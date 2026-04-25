'use strict';
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const Institute = require('./Institute')(sequelize);
const User = require('./User')(sequelize);
const ExamConfig = require('./ExamConfig')(sequelize);
const Section = require('./Section')(sequelize);
const Test = require('./Test')(sequelize);
const Question = require('./Question')(sequelize);
const Attempt = require('./Attempt')(sequelize);
const Answer = require('./Answer')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);

// ── Associations ──────────────────────────────────────────────
// Institute Associations
Institute.hasMany(User, { foreignKey: 'instituteId', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Institute.hasMany(Test, { foreignKey: 'instituteId', as: 'tests', onDelete: 'CASCADE' });
Test.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Institute.hasMany(ExamConfig, { foreignKey: 'instituteId', as: 'examConfigs', onDelete: 'CASCADE' });
ExamConfig.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// ExamConfig ↔ Section
ExamConfig.hasMany(Section, { foreignKey: 'examConfigId', as: 'sections', onDelete: 'CASCADE' });
Section.belongsTo(ExamConfig, { foreignKey: 'examConfigId', as: 'examConfig' });

// ExamConfig ↔ Test
ExamConfig.hasMany(Test, { foreignKey: 'examConfigId', as: 'tests' });
Test.belongsTo(ExamConfig, { foreignKey: 'examConfigId', as: 'examConfig' });

// Test ↔ Question
Test.hasMany(Question, { foreignKey: 'testId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Section ↔ Question
Section.hasMany(Question, { foreignKey: 'sectionId', as: 'questions' });
Question.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });

// User ↔ Attempt
User.hasMany(Attempt, { foreignKey: 'userId', as: 'attempts' });
Attempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Test ↔ Attempt
Test.hasMany(Attempt, { foreignKey: 'testId', as: 'attempts' });
Attempt.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Attempt ↔ Answer
Attempt.hasMany(Answer, { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE' });
Answer.belongsTo(Attempt, { foreignKey: 'attemptId', as: 'attempt' });

// Question ↔ Answer
Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// User ↔ Enrollment (many-to-many with ExamConfig)
User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ExamConfig.hasMany(Enrollment, { foreignKey: 'examConfigId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(ExamConfig, { foreignKey: 'examConfigId', as: 'examConfig' });

module.exports = {
  sequelize,
  Sequelize,
  Institute,
  User,
  ExamConfig,
  Section,
  Test,
  Question,
  Attempt,
  Answer,
  Enrollment,
};
