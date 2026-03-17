import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, 'Vui lòng nhập họ tên'] 
    },
    email: { 
        type: String, 
        required: [true, 'Vui lòng nhập email'], 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: [true, 'Vui lòng nhập mật khẩu'],
        minlength: 6 
    },
    phone: { 
        type: String, 
        required: [true, 'Vui lòng nhập số điện thoại'],
        unique: true,
        trim: true
    },
    address: { 
        type: String, 
        default: "" 
    },
    balance: { 
        type: Number, 
        default: 0 
    },

    // --- BẢO MẬT VÍ (MÃ PIN / MẬT KHẨU THANH TOÁN) ---
    paymentPassword: {
        type: String,
        default: "" // Sẽ được băm (hash) khi người dùng thiết lập
    },

    // --- HÌNH ẢNH ---
    avatar: { 
        type: String, 
        default: "" 
    },
    cover: { 
        type: String, 
        default: "" 
    },
    coverPosition: {
        type: String,
        default: "center" // Các giá trị: top, center, bottom hoặc % (ví dụ: 50%)
    },
    
    // --- PHÂN QUYỀN & TRẠNG THÁI ---
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false // Phục vụ chức năng khóa/mở tài khoản Admin
    },

    // --- TƯƠNG TÁC MẠNG XÃ HỘI ---
    followers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    following: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { 
    timestamps: true 
});

export default mongoose.model('User', userSchema);