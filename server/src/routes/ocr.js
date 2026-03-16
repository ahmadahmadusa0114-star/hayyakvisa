const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Temp storage for OCR uploads
const ocrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '../../../uploads/ocr_tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'ocr_' + Date.now() + path.extname(file.originalname));
  }
});

const ocrUpload = multer({
  storage: ocrStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Normalize OCR text for MRZ reading:
 * - Tesseract common misreads in MRZ zone
 */
function normalizeMRZText(text) {
  return text
    .toUpperCase()
    .replace(/\s+/g, '')           // strip all whitespace
    .replace(/0/g, '0')            // keep 0
    .replace(/[oO]/g, '0')        // O → 0 in numeric fields (handled per-field below)
    .replace(/[lI|]/g, '1')       // l, I, | → 1
    .replace(/[^A-Z0-9<]/g, '<'); // anything else → filler <
}

/**
 * Normalize a raw OCR line for MRZ:
 * - Strip spaces/noise and normalize common character substitutions
 */
function cleanMRZLine(line) {
  return line
    .toUpperCase()
    .replace(/[^A-Z0-9<\s]/g, '') // keep only valid MRZ chars + spaces
    .replace(/\s+/g, '<')         // spaces become filler
    .replace(/[oO]/g, '0')        // O → 0 (common OCR mistake in numeric field)
    .replace(/[lI|!]/g, '1')      // l/I/| → 1
    .replace(/[Gg]/g, '6')        // G → 6 (sometimes)
    .replace(/[Ss$]/g, '5')       // S → 5 sometimes in MRZ numbers
    .trim();
}

/**
 * Find MRZ lines in raw OCR text.
 * Strategy: look for 2 consecutive lines that are 20–50 chars of [A-Z0-9<]
 * The last two qualifying lines are usually the MRZ (bottom of passport).
 */
function findMRZLines(rawText) {
  const candidates = [];
  const lines = rawText.split('\n');

  for (const line of lines) {
    const cleaned = cleanMRZLine(line);
    // MRZ TD3 lines are 44 chars, allow some slack (30–50)
    if (cleaned.length >= 25 && /^[A-Z0-9<]{25,}$/.test(cleaned)) {
      candidates.push(cleaned);
    }
  }

  // Try to find two consecutive near-equal-length lines (44 chars is ideal)
  if (candidates.length >= 2) {
    // Prefer the last two candidates
    return [
      candidates[candidates.length - 2].slice(0, 44).padEnd(44, '<'),
      candidates[candidates.length - 1].slice(0, 44).padEnd(44, '<'),
    ];
  }

  // Fallback: try to find inside the normalized block text (some OCR merges lines)
  const block = rawText.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9<]/g, '<');
  const mrzMatch = block.match(/P[A-Z<][A-Z<]{43}[A-Z0-9<]{44}/);
  if (mrzMatch) {
    const raw = mrzMatch[0];
    return [raw.slice(0, 44), raw.slice(44, 88)];
  }

  return null;
}

