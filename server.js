require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const salesforceRoutes = require('./routes/salesforceRoutes');
const refereeRoutes = require('./routes/refereeRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ENABLE_CORS === 'true' ? '*' : false,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/salesforce', salesforceRoutes);
app.use('/api/referee', refereeRoutes);

// Root endpoint - serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ReferralFlow Reflip API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      salesforce: '/api/salesforce',
      referee: '/api/referee'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.path
    }
  });
});

// Start server (only in local dev, not on Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
      console.log(`
                    ReferralFlow Reflip Server
        Environment: ${process.env.NODE_ENV || 'development'}
        Port: ${PORT}
        Time: ${new Date().toISOString()}
      `);
        });
        }

        module.exports = app;
