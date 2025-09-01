const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/oneforall');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@oneforall.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@oneforall.com');
            console.log('You can use this email to login as admin');
            process.exit(0);
        }

        // Hash the password
        const password = 'admin123'; // You can change this
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const adminUser = new User({
            name: 'System Administrator',
            email: 'admin@oneforall.com',
            password: hashedPassword,
            role: 'admin',
            phone: '1234567890',
            isActive: true
        });

        await adminUser.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@oneforall.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');
        console.log('\nYou can now login with these credentials!');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdminUser();
