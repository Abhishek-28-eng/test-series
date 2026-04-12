const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamConfig = sequelize.define('ExamConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.ENUM('MHT-CET_PCM', 'MHT-CET_PCB', 'JEE', 'NEET'),
      allowNull: false,
      unique: true,
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
  });

  return ExamConfig;
};
