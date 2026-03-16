const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { Manifest, Application } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer for Excel uploads
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/manifests');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'manifest_' + Date.now() + path.extname(file.originalname));
  }
});
const excelUpload = multer({ storage: excelStorage });

// GET all manifests
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const manifests = await Manifest.find()
    .sort({ created_at: -1 })
    .populate('applications');

  const formattedManifests = manifests.map(m => {
    const obj = m.toObject();
    obj._count = { applications: obj.applications ? obj.applications.length : 0 };
    delete obj.applications;
    return obj;
  });

  res.json(formattedManifests);
});

// GET export manifest as Excel
router.get('/export', authenticate, requireAdmin, async (req, res) => {
  const { status = 'SUBMITTED', manifest_id } = req.query;

  const where = {};
  if (manifest_id) {
    where.manifest_id = manifest_id;
  } else {
    where.status = { $in: ['SUBMITTED', 'PROCESSING'] };
  }

  const applications = await Application.find(where)
    .sort({ created_at: 1 })
    .populate('company', 'name');

  if (applications.length === 0) {
    return res.status(404).json({ error: 'No applications found for export' });
  }

  // Create manifest record
  const manifestNumber = 'MNF-' + Date.now();
  const manifest = await Manifest.create({
    manifest_number: manifestNumber
  });

  // Link applications to manifest and update status to PROCESSING
  const appIds = applications.map(a => a._id);
  await Application.updateMany(
    { _id: { $in: appIds } },
    { $set: { manifest_id: manifest._id, status: 'PROCESSING' } }
  );

  // Build Excel data
  const rows = applications.map((app, index) => ({
    'الرقم': index + 1,
    'الاسم بالعربي': app.full_name_ar,
    'الاسم بالانجليزي': app.full_name_en,
    'تاريخ الميلاد': app.date_of_birth,
    'الجنسية': app.nationality,
    'رقم الجواز': app.passport_number,
    'الطيران': '',
    'رقم الرحلة': '',
    'تاريخ الرحلة': '',
    'وقت الرحلة': '',
    'رقم الهاتف': app.phone,
    'الشركة': app.company ? app.company.name : 'Unknown',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { width: 8 }, { width: 30 }, { width: 30 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 18 }, { width: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Manifest');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${manifestNumber}.xlsx"`);
  res.send(buffer);
});

// POST import JET response Excel
router.post('/import', authenticate, requireAdmin, excelUpload.single('result_file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Excel file is required' });

  const filePath = req.file.path;

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data rows' });
    }

    // Detect columns (flexible header matching)
    const sampleRow = rows[0];
    const keys = Object.keys(sampleRow);

    const passportCol = keys.find(k =>
      k.toLowerCase().includes('passport') || k.includes('جواز') || k.toLowerCase().includes('passport_number')
    );
    const statusCol = keys.find(k =>
      k.toLowerCase().includes('status') || k.includes('الحالة') || k.toLowerCase().includes('result')
    );

    if (!passportCol) {
      return res.status(400).json({
        error: 'Could not find passport number column. Expected column: "passport_number" or "رقم الجواز"',
        available_columns: keys
      });
    }

    const results = {
      updated: [],
      missing: [],
      invalid_status: [],
      total: rows.length
    };

    const validStatuses = ['APPROVED', 'REJECTED', 'approved', 'rejected', 'موافق', 'مرفوض'];

    for (const row of rows) {
      const passportNumber = String(row[passportCol] || '').trim();
      const rawStatus = statusCol ? String(row[statusCol] || '').trim() : 'APPROVED';

      if (!passportNumber) continue;

      // Map status
      let mappedStatus;
      const lowerStatus = rawStatus.toLowerCase();
      if (['approved', 'موافق', 'approve', 'yes', '1', 'true'].includes(lowerStatus)) {
        mappedStatus = 'APPROVED';
      } else if (['rejected', 'مرفوض', 'reject', 'no', '0', 'false', 'denied'].includes(lowerStatus)) {
        mappedStatus = 'REJECTED';
      } else if (rawStatus.toUpperCase() === 'APPROVED') {
        mappedStatus = 'APPROVED';
      } else if (rawStatus.toUpperCase() === 'REJECTED') {
        mappedStatus = 'REJECTED';
      }

      const application = await Application.findOne({ passport_number: passportNumber });

      if (!application) {
        results.missing.push(passportNumber);
        continue;
      }

      if (!mappedStatus) {
        results.invalid_status.push({ passport: passportNumber, status: rawStatus });
        continue;
      }

      application.status = mappedStatus;
      await application.save();

      results.updated.push({ passport: passportNumber, status: mappedStatus });
    }

    // Clean up uploaded file
    fs.unlink(filePath, () => {});

    res.json({
      message: 'Import completed',
      summary: {
        total: results.total,
        updated: results.updated.length,
        missing: results.missing.length,
        invalid_status: results.invalid_status.length,
      },
      details: results
    });
  } catch (err) {
    fs.unlink(filePath, () => {});
    throw err;
  }
});

module.exports = router;
