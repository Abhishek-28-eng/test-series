const { Test, ExamConfig, Section, Question, Attempt, User, Enrollment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// GET /api/tests  (student: only enrolled | admin: all)
const getAllTests = async (req, res) => {
  try {
    let where = { instituteId: req.user.instituteId };
    if (req.user.role === 'student') {
      // Only show published tests the student is enrolled in
      const enrollments = await Enrollment.findAll({ where: { userId: req.user.id } });
      const enrolledConfigIds = enrollments.map(e => e.examConfigId);
      where.status = 'published';
      where.examConfigId = enrolledConfigIds;
    }
    const tests = await Test.findAll({
      where,
      include: [{ model: ExamConfig, as: 'examConfig' }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: tests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tests/:id  (full test with questions for student)
const getTestById = async (req, res) => {
  try {
    const test = await Test.findOne({
      where: { id: req.params.id, instituteId: req.user.instituteId },
      include: [
        { model: ExamConfig, as: 'examConfig', include: [{ model: Section, as: 'sections' }] },
        {
          model: Question, as: 'questions',
          attributes: req.user.role === 'student'
            ? { exclude: ['correctOption', 'correctNumericAnswer'] }
            : undefined,
          order: [['questionOrder', 'ASC']],
        },
      ],
    });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (req.user.role === 'student' && test.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Test not available' });
    }
    return res.json({ success: true, data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tests  (admin)
const createTest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { title, examConfigId, description, scheduledAt, scheduledEnd } = req.body;
    const examConfig = await ExamConfig.findByPk(examConfigId);
    if (!examConfig) return res.status(404).json({ success: false, message: 'Exam config not found' });

    if (scheduledAt && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledAt)) {
      return res.status(400).json({ success: false, message: 'Window end must be after window start' });
    }

    const test = await Test.create({ title, examConfigId, description, scheduledAt: scheduledAt || null, scheduledEnd: scheduledEnd || null, createdBy: req.user.id, instituteId: req.user.instituteId });
    return res.status(201).json({ success: true, message: 'Test created', data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tests/:id/publish  (admin)
const publishTest = async (req, res) => {
  try {
    const test = await Test.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId }, include: [{ model: Question, as: 'questions' }] });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot publish a test with no questions' });
    }
    await test.update({ status: 'published' });
    return res.json({ success: true, message: 'Test published successfully', data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tests/:id/schedule  (admin) — set/update schedule window
const scheduleTest = async (req, res) => {
  try {
    const test = await Test.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId } });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const { scheduledAt, scheduledEnd } = req.body;

    if (scheduledAt && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledAt)) {
      return res.status(400).json({ success: false, message: 'Window end must be after window start' });
    }

    await test.update({
      scheduledAt:  scheduledAt  !== undefined ? (scheduledAt  || null) : test.scheduledAt,
      scheduledEnd: scheduledEnd !== undefined ? (scheduledEnd || null) : test.scheduledEnd,
    });
    return res.json({ success: true, message: 'Schedule updated', data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tests/:id  (admin)
const updateTest = async (req, res) => {
  try {
    const test = await Test.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId } });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    await test.update(req.body);
    return res.json({ success: true, message: 'Test updated', data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tests/:id  (admin)
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId } });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    await test.destroy();
    return res.json({ success: true, message: 'Test deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tests/analytics/all (admin)
const getTestAnalytics = async (req, res) => {
  try {
    const tests = await Test.findAll({
      where: { instituteId: req.user.instituteId },
      include: [{ model: ExamConfig, as: 'examConfig', attributes: ['totalMarks', 'displayName'] }]
    });
    
    // Find attempts associated with tests from this institute
    const testIds = tests.map(t => t.id);
    const attempts = await Attempt.findAll({
      where: { status: { [Op.in]: ['submitted', 'auto_submitted'] }, testId: { [Op.in]: testIds } },
      attributes: ['testId', 'score', 'totalCorrect', 'totalWrong', 'totalSkipped']
    });

    const totalStudents = await User.count({ where: { role: 'student', instituteId: req.user.instituteId } });

    const analytics = tests.map(test => {
      const testAttempts = attempts.filter(a => a.testId === test.id);
      const totalAttempts = testAttempts.length;
      
      let avgScore = 0;
      let avgAccuracy = 0;
      
      if (totalAttempts > 0) {
        const totalScore = testAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
        avgScore = (totalScore / totalAttempts).toFixed(2);
        
        let totalC = 0, totalW = 0;
        testAttempts.forEach(a => {
           totalC += (a.totalCorrect || 0);
           totalW += (a.totalWrong || 0);
        });
        avgAccuracy = (totalC + totalW) > 0 ? ((totalC / (totalC + totalW)) * 100).toFixed(2) : 0;
      }
      
      const completionPercentage = totalStudents > 0 ? ((totalAttempts / totalStudents) * 100).toFixed(2) : 0;
      
      return {
        testId: test.id,
        title: test.title,
        examConfigName: test.examConfig?.displayName,
        totalMarks: test.examConfig?.totalMarks,
        totalAttempts,
        avgScore,
        avgAccuracy,
        completionPercentage
      };
    });
    
    return res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('getTestAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTests, getTestById, createTest, publishTest, scheduleTest, updateTest, deleteTest, getTestAnalytics };
