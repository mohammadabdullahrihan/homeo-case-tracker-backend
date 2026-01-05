const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Case = require('./models/Case');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find();
        console.log('Users:', users.map(u => ({ id: u._id, username: u.username })));
        
        const caseUsers = await Case.distinct('user');
        console.log('Unique User IDs in Cases:', caseUsers);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkUsers();
