// db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        
        // Kiểm tra xem URI có tồn tại không để tránh lỗi undefined
        if (!uri) {
            console.error("❌ Lỗi: MONGODB_URI chưa được cấu hình trong file .env");
            return;
        }

        console.log("⏳ Đang xác thực tài khoản với Atlas...");
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Chờ tối đa 5 giây
            family: 4                      // Ép sử dụng IPv4 để tránh lỗi DNS/IPv6
        });

        console.log('✅ CHÚC MỪNG CÔNG! Đã kết nối MongoDB Atlas thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối Database:', error.message);
        
        // Phân tích lỗi để đưa ra gợi ý sát hơn cho bạn
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Gợi ý: Lỗi DNS. Công hãy thử đổi DNS máy tính sang 8.8.8.8 hoặc dùng 4G nhé.');
        } else if (error.message.includes('authentication failed')) {
            console.log('💡 Gợi ý: Sai Username hoặc Password trong file .env.');
        } else {
            console.log('💡 Gợi ý: Kiểm tra lại chuỗi kết nối trong file .env hoặc Whitelist IP trên Atlas.');
        }
    }
};

export default connectDB;