const express = require('express');
const jsonParser = express.json();
const xss = require('xss');
const multer = require('multer');
const {
  uploadToS3,
  removeFromS3,
  removeFromDisk,
  acceptImagesOnly,
} = require('../utils/file-util');
const { checkNSFWLikely } = require('../utils/vision-util');
const { getDefaultPlaceData, getImageByReference } = require('../utils/places-util');
const imagesRouter = express.Router();
const ImagesService = require('./images-service');
const upload = multer({ dest: 'uploads/', fileFilter: acceptImagesOnly });
const sharp = require('sharp');
const { protectedWithJWT, getUserFromToken } = require('../middleware/token-auth');
const UsersService = require('../users/users-service');

imagesRouter
  .route('/')
  .get(async (req, res, next) => {
    const { sort, lat, lon, page, distance } = req.query;

    if (sort !== 'top' && sort !== 'new') {
      return res.status(400).json({ error: 'Invalid value provided for sort param' });
    }

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon parameters are required' });
    } else if (!parseFloat(lat) || !parseFloat(lon)) {
      return res.status(400).json({ error: 'lat and lon parameters are invalid' });
    }

    if (!!page && !parseInt(page)) {
      return res.status(400).json({ error: 'page parameter is invalid' });
    }

    if (!!distance && !parseInt(distance)) {
      return res.status(400).json({ error: 'distance parameter is invalid' });
    }

    try {
      const submissionsByLocation = await ImagesService.getSubmissions(
        req.app.get('db'),
        parseFloat(lat),
        parseFloat(lon),
        sort,
        page,
        distance
      );

      // if we do not have any data, we are using Google to make some
      // submissions that are nearby the requested lat/lon
      // also only do this when no data exists at all
      // pagination can technically otherwise cause it to seem like
      // no data artificially
      if (!submissionsByLocation.length && (!page || (!!page && parseInt(page) === 1))) {
        // make a request to get place coordinates and the photo_reference
        let defaultPlaces = await getDefaultPlaceData(lat, lon);
        await Promise.all(
          defaultPlaces.results.map(async (location) => {
            // if the location has a photos attribute, grab the reference and
            // make a separate request to retrieve the hosted image URL from
            // the reference ID
            if (location.photos) {
              let image_url = await getImageByReference(
                location.photos[0]['photo_reference']
              );
              const submission = {
                image_url,
                latitude: location.geometry.location.lat,
                longitude: location.geometry.location.lng,
              };

              // insert these new submissions into the database
              await ImagesService.createSubmission(req.app.get('db'), submission);
            }
          })
        );
        const googleSubmissions = await ImagesService.getSubmissions(
          req.app.get('db'),
          parseFloat(lat),
          parseFloat(lon),
          sort,
          page,
          distance
        );

        // if somehow even Google has no nearby locations with images
        // send an error
        if (!googleSubmissions.length) {
          return res.status(400).json({ error: 'no submissions available' });
        }
        return res.status(200).json(googleSubmissions);
      }

      return res.status(200).json(submissionsByLocation);
    } catch (e) {
      next(e);
    }
  })
  .post(
    jsonParser,
    getUserFromToken,
    upload.single('someImage'),
    async (req, res, next) => {
      try {
        // console.log(req.file);
        let { image_text, latitude, longitude } = req.body;
        const { path, filename } = req.file;
        const isNSFW = await checkNSFWLikely(path);

        if (!latitude || !longitude) {
          removeFromDisk(path);
          return res
            .status(400)
            .json({ error: 'latitude and longitude parameters are required' });
        } else if (!parseFloat(latitude) || !parseFloat(longitude)) {
          removeFromDisk(path);
          return res
            .status(400)
            .json({ error: 'latitude and longitude parameters are invalid' });
        }

        if (isNSFW) {
          removeFromDisk(path); // remove uploaded file from disk
          return res.status(400).json({
            error: 'provided content does not meet community guidelines',
          });
        }

        // we need to obfuscate coordinates so that users in homes or
        // private places are not easily identified
        const latArr = latitude.split('.');
        const lonArr = longitude.split('.');
        latArr[1] = latArr[1].substring(0, 3);
        lonArr[1] = lonArr[1].substring(0, 3);
        latitude = latArr.join('.');
        longitude = lonArr.join('.');

        const imageData = await sharp(path)
          .rotate() // auto-rotate based on EXIF metadata
          .resize({ width: 1200, withoutEnlargement: true }) // limit max width
          .jpeg({ quality: 70 }) // compress to jpeg with indistinguishable quality difference
          .toBuffer(); // returns a Promise<Buffer>

        const image_url = await uploadToS3(imageData, path, filename, 'image/jpeg');

        const submissionData = {
          image_url,
          image_text: xss(image_text),
          latitude,
          longitude,
        };

        if (req.user) {
          submissionData.user_id = req.user.id;
        }

        const newSubmission = await ImagesService.createSubmission(
          req.app.get('db'),
          submissionData
        );

        return res.status(201).json(newSubmission);
      } catch (error) {
        next(error);
      }
    }
  );

imagesRouter
  .route('/:submission_id')
  .all(async (req, res, next) => {
    const id = req.params.submission_id;
    const submission = await ImagesService.getSingleSubmission(req.app.get('db'), id);

    if (!submission) {
      return res.status(400).json({ error: 'id does not exist' });
    }

    res.submission = submission;
    next();
  })
  .patch(protectedWithJWT, async (req, res, next) => {
    const upvoter = req.user;

    if (upvoter.karma_balance === 0) {
      return res.status(403).json({ error: 'karma_balance is 0' });
    }
    if (upvoter.id === res.submission.user_id) {
      return res
        .status(403)
        .json({ error: 'submission author and upvoter are the same' });
    }

    try {
      // credit submission's karma total
      const currKarmaTotal = res.submission.karma_total;
      const updatedSubmission = await ImagesService.updateSingleSubmission(
        req.app.get('db'),
        res.submission.id,
        { karma_total: currKarmaTotal + 1 }
      );

      // debit upvoter's karma balance
      const currKarmaBalance = upvoter.karma_balance;
      await UsersService.updateUser(req.app.get('db'), upvoter.username, {
        karma_balance: currKarmaBalance - 1,
      });

      return res.status(200).json(updatedSubmission);
    } catch (e) {
      next(e);
    }
  })
  .delete(protectedWithJWT, async (req, res, next) => {
    if (res.submission.user_id && res.submission.user_id !== req.user.id) {
      return res.status(401).json({ error: 'unauthorized request' });
    }

    try {
      const url = res.submission.image_url;
      const s3ObjectKey = url.substring(url.lastIndexOf('/') + 1);
      await ImagesService.deleteSubmission(req.app.get('db'), res.submission.id);
      await removeFromS3(s3ObjectKey);
      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

module.exports = imagesRouter;
