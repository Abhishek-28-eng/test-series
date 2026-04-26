const { ExamConfig, Section } = require('../models');

// GET /api/exam-configs
const getAllConfigs = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const where = req.user.instituteId 
      ? { 
          [Op.or]: [
            { instituteId: req.user.instituteId },
            { instituteId: 1 },
            { instituteId: null }
          ]
        } 
      : {};
    const configs = await ExamConfig.findAll({
      where,
      include: [{ model: Section, as: 'sections', order: [['sectionOrder', 'ASC']] }],
    });

    // Deduplicate by name: prefer institute-specific config over global one
    const configMap = new Map();
    for (const cfg of configs) {
      if (!configMap.has(cfg.name)) {
        configMap.set(cfg.name, cfg);
      } else if (cfg.instituteId === req.user.instituteId) {
        configMap.set(cfg.name, cfg);
      }
    }

    return res.json({ success: true, data: Array.from(configMap.values()) });
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
