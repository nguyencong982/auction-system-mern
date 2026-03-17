import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Middleware xác thực người dùng đã đăng nhập hay chưa
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

        // Tìm user trong database để lấy thông tin role mới nhất
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Người dùng không tồn tại!" });
        }

        // --- LƯU Ý CHO CHỨC NĂNG KHÓA TÀI KHOẢN SAU NÀY ---
        // Nếu user bị khóa (isBlocked), chúng ta có thể chặn ngay tại đây
        // if (user.isBlocked) {
        //     return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa!" });
        // }

        // Đính kèm toàn bộ thông tin user (bao gồm cả role) vào request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: "Token không hợp lệ hoặc đã hết hạn!" 
        });
    }
};

// 2. Middleware CHỈ CHO PHÉP ADMIN (Dùng cho duyệt nạp tiền, quản lý user, duyệt sản phẩm)
export const adminMiddleware = (req, res, next) => {
    // req.user được lấy từ middleware auth chạy phía trước
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: "Truy cập bị từ chối! Bạn không có quyền quản trị." 
        });
    }
};

export default auth;