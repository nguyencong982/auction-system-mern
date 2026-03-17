import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

// 1. Người dùng gửi yêu cầu rút tiền
export const createWithdrawal = async (req, res) => {
    try {
        const { amount, bankName, accountNumber, accountName } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Số dư không đủ để rút!" });
        }

        // Tạo đơn rút tiền
        const withdrawal = await Withdrawal.create({
            userId,
            amount,
            bankName,
            accountNumber,
            accountName,
            status: 'pending'
        });

        // TRỪ TIỀN NGAY LẬP TỨC (Tạm giữ)
        user.balance -= amount;
        await user.save();

        res.status(201).json({ success: true, data: withdrawal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy danh sách rút tiền của CHÍNH người dùng đó (Lịch sử)
export const getMyWithdrawals = async (req, res) => {
    try {
        const list = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Admin lấy TẤT CẢ yêu cầu rút tiền (Hàm đang bị thiếu đây nè!)
export const getAllWithdrawals = async (req, res) => {
    try {
        // Populate để xem thông tin user rút tiền là ai
        const list = await Withdrawal.find().populate('userId', 'fullName email').sort({ createdAt: -1 });
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Admin duyệt hoặc từ chối rút tiền
export const approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'success' hoặc 'failed'

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) return res.status(404).json({ message: "Không tìm thấy đơn!" });

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ message: "Đơn này đã được xử lý rồi!" });
        }

        if (status === 'failed') {
            // Nếu từ chối -> HOÀN TIỀN lại cho User
            const user = await User.findById(withdrawal.userId);
            user.balance += withdrawal.amount;
            await user.save();
        }

        withdrawal.status = status;
        await withdrawal.save();

        res.json({ success: true, message: `Đã cập nhật trạng thái: ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};