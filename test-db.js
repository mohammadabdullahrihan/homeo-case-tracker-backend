const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('Testing MongoDB Connection...');
console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homeo-case-tracker')
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Failed:', err);
        process.exit(1);
    });
