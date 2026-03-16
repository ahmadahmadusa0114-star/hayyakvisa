const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Admin, Company } = require('./models');

async function main() {
  console.log('🌱 Checking database seeding and migrations...');

  try {
    // 1. Database Migration: Update old field names to new ones
    console.log('🔄 Running data migrations...');
    
    // Update Application collection: company_id -> company, manifest_id -> manifest
    await mongoose.connection.collection('applications').updateMany(
      { company_id: { $exists: true } },
      [
        { $set: { company: "$company_id" } },
        { $unset: "company_id" }
      ]
    );
    await mongoose.connection.collection('applications').updateMany(
      { manifest_id: { $exists: true } },
      [
        { $set: { manifest: "$manifest_id" } },
        { $unset: "manifest_id" }
      ]
    );

    // Update WalletTransaction collection: company_id -> company
    await mongoose.connection.collection('wallettransactions').updateMany(
      { company_id: { $exists: true } },
      [
        { $set: { company: "$company_id" } },
        { $unset: "company_id" }
      ]
    );

    console.log('✅ Migrations complete!');

    // 2. Seeding: Create missing core records
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
    console.error('❌ Migration/Seeding failed:', err);
  }
}

module.exports = main;

if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => main().then(() => mongoose.connection.close()))
    .catch(err => console.error(err));
}
