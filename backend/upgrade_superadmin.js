const { sequelize, User } = require('./src/models');

async function upgradeRole() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.query("ALTER TABLE `Users` MODIFY COLUMN `role` VARCHAR(20) DEFAULT 'student';");
    
    // Check if superadmin exists
    let sa = await User.findOne({ where: { role: 'superadmin' } });
    if (!sa) {
      sa = await User.create({
        name: 'Super Admin',
        mobile: '1111111111',
        password: 'superadmin123',
        role: 'superadmin',
        instituteId: null, // superadmin has no specific institute
      });
      console.log('✅ Created Super Admin (Mobile: 1111111111, Pass: superadmin123)');
    } else {
      console.log('✅ Super Admin already exists');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

upgradeRole();
