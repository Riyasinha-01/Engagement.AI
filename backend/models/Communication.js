import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED'],
    default: 'SENT',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
