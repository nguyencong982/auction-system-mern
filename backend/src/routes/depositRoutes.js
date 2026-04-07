import express from 'express';
const router = express.Router();
import { auth, adminMiddleware } from '../middleware/auth.js';
import { 
    createDeposit, 
    approveDeposit, 
    getAllPendingDeposits,
    rejectDeposit // Import hàm mới
} from '../controllers/depositController.js';

// Route cho User
router.post('/create', auth, createDeposit);

// Route cho Admin
router.get('/pending-list', auth, adminMiddleware, getAllPendingDeposits);
router.put('/approve/:transactionId', auth, adminMiddleware, approveDeposit);

// Route Xóa/Từ chối (Dùng DELETE để đúng chuẩn RESTful)
router.delete('/reject/:transactionId', auth, adminMiddleware, rejectDeposit);

export default router;