const { Institute, User } = require('../models');

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

    return res.status(201).json({
      success: true,
      message: 'Institute and primary admin created successfully',
      data: { institute, admin: { name: admin.name, mobile: admin.mobile } }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

module.exports = { getAllInstitutes, createInstitute, toggleInstituteStatus };
