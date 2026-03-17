import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Sử dụng biến môi trường, nếu không có thì mới dùng link mặc định (để chạy local)
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_db';
        
        await mongoose.connect(dbUri);
        console.log('✅ Đã kết nối MongoDB thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối Database:', error.message);
        process.exit(1);
    }
};

export default connectDB;