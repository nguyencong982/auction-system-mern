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
            currentPrice: productData.initialPrice,
            // Đảm bảo status được thiết lập từ dữ liệu controller truyền xuống (thường là 'pending')
            status: productData.status || 'pending'
        });
        return await newProduct.save();
    }

    /**
     * 2. Logic Đặt giá (Bidding)
     */
    async placeBid(productId, userId, bidAmount) {
        const product = await Product.findById(productId);
        if (!product) throw new Error("Sản phẩm không tồn tại!");

        const user = await User.findById(userId);
        if (!user) throw new Error("Người dùng không tồn tại!");

        // 1. KIỂM TRA TRẠNG THÁI DUYỆT (QUAN TRỌNG NHẤT)
        // Chỉ cho phép đặt giá nếu sản phẩm đã được Admin duyệt (active)
        if (product.status !== 'active') {
            const statusMap = {
                'pending': 'Sản phẩm đang chờ Admin duyệt, chưa thể đấu giá.',
                'rejected': 'Sản phẩm này đã bị từ chối do vi phạm quy định.',
                'ended': 'Phiên đấu giá đã kết thúc.',
                'cancelled': 'Phiên đấu giá đã bị hủy.'
            };
            throw new Error(statusMap[product.status] || "Sản phẩm không trong trạng thái đấu giá.");
        }

        // 2. KIỂM TRA SỐ DƯ
        if (user.balance < bidAmount) {
            throw new Error(`Số dư không đủ! Bạn cần ít nhất ${bidAmount.toLocaleString()} VNĐ trong ví.`);
        }

        // 3. KIỂM TRA THỜI GIAN
        if (new Date() > new Date(product.endTime)) {
            // Cập nhật status sang ended nếu quá hạn mà chưa cập nhật
            product.status = 'ended';
            await product.save();
            throw new Error("Phiên đấu giá đã kết thúc!");
        }
        
        // 4. KIỂM TRA GIÁ ĐẶT TỐI THIỂU
        const minimumBid = product.currentPrice + (product.stepPrice || 0);
        if (bidAmount < minimumBid) {
            throw new Error(`Giá đặt phải lớn hơn hoặc bằng ${minimumBid.toLocaleString()} VNĐ`);
        }

        const oldWinnerId = product.currentWinner;
        const oldPrice = product.currentPrice;

        // A. HOÀN TIỀN CHO NGƯỜI CŨ (Nếu có và không phải là chính mình đặt đè)
        if (oldWinnerId && oldWinnerId.toString() !== userId.toString()) {
            const oldWinner = await User.findById(oldWinnerId);
            if (oldWinner) {
                oldWinner.balance += oldPrice;
                await oldWinner.save();
                
                // Thông báo cho người bị vượt mặt
                await NotificationService.createNotification({
                    recipient: oldWinnerId,
                    content: `Bạn đã bị vượt mặt tại "${product.title}". ${oldPrice.toLocaleString()} VNĐ đã được hoàn vào ví.`,
                    type: 'outbid',
                    relatedProduct: product._id
                });
            }
        }

        // B. TRỪ TIỀN NGƯỜI MỚI (Tạm giữ tiền đấu giá)
        user.balance -= bidAmount;
        await user.save();

        // C. CẬP NHẬT THÔNG TIN SẢN PHẨM
        product.currentPrice = bidAmount;
        product.currentWinner = userId;
        product.bidHistory.push({
            bidder: userId,
            bidderName: user.fullName, // Lưu tên để hiển thị nhanh
            amount: bidAmount,
            time: new Date()
        });

        await product.save();
        
        // Trả về product đã cập nhật để Controller xử lý Socket IO
        return product;
    }
}

export default new ProductService();