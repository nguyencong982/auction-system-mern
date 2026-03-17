import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Thêm fieldname để biết đây là avatar hay cover trong tên file
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); 
    }
});

// Thêm bộ lọc file để an toàn hơn
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB cho nhẹ server
});

export default upload;