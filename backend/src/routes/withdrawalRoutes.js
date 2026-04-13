import express from 'express';
import { 
  createWithdrawal, 
  getMyWithdrawals 
} from '../controllers/withdrawalController.js';

import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', auth, createWithdrawal);
router.get('/my-history', auth, getMyWithdrawals);

export default router;