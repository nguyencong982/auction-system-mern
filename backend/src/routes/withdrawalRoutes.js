import express from 'express';
import { 
    createWithdrawal, 
    getAllWithdrawals, 
    approveWithdrawal, 
    getMyWithdrawals 
} from '../controllers/withdrawalController.js';

// Cập nhật dòng import này để lấy cả auth và requirePin
import { auth, requirePin } from '../middleware/auth.js'; 

const router = express.Router();

// Sử dụng cả auth (đăng nhập) và requirePin (đã có PIN)
router.post('/request', auth, requirePin, createWithdrawal);

router.get('/my-history', auth, getMyWithdrawals);
router.get('/', auth, getAllWithdrawals);
router.put('/:id/status', auth, approveWithdrawal);

export default router;