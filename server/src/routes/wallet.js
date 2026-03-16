const express = require('express');
const { WalletTransaction, Company } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET wallet transactions (company: own, admin: by companyId query param)
router.get('/transactions', authenticate, async (req, res) => {
  const { company_id, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (req.user.role === 'COMPANY') {
    where.company_id = req.user.id;
  } else if (company_id) {
    where.company_id = company_id;
  }

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(where)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 })
      .populate('company', 'name'),
    WalletTransaction.countDocuments(where)
  ]);

  res.json({ transactions, total });
});

// GET wallet balance (company: own only)
router.get('/balance', authenticate, async (req, res) => {
  if (req.user.role === 'COMPANY') {
    const company = await Company.findById(req.user.id)
      .select('name wallet_balance markup_price');
    if (!company) return res.status(404).json({ error: 'Company not found' });
    return res.json({
      id: company._id,
      name: company.name,
      wallet_balance: company.wallet_balance,
      markup_price: company.markup_price
    });
  }

  // Admin: get all company balances
  const companies = await Company.find()
    .select('name wallet_balance markup_price status');
    
  const formattedCompanies = companies.map(c => ({
    id: c._id,
    name: c.name,
    wallet_balance: c.wallet_balance,
    markup_price: c.markup_price,
    status: c.status
  }));
  
  res.json(formattedCompanies);
});

module.exports = router;
