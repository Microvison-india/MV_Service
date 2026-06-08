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
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

    if (!adminEmail1 || !adminEmail2) {
      throw new Error('ADMIN_EMAIL_1 or ADMIN_EMAIL_2 is missing in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const adminsToCreate = [
      {
        name: 'Super Admin 1',
        email: adminEmail1,
        passwordHash: defaultPassword, // Model pre-save hook will hash this
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Super Admin 2',
        email: adminEmail2,
        passwordHash: defaultPassword, // Model pre-save hook will hash this
        role: 'admin',
        status: 'active',
      },
    ];

    for (const adminData of adminsToCreate) {
      // Check if admin already exists
      const existingUser = await User.findOne({ email: adminData.email });
      if (existingUser) {
        console.log(`Admin ${adminData.email} already exists. Skipping.`);
      } else {
        await User.create(adminData);
        console.log(`Created admin: ${adminData.email}`);
      }
    }

    console.log('\nAdmin seeding completed successfully.');
    console.log(`Default password for both is: ${defaultPassword}`);
    console.log('You can change this password using the "Forgot Password" flow on the login page.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
