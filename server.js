const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const caseRoutes = require('./routes/caseRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection Function
const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') return;
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homeo-case-tracker');
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// Initialize DB Connection
const dbConnection = connectDB();

// Routes
app.use('/api/case', caseRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health Check & Landing Page
app.get('/', (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Homoeopathy Case Tracker API</title>
        <style>
            :root {
                --primary: #10b981;
                --primary-dark: #047857;
                --bg: #f0fdf4;
                --text: #1f2937;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: var(--bg);
                color: var(--text);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
            }
            .container {
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 500px;
                width: 90%;
            }
            .status-dot {
                height: 12px;
                width: 12px;
                background-color: var(--primary);
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
                animation: pulse 2s infinite;
            }
            h1 {
                color: var(--primary-dark);
                margin-bottom: 0.5rem;
            }
            p {
                color: #6b7280;
                line-height: 1.6;
            }
            .badge {
                background: #d1fae5;
                color: #065f46;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                margin-top: 1rem;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            .footer {
                margin-top: 2rem;
                font-size: 0.875rem;
                color: #9ca3af;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 14c1.49-1.28 3.6-1.28 5.09 0 1.49 1.28 1.49 3.36 0 4.63-1.49 1.28-3.6 1.28-5.09 0-1.49-1.28-1.49-3.36 0-4.63z"></path>
                    <path d="M22 17.5v4.5"></path>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path>
                </svg>
            </div>
            <h1>Homoeopathy Case Tracker API</h1>
            <div class="badge">
                <span class="status-dot"></span>
                System Operational
            </div>
            <p>
                The backend services are running smoothly. <br>
                Secure endpoints are ready for client connections.
            </p>
            <div class="footer">
                v1.0.0 • Powered by Node.js & MongoDB
            </div>
        </div>
    </body>
    </html>
    `;
  res.send(htmlContent);
});

// Start Server
if (require.main === module) {
  dbConnection.then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
