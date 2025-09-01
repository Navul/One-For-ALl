const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/oneforall', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateAdminPassword() {
    try {
        // Find the admin user
        const adminUser = await User.findOne({ email: 'admin@oneforall.com' });
        
        if (!adminUser) {
            console.log('Admin user not found');
            return;
        }

        console.log('Found admin user:', adminUser.name);

        // Hash the new password
        const newPassword = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password
        adminUser.password = hashedPassword;
        await adminUser.save();

        console.log('Admin password updated successfully!');
        console.log('Login credentials:');
        console.log('Email: admin@oneforall.com');
        console.log('Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('Error updating admin password:', error);
        process.exit(1);
    }
}

updateAdminPassword();
