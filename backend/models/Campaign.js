import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  campaignName: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ANALYZED', 'APPROVED', 'SENT', 'COMPLETED'],
    default: 'DRAFT'
  }
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
