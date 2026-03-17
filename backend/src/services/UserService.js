import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
    // 1. Phương thức Đăng ký
    async registerAccount(userData) {
        const userExists = await User.findOne({ email: userData.email });
        if (userExists) {
            throw new Error('Email này đã được sử dụng!');
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        if (userData.phone) {
            const phoneExists = await User.findOne({ phone: userData.phone });
            if (phoneExists) {
                throw new Error('Số điện thoại này đã được sử dụng!');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Sử dụng spread operator (...) lấy toàn bộ thông tin từ userData
        const newUser = new User({
            ...userData,
            password: hashedPassword
        });

        return await newUser.save();
    }

    // 2. Phương thức Đăng nhập
    async loginAccount(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Email không tồn tại trên hệ thống!');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Mật khẩu không chính xác!');
        }

         // UserService.js
const token = jwt.sign(
    { id: user._id, email: user.email }, 
    process.env.JWT_SECRET, // Dùng biến môi trường cho đồng bộ với Middleware
    { expiresIn: '24h' }
);

        // Trả về thông tin cần thiết cho Frontend
        return {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || "",
                address: user.address || "",
                balance: user.balance,
                avatar: user.avatar,
                role: user.role
            },
            token
        };
    }

    // 3. Phương thức Đặt lại mật khẩu bằng số điện thoại (Mới thêm)
    async resetPasswordByPhone(phone, newPassword) {
        // Tìm người dùng theo số điện thoại
        const user = await User.findOne({ phone: phone });
        
        if (!user) {
            throw new Error('Số điện thoại này chưa được đăng ký tài khoản!');
        }

        // Băm mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật và lưu lại
        user.password = hashedPassword;
        await user.save();

        return { 
            success: true, 
            message: "Mật khẩu của bạn đã được thay đổi thành công!" 
        };
    }
}

export default new UserService();