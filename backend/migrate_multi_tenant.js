const { sequelize, Institute, User, Test, ExamConfig } = require('./src/models');
const { DataTypes } = require('sequelize');

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log('Syncing Institute table...');
    await Institute.sync({ alter: true });

    const addCol = async (table) => {
      await queryInterface.addColumn(table, 'instituteId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      }).catch(e => console.log(`instituteId may exist in ${table}:`, e.message));
    };

    console.log('Adding instituteId columns...');
    await addCol('Users');
    await addCol('Tests');
    await addCol('ExamConfigs');

    console.log('Ensuring default institute exists...');
    let defaultInst = await Institute.findOne({ where: { code: 'DEFAULT' } });
    if (!defaultInst) {
      defaultInst = await Institute.create({
        name: 'Main Institute',
        code: 'DEFAULT',
      });
      console.log('Created DEFAULT institute with ID:', defaultInst.id);
    } else {
      console.log('DEFAULT institute already exists with ID:', defaultInst.id);
    }

    console.log('Mapping existing data to DEFAULT institute...');
    await User.update({ instituteId: defaultInst.id }, { where: { instituteId: null } });
    await Test.update({ instituteId: defaultInst.id }, { where: { instituteId: null } });
    await ExamConfig.update({ instituteId: defaultInst.id }, { where: { instituteId: null } });

    console.log('✅ Migration to Multi-Tenant complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
