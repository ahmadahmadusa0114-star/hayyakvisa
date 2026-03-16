require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Admin, Company } = require('./models');

// If running standalone, connect to DB
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB for seeding'))
    .catch(err => {
      console.error('❌ Failed to connect to MongoDB', err);
      process.exit(1);
    });
}

async function main() {
  console.log('🌱 Seeding database...');

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
    console.log('✅ Admin created:');
    console.log('   Email:', adminEmail);
    console.log('   Password: admin123');
  } else {
    console.log('ℹ️  Admin already exists, skipping...');
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
    console.log('\n✅ Demo company created:');
    console.log('   Email:', companyEmail);
    console.log('   Password: company123');
    console.log('   Wallet: 50 JOD');
    console.log('   Markup: 3 JOD/application');
  } else {
    console.log('ℹ️  Demo company already exists, skipping...');
  }

  console.log('\n✨ Seeding complete!');
  
  if (require.main === module) {
    mongoose.connection.close();
  }
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
