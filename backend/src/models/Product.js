import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    
    // --- TRƯỜNG MỚI: DANH MỤC SẢN PHẨM ---
    category: { 
        type: String, 
        enum: ['Công nghệ', 'Thời trang', 'Đồ cổ', 'Gia dụng', 'Khác'], 
        default: 'Khác' 
    },
    // ------------------------------------

    initialPrice: { type: Number, required: true },
    stepPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: function() { return this.initialPrice; } },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // --- LỊCH SỬ ĐẤU GIÁ ---
    bidHistory: [{
        bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bidderName: String,
        amount: Number,
        time: { type: Date, default: Date.now }
    }],
    // -----------------------

    // --- CÁC TRƯỜNG PHỤC VỤ COUNTDOWN & TỰ ĐỘNG KẾT THÚC ---
    startTime: { 
        type: Date, 
        default: Date.now 
    },
    endTime: { 
        type: Date, 
        required: true,
        // Nếu không truyền endTime, mặc định kết thúc sau 24h kể từ khi tạo
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) 
    },
    
    /**
     * TRẠNG THÁI SẢN PHẨM:
     * pending: Đang chờ Admin duyệt (Dành cho chức năng Kiểm duyệt bạn yêu cầu)
     * active: Đang trong phiên đấu giá
     * ended: Phiên đấu giá đã kết thúc thành công
     * rejected: Bị Admin từ chối (Dành cho chức năng Kiểm duyệt)
     * cancelled: Bị hủy bỏ
     */
    status: { 
        type: String, 
        enum: ['pending', 'active', 'ended', 'rejected', 'cancelled'], 
        default: 'active' 
    }
    // ------------------------------------------------------
}, { timestamps: true });

// Index giúp tác vụ quét tự động (Cron Job) tìm các sản phẩm hết hạn nhanh hơn
productSchema.index({ status: 1, endTime: 1 });

// --- INDEX MỚI: HỖ TRỢ TÌM KIẾM THEO TÊN VÀ LỌC THEO DANH MỤC ---
productSchema.index({ title: 'text' });
productSchema.index({ category: 1 });
// --------------------------------------------------------------

const Product = mongoose.model('Product', productSchema);
export default Product;