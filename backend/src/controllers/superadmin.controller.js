const { Institute, User, ExamConfig, Section } = require('../models');

const STANDARD_EXAM_CONFIGS = [
  {
    name: 'MHT-CET_PCM', displayName: 'MHT-CET (PCM)', duration: 180, totalMarks: 200, negativeMarking: false,
    instructions: 'Section 1 (Physics + Chemistry): 90 minutes | Section 2 (Mathematics): 90 minutes. No negative marking.',
    sections: [
      { subject: 'Physics',     totalQuestions: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 1 },
      { subject: 'Chemistry',   totalQuestions: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 2 },
      { subject: 'Mathematics', totalQuestions: 50, marksPerQuestion: 2, negativeMarksPerQuestion: 0, sectionDuration: 90, sectionOrder: 3 },
    ],
  },
  {
    name: 'MHT-CET_PCB', displayName: 'MHT-CET (PCB)', duration: 180, totalMarks: 200, negativeMarking: false,
    instructions: 'Physics: 50Q | Chemistry: 50Q | Biology: 100Q. No negative marking.',
    sections: [
      { subject: 'Physics',   totalQuestions: 50,  marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 1 },
      { subject: 'Chemistry', totalQuestions: 50,  marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 2 },
      { subject: 'Biology',   totalQuestions: 100, marksPerQuestion: 1, negativeMarksPerQuestion: 0, sectionDuration: null, sectionOrder: 3 },
    ],
  },
  {
    name: 'JEE', displayName: 'JEE Main', duration: 180, totalMarks: 300, negativeMarking: true,
    instructions: '+4 for correct, -1 for wrong.',
    sections: [
      { subject: 'Physics',     totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 1 },
      { subject: 'Chemistry',   totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 2 },
      { subject: 'Mathematics', totalQuestions: 30, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 3 },
    ],
  },
  {
    name: 'NEET', displayName: 'NEET UG', duration: 200, totalMarks: 720, negativeMarking: true,
    instructions: '+4 for correct, -1 for wrong.',
    sections: [
      { subject: 'Physics',   totalQuestions: 50,  marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 1 },
      { subject: 'Chemistry', totalQuestions: 50,  marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 2 },
      { subject: 'Biology',   totalQuestions: 100, marksPerQuestion: 4, negativeMarksPerQuestion: 1, sectionDuration: null, sectionOrder: 3 },
    ],
  },
];

const seedExamConfigsForInstitute = async (instituteId) => {
  for (const config of STANDARD_EXAM_CONFIGS) {
    const { sections, ...configData } = config;
    const [ec] = await ExamConfig.findOrCreate({
      where: { name: configData.name, instituteId },
      defaults: { ...configData, instituteId },
    });
    for (const sec of sections) {
      await Section.findOrCreate({
        where: { examConfigId: ec.id, subject: sec.subject },
        defaults: { ...sec, examConfigId: ec.id },
      });
    }
  }
};

const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    // Fetch total admins per institute just to show some stats
    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['instituteId'] });
    const students = await User.findAll({ where: { role: 'student' }, attributes: ['instituteId'] });

    const data = institutes.map(inst => {
      return {
        ...inst.toJSON(),
        totalAdmins: admins.filter(a => a.instituteId === inst.id).length,
        totalStudents: students.filter(s => s.instituteId === inst.id).length,
      }
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createInstitute = async (req, res) => {
  try {
    const { name, code, adminName, adminMobile, adminPassword } = req.body;

    if (!name || !code || !adminName || !adminMobile || !adminPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if code exists
    const existingInst = await Institute.findOne({ where: { code: code.toUpperCase() } });
    if (existingInst) {
      return res.status(409).json({ success: false, message: 'Institute code already in use' });
    }

    // Check if admin mobile globally exists to avoid collision
    const existingAdmin = await User.findOne({ where: { mobile: adminMobile } });
    if (existingAdmin) {
       return res.status(409).json({ success: false, message: 'Admin mobile already registered' });
    }

    // Create Institute
    const institute = await Institute.create({
      name,
      code: code.toUpperCase(),
      isActive: true
    });

    // Create Primary Admin
    const admin = await User.create({
      name: adminName,
      mobile: adminMobile,
      password: adminPassword,
      role: 'admin',
      instituteId: institute.id
    });

    // Auto-seed the 4 standard exam configs for this institute
    await seedExamConfigsForInstitute(institute.id);

    return res.status(201).json({
      success: true,
      message: 'Institute, admin, and exam configs created successfully',
      data: { institute, admin: { name: admin.name, mobile: admin.mobile } }
    });
  } catch (error) {
    const errorMsg = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
    return res.status(500).json({ success: false, message: errorMsg, stack: error.stack });
  }
};

const toggleInstituteStatus = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });
    
    if (institute.code === 'DEFAULT') {
       return res.status(400).json({ success: false, message: 'Cannot disable the default institute' });
    }

    await institute.update({ isActive: !institute.isActive });
    return res.json({ success: true, message: `Institute ${institute.isActive ? 'enabled' : 'disabled'}`, data: institute });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });

    if (institute.code === 'DEFAULT') {
       return res.status(400).json({ success: false, message: 'Cannot delete the default institute' });
    }

    await institute.destroy();
    return res.json({ success: true, message: 'Institute and all associated data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllInstitutes, createInstitute, toggleInstituteStatus, deleteInstitute };
