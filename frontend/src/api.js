import axios from 'axios';

// --- 1. Cấu hình instance Axios ---
const API = axios.create({
    // Đảm bảo URL luôn có tiền tố /api
    baseURL: (import.meta.env.VITE_API_URL 
        ? (import.meta.env.VITE_API_URL.endsWith('/api') 
            ? import.meta.env.VITE_API_URL 
            : `${import.meta.env.VITE_API_URL}/api`)
        : 'https://auction-system-mern-xeyx.onrender.com/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// --- 2. Interceptor xử lý Token và FormData ---
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    
    // Tự động điều chỉnh header nếu gửi dữ liệu dạng FormData (như upload ảnh)
    if (req.data instanceof FormData) {
        delete req.headers['Content-Type'];
    }
    
    return req;
});

/**
 * --- 3. CÁC HÀM GỌI API ---
 */

// A. Nhóm Xác thực & Profile
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getMyProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// B. Nhóm Mã PIN Thanh Toán
// Thiết lập mã PIN lần đầu
export const setupPaymentPin = (data) => API.post('/auth/setup-payment-pin', data);
// Khôi phục mã PIN qua OTP
export const resetPaymentPinByOTP = (data) => API.post('/auth/reset-payment-pin', data);

// C. Nhóm Sản phẩm & Đấu giá (Dành cho User)
export const fetchProducts = () => API.get('/products'); // Chỉ lấy các sản phẩm 'active'
export const fetchProductDetail = (id) => API.get(`/products/${id}`);
export const createProduct = (formData) => API.post('/products', formData); // Mặc định sẽ là 'pending'
export const placeBid = (data) => API.post('/products/bid', data);
export const getMyProducts = () => API.get('/products/my-products'); // Xem tất cả sp của tôi (kể cả đang duyệt)
export const getMyBidHistory = () => API.get('/products/my-bids');
export const getChatHistory = (productId) => API.get(`/products/${productId}/chat`);

// D. Nhóm Tài chính & Giao dịch
export const depositMoney = (amount) => API.post('/user/deposit', { amount });
export const createWithdrawalRequest = (data) => API.post('/withdrawals/request', data);
export const getWithdrawalHistory = () => API.get('/withdrawals/my-history');

// E. Nhóm Thông báo & Tương tác
export const getNotifications = () => API.get('/notifications');
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const toggleFollow = (id) => API.post(`/users/follow/${id}`);

// F. Nhóm Quản trị (Admin) - QUAN TRỌNG ĐỂ DUYỆT SẢN PHẨM
/**
 * Lấy danh sách sản phẩm đang ở trạng thái 'pending' (chờ duyệt)
 */
export const getPendingProducts = () => API.get('/products/admin/pending');

/**
 * Cập nhật trạng thái duyệt sản phẩm
 * @param {string} id - ID sản phẩm
 * @param {string} status - Gửi 'active' để duyệt hoặc 'rejected' để từ chối
 */
export const approveProduct = (id, status) => API.patch(`/products/admin/approve/${id}`, { status });

/**
 * Các hàm quản lý nạp/rút tiền dành cho Admin (Nếu có)
 */
export const getAdminPendingWithdrawals = () => API.get('/withdrawals/admin/pending');
export const processWithdrawal = (id, action) => API.patch(`/withdrawals/admin/${id}`, { action }); // action: 'approve' hoặc 'reject'

export default API;