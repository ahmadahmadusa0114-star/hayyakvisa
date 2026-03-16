const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Company } = require('../models');

const router = express.Router();

// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin._id, email: admin.email, name: admin.name, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, user: { id: admin._id, email: admin.email, name: admin.name, role: 'ADMIN' } });
});

// Company Login
router.post('/company/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const company = await Company.findOne({ email });
  if (!company) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (company.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Company account is inactive. Please contact admin.' });
  }

  const isValid = await bcrypt.compare(password, company.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: company._id, email: company.email, name: company.name, role: 'COMPANY' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id: company._id,
      email: company.email,
      name: company.name,
      role: 'COMPANY',
      wallet_balance: company.wallet_balance,
      markup_price: company.markup_price,
    }
  });
});

module.exports = router;
