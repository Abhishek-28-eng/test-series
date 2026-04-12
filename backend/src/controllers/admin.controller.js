const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { User, Test, Attempt, Answer, Question, ExamConfig, Enrollment, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTests, totalAttempts, recentAttempts] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      Test.count(),
      Attempt.count({ where: { status: { [Op.in]: ['submitted', 'auto_submitted'] } } }),
      Attempt.findAll({
        where: { status: { [Op.in]: ['submitted', 'auto_submitted'] } },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'mobile'] },
          { model: Test, as: 'test', attributes: ['id', 'title'] },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 10,
      }),
    ]);

    const avgScore = await Attempt.findOne({
      where: { status: { [Op.in]: ['submitted', 'auto_submitted'] } },
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avg']],
      raw: true,
    });

    return res.json({
      success: true,
      data: { totalStudents, totalTests, totalAttempts, avgScore: parseFloat(avgScore?.avg || 0).toFixed(2), recentAttempts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: { exclude: ['password'] },
      include: [{ model: Enrollment, as: 'enrollments', include: [{ model: ExamConfig, as: 'examConfig' }] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/students/register
const registerStudent = async (req, res) => {
  try {
    const { name, email, mobile, password, enrolledExamConfigs = [], classYear, parentMobile } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile and password are required' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const mobileExists = await User.findOne({ where: { mobile } });
    if (mobileExists) return res.status(409).json({ success: false, message: 'Mobile already registered' });

    const user = await User.create({ name, email: email || null, mobile, password, role: 'student', classYear, parentMobile });

    // Create enrollments for selected exam configs
    if (Array.isArray(enrolledExamConfigs) && enrolledExamConfigs.length > 0) {
      const enrollments = enrolledExamConfigs.map(ecId => ({ userId: user.id, examConfigId: parseInt(ecId) }));
      await Enrollment.bulkCreate(enrollments, { ignoreDuplicates: true });
    }

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      data: { id: user.id, name: user.name, mobile: user.mobile },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/students/:id/reset-password
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await student.update({ password: newPassword });
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    await student.destroy();
    return res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/students/:id/enrollments
const updateEnrollments = async (req, res) => {
  try {
    const { examConfigIds = [] } = req.body;
    const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Remove existing and re-create
    await Enrollment.destroy({ where: { userId: student.id } });
    if (examConfigIds.length > 0) {
      await Enrollment.bulkCreate(examConfigIds.map(ecId => ({ userId: student.id, examConfigId: parseInt(ecId) })), { ignoreDuplicates: true });
    }
    return res.json({ success: true, message: 'Enrollments updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/students/:id/growth
const getStudentGrowth = async (req, res) => {
  try {
    const student = await User.findOne({ where: { id: req.params.id, role: 'student' }, attributes: { exclude: ['password'] } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const attempts = await Attempt.findAll({
      where: { userId: req.params.id, status: { [Op.in]: ['submitted', 'auto_submitted'] } },
      include: [{ model: Test, as: 'test', include: [{ model: ExamConfig, as: 'examConfig' }] }],
      order: [['createdAt', 'ASC']],
    });

    const growth = attempts.map((a, idx) => ({
      attemptNo:   idx + 1,
      testTitle:   a.test?.title,
      examType:    a.test?.examConfig?.displayName,
      score:       a.score,
      totalMarks:  a.test?.examConfig?.totalMarks,
      percentage:  a.test?.examConfig?.totalMarks ? parseFloat(((a.score / a.test.examConfig.totalMarks) * 100).toFixed(1)) : 0,
      accuracy:    a.totalCorrect + a.totalWrong > 0 ? parseFloat(((a.totalCorrect / (a.totalCorrect + a.totalWrong)) * 100).toFixed(1)) : 0,
      correct:     a.totalCorrect,
      wrong:       a.totalWrong,
      skipped:     a.totalSkipped,
      timeTaken:   a.timeTaken,
      date:        a.createdAt,
    }));

    return res.json({ success: true, data: { student, growth } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/results
const getAllResults = async (req, res) => {
  try {
    const { testId } = req.query;
    const where = { status: { [Op.in]: ['submitted', 'auto_submitted'] } };
    if (testId) where.testId = testId;

    const attempts = await Attempt.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'mobile'] },
        { model: Test, as: 'test', attributes: ['id', 'title'] },
      ],
      order: [['score', 'DESC']],
    });

    const results = attempts.map((a, idx) => ({
      rank: idx + 1,
      ...a.toJSON(),
      accuracy: a.totalCorrect + a.totalWrong > 0
        ? parseFloat(((a.totalCorrect / (a.totalCorrect + a.totalWrong)) * 100).toFixed(2)) : 0,
      timeTakenFormatted: a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : 'N/A',
    }));

    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/results/export  — CSV download
const exportResults = async (req, res) => {
  try {
    const { testId } = req.query;
    const where = { status: { [Op.in]: ['submitted', 'auto_submitted'] } };
    if (testId) where.testId = testId;

    const attempts = await Attempt.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'mobile'] },
        { model: Test, as: 'test', attributes: ['id', 'title'] },
      ],
      order: [['score', 'DESC']],
    });

    const rows = attempts.map((a, idx) => ({
      Rank:         idx + 1,
      Name:         a.user?.name,
      Mobile:       a.user?.mobile,
      Test:         a.test?.title,
      Score:        a.score,
      Correct:      a.totalCorrect,
      Wrong:        a.totalWrong,
      Skipped:      a.totalSkipped,
      Accuracy:     a.totalCorrect + a.totalWrong > 0
        ? `${((a.totalCorrect / (a.totalCorrect + a.totalWrong)) * 100).toFixed(1)}%` : '0%',
      'Time Taken': a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : 'N/A',
      Date:         new Date(a.updatedAt).toLocaleDateString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('results.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/students/:id/attempts
const getStudentAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.params.id },
      include: [{ model: Test, as: 'test', include: [{ model: ExamConfig, as: 'examConfig' }] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: attempts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/students/:id/analytics  — subject-wise totals across all attempts
const getStudentAnalytics = async (req, res) => {
  try {
    const student = await User.findOne({
      where: { id: req.params.id, role: 'student' },
      attributes: { exclude: ['password'] }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Step 1: Get submitted attempts (lightweight — only need id + score)
    const attempts = await Attempt.findAll({
      where: { userId: req.params.id, status: { [Op.in]: ['submitted', 'auto_submitted'] } },
      attributes: ['id', 'score'],
    });

    const totalTests    = attempts.length;
    const totalScore    = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const attemptIds    = attempts.map(a => a.id);
    const subjectStats  = {};

    if (attemptIds.length > 0) {
      // Step 2: Flat query — all answers for those attempts joined with question subject
      const answers = await Answer.findAll({
        where: { attemptId: { [Op.in]: attemptIds } },
        attributes: ['status', 'isCorrect'],
        include: [{ model: Question, as: 'question', attributes: ['id', 'subject'] }],
      });

      answers.forEach(ans => {
        const subj = ans.question?.subject;
        if (!subj) return;
        if (!subjectStats[subj]) subjectStats[subj] = { correct: 0, wrong: 0, skipped: 0, totalAttempts: 0 };
        subjectStats[subj].totalAttempts++;
        if (ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED') {
          subjectStats[subj].skipped++;
        } else if (ans.isCorrect === true) {
          subjectStats[subj].correct++;
        } else {
          subjectStats[subj].wrong++;
        }
      });
    }

    return res.json({
      success: true,
      data: {
        student,
        totalTests,
        averageScore: totalTests > 0 ? (totalScore / totalTests).toFixed(2) : 0,
        subjectStats
      }
    });
  } catch (error) {
    console.error('getStudentAnalytics error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message || 'Server error in analytics' });
  }
};

module.exports = {
  getDashboard, getAllStudents, registerStudent, resetPassword, deleteStudent,
  updateEnrollments, getStudentGrowth, getAllResults, exportResults, getStudentAttempts, getStudentAnalytics,
};
