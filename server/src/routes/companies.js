const express = require('express');
const bcrypt = require('bcryptjs');
const { Company, WalletTransaction } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin auth
router.use(authenticate, requireAdmin);

// GET all companies
router.get('/', async (req, res) => {
  const companies = await Company.find()
    .sort({ created_at: -1 })
    .populate('applications')
    .select('-password');
    
  const formattedCompanies = companies.map(c => {
    const obj = c.toObject();
    obj._count = { applications: obj.applications ? obj.applications.length : 0 };
    delete obj.applications;
    return obj;
  });

  res.json(formattedCompanies);
});

// GET single company
router.get('/:id', async (req, res) => {
  const company = await Company.findById(req.params.id)
    .populate('applications')
    .select('-password');
    
  if (!company) return res.status(404).json({ error: 'Company not found' });
  
  const obj = company.toObject();
  obj._count = { applications: obj.applications ? obj.applications.length : 0 };
  delete obj.applications;
  
  res.json(obj);
});

// POST create company
router.post('/', async (req, res) => {
  const { name, email, password, markup_price } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  const existing = await Company.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const company = await Company.create({
    name,
    email,
    password: hashedPassword,
    markup_price: markup_price ? parseFloat(markup_price) : 3.0,
  });

  res.status(201).json({
    id: company._id, name: company.name, email: company.email,
    markup_price: company.markup_price, wallet_balance: company.wallet_balance,
    status: company.status, created_at: company.created_at
  });
});

// PUT update company
router.put('/:id', async (req, res) => {
  const { name, email, markup_price, status, password } = req.body;

  const existing = await Company.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Company not found' });

  const updateData = {};
  if (name) updateData.name = name;
  if (email && email !== existing.email) {
    const emailTaken = await Company.findOne({ email });
    if (emailTaken) return res.status(409).json({ error: 'Email already in use' });
    updateData.email = email;
  }
  if (markup_price !== undefined) updateData.markup_price = parseFloat(markup_price);
  if (status) updateData.status = status;
  if (password) updateData.password = await bcrypt.hash(password, 10);

  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true }
  ).select('-password');

  res.json(company);
});

// DELETE company
router.delete('/:id', async (req, res) => {
  const existing = await Company.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Company not found' });

  await Company.findByIdAndDelete(req.params.id);
  res.json({ message: 'Company deleted successfully' });
});

// POST wallet operation (add/remove balance)
router.post('/:id/wallet', async (req, res) => {
  const { type, amount, description } = req.body;

  if (!type || !amount) return res.status(400).json({ error: 'type and amount are required' });
  if (!['DEPOSIT', 'REFUND'].includes(type) && type !== 'DEDUCTION') {
    return res.status(400).json({ error: 'type must be DEPOSIT or DEDUCTION' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  let balanceChange;
  if (type === 'DEPOSIT') {
    balanceChange = parsedAmount;
  } else if (type === 'DEDUCTION') {
    if (company.wallet_balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    balanceChange = -parsedAmount;
  }

  // Transaction-like behavior with Mongoose
  company.wallet_balance += balanceChange;
  await company.save();

  const transaction = await WalletTransaction.create({
    company_id: req.params.id,
    type,
    amount: parsedAmount,
    description: description || (type === 'DEPOSIT' ? 'Balance added by admin' : 'Balance removed by admin'),
  });

  res.json({ company: { id: company._id, name: company.name, wallet_balance: company.wallet_balance }, transaction });
});

module.exports = router;
