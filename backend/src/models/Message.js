import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    // Tham chiếu tới sản phẩm đang đấu giá
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    // Người gửi tin nhắn (Người đấu giá hoặc Chủ sản phẩm)
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Nội dung trao đổi
    content: { 
        type: String, 
        required: true,
        trim: true // Tự động cắt khoảng trắng thừa
    },
}, { 
    timestamps: true // Tự động tạo createdAt và updatedAt
});

/**
 * Đánh index kép (Compound Index):
 * Giúp việc lấy 50 tin nhắn gần nhất theo từng sản phẩm 
 * trong ProductController.getChatHistory đạt tốc độ tối ưu.
 */
messageSchema.index({ productId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;