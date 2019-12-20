const config = require('../config')
const rqPromise = require('request-promise-native')

function getDefaultPlaceData(lat, lon) {
  const options = {
    uri: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    qs: {
      key: config.GOOGLE_PLACES_API_KEY,
      location: `${lat},${lon}`,
      radius: 20000,
    },
    headers: {
      'User-Agent': 'Request-Promise',
    },
    json: true, // Automatically parses the JSON string in the response
  }
  return rqPromise(options)
};

function getImageByReference(photoreference) {
  let imageURL;
  const options = {
    uri: 'https://maps.googleapis.com/maps/api/place/photo',
    qs: {
      key: config.GOOGLE_PLACES_API_KEY,
      photoreference,
      maxwidth: 500
    },
    headers: {
      'User-Agent': 'Request-Promise',
    },
    // hijack the redirect header from Google which contains
    // the hosted image url, otherwise the end result is an actual
    // file that would require re-uploading into our own cloud storage
    // questionable legality to take the photo and store it

    followRedirect: (res) => {
      imageURL = res.headers.location
      return true
    },
    json: true
  }
  // we only care about Google's hosted asset
  return rqPromise(options)
    .then(() => imageURL)
}

module.exports = {
  getDefaultPlaceData,
  getImageByReference
}
