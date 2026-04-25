const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamConfig = sequelize.define('ExamConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER, // minutes
      allowNull: false,
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    negativeMarking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['instituteId', 'name']
      }
    ]
  });

  return ExamConfig;
};
