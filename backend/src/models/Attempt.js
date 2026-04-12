const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attempt = sequelize.define('Attempt', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalWrong: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalSkipped: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted', 'auto_submitted'),
      defaultValue: 'in_progress',
    },
    timeTaken: {
      type: DataTypes.INTEGER, // seconds
      allowNull: true,
    },
  });

  return Attempt;
};
