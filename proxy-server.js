const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Lambda URL
const LAMBDA_URL = 'https://lh4wi733jhjrlpz76bbwezpuea0drqzq.lambda-url.eu-west-2.on.aws';

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Bvester Proxy Server',
        timestamp: new Date().toISOString()
    });
});

// Proxy all requests to Lambda
app.all('*', async (req, res) => {
    try {
        console.log(`Proxying ${req.method} ${req.path}`);

        const response = await axios({
            method: req.method,
            url: `${LAMBDA_URL}${req.path}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Don't throw on any status
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({
            error: 'Proxy server error',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});