import Campaign from '../models/Campaign.js';
import Customer from '../models/Customer.js';
import AIInsight from '../models/AIInsight.js';
import Communication from '../models/Communication.js';
import { sendEmail } from '../services/email.js';
import axios from 'axios';

// Create campaign and generate sequential ID e.g. CMP001
export const createCampaign = async (req, res) => {
  try {
    const { campaignName } = req.body;
    if (!campaignName) {
      return res.status(400).json({ message: 'Campaign name is required' });
    }

    // Generate unique sequential campaign ID (e.g. CMP001, CMP002...)
    const latestCampaign = await Campaign.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    if (latestCampaign && latestCampaign.campaignId) {
      const match = latestCampaign.campaignId.match(/CMP(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const campaignId = `CMP${String(nextNumber).padStart(3, '0')}`;

    const campaign = new Campaign({
      campaignId,
      campaignName,
      createdBy: req.user._id,
      status: 'DRAFT'
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
};

// Get all campaigns for user + dashboard counts
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    
    // Calculate dashboard statistics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'APPROVED' || c.status === 'SENT').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED').length;

    res.json({
      campaigns,
      stats: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
};

// Get single campaign details (including its customers, communications, and insights)
export const getCampaignDetails = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const customers = await Customer.find({ campaignId: campaign._id });
    const aiInsight = await AIInsight.findOne({ campaignId: campaign._id });
    const communications = await Communication.find({ campaignId: campaign._id });

    res.json({
      campaign,
      customers,
      aiInsight,
      communications
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaign details', error: error.message });
  }
};

// Upload customers and validate
export const uploadCustomers = async (req, res) => {
  try {
    const { customers } = req.body;
    const campaignId = req.params.id;

    // Check if campaign exists
    const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ message: 'Customers list is required and must be an array' });
    }

    // Minimum 5 customers required validation
    if (customers.length < 5) {
      return res.status(400).json({ message: 'Campaign requirements failed: A minimum of 5 customers is required.' });
    }

    // Validate fields for each customer
    const requiredFields = ['name', 'age', 'city', 'email', 'totalOrders', 'totalSpend', 'lastOrders'];
    for (const [index, cust] of customers.entries()) {
      for (const field of requiredFields) {
        if (cust[field] === undefined || cust[field] === null || cust[field] === '') {
          return res.status(400).json({
            message: `Validation error at row ${index + 1}: Customer field '${field}' is required.`
          });
        }
      }
    }

    // Clean up existing customers for this campaign (allows re-upload)
    await Customer.deleteMany({ campaignId: campaign._id });

    // Prepare and insert
    const customerDocs = customers.map(cust => ({
      campaignId: campaign._id,
      name: cust.name,
      age: Number(cust.age),
      city: cust.city,
      email: cust.email,
      totalOrders: Number(cust.totalOrders),
      totalSpend: Number(cust.totalSpend),
      lastOrders: String(cust.lastOrders)
    }));

    const insertedCustomers = await Customer.insertMany(customerDocs);

    // Reset status back to DRAFT or keep, let's keep DRAFT until analyzed
    campaign.status = 'DRAFT';
    await campaign.save();

    res.status(200).json({
      message: 'Customers uploaded successfully',
      count: insertedCustomers.length,
      customers: insertedCustomers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading customers', error: error.message });
  }
};

// Send Campaign to all customers and notify Channel Service
export const sendCampaign = async (req, res) => {
  try {
    const { subject, body } = req.body;
    const campaignId = req.params.id;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body templates are required' });
    }

    const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const customers = await Customer.find({ campaignId: campaign._id });
    if (customers.length === 0) {
      return res.status(400).json({ message: 'No customers found for this campaign. Upload customer list first.' });
    }

    const trackingBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Loop through each customer and send personalized email + notify Channel Service
    for (const customer of customers) {
      const trackingLink = `${trackingBaseUrl}/customer/${customer._id}`;

      // Personalize subject & body
      const personalizedSubject = subject
        .replace(/\{\{name\}\}/g, customer.name)
        .replace(/\{\{city\}\}/g, customer.city)
        .replace(/\{\{totalOrders\}\}/g, customer.totalOrders.toString())
        .replace(/\{\{totalSpend\}\}/g, customer.totalSpend.toString());

      const personalizedBody = body
        .replace(/\{\{name\}\}/g, customer.name)
        .replace(/\{\{city\}\}/g, customer.city)
        .replace(/\{\{totalOrders\}\}/g, customer.totalOrders.toString())
        .replace(/\{\{totalSpend\}\}/g, customer.totalSpend.toString())
        .replace(/\{\{tracking_link\}\}/g, trackingLink);

      // 1. Record communication as SENT
      await Communication.findOneAndUpdate(
        { campaignId: campaign._id, customerId: customer._id },
        {
          campaignId: campaign._id,
          customerId: customer._id,
          status: 'SENT',
          timestamp: new Date()
        },
        { upsert: true, new: true }
      );

      // 2. Call Resend Email Service (non-blocking)
      sendEmail({
        to: customer.email,
        subject: personalizedSubject,
        body: personalizedBody
      }).catch(err => console.error(`Error sending email to ${customer.email}:`, err.message));

      // 3. Simulate Channel Service locally (non-blocking loopback request for DELIVERED status)
      const port = process.env.PORT || 5000;
      setTimeout(() => {
        axios.post(`http://127.0.0.1:${port}/api/receipt`, {
          customerId: customer._id,
          campaignId: campaign._id,
          status: 'DELIVERED'
        }).catch(err => console.error(`Failed to send local DELIVERED callback for ${customer.email}:`, err.message));
      }, 1500);
    }

    // Update campaign status
    campaign.status = 'SENT';
    await campaign.save();

    res.json({
      message: `Campaign delivery initiated for ${customers.length} customers.`,
      status: 'SENT'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending campaign', error: error.message });
  }
};
