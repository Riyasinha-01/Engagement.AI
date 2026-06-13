import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    unique: true
  },
  highValueCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  likelyToRepurchase: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  atRiskCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  recommendedCampaign: {
    title: { type: String, required: true },
    offer: { type: String, required: true },
    reason: { type: String, required: true }
  }
});

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
export default AIInsight;
