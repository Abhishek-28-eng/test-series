const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, instituteId: user.instituteId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { name, email, mobile, password, examType, classYear, parentMobile } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const mobileExists = await User.findOne({ where: { mobile } });
    if (mobileExists) return res.status(409).json({ success: false, message: 'Mobile already registered' });

    // For public registration, assign to DEFAULT institute if not specified
    const Institute = require('../models').Institute;
    const defaultInst = await Institute.findOne({ where: { code: 'DEFAULT' } });

    const user = await User.create({ name, email, mobile, password, role: 'student', examType, classYear, parentMobile, instituteId: defaultInst?.id });

    const token = generateToken(user);
    return res.status(201).json({ success: true, message: 'Registration successful', token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { email, mobile, password, instituteCode } = req.body;
    
    // Resolve Institute
    const Institute = require('../models').Institute;
    let institute;
    if (instituteCode) {
      institute = await Institute.findOne({ where: { code: instituteCode, isActive: true } });
      if (!institute) return res.status(404).json({ success: false, message: 'Invalid or inactive Institute Code' });
    } else {
      // Fallback for existing users / backward compatibility
      institute = await Institute.findOne({ where: { code: 'DEFAULT' } });
    }

    if (!institute) return res.status(500).json({ success: false, message: 'Institute system error' });

    // Support login via email OR mobile, scoping by institute
    let user = null;
    if (email) {
      user = await User.findOne({ where: { email, instituteId: institute.id } });
      if (!user) user = await User.findOne({ where: { email, role: 'superadmin' } });
    } else if (mobile) {
      user = await User.findOne({ where: { mobile, instituteId: institute.id } });
      if (!user) user = await User.findOne({ where: { mobile, role: 'superadmin' } });
    } else {
      return res.status(400).json({ success: false, message: 'Email or mobile number is required' });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Update engagement metrics
    await user.update({
      loginCount: (user.loginCount || 0) + 1,
      lastLoginAt: new Date(),
    });

    const token = generateToken(user);
    return res.json({ success: true, message: 'Login successful', token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.json({ success: true, user: req.user.toSafeJSON() });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, examType, classYear } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    await user.update({ name, examType, classYear });
    return res.json({ success: true, message: 'Profile updated successfully', user: user.toSafeJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
