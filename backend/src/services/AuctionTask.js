import cron from 'node-cron';
import Product from '../models/Product.js';
import { io } from '../app.js';
import NotificationService from './NotificationService.js';

// Chạy kiểm tra mỗi phút một lần
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        
        // Tìm các sản phẩm đã hết hạn nhưng vẫn đang ở trạng thái 'active'
        const expiredProducts = await Product.find({
            endTime: { $lte: now },
            status: 'active'
        });

        for (const product of expiredProducts) {
            // Cập nhật trạng thái sản phẩm sang 'ended'
            product.status = 'ended';
            await product.save();

            // 1. XỬ LÝ KHI CÓ NGƯỜI THẮNG CUỘC
            if (product.currentWinner) {
                const winnerId = product.currentWinner.toString();
                const messageContent = `Chúc mừng! Bạn đã thắng đấu giá sản phẩm "${product.title}" với giá ${product.currentPrice.toLocaleString()} VNĐ`;

                // Lưu thông báo vào Database để xem lại sau
                await NotificationService.createNotification({
                    recipient: product.currentWinner,
                    content: messageContent,
                    type: 'winner_announced',
                    relatedProduct: product._id
                });

                // GỬI THÔNG BÁO REAL-TIME RIÊNG CHO NGƯỜI THẮNG
                // Sử dụng io.to(winnerId) để gửi tin nhắn vào đúng phòng của User đó
                io.to(winnerId).emit('new_notification', {
                    content: messageContent,
                    type: 'winner_announced',
                    productId: product._id
                });
            }

            // 2. Bắn tín hiệu Socket chung cho tất cả mọi người để cập nhật lại danh sách sàn đấu giá
            io.emit('auctionEnded', {
                productId: product._id,
                winner: product.currentWinner,
                finalPrice: product.currentPrice
            });
            
            console.log(`🏁 Đã chốt phiên và gửi thông báo cho sản phẩm: ${product.title}`);
        }
    } catch (error) {
        console.error('❌ Lỗi Cron Job:', error);
    }
});