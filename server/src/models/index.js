const mongoose = require('mongoose');

// ==========================================
// Admin Model
// ==========================================
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const Admin = mongoose.model('Admin', adminSchema);

// ==========================================
// Company Model
// ==========================================
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  markup_price: { type: Number, default: 3.0 },
  wallet_balance: { type: Number, default: 0.0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Virtual for applications count
companySchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'company_id',
  count: true
});

companySchema.set('toObject', { virtuals: true });
companySchema.set('toJSON', { virtuals: true });

const Company = mongoose.model('Company', companySchema);

// ==========================================
// Manifest Model
// ==========================================
const manifestSchema = new mongoose.Schema({
  manifest_number: { type: String, required: true, unique: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Virtual for applications count
manifestSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'manifest_id',
  count: true
});

manifestSchema.set('toObject', { virtuals: true });
manifestSchema.set('toJSON', { virtuals: true });

const Manifest = mongoose.model('Manifest', manifestSchema);

// ==========================================
// Application Model
// ==========================================
const applicationSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  manifest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest', default: null },
  full_name_ar: { type: String, required: true },
  full_name_en: { type: String, required: true },
  passport_number: { type: String, required: true },
  nationality: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  passport_expiry: { type: String, required: true },
  phone: { type: String, required: true },
  passport_image: { type: String, default: null },
  personal_photo: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED'], 
    default: 'SUBMITTED' 
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Ensure correct JSON transformation
applicationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  }
});

const Application = mongoose.model('Application', applicationSchema);

// ==========================================
// WalletTransaction Model
// ==========================================
const walletTransactionSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, enum: ['DEPOSIT', 'DEDUCTION', 'REFUND'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = {
  Admin,
  Company,
  Manifest,
  Application,
  WalletTransaction
};
