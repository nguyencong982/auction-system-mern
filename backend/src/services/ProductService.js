import Product from '../models/Product.js';
import User from '../models/User.js'; 
import NotificationService from './NotificationService.js';

class ProductService {
    /**
     * 1. Logic Đăng sản phẩm mới
     */
    async createProduct(productData, ownerId) {
        const newProduct = new Product({
            ...productData,
            owner: ownerId,
            // Đảm bảo giá hiện tại bắt đầu từ giá khởi điểm
            currentPrice: productData.initialPrice 
        });
        return await newProduct.save();
    }

    /**
     * 2. Logic Đặt giá (Bidding)
     */
    async placeBid(productId, userId, bidAmount) {
        // Sử dụng session nếu bạn muốn an toàn tuyệt đối về tiền tệ (Transactions)
        const product = await Product.findById(productId);
        if (!product) throw new Error("Sản phẩm không tồn tại!");

        const user = await User.findById(userId);
        if (!user) throw new Error("Người dùng không tồn tại!");

        // 1. KIỂM TRA SỐ DƯ
        if (user.balance < bidAmount) {
            throw new Error(`Số dư không đủ! Bạn cần ít nhất ${bidAmount.toLocaleString()} VNĐ trong ví.`);
        }

        // 2. KIỂM TRA ĐIỀU KIỆN ĐẤU GIÁ
        if (new Date() > new Date(product.endTime) || product.status !== 'active') {
            throw new Error("Phiên đấu giá đã kết thúc hoặc không còn hoạt động!");
        }
        
        const minimumBid = product.currentPrice + (product.stepPrice || 0);
        if (bidAmount < minimumBid) {
            throw new Error(`Giá đặt phải lớn hơn hoặc bằng ${minimumBid.toLocaleString()} VNĐ`);
        }

        const oldWinnerId = product.currentWinner;
        const oldPrice = product.currentPrice;

        // A. HOÀN TIỀN CHO NGƯỜI CŨ (Nếu có)
        if (oldWinnerId && oldWinnerId.toString() !== userId.toString()) {
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

        // C. CẬP NHẬT SẢN PHẨM
        product.currentPrice = bidAmount;
        product.currentWinner = userId;
        product.bidHistory.push({
            bidder: userId,
            amount: bidAmount,
            time: new Date()
        });

        await product.save();
        
        // Trả về product đã cập nhật để Controller xử lý Socket IO
        return product;
    }
}

export default new ProductService();