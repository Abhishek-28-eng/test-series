const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Question, Test, Section, ExamConfig } = require('../models');
const { validationResult } = require('express-validator');

const VALID_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const VALID_OPTIONS = ['A', 'B', 'C', 'D'];
const VALID_DIFFICULTY = ['easy', 'medium', 'hard'];
const VALID_TYPES = ['MCQ', 'NUMERICAL'];

// POST /api/questions  (admin - single question)
const createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const test = await Test.findByPk(req.body.testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const section = await Section.findByPk(req.body.sectionId);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

    const count = await Question.count({ where: { testId: req.body.testId, sectionId: req.body.sectionId } });
    const question = await Question.create({ ...req.body, questionOrder: count + 1 });
    return res.status(201).json({ success: true, message: 'Question created', data: question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/questions/upload-csv  (admin)
const uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No CSV file uploaded' });

  try {
    const { testId, sectionId } = req.body;
    if (!testId || !sectionId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'testId and sectionId are required' });
    }

    const test = await Test.findByPk(testId);
    if (!test) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const section = await Section.findByPk(sectionId, { include: [{ model: ExamConfig, as: 'examConfig' }] });
    if (!section) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const rows = [];
    const errors = [];
    let rowIndex = 1;

    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(req.file.path);
      stream
        .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim() }))
        .on('data', (row) => rows.push({ row, rowIndex: rowIndex++ }))
        .on('end', () => {
          stream.destroy(); // Ensure file is closed on Windows
          resolve();
        })
        .on('error', (err) => {
          stream.destroy();
          reject(err);
        });
    });

    const validRows = [];
    for (const { row, rowIndex } of rows) {
      const rowErrors = [];

      // Required field checks
      if (!row.subject?.trim()) rowErrors.push('subject is required');
      else if (!VALID_SUBJECTS.includes(row.subject.trim())) rowErrors.push(`subject must be one of: ${VALID_SUBJECTS.join(', ')}`);

      if (!row.questionText?.trim() && !row.question?.trim()) rowErrors.push('questionText is required');

      const qType = (row.questionType || row.question_type || 'MCQ').trim().toUpperCase();
      if (!VALID_TYPES.includes(qType)) rowErrors.push(`questionType must be MCQ or NUMERICAL`);

      if (qType === 'MCQ') {
        if (!row.optionA?.trim()) rowErrors.push('optionA required for MCQ');
        if (!row.optionB?.trim()) rowErrors.push('optionB required for MCQ');
        const co = (row.correctOption || row.correct_option || '').trim().toUpperCase();
        if (!VALID_OPTIONS.includes(co)) rowErrors.push(`correctOption must be A, B, C, or D`);
      }

      if (qType === 'NUMERICAL') {
        if (row.correctNumericAnswer === undefined || row.correctNumericAnswer === null || row.correctNumericAnswer === '') {
          rowErrors.push('correctNumericAnswer required for NUMERICAL type');
        }
      }

      const marks = parseFloat(row.marks);
      if (isNaN(marks) || marks <= 0) rowErrors.push('marks must be a positive number');

      const negMarksStr = row.negativeMarks || row.negative_marks || 0;
      const parsedNegMarks = parseFloat(negMarksStr);
      const negMarks = isNaN(parsedNegMarks) ? NaN : Math.abs(parsedNegMarks);
      if (isNaN(negMarks) || negMarks < 0) rowErrors.push('negativeMarks must be a valid number');

      const diff = (row.difficulty || 'medium').trim().toLowerCase();
      if (!VALID_DIFFICULTY.includes(diff)) rowErrors.push(`difficulty must be easy, medium, or hard`);

      if (rowErrors.length > 0) {
        errors.push({ row: rowIndex, errors: rowErrors, data: row });
      } else {
        validRows.push({
          testId: parseInt(testId),
          sectionId: parseInt(sectionId),
          subject: row.subject.trim(),
          chapter: row.chapter?.trim() || null,
          topic: row.topic?.trim() || null,
          questionType: qType,
          questionText: (row.questionText || row.question).trim(),
          optionA: row.optionA?.trim() || null,
          optionB: row.optionB?.trim() || null,
          optionC: row.optionC?.trim() || null,
          optionD: row.optionD?.trim() || null,
          correctOption: qType === 'MCQ' ? (row.correctOption || row.correct_option).trim().toUpperCase() : null,
          correctNumericAnswer: qType === 'NUMERICAL' ? parseFloat(row.correctNumericAnswer) : null,
          explanation: (row.explanation || row.solution || row.solutionText)?.trim() || null,
          marks,
          negativeMarks: negMarks,
          difficulty: diff,
          questionOrder: 0,
        });
      }
    }

    // Bulk insert valid rows
    let insertedCount = 0;
    if (validRows.length > 0) {
      const existingCount = await Question.count({ where: { testId, sectionId } });
      validRows.forEach((q, i) => { q.questionOrder = existingCount + i + 1; });
      await Question.bulkCreate(validRows);
      insertedCount = validRows.length;
    }

    // Cleanup file
    if (fs.existsSync(req.file.path)) {
      setTimeout(() => {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }, 100); // 100ms delay to free locks on Windows
    }

    return res.json({
      success: true,
      message: 'CSV processing complete',
      data: {
        totalRows: rows.length,
        successCount: insertedCount,
        failedCount: errors.length,
        errors,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    console.error('CSV Upload Crash Error:', error);
    return res.status(500).json({ success: false, message: 'Server upload crash: ' + error.message });
  }
};

// GET /api/questions/test/:testId  (all authenticated users)
const getQuestionsByTest = async (req, res) => {
  try {
    const isStudent = req.user.role === 'student';
    const questions = await Question.findAll({
      where: { testId: req.params.testId },
      attributes: isStudent
        ? { exclude: ['correctOption', 'correctNumericAnswer'] }
        : undefined,
      include: [{ model: Section, as: 'section' }],
      order: [['sectionId', 'ASC'], ['questionOrder', 'ASC']],
    });
    return res.json({ success: true, data: questions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/questions/:id  (admin)
const updateQuestion = async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

    const {
      questionText, questionType, subject, chapter, topic, difficulty,
      optionA, optionB, optionC, optionD,
      correctOption, correctNumericAnswer,
      marks, negativeMarks, explanation, isSectionB
    } = req.body;

    const qType = (questionType || q.questionType).trim().toUpperCase();
    if (!VALID_TYPES.includes(qType)) {
      return res.status(422).json({ success: false, message: 'questionType must be MCQ or NUMERICAL' });
    }
    if (qType === 'MCQ' && correctOption && !VALID_OPTIONS.includes(correctOption.toUpperCase())) {
      return res.status(422).json({ success: false, message: 'correctOption must be A, B, C, or D' });
    }

    await q.update({
      questionText:        questionText        ?? q.questionText,
      questionType:        qType,
      subject:             subject             ?? q.subject,
      chapter:             chapter             ?? q.chapter,
      topic:               topic               ?? q.topic,
      difficulty:          difficulty          ?? q.difficulty,
      optionA:             optionA             ?? q.optionA,
      optionB:             optionB             ?? q.optionB,
      optionC:             optionC             ?? q.optionC,
      optionD:             optionD             ?? q.optionD,
      correctOption:       qType === 'MCQ'      ? (correctOption?.toUpperCase() ?? q.correctOption) : null,
      correctNumericAnswer: qType === 'NUMERICAL' ? (correctNumericAnswer ?? q.correctNumericAnswer) : null,
      marks:               marks               ?? q.marks,
      negativeMarks:       negativeMarks       ?? q.negativeMarks,
      explanation:         explanation         ?? q.explanation,
      isSectionB:          isSectionB          ?? q.isSectionB,
    });

    return res.json({ success: true, message: 'Question updated', data: q });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/questions/:id  (admin)
const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    await q.destroy();
    return res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createQuestion, uploadCSV, getQuestionsByTest, updateQuestion, deleteQuestion };
