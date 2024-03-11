// utils.js (or any other appropriate file)
const findLatestVolume = async (bookID, bookContainer) => {
  // Define the regex pattern for volume folders
  const volumeRegex = /Volume(\d+)/;
  const bookDirectory = `Book${bookID}`;

  // Get the list of blobs (volume folders) in the book's directory
  const volumeBlobs = bookContainer.listBlobsFlat({ prefix: bookDirectory });

  // Filter blobs based on the volume directories
  const volumeNumbers = [];
  for await (const blob of volumeBlobs) {
    const match = blob.name.match(volumeRegex);
    if (match) {
      volumeNumbers.push(parseInt(match[1], 10));
    }
  }

  // Find the latest volume based on the volume numbers
  if (volumeNumbers.length > 0) {
    const latestVolumeNumber = Math.max(...volumeNumbers);
    return `${bookContainer.url}/${bookDirectory}/Volume${latestVolumeNumber}/`;
  } else {
    return null; // No volumes available
  }
};

async function findVolumeName(bookID, volumeID) {

    return `Volume ${volumeID} of Book ${bookID}`;
  }

module.exports = { findLatestVolume,findVolumeName };
