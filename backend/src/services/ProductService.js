import Product from '../models/Product.js';
import User from '../models/User.js'; 
import { io } from '../app.js'; 
import NotificationService from './NotificationService.js';

class ProductService {
    /**
     * 1. Logic Đăng sản phẩm mới (Tự động nhận category qua productData)
     */
    async createProduct(productData, ownerId) {
        const newProduct = new Product({
            ...productData, // Trường category từ controller truyền vào đã được gán trực tiếp ở bước trước
            owner: ownerId
        });
        return await newProduct.save();
    }

    /**
     * 2. Logic Đặt giá (Bidding) - GIỮ NGUYÊN LOGIC HOÀN TIỀN & LỊCH SỬ
     */
    async placeBid(productId, userId, bidAmount) {
        const product = await Product.findById(productId);
        if (!product) throw new Error("Sản phẩm không tồn tại!");

        const user = await User.findById(userId);
        if (!user) throw new Error("Người dùng không tồn tại!");

        // 1. KIỂM TRA SỐ DƯ
        if (user.balance < bidAmount) {
            throw new Error(`Số dư không đủ! Bạn cần ${bidAmount.toLocaleString()} VNĐ`);
        }

        // 2. KIỂM TRA ĐIỀU KIỆN ĐẤU GIÁ
        if (new Date() > product.endTime || product.status !== 'active') {
            throw new Error("Phiên đấu giá đã kết thúc!");
        }
        
        const minimumBid = product.currentPrice + product.stepPrice;
        if (bidAmount < minimumBid) {
            throw new Error(`Giá thấp nhất có thể đặt là ${minimumBid.toLocaleString()} VNĐ`);
        }

        const oldWinnerId = product.currentWinner;
        const oldPrice = product.currentPrice;

        // A. HOÀN TIỀN CHO NGƯỜI CŨ
        if (oldWinnerId) {
            const oldWinner = await User.findById(oldWinnerId);
            if (oldWinner) {
                oldWinner.balance += oldPrice;
                await oldWinner.save();
                
                await NotificationService.createNotification({
                    recipient: oldWinnerId,
                    content: `Bạn đã bị vượt mặt tại "${product.title}". ${oldPrice.toLocaleString()} VNĐ đã được hoàn vào ví.`,
                    type: 'outbid',
                    relatedProduct: product._id
                });
            }
        }

        // B. TRỪ TIỀN NGƯỜI MỚI
        user.balance -= bidAmount;
        await user.save();

        // C. CẬP NHẬT TRẠNG THÁI SẢN PHẨM & LỊCH SỬ
        product.currentPrice = bidAmount;
        product.currentWinner = userId;

        // --- THÊM LOGIC LƯU LỊCH SỬ TẠI ĐÂY ---
        product.bidHistory.push({
            bidder: userId,
            bidderName: user.fullName,
            amount: bidAmount,
            time: new Date()
        });
        // --------------------------------------

        await product.save();

        // Phát tín hiệu Real-time
        io.emit('bidUpdated', {
            productId: product._id,
            newPrice: product.currentPrice,
            winnerName: user.fullName,
            userBalance: user.balance,
            bidHistory: product.bidHistory // Gửi kèm lịch sử mới nhất
        });

        return product;
    }
}

export default new ProductService();