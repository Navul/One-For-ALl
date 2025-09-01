const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const promoteUserToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/oneforall');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log('✅ User promoted to admin successfully!');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.name);
        console.log('🔑 Role:', user.role);
        
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

// Usage: node promote-admin.js email@example.com
const email = process.argv[2];
if (!email) {
    console.log('Usage: node promote-admin.js <email>');
    process.exit(1);
}

promoteUserToAdmin(email);
