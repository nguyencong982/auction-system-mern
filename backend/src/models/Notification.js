import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    content: { type: String, required: true },
    type: { 
        type: String, 
        // Đã thêm 'new_follower' vào enum để tránh lỗi Validation 500
        enum: ['outbid', 'auction_ended', 'winner_announced', 'new_follower'], 
        required: true 
    },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;