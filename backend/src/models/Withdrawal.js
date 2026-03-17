import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Vui lòng nhập số tiền muốn rút'],
        min: [50000, 'Số tiền rút tối thiểu là 50.000đ']
    },
    bankName: {
        type: String,
        required: [true, 'Tên ngân hàng là bắt buộc']
    },
    accountNumber: {
        type: String,
        required: [true, 'Số tài khoản là bắt buộc']
    },
    accountName: {
        type: String,
        required: [true, 'Tên chủ tài khoản là bắt buộc']
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    adminNote: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('Withdrawal', withdrawalSchema);