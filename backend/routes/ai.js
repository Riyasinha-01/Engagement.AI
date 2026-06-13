import express from 'express';
import { analyzeCampaign, approveCampaign, regenerateCampaign, generateEmailTemplate } from '../controllers/aiController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/analyze', auth, analyzeCampaign);
router.post('/:id/approve', auth, approveCampaign);
router.post('/:id/regenerate', auth, regenerateCampaign);
router.post('/:id/email/generate', auth, generateEmailTemplate);

export default router;
