const { Test, ExamConfig, Section, Question, Attempt, User, Enrollment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// GET /api/tests  (student: only enrolled | admin: all)
const getAllTests = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'student') {
      // Only show published tests the student is enrolled in
      const enrollments = await Enrollment.findAll({ where: { userId: req.user.id } });
      const enrolledConfigIds = enrollments.map(e => e.examConfigId);
      where = { status: 'published', examConfigId: enrolledConfigIds };
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
    const test = await Test.findByPk(req.params.id, {
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

    const { title, examConfigId, description, scheduledAt } = req.body;
    const examConfig = await ExamConfig.findByPk(examConfigId);
    if (!examConfig) return res.status(404).json({ success: false, message: 'Exam config not found' });

    const test = await Test.create({ title, examConfigId, description, scheduledAt, createdBy: req.user.id });
    return res.status(201).json({ success: true, message: 'Test created', data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tests/:id/publish  (admin)
const publishTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, { include: [{ model: Question, as: 'questions' }] });
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

// PUT /api/tests/:id  (admin)
const updateTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
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
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    await test.destroy();
    return res.json({ success: true, message: 'Test deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTests, getTestById, createTest, publishTest, updateTest, deleteTest };
