const { sequelize } = require('./src/models');

async function fixUnique() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Drop existing global unique indexes (names might vary, usually Users_mobile_uk and Users_email_uk or just mobile / email)
    await sequelize.query('ALTER TABLE `Users` DROP INDEX `mobile`;').catch(e => console.log('No mobile index to drop or error:', e.message));
    await sequelize.query('ALTER TABLE `Users` DROP INDEX `Users_mobile_uk`;').catch(e => console.log('No Users_mobile_uk to drop'));
    await sequelize.query('ALTER TABLE `Users` DROP INDEX `email`;').catch(e => console.log('No email index to drop'));
    await sequelize.query('ALTER TABLE `Users` DROP INDEX `Users_email_uk`;').catch(e => console.log('No Users_email_uk to drop'));
    
    // In Sequelize MySQL, unique constraints are often named by the column name if created via sync.
    // Let's add composite unique indexes
    await sequelize.query('ALTER TABLE `Users` ADD UNIQUE INDEX `institute_mobile_uk` (`instituteId`, `mobile`);').catch(e => console.log('Failed to add composite mobile index:', e.message));
    await sequelize.query('ALTER TABLE `Users` ADD UNIQUE INDEX `institute_email_uk` (`instituteId`, `email`);').catch(e => console.log('Failed to add composite email index:', e.message));

    console.log('✅ Unique constraints updated for multi-tenant isolation.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUnique();
