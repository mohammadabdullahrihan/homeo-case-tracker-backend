const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Case = require('./models/Case');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const oneCase = await Case.findOne();
        console.log('Case Keys:', Object.keys(oneCase.toObject()));
        console.log('Case Data Keys:', Object.keys(oneCase.caseData || {}));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
