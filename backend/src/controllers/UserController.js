import UserService from '../services/UserService.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

class UserController {
    // 1. Đăng ký tài khoản
    // UserController.js - Sửa lại dòng lấy dữ liệu
register = async (req, res) => {
    try {
        // Nhận cả phone hoặc phoneNumber từ body
        const phone = req.body.phone || req.body.phoneNumber; 

        if (!phone) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại" });
        }

        // Đảm bảo truyền đủ dữ liệu vào Service bao gồm cả phone đã chuẩn hóa
        const user = await UserService.registerAccount({ ...req.body, phone });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

    // 2. Đăng nhập
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await UserService.loginAccount(email, password);
            res.status(200).json({
                success: true,
                message: "Đăng nhập thành công!",
                ...result
            });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }

    // --- MỚI: ĐẶT LẠI MẬT KHẨU (QUÊN MẬT KHẨU) ---
    resetPassword = async (req, res) => {
        try {
            const { phone, newPassword } = req.body;

            if (!phone || !newPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Vui lòng nhập đủ số điện thoại và mật khẩu mới" 
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Mật khẩu phải có ít nhất 6 ký tự" 
                });
            }

            const result = await UserService.resetPasswordByPhone(phone, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 3. Lấy thông tin cá nhân của CHÍNH MÌNH
    getProfile = async (req, res) => {
        try {
            const user = await User.findById(req.user.id)
                .select('-password')
                .populate('followers', 'fullName')
                .populate('following', 'fullName');
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 4. Lấy thông tin TRANG CÁ NHÂN CÔNG KHAI
    getPublicProfile = async (req, res) => {
        try {
            const { id } = req.params;

            const [userProfile, products] = await Promise.all([
                User.findById(id)
                    .select('fullName email phone address followers following createdAt avatar cover')
                    .lean(),
                Product.find({ owner: id, status: 'active' })
                    .sort({ createdAt: -1 })
            ]);

            if (!userProfile) {
                return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
            }

            res.status(200).json({ 
                success: true, 
                data: { profile: userProfile, products } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi khi lấy hồ sơ người dùng" });
        }
    }

    // 5. Cập nhật thông tin cá nhân (Text)
    updateProfile = async (req, res) => {
        try {
            const { fullName, phone, address } = req.body;
            const userId = req.user.id;

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { fullName, phone, address },
                { new: true, runValidators: true }
            ).select('-password');

            res.status(200).json({ 
                success: true, 
                message: "Cập nhật thông tin thành công!",
                data: updatedUser 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 6. Theo dõi / Bỏ theo dõi
    toggleFollow = async (req, res) => {
        try {
            const targetId = req.params.id;
            const myId = req.user.id;

            if (targetId === myId) {
                return res.status(400).json({ success: false, message: "Bạn không thể tự theo dõi chính mình" });
            }

            const [targetUser, currentUser] = await Promise.all([
                User.findById(targetId),
                User.findById(myId)
            ]);

            if (!targetUser) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            if (!currentUser) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập lại" });

            const isFollowing = targetUser.followers.includes(myId);
            let updatedTargetUser;

            if (isFollowing) {
                await Notification.deleteMany({ recipient: targetId, sender: myId, type: 'new_follower' });
                const [result] = await Promise.all([
                    User.findByIdAndUpdate(targetId, { $pull: { followers: myId } }, { new: true }),
                    User.findByIdAndUpdate(myId, { $pull: { following: targetId } })
                ]);
                updatedTargetUser = result;
                res.status(200).json({ success: true, message: "Đã bỏ theo dõi", isFollowing: false });
            } else {
                await Notification.deleteMany({ recipient: targetId, sender: myId, type: 'new_follower' });
                const [result] = await Promise.all([
                    User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } }, { new: true }),
                    User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } }),
                    Notification.create({
                        recipient: targetId,
                        sender: myId,
                        type: 'new_follower',
                        content: `${currentUser.fullName || 'Một người dùng'} đã bắt đầu theo dõi bạn.`,
                        isRead: false
                    })
                ]);
                updatedTargetUser = result;
                res.status(200).json({ success: true, message: "Đã theo dõi", isFollowing: true });
            }

            if (req.io && updatedTargetUser) {
                req.io.emit(`update_followers_${targetId}`, {
                    followers: updatedTargetUser.followers,
                    count: updatedTargetUser.followers.length
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi follow", error: error.message });
        }
    }

    // 7. Lấy danh sách Followers & Following
    getFollowLists = async (req, res) => {
        try {
            const user = await User.findById(req.user.id)
                .populate('followers', 'fullName email')
                .populate('following', 'fullName email');
            
            res.status(200).json({ 
                success: true, 
                data: {
                    followers: user?.followers || [],
                    following: user?.following || []
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 8. Lấy danh sách thông báo
    getNotifications = async (req, res) => {
        try {
            const userId = req.user.id; 
            const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(20);
            
            await Notification.updateMany(
                { recipient: userId, isRead: false },
                { $set: { isRead: true } }
            );
                
            res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 9. Lấy số lượng thông báo CHƯA ĐỌC
    getUnreadCount = async (req, res) => {
        try {
            const userId = req.user.id;
            const count = await Notification.countDocuments({ recipient: userId, isRead: false });
            res.status(200).json({ success: true, count: count || 0 });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 10. Nạp tiền
    deposit = async (req, res) => {
        try {
            const { amount } = req.body;
            if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

            user.balance += amount;
            await user.save();

            res.status(200).json({ 
                success: true, 
                message: `Nạp thành công ${amount.toLocaleString()} VNĐ!`, 
                balance: user.balance 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 11. Cập nhật Ảnh đại diện & Ảnh bìa
    // 11. Cập nhật Ảnh đại diện & Ảnh bìa
// 11. Cập nhật Ảnh đại diện & Ảnh bìa
    updateProfileImage = async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh" });
            }

            const userId = req.user.id;
            const imageUrl = req.file.path; 

            const updateData = {};
            if (req.file.fieldname === 'avatar') {
                updateData.avatar = imageUrl;
            } else if (req.file.fieldname === 'cover') {
                updateData.cover = imageUrl;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            ).select('-password');

            res.status(200).json({ 
                success: true, 
                message: "Cập nhật ảnh thành công!", 
                data: updatedUser 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi upload: " + error.message });
        }
    } // Đóng hàm updateProfileImage

    // --- MỚI: THIẾT LẬP MÃ PIN THANH TOÁN ---
    setupPaymentPassword = async (req, res) => {
        try {
            const { pin, password } = req.body;
            const userId = req.user.id;

            if (!pin || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Vui lòng nhập đầy đủ mã PIN và mật khẩu xác nhận" 
                });
            }

            const user = await User.findById(userId).select('+password');
            if (!user) {
                return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            }

            const isMatch = await UserService.comparePassword(password, user.password); 
            
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Mật khẩu đăng nhập không chính xác" });
            }

            if (!/^\d{6}$/.test(pin)) {
                return res.status(400).json({ success: false, message: "Mã PIN phải bao gồm 6 chữ số" });
            }

            const salt = await UserService.generateSalt(10); 
            const hashedPin = await UserService.hashPassword(pin, salt);

            await User.findByIdAndUpdate(userId, { paymentPassword: hashedPin });

            res.status(200).json({ 
                success: true, 
                message: "Thiết lập mã PIN thanh toán thành công!" 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi hệ thống: " + error.message });
        }
    } // Đóng hàm setupPaymentPassword
} // Đóng class UserController

export default new UserController();