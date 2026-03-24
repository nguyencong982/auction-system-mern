import ProductService from '../services/ProductService.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; 
import Message from '../models/Message.js'; 

class ProductController {
    // 1. Lấy danh sách sản phẩm đang đấu giá
    getAllActive = async (req, res) => {
        try {
            const { search, category, minPrice, maxPrice, sort } = req.query;
            let query = { status: 'active' };

            if (search) {
                query.title = { $regex: search, $options: 'i' };
            }

            if (category && category !== 'Tất cả') {
                query.category = category;
            }

            if (minPrice || maxPrice) {
                query.currentPrice = {};
                if (minPrice) query.currentPrice.$gte = Number(minPrice);
                if (maxPrice) query.currentPrice.$lte = Number(maxPrice);
            }

            let sortOption = { createdAt: -1 }; 
            if (sort === 'price_asc') sortOption = { currentPrice: 1 };
            if (sort === 'price_desc') sortOption = { currentPrice: -1 };
            if (sort === 'ending_soon') sortOption = { endTime: 1 };

            const products = await Product.find(query)
                .populate('owner', 'fullName _id avatar') 
                .sort(sortOption);

            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 2. Lấy sản phẩm của TÔI
    getMyProducts = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ success: false, message: "Không xác định được người dùng" });
            }

            const products = await Product.find({ owner: req.user.id })
                .populate({
                    path: 'currentWinner',
                    select: 'fullName _id avatar', 
                    strictPopulate: false 
                })
                .sort({ createdAt: -1 });

            res.status(200).json({ success: true, data: products });
        } catch (error) {
            console.error("Lỗi getMyProducts:", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
        }
    }

    // 3. LẤY SẢN PHẨM ĐÃ BÁN THÀNH CÔNG
    getMySoldProducts = async (req, res) => {
        try {
            const sellerId = req.user.id;
            const soldItems = await Product.find({
                owner: sellerId,
                status: 'ended',
                currentWinner: { $ne: null }
            })
            .populate('currentWinner', 'fullName email phone address avatar')
            .sort({ endTime: -1 });

            res.status(200).json({ success: true, data: soldItems });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 4. KIỂM TRA USER CÓ SẢN PHẨM KHÔNG
    checkUserHasProducts = async (req, res) => {
        try {
            const userId = req.user.id;
            const count = await Product.countDocuments({ owner: userId });
            res.status(200).json({ 
                success: true, 
                hasProducts: count > 0 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 5. Lấy chi tiết sản phẩm
    getDetail = async (req, res) => {
        try {
            const { id } = req.params;
            if (id.length !== 24) {
                return res.status(400).json({ success: false, message: "Định dạng ID không hợp lệ" });
            }

            const product = await Product.findById(id)
                .populate('owner', 'fullName email _id avatar') 
                .populate('currentWinner', 'fullName _id avatar') 
                .populate('bidHistory.bidder', 'fullName _id avatar'); 
            
            if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy chi tiết" });
        }
    }

    // 6. ĐĂNG SẢN PHẨM (Cloudinary + Fix endTime)
    create = async (req, res) => {
        try {
            const ownerId = req.user.id;
            const { 
                title, 
                description, 
                initialPrice, 
                stepPrice, 
                category, 
                durationHours,
                endTime 
            } = req.body; 
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Vui lòng upload ảnh sản phẩm!" });
            }

            const productData = { 
                title,
                description,
                initialPrice: Number(initialPrice),
                stepPrice: Number(stepPrice),
                category: category,
                imageUrl: req.file.path // Đường dẫn từ Cloudinary
            };

            // Ưu tiên endTime từ Frontend chọn, nếu không có mới dùng durationHours
            if (endTime) {
                productData.endTime = new Date(endTime);
            } else {
                const hours = parseInt(durationHours) || 24;
                productData.endTime = new Date(Date.now() + hours * 60 * 60 * 1000);
            }
            
            const product = await ProductService.createProduct(productData, ownerId);
            
            const populatedProduct = await Product.findById(product._id)
                .populate('owner', 'fullName _id avatar');

            const io = req.app.get('socketio');
            if (io) io.emit('newProduct', populatedProduct);

            res.status(201).json({ success: true, data: populatedProduct });

        } catch (error) {
            console.error("🔥 Lỗi Create Product:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 7. Cập nhật sản phẩm
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, stepPrice, category } = req.body;

            const product = await Product.findOneAndUpdate(
                { _id: id, owner: req.user.id, currentWinner: null },
                { title, description, stepPrice, category },
                { new: true }
            ).populate('owner', 'fullName _id avatar');

            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Sản phẩm không tồn tại hoặc đã có người đấu giá" 
                });
            }

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 8. Xóa sản phẩm
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            if (product.owner.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: "Bạn không có quyền" });
            }

            if (product.currentWinner) {
                return res.status(400).json({ success: false, message: "Sản phẩm đã có người thầu, không thể xóa!" });
            }

            await Product.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 9. Đặt giá
    bid = async (req, res) => {
        try {
            const { productId, bidAmount } = req.body;
            const userId = req.user.id;

            const product = await Product.findById(productId);
            if (!product) throw new Error("Sản phẩm không tồn tại");

            const now = new Date();
            if (now > new Date(product.endTime) || product.status !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: "Phiên đấu giá này đã kết thúc!" 
                });
            }

            if (product.owner.toString() === userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Bạn không thể đấu giá sản phẩm của chính mình!" 
                });
            }

            await ProductService.placeBid(productId, userId, bidAmount);
            
            const result = await Product.findById(productId)
                .populate('owner', 'fullName _id avatar') 
                .populate('currentWinner', 'fullName _id avatar') 
                .populate({
                    path: 'bidHistory.bidder',
                    select: 'fullName _id avatar' 
                });

            const io = req.app.get('socketio');
            if (io) {
                io.emit('bidUpdated', {
                    productId: result._id,
                    newPrice: result.currentPrice,
                    winnerName: result.currentWinner?.fullName,
                    winnerAvatar: result.currentWinner?.avatar,
                    bidHistory: result.bidHistory 
                });
                io.emit('priceUpdate', result);
            }

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 10. Lấy lịch sử đấu giá
    getMyBidHistory = async (req, res) => {
        try {
            const userId = req.user.id;

            const products = await Product.find({
                'bidHistory.bidder': userId
            })
            .populate('owner', 'fullName avatar')
            .populate('currentWinner', 'fullName avatar')
            .sort({ updatedAt: -1 });

            const formattedData = products.map(product => {
                const isWinning = product.currentWinner && product.currentWinner._id.toString() === userId;
                const isEnded = product.status === 'ended' || new Date() > new Date(product.endTime);
                
                let userStatus = "";
                if (isEnded) {
                    userStatus = isWinning ? 'WON' : 'LOST';
                } else {
                    userStatus = isWinning ? 'LEADING' : 'OUTBID';
                }

                return {
                    ...product._doc,
                    userStatus
                };
            });

            res.status(200).json({ success: true, data: formattedData });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 11. Lấy lịch sử Chat
    getChatHistory = async (req, res) => {
        try {
            const { id } = req.params;
            const messages = await Message.find({ productId: id })
                .populate('sender', 'fullName avatar')
                .sort({ createdAt: 1 })
                .limit(50);
                
            res.status(200).json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new ProductController();