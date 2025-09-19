const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bvester Backend API is running',
    version: '1.0.0',
    endpoints: ['/health', '/api/info']
  });
});

// API info
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    name: 'Bvester Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => process.exit(0));
});