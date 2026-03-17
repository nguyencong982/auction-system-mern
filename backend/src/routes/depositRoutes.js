import express from 'express';
const router = express.Router();
import { auth, adminMiddleware } from '../middleware/auth.js';
import { 
    createDeposit, 
    approveDeposit, 
    getAllPendingDeposits 
} from '../controllers/depositController.js';

// Route cho User: Tạo lệnh nạp
router.post('/create', auth, createDeposit);

// Route cho Admin: Xem danh sách chờ và Duyệt
router.get('/pending-list', auth, adminMiddleware, getAllPendingDeposits);
router.put('/approve/:transactionId', auth, adminMiddleware, approveDeposit);

export default router;