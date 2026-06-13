import express from 'express';
import { receiptCallback, trackCustomerAction } from '../controllers/trackingController.js';

const router = express.Router();

router.post('/receipt', receiptCallback);
router.post('/track/:customerId', trackCustomerAction);

export default router;
