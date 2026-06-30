const express = require('express');
const fs = require('fs');
const path = require('path');

module.exports = (imageBaseDirectory) => {
  const router = express.Router();

  router.get('/image-sets', (req, res) => {
    fs.readdir(imageBaseDirectory, { withFileTypes: true }, (err, dirents) => {
      if (err) {
        console.error('Error reading image base directory:', err);
        return res.status(500).json({ error: 'Could not retrieve image sets.' });
      }

      const imageSets = dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      res.json(imageSets);
    });
  });

  router.get('/images/:imageSet', (req, res) => {
    const imageSet = req.params.imageSet;
    const directoryPath = path.join(imageBaseDirectory, imageSet, 'images');

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        // If the directory doesn't exist or there's another error, send a 404 response.
        console.error('Error reading directory:', err);
        return res.status(404).json({ error: 'Image set not found.' });
      }

      // Filter out any non-image files if necessary (e.g., .DS_Store on macOS)
      const imageFiles = files.filter(file => {
        const extension = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg', '.gif'].includes(extension);
      });

      // Create an array of full URLs for the images.
      // This creates a full, absolute URL that the browser can find.
      const imageUrls = imageFiles.map(file => {
        const serverBaseUrl = `${req.protocol}://${req.get('host')}`; // -> "http://localhost:3000"
        const imagePath = `/images/${imageSet}/images/${file}`;
        return `${serverBaseUrl}${imagePath}`;
      });
      
      res.json(imageUrls);
    });
  });

  router.get('/images/:imageSet/csv', (req, res) => {
    const { imageSet } = req.params;
    const { prefix } = req.query; // Get the prefix from the query parameters.

    // If a prefix is provided, prepend it to the filename.
    // Otherwise, use the default filename.
    const filename = prefix
      ? `${prefix}${imageSet}_celltype_info.csv`
      : 'celltype_info.csv';

    const filePath = path.join(imageBaseDirectory, imageSet, 'images', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('CSV file not found:', filePath);
          return res.status(404).json({ error: 'CSV file not found.' });
        }
        console.error('Error sending file:', err);
        return res.status(500).json({ error: 'Error sending file.' });
      }
    });
  });

  return router;
};
