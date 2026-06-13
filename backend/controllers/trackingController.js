import Communication from '../models/Communication.js';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import AIInsight from '../models/AIInsight.js';


// Calculate campaign analytics helper
export const calculateCampaignStats = async (campaignId) => {
  const communications = await Communication.find({ campaignId });
  const totalCustomers = await Customer.countDocuments({ campaignId });

  // Funnel calculations (cumulative based on lifecycle status progression)
  // Statuses: SENT -> DELIVERED -> OPENED -> CLICKED -> PURCHASED
  const sent = communications.length;
  const delivered = communications.filter(c => 
    ['DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED'].includes(c.status)
  ).length;
  const opened = communications.filter(c => 
    ['OPENED', 'CLICKED', 'PURCHASED'].includes(c.status)
  ).length;
  const clicked = communications.filter(c => 
    ['CLICKED', 'PURCHASED'].includes(c.status)
  ).length;
  const purchased = communications.filter(c => 
    c.status === 'PURCHASED'
  ).length;

  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
  const purchaseRate = sent > 0 ? Math.round((purchased / sent) * 100) : 0;

  return {
    campaignId,
    totalCustomers,
    sent,
    delivered,
    opened,
    clicked,
    purchased,
    openRate,
    clickRate,
    purchaseRate
  };
};

// Broadcast updates to Socket.io clients
const broadcastStats = async (app, campaignId) => {
  const io = app.get('socketio');
  if (io) {
    try {
      const stats = await calculateCampaignStats(campaignId);
      io.emit('campaign_update', stats);
      console.log(`Socket.io: Broadcasted stats for campaign ${campaignId}`);
    } catch (err) {
      console.error('Socket.io broadcast error:', err.message);
    }
  }
};

// Webhook callback endpoint for Channel Service
export const receiptCallback = async (req, res) => {
  try {
    const { customerId, campaignId, status } = req.body;

    if (!customerId || !campaignId || !status) {
      return res.status(400).json({ message: 'Missing receipt callback fields' });
    }

    // Update communication record status
    // Ensure we do not overwrite a higher lifecycle status (e.g., if customer opened, don't revert to DELIVERED)
    const statusPriority = {
      'SENT': 1,
      'DELIVERED': 2,
      'OPENED': 3,
      'CLICKED': 4,
      'PURCHASED': 5
    };

    const comm = await Communication.findOne({ campaignId, customerId });
    if (comm) {
      const currentPriority = statusPriority[comm.status] || 0;
      const incomingPriority = statusPriority[status] || 0;

      // Only update if incoming status is higher in the funnel
      if (incomingPriority > currentPriority) {
        comm.status = status;
        comm.timestamp = new Date();
        await comm.save();
      }
    } else {
      const newComm = new Communication({ campaignId, customerId, status });
      await newComm.save();
    }

    // Broadcast updated stats via socket
    await broadcastStats(req.app, campaignId);

    res.json({ message: 'Receipt updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating receipt callback', error: error.message });
  }
};

// Direct tracking action endpoint for the Customer page
export const trackCustomerAction = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.body; // OPENED, CLICKED, or PURCHASED

    if (!['OPENED', 'CLICKED', 'PURCHASED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid tracking status' });
    }

    // Find customer to obtain their campaignId
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

        const campaignId = customer.campaignId;
    
    // Fetch campaign recommendations to present on landing page
    const aiInsight = await AIInsight.findOne({ campaignId });

    // Update status in communications
    const statusPriority = {
      'SENT': 1,
      'DELIVERED': 2,
      'OPENED': 3,
      'CLICKED': 4,
      'PURCHASED': 5
    };

    const comm = await Communication.findOne({ campaignId, customerId });
    if (comm) {
      const currentPriority = statusPriority[comm.status] || 0;
      const incomingPriority = statusPriority[status] || 0;

      if (incomingPriority > currentPriority) {
        comm.status = status;
        comm.timestamp = new Date();
        await comm.save();
      }
    } else {
      const newComm = new Communication({ campaignId, customerId, status });
      await newComm.save();
    }

    // Broadcast updated stats via socket
    await broadcastStats(req.app, campaignId.toString());

    res.json({
      message: `Tracking updated to ${status} for customer ${customer.name}`,
      customer: {
        name: customer.name,
        city: customer.city
      },
      campaign: {
        title: aiInsight?.recommendedCampaign?.title || 'Special Rewards Offer',
        offer: aiInsight?.recommendedCampaign?.offer || 'Get 25% OFF your next purchase'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking customer action', error: error.message });
  }
};
