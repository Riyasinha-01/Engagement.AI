import Campaign from '../models/Campaign.js';
import Customer from '../models/Customer.js';
import AIInsight from '../models/AIInsight.js';
import { analyzeAudience, generateEmailsAI } from '../services/huggingface.js';

// Analyze customer audience and recommend campaign
export const analyzeCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Find campaign
    const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Find customers
    const customers = await Customer.find({ campaignId: campaign._id });
    if (customers.length < 5) {
      return res.status(400).json({ message: 'A minimum of 5 customers is required to perform AI analysis.' });
    }

    // Run AI Audience Analysis
    const analysisResult = await analyzeAudience(customers);

    // Store or update AIInsight
    const aiInsight = await AIInsight.findOneAndUpdate(
      { campaignId: campaign._id },
      {
        campaignId: campaign._id,
        highValueCustomers: analysisResult.highValueCustomers,
        likelyToRepurchase: analysisResult.likelyToRepurchase,
        atRiskCustomers: analysisResult.atRiskCustomers,
        recommendedCampaign: analysisResult.recommendedCampaign
      },
      { new: true, upsert: true }
    );

    // Update campaign status
    campaign.status = 'ANALYZED';
    await campaign.save();

    res.json(aiInsight);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing campaign audience', error: error.message });
  }
};

// Approve campaign recommendation
export const approveCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Verify insights exist
    const aiInsight = await AIInsight.findOne({ campaignId: campaign._id });
    if (!aiInsight) {
      return res.status(400).json({ message: 'Please run audience analysis before approving.' });
    }

    campaign.status = 'APPROVED';
    await campaign.save();

    res.json({
      message: 'Campaign approved successfully',
      campaign
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving campaign', error: error.message });
  }
};

// Regenerate campaign recommendation (essentially re-runs analysis)
export const regenerateCampaign = async (req, res) => {
  // Re-run the analysis
  return analyzeCampaign(req, res);
};

// Generate AI Email Template
export const generateEmailTemplate = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const aiInsight = await AIInsight.findOne({ campaignId: campaign._id });
    if (!aiInsight) {
      return res.status(400).json({ message: 'No campaign insights found. Run analysis first.' });
    }

    // Fetch a single customer to serve as a sample profile for the AI copywriter
    const sampleCustomer = await Customer.findOne({ campaignId: campaign._id });
    if (!sampleCustomer) {
      return res.status(400).json({ message: 'No customers found for this campaign.' });
    }

    // Generate personalized email content
    const emailResult = await generateEmailsAI(aiInsight.recommendedCampaign, sampleCustomer);

    // Convert the sample customer details into general brackets so the marketer edits a universal template
    // Replace customer name with {{name}}, customer city with {{city}}, etc.
    let genericBody = emailResult.body
      .replace(new RegExp(sampleCustomer.name, 'g'), '{{name}}')
      .replace(new RegExp(sampleCustomer.city, 'g'), '{{city}}')
      .replace(new RegExp(sampleCustomer.totalOrders.toString(), 'g'), '{{totalOrders}}')
      .replace(new RegExp('\\$?' + sampleCustomer.totalSpend.toString(), 'g'), '${{totalSpend}}');

    // Ensure the tracking link placeholder is included
    if (!genericBody.includes('{{tracking_link}}')) {
      genericBody += '\n\nClick here to view your offer: {{tracking_link}}';
    }

    let genericSubject = emailResult.subject
      .replace(new RegExp(sampleCustomer.name, 'g'), '{{name}}')
      .replace(new RegExp(sampleCustomer.city, 'g'), '{{city}}');

    res.json({
      subject: genericSubject,
      body: genericBody,
      campaignName: campaign.campaignName,
      recommendedCampaign: aiInsight.recommendedCampaign
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating email template', error: error.message });
  }
};
