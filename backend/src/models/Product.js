import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    
    category: { 
        type: String, 
        enum: ['Công nghệ', 'Thời trang', 'Đồ cổ', 'Gia dụng', 'Khác'], 
        default: 'Khác' 
    },

    initialPrice: { type: Number, required: true },
    stepPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: function() { return this.initialPrice; } },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    bidHistory: [{
        bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bidderName: String,
        amount: Number,
        time: { type: Date, default: Date.now }
    }],

    startTime: { 
        type: Date, 
        default: Date.now 
    },
    endTime: { 
        type: Date, 
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) 
    },
    
    status: { 
        type: String, 
        enum: ['pending', 'active', 'ended', 'rejected', 'cancelled'], 
        default: 'pending' // THAY ĐỔI: Mặc định là chờ duyệt
    }
}, { timestamps: true });

productSchema.index({ status: 1, endTime: 1 });
productSchema.index({ title: 'text' });
productSchema.index({ category: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;