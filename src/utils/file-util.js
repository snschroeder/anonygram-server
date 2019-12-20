const fs = require('fs');
const aws = require('aws-sdk');
const { AWS_ID, AWS_SECRET, AWS_BUCKET } = require('../config');

const s3 = new aws.S3({
  accessKeyId: AWS_ID,
  secretAccessKey: AWS_SECRET,
});

function removeFromDisk(filePath) {
  fs.unlinkSync(filePath);
}

function removeFromS3(s3ObjectKey) {
  if (!AWS_ID || !AWS_SECRET || !AWS_BUCKET) {
    throw { message: 'AWS credentials not configured' };
  }

  const params = {
    Bucket: AWS_BUCKET,
    Key: s3ObjectKey,
  };

  const removalPromise = new Promise((resolve, reject) => {
    s3.deleteObject(params, (error, data) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });

  return removalPromise
    .then(() => {
      // console.log(`File deleted successfully. file: ${s3ObjectKey}`);
      return;
    })
    .catch((error) => {
      throw error;
    });
}

function uploadToS3(fileContents, filePath, fileName, mimeType) {
  if (!AWS_ID || !AWS_SECRET || !AWS_BUCKET) {
    removeFromDisk(filePath); // remove uploaded file from disk
    throw { message: 'AWS credentials not configured' };
  }

  // const contents = fs.readFileSync(path);
  const params = {
    Bucket: AWS_BUCKET,
    Key: fileName,
    Body: fileContents,
    ContentType: mimeType,
  };

  const uploadPromise = new Promise((resolve, reject) => {
    s3.upload(params, (error, data) => {
      removeFromDisk(filePath); // remove uploaded file from disk after s3 has received it
      if (error) {
        reject(error);
      }
      resolve(data.Location);
    });
  });

  return uploadPromise
    .then((dataLocation) => {
      // console.log(`File uploaded successfully. ${dataLocation}`);
      return dataLocation;
    })
    .catch((error) => {
      throw error;
    });
}

function acceptImagesOnly(req, file, callback) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return callback({ status: 415, message: 'File type is not an image' }, false);
  }
  callback(null, true);
}

module.exports = {
  uploadToS3,
  removeFromDisk,
  removeFromS3,
  acceptImagesOnly,
};
