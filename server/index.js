const express = require('express');
const path = require('path');
const cors = require('cors');
const imageRoutes = require('./routes/images');

const app = express();
const port = 3000;

// Configure CORS to allow requests from your frontend server
const corsOptions = {
  origin: 'http://localhost:5173'
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Define the base directory where the image sets are stored.
// IMPORTANT: Replace this with the actual path on your system.
const imageBaseDirectory = '/Users/jubayer/Desktop/project_tnhl/web_app/data/output/sp';

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
  console.log(`Server is running on http://localhost:${port}`);
});
