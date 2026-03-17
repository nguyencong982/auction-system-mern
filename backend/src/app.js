import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import depositRoutes from './routes/depositRoutes.js';
// --- IMPORT ROUTE RÚT TIỀN ---
import withdrawalRoutes from './routes/withdrawalRoutes.js'; 
import 'dotenv/config';
// Import các Controller
import UserController from './controllers/UserController.js';
import ProductController from './controllers/ProductController.js';

// Import Model
import Message from './models/Message.js';

// Import Middleware
import auth from './middleware/auth.js'; 
import upload from './middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// 1. Cấu hình Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

// 2. Kết nối Database
connectDB();

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.io = io; 
    next();
});

// PHỤC VỤ FILE TĨNH
app.use('/uploads', express.static('uploads'));

// 4. Socket.io Logic
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
        console.log(`💬 User joined chat room: chat_${productId}`);
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

// --- HỆ THỐNG ROUTES ---

// A. Routes Xác thực (Auth)
app.post('/api/auth/register', UserController.register); 
app.post('/api/auth/login', UserController.login);
app.post('/api/auth/reset-password', UserController.resetPassword); 
app.get('/api/auth/profile', auth, UserController.getProfile); 
app.put('/api/auth/profile', auth, UserController.updateProfile); 

// B. Routes Người dùng
app.get('/api/users/profile/:id', auth, UserController.getPublicProfile);
app.post('/api/users/follow/:id', auth, UserController.toggleFollow);
app.get('/api/users/follow-lists', auth, UserController.getFollowLists);
app.post('/api/users/update-avatar', auth, upload.single('avatar'), UserController.updateProfileImage);
app.post('/api/users/update-cover', auth, upload.single('cover'), UserController.updateProfileImage);

// C. Routes Sản phẩm
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

// D. Hệ thống Tài chính (Nạp/Rút & Thông báo)
app.use('/api/deposit', depositRoutes);
// --- TÍCH HỢP ROUTE RÚT TIỀN TẠI ĐÂY ---
app.use('/api/withdrawals', withdrawalRoutes); 

app.get('/api/notifications/unread-count', auth, UserController.getUnreadCount);
app.get('/api/notifications', auth, UserController.getNotifications);
app.post('/api/user/deposit', auth, UserController.deposit);

// 5. Xử lý lỗi tập trung
app.use((err, req, res, next) => {
    console.error("🔥 Lỗi Server:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: "Có lỗi xảy ra trên server!",
        error: err.message 
    });
});

// 6. Khởi chạy Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server real-time chạy tại: http://localhost:${PORT}`);
});

export { io };