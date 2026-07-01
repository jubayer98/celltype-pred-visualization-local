require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

// Configure CORS to allow requests from your frontend server
const corsOptions = {
  origin: process.env.FRONT_END_URL
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Get the base directory for images from environment variables.
const imageBaseDirectory = process.env.IMAGE_BASE_DIRECTORY;
if (!imageBaseDirectory) {
  console.error('Error: IMAGE_BASE_DIRECTORY is not set in the .env file.');
  process.exit(1); // Exit the application if the path is not configured.
}

const imageRoutes = require('./routes/images')(imageBaseDirectory);

// Create a static route to serve the images from the base directory.
// This allows direct access to the image files via a URL.
app.use('/images', express.static(imageBaseDirectory));

// Use the image routes for our API
app.use('/api', imageRoutes);

// Add a handler for the root route to confirm the API is running
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API server is running successfully.' });
});

app.listen(port, () => {
  if (nodeEnv === 'development') {
    console.log(`Server is running on http://localhost:${port}`);
  } else {
    console.log(`Server is listening on port ${port}`);
  }
});
