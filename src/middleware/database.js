const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');



// Storage connection
const storageAccount = 'happinovel2021';
const accountKey = 'HgAgETD+yESSmViHECBYSTrT47erBuEOLvpIR9VvqBLGgLM3kwS5s4LkEFA4Sdoo3coeFLEHUzP4+AStK3hMrw==';
const sharedKeyCredential = new StorageSharedKeyCredential(storageAccount, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${storageAccount}.blob.core.windows.net`, sharedKeyCredential
);

// Container
const avatarContainer = blobServiceClient.getContainerClient('avatar');
const bookContainer = blobServiceClient.getContainerClient('book');
const bookcoverContainer = blobServiceClient.getContainerClient('bookcover');
const commentContainer = blobServiceClient.getContainerClient('comment');
const notifyContainer = blobServiceClient.getContainerClient('notify');
const profilecoverContainer = blobServiceClient.getContainerClient('profilecover');
const ratingContainer = blobServiceClient.getContainerClient('rating');

module.exports = {
    avatarContainer, 
    bookContainer, 
    bookcoverContainer, 
    commentContainer, 
    notifyContainer, 
    profilecoverContainer, 
    ratingContainer,
}