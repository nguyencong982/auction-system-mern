import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { io } from '../app.js';

// 1. User tạo lệnh nạp tiền
export const createDeposit = async (req, res) => {
    try {
        const { amount } = req.body;
        const transactionCode = 'NAP' + Math.floor(100000 + Math.random() * 900000);

        const newTransaction = new Transaction({
            userId: req.user.id,
            amount,
            code: transactionCode
        });

        await newTransaction.save();
        res.status(201).json({ 
            success: true, 
            message: "Đã tạo lệnh nạp tiền. Vui lòng chuyển khoản đúng nội dung!",
            data: newTransaction 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Admin duyệt nạp tiền
export const approveDeposit = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId);

        if (!transaction || transaction.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Giao dịch không hợp lệ hoặc đã xử lý" });
        }

        const user = await User.findById(transaction.userId);
        if (user) {
            // Cập nhật số dư User
            user.balance += transaction.amount;
            await user.save();

            // Cập nhật trạng thái giao dịch
            transaction.status = 'success';
            await transaction.save();

            // Gửi tín hiệu Socket.io thời gian thực
            io.to(user._id.toString()).emit('depositSuccess', {
                newBalance: user.balance,
                amount: transaction.amount,
                message: `Tài khoản của bạn đã được cộng ${transaction.amount.toLocaleString()}đ!`
            });

            return res.json({ success: true, message: "Đã duyệt và cộng tiền thành công!" });
        }

        res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Admin từ chối và XÓA lệnh nạp (Giải quyết yêu cầu của bạn)
export const rejectDeposit = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Tìm và xóa trực tiếp khỏi database
        const transaction = await Transaction.findByIdAndDelete(transactionId);

        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy lệnh nạp hoặc lệnh đã được xử lý trước đó" 
            });
        }

        res.json({ 
            success: true, 
            message: "Đã từ chối và xóa lệnh nạp lỗi thành công!" 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Admin xem tất cả yêu cầu nạp tiền đang chờ
export const getAllPendingDeposits = async (req, res) => {
    try {
        const list = await Transaction.find({ status: 'pending' })
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};