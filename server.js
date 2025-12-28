const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const caseRoutes = require('./routes/caseRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homeo-case-tracker')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/case', caseRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Homeo Case Tracker API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
