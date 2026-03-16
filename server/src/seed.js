const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Admin, Company } = require('./models');

async function main() {
  console.log('🌱 Checking database seeding...');

  try {
    // Create admin
    const adminEmail = 'admin@hayyakvisa.com';
    const existing = await Admin.findOne({ email: adminEmail });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
      });
      console.log('✅ Admin created (admin123)');
    }

    // Create a sample company
    const companyEmail = 'demo@travelagency.com';
    const existingCompany = await Company.findOne({ email: companyEmail });

    if (!existingCompany) {
      const hashedPassword = await bcrypt.hash('company123', 10);
      await Company.create({
        name: 'Demo Travel Agency',
        email: companyEmail,
        password: hashedPassword,
        markup_price: 3.0,
        wallet_balance: 50.0,
        status: 'ACTIVE',
      });
      console.log('✅ Demo company created (company123)');
    }

    console.log('✨ Seeding check complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

module.exports = main;

if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => main().then(() => mongoose.connection.close()))
    .catch(err => console.error(err));
}
