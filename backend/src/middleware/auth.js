import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Middleware xác thực người dùng đã đăng nhập
export const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: "Không tìm thấy quyền truy cập. Vui lòng đăng nhập!" 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Người dùng không tồn tại!" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: "Token không hợp lệ hoặc đã hết hạn!" 
        });
    }
};

// 2. Middleware kiểm tra đã thiết lập mã PIN chưa (Dùng cho rút tiền)
export const requirePin = async (req, res, next) => {
    try {
        // req.user được kế thừa từ middleware auth chạy trước đó
        if (!req.user.hasPaymentPin) {
            return res.status(403).json({ 
                success: false, 
                message: "Vui lòng thiết lập mã PIN thanh toán trước khi thực hiện giao dịch này." 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi kiểm tra mã PIN" });
    }
};

// 3. Middleware dành cho Admin
export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: "Truy cập bị từ chối! Bạn không có quyền quản trị." 
        });
    }
};

// Xuất mặc định là auth để các file cũ không bị lỗi import
export default auth;