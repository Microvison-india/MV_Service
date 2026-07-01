const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmins = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    const adminEmail1 = process.env.ADMIN_EMAIL_1;
    const adminEmail2 = process.env.ADMIN_EMAIL_2;
    const adminEmail3 = process.env.ADMIN_EMAIL_3; // Added 3rd admin
    
    // Names (Optional, defaults to Super Admin if not provided)
    const adminName1 = process.env.ADMIN_NAME_1 || 'Super Admin 1';
    const adminName2 = process.env.ADMIN_NAME_2 || 'Super Admin 2';
    const adminName3 = process.env.ADMIN_NAME_3 || 'Super Admin 3';
    
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

    // We only throw an error if the first one is missing, so you can have 1, 2, or 3 admins.
    if (!adminEmail1) {
      throw new Error('At least ADMIN_EMAIL_1 is required in .env');
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB for admin seeding...');
    }

    const adminsToCreate = [];
    
    if (adminEmail1) {
      adminsToCreate.push({
        name: adminName1,
        email: adminEmail1,
        passwordHash: defaultPassword,
        role: 'admin',
        status: 'active',
      });
    }
    
    if (adminEmail2) {
      adminsToCreate.push({
        name: adminName2,
        email: adminEmail2,
        passwordHash: defaultPassword,
        role: 'admin',
        status: 'active',
      });
    }

    if (adminEmail3) {
      adminsToCreate.push({
        name: adminName3,
        email: adminEmail3,
        passwordHash: defaultPassword,
        role: 'admin',
        status: 'active',
      });
    }

    for (const adminData of adminsToCreate) {
      // Check if admin already exists
      const existingUser = await User.findOne({ email: adminData.email });
      if (existingUser) {
        console.log(`Admin ${adminData.email} already exists.`);
      } else {
        await User.create(adminData);
        console.log(`Created admin: ${adminData.email}`);
      }
    }

    console.log('\nAdmin seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding admins:', error);
  }
};

module.exports = seedAdmins;
