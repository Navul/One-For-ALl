// Simple script to create admin user
// Run: node create-admin-simple.js

const bcrypt = require('bcryptjs');

// Generate hash for password 'admin123'
const generateAdminHash = async () => {
    const password = 'admin123';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('='.repeat(50));
    console.log('ADMIN USER CREATION DATA');
    console.log('='.repeat(50));
    console.log('Email: superadmin@oneforall.com');
    console.log('Password: admin123');
    console.log('Hashed Password:', hash);
    console.log('Role: admin');
    console.log('='.repeat(50));
    console.log('');
    console.log('MongoDB Insert Command:');
    console.log('db.users.insertOne({');
    console.log('  name: "Super Admin",');
    console.log('  email: "superadmin@oneforall.com",');
    console.log(`  password: "${hash}",`);
    console.log('  role: "admin",');
    console.log('  phone: "+1234567890",');
    console.log('  isActive: true,');
    console.log('  isBanned: false,');
    console.log('  createdAt: new Date(),');
    console.log('  updatedAt: new Date()');
    console.log('})');
    console.log('='.repeat(50));
};

generateAdminHash().catch(console.error);
