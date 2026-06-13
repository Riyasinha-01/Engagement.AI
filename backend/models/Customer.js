import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  totalOrders: {
    type: Number,
    required: true
  },
  totalSpend: {
    type: Number,
    required: true
  },
  lastOrders: {
    type: String, // String to support date formats or other patterns
    required: true
  }
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