function formatYYMMDD(yymmdd) {
  if (!yymmdd || yymmdd.length < 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  if (isNaN(yy) || !mm.match(/^\d{2}$/) || !dd.match(/^\d{2}$/)) return '';
  const year = yy > 30 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

function parseMRZLines(line1, line2) {
  try {
    // --- Line 1: P<COUNTRYNAME<<FIRSTNAME<MIDDLENAME ---
    // Position 0: document type (P)
    // Position 1: subtype (<)
    // Position 2-4: issuing country (3 chars)
    // Position 5-43: names (separated by <<)
    const issuingCountry = line1.substring(2, 5).replace(/</g, '');
    const namePart = line1.substring(5).split('<<');
    const lastName = (namePart[0] || '').replace(/</g, ' ').trim();
    const firstName = ((namePart[1] || '') + ' ' + (namePart[2] || '')).replace(/</g, ' ').trim();
    const fullNameEn = [lastName, firstName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    // --- Line 2: PASSPORT_NUMBER(9) CHECK NATIONALITY(3) DOB(6) CHECK SEX(1) EXPIRY(6) CHECK ---
    // Restore common OCR mistakes in the numeric portion of line 2
    // In the numeric regions, O→0, l→1, etc.
    const numericFix = (s) => s.replace(/[oO]/g, '0').replace(/[lI|]/g, '1');

    const passportNumberRaw = numericFix(line2.substring(0, 9)).replace(/</g, '');
    const nationalityRaw = line2.substring(10, 13).replace(/</g, '');
    const dobRaw = numericFix(line2.substring(13, 19));
    const expiryRaw = numericFix(line2.substring(21, 27));

    const dob = formatYYMMDD(dobRaw);
    const expiry = formatYYMMDD(expiryRaw);

    // Use issuing country as nationality if nationality field is all filler
    const nationality = nationalityRaw || issuingCountry;

    return {
      passport_number: passportNumberRaw,
      full_name_en: fullNameEn,
      nationality,
      date_of_birth: dob,
      passport_expiry: expiry,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Run OCR on one image path with given config.
 * Returns raw text string.
 */
async function runTesseract(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
    tessedit_pageseg_mode: '6', // assume uniform block of text
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
  });
  return text;
}

// POST /api/ocr/passport
router.post('/passport', authenticate, ocrUpload.single('passport_image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Passport image is required' });

  const inputPath = req.file.path;
  const base = inputPath.replace(/\.[^.]+$/, '');
  const processedFull = base + '_full.png';
  const processedCrop = base + '_crop.png';
  const processedHigh = base + '_high.png';

  const cleanup = () => {
    [inputPath, processedFull, processedCrop, processedHigh].forEach(f => fs.unlink(f, () => {}));
  };

  try {
    // Get image metadata
    const meta = await sharp(inputPath).metadata();
    const imgWidth = meta.width || 1000;
    const imgHeight = meta.height || 700;

    // Strategy 1: Full image — greyscale + normalize + resize to 2000px wide
    await sharp(inputPath)
      .resize({ width: 2000, withoutEnlargement: false })
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .threshold(140) // binarize — helps MRZ reading
      .toFile(processedFull);

    // Strategy 2: Crop bottom 30% of passport (where MRZ always lives)
    const cropTop = Math.floor(imgHeight * 0.65);
    const cropHeight = imgHeight - cropTop;
    await sharp(inputPath)
      .extract({ left: 0, top: cropTop, width: imgWidth, height: cropHeight })
      .resize({ width: 2000 })
      .greyscale()
      .normalize()
      .sharpen({ sigma: 2 })
      .threshold(130)
      .toFile(processedCrop);

    // Strategy 3: Gamma + high linear contrast (no clahe to avoid UCHAR format issues)
    await sharp(inputPath)
      .resize({ width: 2000 })
      .greyscale()
      .gamma(0.7)               // darken mid-tones to improve MRZ visibility
      .linear(1.8, -40)         // boost contrast: multiply + offset
      .normalise()
      .sharpen({ sigma: 2 })
      .toFile(processedHigh);

    const rawTexts = [];
    let parsed = null;

    // Try all three preprocessed images
    for (const imgPath of [processedCrop, processedFull, processedHigh]) {
      try {
        const text = await runTesseract(imgPath);
        rawTexts.push(text);
        const mrzLines = findMRZLines(text);
        if (mrzLines) {
          const result = parseMRZLines(mrzLines[0], mrzLines[1]);
          if (result && result.passport_number && result.passport_number.length >= 5) {
            console.log('✅ OCR: MRZ parsed from', path.basename(imgPath));
            console.log('  Line1:', mrzLines[0]);
            console.log('  Line2:', mrzLines[1]);
            console.log('  Result:', result);
            parsed = result;
            break;
          }
        }
      } catch (ocrErr) {
        console.warn('OCR attempt failed:', ocrErr.message);
      }
    }

    cleanup();

    if (!parsed) {
      // Return all raw text so developer/user can debug
      const combinedRaw = rawTexts.map((t, i) => `--- Strategy ${i + 1} ---\n${t}`).join('\n\n');
      console.log('❌ OCR: All strategies failed. Raw text:\n', combinedRaw.substring(0, 1000));
      return res.status(422).json({
        error: 'Could not extract MRZ from passport image. Please fill fields manually.',
        hint: 'Ensure the passport photo is clear, well-lit, and the MRZ zone (bottom of passport) is fully visible.',
        raw_text: combinedRaw.substring(0, 1000)
      });
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    cleanup();
    throw err;
  }
});

module.exports = router;
