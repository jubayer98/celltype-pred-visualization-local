require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// --- Environment Variable Validation ---
const requiredEnv = ['IMAGE_BASE_DIRECTORY', 'ENV'];
if (process.env.ENV === 'PROD') {
  requiredEnv.push('FRONTEND_PROD_URL');
} else {
  requiredEnv.push('FRONTEND_DEV_URL');
}

for (const variable of requiredEnv) {
  if (!process.env[variable]) {
    // In production, Railway will restart the service. In development, it will crash.
    console.error(`FATAL: Environment variable ${variable} is not set.`);
    process.exit(1);
  }
}
const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.ENV === 'PROD';

// Configure CORS to allow requests from your frontend server
const corsOptions = {
  origin: isProduction
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_DEV_URL,
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Define the base directory where the image sets are stored.
const imageBaseDirectory = process.env.IMAGE_BASE_DIRECTORY;

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
  const serverUrl = isProduction
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : `http://localhost:${port}`;
  console.log(`Server is running in ${process.env.ENV} mode on ${serverUrl}`);
});
