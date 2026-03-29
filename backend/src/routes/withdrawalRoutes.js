import express from 'express';
import { 
    createWithdrawal, 
    getAllWithdrawals, 
    approveWithdrawal, 
    getMyWithdrawals 
} from '../controllers/withdrawalController.js';
import auth from '../middleware/auth.js'; 

const router = express.Router();

// Đường dẫn đầy đủ: POST /api/withdrawals/request
router.post('/request', auth, createWithdrawal);

// Đường dẫn đầy đủ: GET /api/withdrawals/my-history
router.get('/my-history', auth, getMyWithdrawals);

// Đường dẫn đầy đủ: GET /api/withdrawals (Dành cho Admin xem danh sách)
router.get('/', auth, getAllWithdrawals);

// Đường dẫn đầy đủ: PUT /api/withdrawals/:id/status (Admin duyệt)
router.put('/:id/status', auth, approveWithdrawal);
router.post('/request', auth, requirePin, createWithdrawal);

export default router;