const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Enrollment = sequelize.define('Enrollment', {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:        { type: DataTypes.INTEGER, allowNull: false },
    examConfigId:  { type: DataTypes.INTEGER, allowNull: false },
  }, {
    indexes: [{ unique: true, fields: ['userId', 'examConfigId'] }],
  });

  return Enrollment;
};
