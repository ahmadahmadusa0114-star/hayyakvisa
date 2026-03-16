const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Application, Company, Manifest, WalletTransaction } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'passports';
    if (file.fieldname === 'personal_photo') folder = 'photos';
    const uploadDir = path.join(__dirname, '../../../uploads', folder);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only jpg, jpeg, png, pdf files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET all applications (admin: all, company: own)
router.get('/', authenticate, async (req, res) => {
  const { status, company_id, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  // Companies can only see their own
  if (req.user.role === 'COMPANY') {
    where.company_id = req.user.id;
  } else if (company_id) {
    where.company_id = company_id;
  }

  if (status) where.status = status;

  if (search) {
    where.$or = [
      { passport_number: { $regex: search, $options: 'i' } },
      { full_name_en: { $regex: search, $options: 'i' } },
      { full_name_ar: { $regex: search, $options: 'i' } },
    ];
  }

  const [applications, total] = await Promise.all([
    Application.find(where)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 })
      .populate('company', 'name')
      .populate('manifest', 'manifest_number'),
    Application.countDocuments(where)
  ]);

  res.json({ applications, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET stats
router.get('/stats', authenticate, async (req, res) => {
  const where = req.user.role === 'COMPANY' ? { company_id: req.user.id } : {};

  const [total, submitted, processing, approved, rejected] = await Promise.all([
    Application.countDocuments(where),
    Application.countDocuments({ ...where, status: 'SUBMITTED' }),
    Application.countDocuments({ ...where, status: 'PROCESSING' }),
    Application.countDocuments({ ...where, status: 'APPROVED' }),
    Application.countDocuments({ ...where, status: 'REJECTED' }),
  ]);

  res.json({ total, submitted, processing, approved, rejected });
});

// GET single application
router.get('/:id', authenticate, async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('company', 'name')
    .populate('manifest', 'manifest_number');

  if (!application) return res.status(404).json({ error: 'Application not found' });

  // Companies can only see their own
  if (req.user.role === 'COMPANY' && application.company_id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(application);
});

// POST submit application(s)
router.post('/', authenticate, upload.fields([
  { name: 'passport_image', maxCount: 1 },
  { name: 'personal_photo', maxCount: 1 }
]), async (req, res) => {
  const companyId = req.user.role === 'COMPANY' ? req.user.id : req.body.company_id;

  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  // Get company with current balance
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  if (company.status !== 'ACTIVE') return res.status(403).json({ error: 'Company is inactive' });

  const {
    full_name_ar, full_name_en, passport_number,
    nationality, date_of_birth, passport_expiry, phone
  } = req.body;

  if (!full_name_ar || !full_name_en || !passport_number || !nationality || !date_of_birth || !passport_expiry || !phone) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check wallet balance
  if (company.wallet_balance < company.markup_price) {
    return res.status(402).json({
      error: `Insufficient wallet balance. Required: ${company.markup_price} JOD, Available: ${company.wallet_balance} JOD`
    });
  }

  // Check for duplicate passport
  const duplicate = await Application.findOne({
    passport_number, 
    status: { $ne: 'REJECTED' } 
  });
  if (duplicate) {
    return res.status(409).json({
      error: `Passport number ${passport_number} has already been submitted and is ${duplicate.status.toLowerCase()}`
    });
  }

  const passport_image = req.files?.passport_image?.[0]
    ? `/uploads/passports/${req.files.passport_image[0].filename}`
    : null;
  const personal_photo = req.files?.personal_photo?.[0]
    ? `/uploads/photos/${req.files.personal_photo[0].filename}`
    : null;

  // Transaction-like behavior
  company.wallet_balance -= company.markup_price;
  await company.save();

  const application = await Application.create({
    company_id: companyId,
    full_name_ar,
    full_name_en,
    passport_number,
    nationality,
    date_of_birth,
    passport_expiry,
    phone,
    passport_image,
    personal_photo,
    status: 'SUBMITTED'
  });

  await WalletTransaction.create({
    company_id: companyId,
    type: 'DEDUCTION',
    amount: company.markup_price,
    description: `Application submitted for passport ${passport_number}`
  });

  res.status(201).json(application);
});

// PUT update application status (admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  application.status = status;
  await application.save();

  res.json(application);
});

// DELETE application (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  await Application.findByIdAndDelete(req.params.id);
  res.json({ message: 'Application deleted' });
});

module.exports = router;
