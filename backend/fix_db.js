const { sequelize } = require('./src/models');
const { DataTypes } = require('sequelize');

async function fix() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('Users', 'loginCount', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }).catch(e => console.log('loginCount already exists or error:', e.message));

    await queryInterface.addColumn('Users', 'lastLoginAt', {
      type: DataTypes.DATE,
      allowNull: true,
    }).catch(e => console.log('lastLoginAt already exists or error:', e.message));

    console.log('✅ Done fixing DB');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
