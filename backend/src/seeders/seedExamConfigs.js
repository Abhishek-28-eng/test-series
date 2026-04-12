require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize, ExamConfig, Section, User } = require('../models');
const bcrypt = require('bcryptjs');

const examConfigs = [
  {
    name: 'MHT-CET_PCM',
    displayName: 'MHT-CET (PCM)',
    duration: 180,
    totalMarks: 200,
    negativeMarking: false,
    instructions: 'Section 1 (Physics + Chemistry): 90 minutes | Section 2 (Mathematics): 90 minutes. No negative marking.',
    sections: [
      { subject: 'Physics',      totalQuestions: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 1 },
      { subject: 'Chemistry',    totalQuestions: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 2 },
      { subject: 'Mathematics',  totalQuestions: 50, marksPerQuestion: 2, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 3 },
    ],
  },
  {
    name: 'MHT-CET_PCB',
    displayName: 'MHT-CET (PCB)',
    duration: 180,
    totalMarks: 200,
    negativeMarking: false,
    instructions: 'Physics: 50Q (1 mark each) | Chemistry: 50Q (1 mark each) | Biology: 100Q (1 mark each). No negative marking.',
    sections: [
      { subject: 'Physics',    totalQuestions: 50,  marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 1 },
      { subject: 'Chemistry',  totalQuestions: 50,  marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 2 },
      { subject: 'Biology',    totalQuestions: 100, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 3 },
    ],
  },
  {
    name: 'JEE',
    displayName: 'JEE Main',
    duration: 180,
    totalMarks: 300,
    negativeMarking: true,
    instructions: '+4 for correct, -1 for wrong. Section A: MCQ | Section B: Numerical (10 shown, attempt any 5).',
    sections: [
      { subject: 'Physics',     totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: null, sectionOrder: 1 },
      { subject: 'Chemistry',   totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: null, sectionOrder: 2 },
      { subject: 'Mathematics', totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: null, sectionOrder: 3 },
    ],
  },
  {
    name: 'NEET',
    displayName: 'NEET UG',
    duration: 200,
    totalMarks: 720,
    negativeMarking: true,
    instructions: '+4 for correct, -1 for wrong. Section A: 35Q compulsory | Section B: 15Q (attempt any 10).',
    sections: [
      { subject: 'Physics',   totalQuestions: 50, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: 10, sectionOrder: 1 },
      { subject: 'Chemistry', totalQuestions: 50, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: 10, sectionOrder: 2 },
      { subject: 'Biology',   totalQuestions: 100, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, maxAttempt: 10, sectionOrder: 3 },
    ],
  },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    await sequelize.sync({ alter: true });
    console.log('✅ DB synced');

    // Seed ExamConfigs + Sections
    for (const config of examConfigs) {
      const { sections, ...configData } = config;
      const [ec, created] = await ExamConfig.findOrCreate({
        where: { name: configData.name },
        defaults: configData,
      });
      if (!created) {
        await ec.update(configData);
        console.log(`♻️  Updated ExamConfig: ${configData.name}`);
      } else {
        console.log(`✅ Created ExamConfig: ${configData.name}`);
      }

      // Delete old sections and recreate
      await Section.destroy({ where: { examConfigId: ec.id } });
      for (const sec of sections) {
        await Section.create({ ...sec, examConfigId: ec.id });
      }
      console.log(`   └─ ${sections.length} sections seeded`);
    }

    // Seed admin user if not exists
    const adminEmail = 'admin@testseries.com';
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: 'Super Admin',
        email: adminEmail,
        mobile: '9999999999',
        password: 'Admin@123',
        role: 'admin',
      },
    });
    if (adminCreated) {
      console.log('✅ Admin user created: admin@testseries.com / Admin@123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
