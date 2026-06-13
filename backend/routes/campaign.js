import express from 'express';
import { createCampaign, getCampaigns, getCampaignDetails, uploadCustomers, sendCampaign } from '../controllers/campaignController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createCampaign);
router.get('/', auth, getCampaigns);
router.get('/:id', auth, getCampaignDetails);
router.post('/:id/customers', auth, uploadCustomers);
router.post('/:id/send', auth, sendCampaign);

export default router;
