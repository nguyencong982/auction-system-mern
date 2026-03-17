import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Vui lòng nhập số tiền nạp'],
        min: [10000, 'Số tiền nạp tối thiểu là 10.000đ']
    },
    code: {
        type: String,
        unique: true,
        required: true
    }, // Ví dụ: NAP123456
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    note: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);