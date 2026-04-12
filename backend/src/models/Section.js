const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Section = sequelize.define('Section', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    examConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject: {
      type: DataTypes.ENUM('Physics', 'Chemistry', 'Mathematics', 'Biology'),
      allowNull: false,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marksPerQuestion: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
    negativeMarksPerQuestion: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    sectionDuration: {
      type: DataTypes.INTEGER, // minutes, null = shared with exam
      allowNull: true,
    },
    maxAttempt: {
      type: DataTypes.INTEGER, // For JEE/NEET Section B optional attempt limit
      allowNull: true,
    },
    sectionOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

  return Section;
};
