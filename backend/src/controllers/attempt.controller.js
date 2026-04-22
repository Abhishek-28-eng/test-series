const { Attempt, Answer, Test, Question, Section, ExamConfig } = require('../models');
const { Op } = require('sequelize');

// ── Marking Engine ─────────────────────────────────────────────
const calculateScore = (question, answer, examConfig) => {
  const hasNegative = examConfig.negativeMarking;

  if (question.questionType === 'MCQ') {
    if (!answer.selectedOption) return { correct: false, marks: 0 };
    if (answer.selectedOption === question.correctOption) {
      return { correct: true, marks: question.marks };
    }
    const deduction = hasNegative ? question.negativeMarks : 0;
    return { correct: false, marks: -deduction };
  }

  if (question.questionType === 'NUMERICAL') {
    if (answer.numericAnswer === null || answer.numericAnswer === undefined) return { correct: false, marks: 0 };
    const tolerance = 0.01;
    const isCorrect = Math.abs(answer.numericAnswer - question.correctNumericAnswer) <= tolerance;
    if (isCorrect) return { correct: true, marks: question.marks };
    const deduction = hasNegative ? question.negativeMarks : 0;
    return { correct: false, marks: -deduction };
  }

  return { correct: false, marks: 0 };
};

// POST /api/attempts/start
const startAttempt = async (req, res) => {
  try {
    const { testId } = req.body;
    const test = await Test.findByPk(testId, {
      include: [
        {
          model: ExamConfig, as: 'examConfig',
          include: [{ model: Section, as: 'sections' }],
        },
        { model: Question, as: 'questions', attributes: { exclude: ['correctOption', 'correctNumericAnswer'] } },
      ],
    });

    if (!test || test.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Test not found or not available' });
    }

    // Prevent duplicate in-progress attempt
    const existing = await Attempt.findOne({
      where: { userId: req.user.id, testId, status: 'in_progress' },
    });
    if (existing) {
      // Return existing attempt to resume
      const answers = await Answer.findAll({ where: { attemptId: existing.id } });
      return res.json({ success: true, message: 'Resuming existing attempt', data: { attempt: existing, test, answers } });
    }

    const attempt = await Attempt.create({ userId: req.user.id, testId, startTime: new Date() });

    // Pre-create NOT_VISITED answer stubs for all questions
    const answerStubs = test.questions.map((q) => ({
      attemptId: attempt.id,
      questionId: q.id,
      status: 'NOT_VISITED',
      selectedOption: null,
      numericAnswer: null,
    }));
    await Answer.bulkCreate(answerStubs);

    return res.status(201).json({ success: true, message: 'Attempt started', data: { attempt, test, answers: answerStubs } });
  } catch (error) {
    console.error('Start attempt error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attempts/save-answer
const saveAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedOption, numericAnswer, status } = req.body;

    const attempt = await Attempt.findOne({ where: { id: attemptId, userId: req.user.id } });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt already submitted' });
    }

    // Backend timer validation
    const test = await Test.findByPk(attempt.testId, { include: [{ model: ExamConfig, as: 'examConfig' }] });
    const elapsed = (Date.now() - new Date(attempt.startTime).getTime()) / 1000 / 60; // minutes
    if (elapsed > test.examConfig.duration + 1) { // 1-min grace
      await attempt.update({ status: 'auto_submitted' });
      return res.status(400).json({ success: false, message: 'Time expired. Attempt auto-submitted.' });
    }

    // JEE Section B: check max attempt limit
    const question = await Question.findByPk(questionId, { include: [{ model: Section, as: 'section' }] });
    if (question?.isSectionB && question.section?.maxAttempt) {
      const sectionBAnswered = await Answer.count({
        where: {
          attemptId,
          status: { [Op.in]: ['ANSWERED', 'ANSWERED_MARKED_REVIEW'] },
        },
        include: [{
          model: Question, as: 'question',
          where: { sectionId: question.sectionId, isSectionB: true },
          required: true,
        }],
      });
      const currentAnswer = await Answer.findOne({ where: { attemptId, questionId } });
      const wasAlreadyAnswered = currentAnswer && ['ANSWERED', 'ANSWERED_MARKED_REVIEW'].includes(currentAnswer.status);
      if (!wasAlreadyAnswered && sectionBAnswered >= question.section.maxAttempt) {
        return res.status(400).json({
          success: false,
          message: `Section B attempt limit reached (max ${question.section.maxAttempt})`,
        });
      }
    }

    const [answer, created] = await Answer.findOrCreate({
      where: { attemptId, questionId },
      defaults: { selectedOption: null, numericAnswer: null, status: 'NOT_VISITED' },
    });

    await answer.update({
      selectedOption: selectedOption || null,
      numericAnswer: numericAnswer !== undefined ? numericAnswer : null,
      status: status || 'ANSWERED',
    });

    return res.json({ success: true, message: 'Answer saved', data: answer });
  } catch (error) {
    console.error('Save answer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attempts/submit
const submitAttempt = async (req, res) => {
  try {
    const { attemptId } = req.body;

    const attempt = await Attempt.findOne({ where: { id: attemptId, userId: req.user.id } });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt already submitted' });
    }

    const test = await Test.findByPk(attempt.testId, {
      include: [{ model: ExamConfig, as: 'examConfig' }],
    });

    const answers = await Answer.findAll({ where: { attemptId } });
    const questions = await Question.findAll({ where: { testId: attempt.testId } });
    const questionMap = {};
    questions.forEach((q) => { questionMap[q.id] = q; });

    let totalScore = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;

    const updatedAnswers = [];
    for (const answer of answers) {
      const question = questionMap[answer.questionId];
      if (!question) continue;

      if (answer.status === 'NOT_VISITED' || answer.status === 'NOT_ANSWERED') {
        totalSkipped++;
        updatedAnswers.push(answer.update({ isCorrect: null, marksObtained: 0 }));
        continue;
      }

      const { correct, marks } = calculateScore(question, answer, test.examConfig);
      totalScore += marks;
      if (correct) totalCorrect++;
      else if (marks < 0 || answer.selectedOption || answer.numericAnswer !== null) totalWrong++;
      updatedAnswers.push(answer.update({ isCorrect: correct, marksObtained: marks }));
    }

    await Promise.all(updatedAnswers);

    const endTime = new Date();
    const timeTaken = Math.round((endTime - new Date(attempt.startTime)) / 1000);

    await attempt.update({
      status: 'submitted',
      endTime,
      score: Math.max(0, totalScore),
      totalCorrect,
      totalWrong,
      totalSkipped,
      timeTaken,
    });

    return res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attempt: attempt.toJSON(),
        summary: {
          score: Math.max(0, totalScore),
          totalMarks: test.examConfig.totalMarks,
          accuracy: totalCorrect + totalWrong > 0
            ? parseFloat(((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(2))
            : 0,
          totalCorrect,
          totalWrong,
          totalSkipped,
          timeTaken,
        },
      },
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts/my
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.user.id },
      include: [{ model: Test, as: 'test', include: [{ model: ExamConfig, as: 'examConfig' }] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: attempts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts/:id/result
const getAttemptResult = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      where: {
        id: req.params.id,
        ...(req.user.role === 'student' ? { userId: req.user.id } : {}),
      },
      include: [
        { model: Test, as: 'test', include: [{ model: ExamConfig, as: 'examConfig' }] },
        {
          model: Answer, as: 'answers',
          include: [{
            model: Question, as: 'question',
            include: [{ model: Section, as: 'section' }],
          }],
        },
      ],
    });

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    const accuracy = attempt.totalCorrect + attempt.totalWrong > 0
      ? parseFloat(((attempt.totalCorrect / (attempt.totalCorrect + attempt.totalWrong)) * 100).toFixed(2))
      : 0;

    return res.json({
      success: true,
      data: {
        attempt,
        summary: {
          score: attempt.score,
          totalMarks: attempt.test.examConfig.totalMarks,
          accuracy,
          totalCorrect: attempt.totalCorrect,
          totalWrong: attempt.totalWrong,
          totalSkipped: attempt.totalSkipped,
          timeTaken: attempt.timeTaken,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts/analytics
const getAnalytics = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.user.id, status: { [Op.in]: ['submitted', 'auto_submitted'] } },
      include: [
        {
          model: Answer, as: 'answers',
          include: [{ 
            model: Question, as: 'question', 
            attributes: ['subject', 'sectionId'],
            include: [{ model: Section, as: 'section', attributes: ['subject'] }]
          }]
        }
      ]
    });

    let totalTests = attempts.length;
    let totalScore = 0;
    const subjectStats = {};

    attempts.forEach(attempt => {
      totalScore += attempt.score || 0;
      attempt.answers.forEach(ans => {
        if (!ans.question) return;
        
        const subj = ans.question.subject || ans.question.section?.subject || 'General';
        
        if (!subjectStats[subj]) {
          subjectStats[subj] = { correct: 0, wrong: 0, skipped: 0, obtainedMarks: 0, totalAttempts: 0 };
        }
        
        subjectStats[subj].totalAttempts++;
        if (ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED') {
          subjectStats[subj].skipped++;
        } else if (ans.isCorrect === true) {
          subjectStats[subj].correct++;
          subjectStats[subj].obtainedMarks += (ans.marksObtained || 0);
        } else {
          subjectStats[subj].wrong++;
          subjectStats[subj].obtainedMarks += (ans.marksObtained || 0); // Include negative marks
        }
      });
    });

    return res.json({
      success: true,
      data: {
        totalTests,
        averageScore: totalTests > 0 ? (totalScore / totalTests).toFixed(2) : 0,
        subjectStats
      }
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts/mistakes
const getMistakes = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.user.id, status: { [Op.in]: ['submitted', 'auto_submitted'] } },
      attributes: ['id', 'testId', 'updatedAt'],
      include: [
        { model: Test, as: 'test', attributes: ['title'] },
        {
          model: Answer, as: 'answers',
          where: { isCorrect: { [Op.not]: true } },
          include: [{ 
            model: Question, as: 'question',
            include: [{ model: Section, as: 'section', attributes: ['subject'] }]
          }]
        }
      ]
    });

    const mistakes = [];
    attempts.forEach(attempt => {
      attempt.answers.forEach(ans => {
        mistakes.push({
          answerId: ans.id,
          testName: attempt.test?.title,
          attemptDate: attempt.updatedAt,
          subject: ans.question?.subject || ans.question?.section?.subject || 'General',
          questionText: ans.question?.questionText,
          questionType: ans.question?.questionType,
          selectedOption: ans.selectedOption,
          numericAnswer: ans.numericAnswer,
          correctOption: ans.question?.correctOption,
          correctNumericAnswer: ans.question?.correctNumericAnswer,
          explanation: ans.question?.explanation,
          wasSkipped: ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED'
        });
      });
    });

    // Optionally fetch skipped separately, or change `where` to `isCorrect: false OR isCorrect: null`
    // Wait, Sequelize `isCorrect: false` only gets WRONG answers, not NULL (skipped).
    // Let's refetch to include skipped too.

    return res.json({ success: true, data: mistakes });
  } catch (error) {
    console.error('getMistakes error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startAttempt, saveAnswer, submitAttempt, getMyAttempts, getAttemptResult, getAnalytics, getMistakes };
