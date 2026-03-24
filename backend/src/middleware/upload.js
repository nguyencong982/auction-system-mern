// backend/middleware/upload.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import 'dotenv/config'; 

// 1. Cấu hình Cloudinary (Lấy key từ file .env)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 2. Cấu hình Storage Cloudinary (Thay thế hoàn toàn diskStorage cũ)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'auction_products', 
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'], 
    // Tự động thêm timestamp vào tên file để không bị trùng trên Cloudinary
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] 
  },
});

// 3. Tạo Middleware Upload
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ được phép upload file ảnh!'), false);
        }
    }
});

export default upload;