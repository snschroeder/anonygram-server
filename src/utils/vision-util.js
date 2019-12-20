const vision = require('@google-cloud/vision')

async function checkNSFWLikely(filePath) {
  // Creates a client
  const visionClient = new vision.ImageAnnotatorClient()
  const checkTypes = ['adult', 'spoof', 'medical', 'violence', 'racy']

  // Perform check of rating for unsafe categories
  const [result] = await visionClient.safeSearchDetection(filePath)
  const detections = result.safeSearchAnnotation

  // reject image if any of the unsafe categories come back with
  // POSSIBLE or greater odds of NSFW content
  for (let i = 0; i < checkTypes.length; i++) {
    if (
      detections[checkTypes[i]] === 'POSSIBLE' ||
      detections[checkTypes[i]] === 'LIKELY' ||
      detections[checkTypes[i]] === 'VERY_LIKELY'
    ) {
      // console.log(`Failed type ${checkTypes[i]} with value of ${detections[checkTypes[i]]}`)
      return true
    }
  }

  return false
}

module.exports = {
  checkNSFWLikely
}
