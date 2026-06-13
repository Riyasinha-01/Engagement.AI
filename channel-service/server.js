import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'http://localhost:5000/api/receipt';
const PORT = process.env.PORT || 6000;

app.post('/api/send', (req, res) => {
  const { customerId, campaignId, email, message } = req.body;

  if (!customerId || !campaignId || !email) {
    return res.status(400).json({ message: 'Missing customerId, campaignId, or email in send payload' });
  }

  console.log(`[Channel Service] Initiated communication for Customer: ${email}`);

  // Simulating lifecycle callback progression:
  // Step 1: Immediately notify CRM backend that email has been SENT
  axios.post(CRM_BACKEND_URL, {
    customerId,
    campaignId,
    status: 'SENT'
  })
  .then(() => console.log(`[Channel Service] SENT callback successfully delivered for customer: ${email}`))
  .catch(err => console.error(`[Channel Service] Failed to send SENT callback: ${err.message}`));

  // Step 2: Simulate delivery delay (1.5 seconds) and send DELIVERED callback
  setTimeout(() => {
    axios.post(CRM_BACKEND_URL, {
      customerId,
      campaignId,
      status: 'DELIVERED'
    })
    .then(() => console.log(`[Channel Service] DELIVERED callback successfully delivered for customer: ${email}`))
    .catch(err => console.error(`[Channel Service] Failed to send DELIVERED callback: ${err.message}`));
  }, 1500);

  res.json({
    status: 'SIMULATED_SUCCESS',
    message: `Delivery lifecycle triggered for customer ${email}`
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Channel Service' });
});

app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
  console.log(`Configured CRM Backend Callback URL: ${CRM_BACKEND_URL}`);
});
