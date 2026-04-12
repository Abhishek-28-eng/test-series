const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Answer = sequelize.define('Answer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attemptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    selectedOption: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: true,
    },
    numericAnswer: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('NOT_VISITED', 'ANSWERED', 'MARKED_REVIEW', 'ANSWERED_MARKED_REVIEW', 'NOT_ANSWERED'),
      defaultValue: 'NOT_VISITED',
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    marksObtained: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    timeTaken: {
      type: DataTypes.INTEGER, // seconds on this question
      defaultValue: 0,
    },
  });

  return Answer;
};
