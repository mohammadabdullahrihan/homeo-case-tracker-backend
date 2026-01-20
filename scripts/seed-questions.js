const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const FormConfig = require('../models/FormConfig');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedQuestions = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Read JSON file
    const dataPath = path.join(__dirname, '../data/questions.json');
    const rawData = fs.readFileSync(dataPath);
    const configData = JSON.parse(rawData);

    console.log('🚀 Seeding Form Configuration...');

    // We assume there is only ONE active configuration for now, or we can look up by version.
    // Strategy: Delete existing and create new to ensure exact sync with JSON,
    // OR Update the first found document.

    // Let's go with: Remove all and insert this one as the primary config.
    await FormConfig.deleteMany({});
    console.log('🗑️  Cleared existing configurations.');

    const newConfig = await FormConfig.create(configData);

    console.log('✨ Configuration seeded successfully!');
    console.log(`📊 Sections: ${newConfig.sections.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedQuestions();
