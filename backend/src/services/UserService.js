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

        if (userData.phone) {
            const phoneExists = await User.findOne({ phone: userData.phone });
            if (phoneExists) {
                throw new Error('Số điện thoại này đã được sử dụng!');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

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

        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

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

    // 3. Phương thức Đặt lại mật khẩu bằng số điện thoại
    async resetPasswordByPhone(phone, newPassword) {
        const user = await User.findOne({ phone: phone });
        
        if (!user) {
            throw new Error('Số điện thoại này chưa được đăng ký tài khoản!');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return { 
            success: true, 
            message: "Mật khẩu của bạn đã được thay đổi thành công!" 
        };
    }

    // --- CÁC HÀM BỔ TRỢ MỚI CHO MÃ PIN (PAYMENT PASSWORD) ---

    // Hàm tạo Salt (dùng chung cho cả Pass và PIN)
    async generateSalt(rounds = 10) {
        return await bcrypt.genSalt(rounds);
    }

    // Hàm băm (dùng chung cho cả Pass và PIN)
    async hashPassword(plainText, salt) {
        return await bcrypt.hash(plainText, salt);
    }

    // Hàm so sánh (dùng kiểm tra mã PIN khi rút tiền)
    async comparePassword(plainText, hashedText) {
        return await bcrypt.compare(plainText, hashedText);
    }
}

export default new UserService();