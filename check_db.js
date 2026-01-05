const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FormConfig = require('./models/FormConfig');
const Case = require('./models/Case');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB:', mongoose.connection.name);
        
        const configCount = await FormConfig.countDocuments();
        const activeConfig = await FormConfig.findOne({ isActive: true });
        const caseCount = await Case.countDocuments();
        
        console.log('FormConfig Count:', configCount);
        console.log('Active Config Found:', !!activeConfig);
        console.log('Case Count:', caseCount);
        
        if (activeConfig) {
            console.log('Active Config Sections:', activeConfig.sections.length);
        }
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
