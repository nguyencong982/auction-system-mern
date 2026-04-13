import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import UserService from '../services/UserService.js';

export const createWithdrawal = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName, pin } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const userId = req.user._id || req.user.id;
    const amountNumber = Number(amount);

    // Validate đầu vào
    if (!amountNumber || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });
    }
    if (amountNumber < 50000) {
      return res.status(400).json({ success: false, message: "Số tiền tối thiểu là 50.000đ" });
    }
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin ngân hàng" });
    }

    const user = await User.findById(userId).select('+paymentPassword balance');
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    // Check PIN
    if (!user.paymentPassword) {
      return res.status(400).json({ success: false, message: "Bạn chưa thiết lập mã PIN" });
    }
    if (!pin) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã PIN" });
    }

    const isPinValid = await UserService.comparePassword(pin, user.paymentPassword);
    if (!isPinValid) {
      return res.status(400).json({ success: false, message: "Mã PIN không đúng" });
    }

    // Check Số dư - Trả về lỗi 400 để Frontend bắt trong khối catch
    if (user.balance < amountNumber) {
      return res.status(400).json({ success: false, message: "Số dư ví không đủ để thực hiện giao dịch" });
    }

    // Tạo yêu cầu và trừ tiền
    const withdrawal = await Withdrawal.create({
      userId,
      amount: amountNumber,
      bankName,
      accountNumber,
      accountName,
      status: 'pending'
    });

    user.balance -= amountNumber;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Gửi yêu cầu rút tiền thành công!",
      data: withdrawal
    });

  } catch (error) {
    console.error("WITHDRAW ERROR:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi rút tiền" });
  }
};