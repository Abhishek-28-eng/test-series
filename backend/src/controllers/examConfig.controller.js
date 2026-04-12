const { ExamConfig, Section } = require('../models');

// GET /api/exam-configs
const getAllConfigs = async (req, res) => {
  try {
    const configs = await ExamConfig.findAll({
      include: [{ model: Section, as: 'sections', order: [['sectionOrder', 'ASC']] }],
    });
    return res.json({ success: true, data: configs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/exam-configs/:id
const getConfigById = async (req, res) => {
  try {
    const config = await ExamConfig.findByPk(req.params.id, {
      include: [{ model: Section, as: 'sections', order: [['sectionOrder', 'ASC']] }],
    });
    if (!config) return res.status(404).json({ success: false, message: 'Exam config not found' });
    return res.json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/exam-configs/name/:name
const getConfigByName = async (req, res) => {
  try {
    const config = await ExamConfig.findOne({
      where: { name: req.params.name },
      include: [{ model: Section, as: 'sections', order: [['sectionOrder', 'ASC']] }],
    });
    if (!config) return res.status(404).json({ success: false, message: 'Exam config not found' });
    return res.json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllConfigs, getConfigById, getConfigByName };
