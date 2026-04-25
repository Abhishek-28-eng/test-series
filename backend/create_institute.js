const { sequelize, Institute, User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createInstituteAndAdmin() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: node create_institute.js <InstituteName> <InstituteCode> <AdminName> <AdminMobile> <AdminPassword>');
    console.log('Example: node create_institute.js "Pune Institute" PUNE "Admin User" 9876543210 mypassword');
    process.exit(1);
  }

  const [instituteName, instituteCode, adminName, adminMobile, adminPassword] = args;

  try {
    // 1. Create the Institute
    const [institute, created] = await Institute.findOrCreate({
      where: { code: instituteCode.toUpperCase() },
      defaults: { name: instituteName }
    });

    if (!created) {
      console.log(`Institute with code ${instituteCode.toUpperCase()} already exists (ID: ${institute.id}). Adding admin to existing institute...`);
    } else {
      console.log(`✅ Created Institute: ${institute.name} (Code: ${institute.code})`);
    }

    // 2. Check if mobile exists in that institute
    const existingAdmin = await User.findOne({ where: { mobile: adminMobile, instituteId: institute.id } });
    if (existingAdmin) {
      console.log(`❌ Error: A user with mobile ${adminMobile} already exists in ${instituteCode}`);
      process.exit(1);
    }

    // 3. Create the Admin User
    const admin = await User.create({
      name: adminName,
      mobile: adminMobile,
      password: adminPassword, // Model hook will hash this automatically
      role: 'admin',
      instituteId: institute.id
    });

    console.log(`✅ Created Admin Account:`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Mobile: ${admin.mobile}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Institute Code: ${institute.code}`);
    console.log(`\nYou can now log in at the frontend using these credentials!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create institute/admin:', error);
    process.exit(1);
  }
}

createInstituteAndAdmin();
