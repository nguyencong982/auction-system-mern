import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import UserService from '../services/UserService.js';

// =======================
// 1. RÚT TIỀN
// =======================
export const createWithdrawal = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName, pin } = req.body;

    // ✅ Check login
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập"
      });
    }

    const userId = req.user._id || req.user.id;

    // ================= VALIDATE INPUT =================
    const amountNumber = Number(amount);

    if (!amountNumber || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ"
      });
    }

    if (amountNumber < 50000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền tối thiểu là 50.000đ"
      });
    }

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin ngân hàng"
      });
    }

    // ================= LẤY USER =================
    const user = await User.findById(userId).select('+paymentPassword balance');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng!"
      });
    }

    // ================= CHECK PIN =================
    if (!user.paymentPassword) {
      return res.status(400).json({
        success: false,
        message: "Bạn chưa thiết lập mã PIN"
      });
    }

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã PIN"
      });
    }

    const isPinValid = await UserService.comparePassword(pin, user.paymentPassword);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: "Mã PIN không đúng"
      });
    }

    // ================= CHECK SỐ DƯ =================
    if (user.balance < amountNumber) {
      return res.status(400).json({
        success: false,
        message: "Số dư không đủ"
      });
    }

    // ================= TẠO YÊU CẦU =================
    const withdrawal = await Withdrawal.create({
      userId,
      amount: amountNumber,
      bankName,
      accountNumber,
      accountName,
      status: 'pending'
    });

    // ✅ TRỪ TIỀN
    user.balance -= amountNumber;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Gửi yêu cầu rút tiền thành công!",
      data: withdrawal
    });

  } catch (error) {
    console.error("WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống"
    });
  }
};

// =======================
// 2. LỊCH SỬ RÚT TIỀN
// =======================
export const getMyWithdrawals = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập"
      });
    }

    const userId = req.user._id || req.user.id;

    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: withdrawals
    });

  } catch (error) {
    console.error("GET WITHDRAWALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống"
    });
  }
};