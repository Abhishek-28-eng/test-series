const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject: {
      type: DataTypes.ENUM('Physics', 'Chemistry', 'Mathematics', 'Biology'),
      allowNull: false,
    },
    chapter: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    questionType: {
      type: DataTypes.ENUM('MCQ', 'NUMERICAL'),
      defaultValue: 'MCQ',
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionA: { type: DataTypes.TEXT, allowNull: true },
    optionB: { type: DataTypes.TEXT, allowNull: true },
    optionC: { type: DataTypes.TEXT, allowNull: true },
    optionD: { type: DataTypes.TEXT, allowNull: true },
    correctOption: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: true, // null for NUMERICAL
    },
    correctNumericAnswer: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    marks: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
    negativeMarks: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
    },
    questionOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    isSectionB: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // For JEE/NEET Section B optional questions
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Question;
};
