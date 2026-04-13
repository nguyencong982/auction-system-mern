import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js'; 
import UserController from './controllers/UserController.js';
import ProductController from './controllers/ProductController.js';
import Message from './models/Message.js';
import auth, { adminMiddleware } from './middleware/auth.js'; 
import upload from './middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// --- 1. TỰ ĐỘNG TẠO THƯ MỤC UPLOADS ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- 2. CẤU HÌNH SOCKET.IO (Đã sửa cổng 5173) ---
const io = new Server(httpServer, {
    cors: {
        origin: [
            "https://auction-system-mern-psi.vercel.app", 
            "http://localhost:3000", 
            "http://localhost:5173" // Thêm cổng này cho Vite
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

app.set('socketio', io);

// 3. Kết nối Database
connectDB();

// --- 4. MIDDLEWARES (Đã sửa cổng 5173) ---
app.use(cors({
    origin: [
        "https://auction-system-mern-psi.vercel.app", 
        "http://localhost:3000", 
        "http://localhost:5173" // Thêm cổng này cho Vite
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auction_products', express.static(path.join(__dirname, 'auction_products')));

app.use((req, res, next) => {
    req.io = io; 
    next();
});

// 5. Socket.io Logic
io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);
    
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`👤 User ${userId} đã tham gia phòng thông báo.`);
        }
    });

    socket.on('joinChat', (productId) => {
        socket.join(`chat_${productId}`);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { productId, senderId, content } = data;
            if (!content || !content.trim()) return;

            const newMessage = await Message.create({
                productId,
                sender: senderId,
                content
            });

            const populatedMessage = await Message.findById(newMessage._id)
                .populate('sender', 'fullName avatar');

            io.to(`chat_${productId}`).emit('newMessage', populatedMessage);
        } catch (error) {
            console.error("❌ Lỗi Socket Chat:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Một user đã ngắt kết nối');
    });
});

import './services/AuctionTask.js'; 

// --- 6. HỆ THỐNG ROUTES ---

// A. Routes Xác thực
app.post('/api/auth/register', UserController.register); 
app.post('/api/auth/login', UserController.login);
app.post('/api/auth/reset-password', UserController.resetPassword); 
app.get('/api/auth/profile', auth, UserController.getProfile); 
app.put('/api/auth/profile', auth, UserController.updateProfile); 
app.post('/api/auth/setup-payment-pin', auth, UserController.setupPaymentPassword);

// B. Routes Người dùng
app.get('/api/users/profile/:id', auth, UserController.getPublicProfile);
app.post('/api/users/follow/:id', auth, UserController.toggleFollow);
app.get('/api/users/follow-lists', auth, UserController.getFollowLists);
app.post('/api/users/update-avatar', auth, upload.single('avatar'), UserController.updateProfileImage);
app.post('/api/users/update-cover', auth, upload.single('cover'), UserController.updateProfileImage);

// C. Routes Sản phẩm
app.get('/api/products/admin/pending', auth, adminMiddleware, ProductController.getPendingAdmin);
app.patch('/api/products/admin/approve/:id', auth, adminMiddleware, ProductController.approveProduct);

app.get('/api/products', ProductController.getAllActive);
app.get('/api/products/my-sold-items', auth, ProductController.getMySoldProducts); 
app.get('/api/products/check-has-products', auth, ProductController.checkUserHasProducts); 
app.get('/api/products/my-products', auth, ProductController.getMyProducts); 
app.get('/api/products/my-bids', auth, ProductController.getMyBidHistory);
app.get('/api/products/:id/chat', auth, ProductController.getChatHistory); 
app.get('/api/products/:id', ProductController.getDetail); 
app.post('/api/products', auth, upload.single('image'), ProductController.create);
app.put('/api/products/:id', auth, ProductController.update);
app.delete('/api/products/:id', auth, ProductController.delete);
app.post('/api/products/bid', auth, ProductController.bid);

// D. Hệ thống Tài chính
app.use('/api/deposit', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes); 

app.get('/api/notifications/unread-count', auth, UserController.getUnreadCount);
app.get('/api/notifications', auth, UserController.getNotifications);
app.post('/api/user/deposit', auth, UserController.deposit);
app.post('/api/auth/reset-payment-pin', auth, UserController.resetPaymentPinByOTP);

// 7. Xử lý lỗi tập trung
app.use((err, req, res, next) => {
    console.error("🔥 Lỗi Server:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: "Có lỗi xảy ra trên server!",
        error: err.message 
    });
});

// 8. Khởi chạy Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server đang chạy ổn định trên Port: ${PORT}`);
});

export { io };