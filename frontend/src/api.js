import axios from 'axios';

// --- 1. Cấu hình instance Axios ---
const API = axios.create({
    baseURL: (import.meta.env.VITE_API_URL 
        ? (import.meta.env.VITE_API_URL.endsWith('/api') 
            ? import.meta.env.VITE_API_URL 
            : `${import.meta.env.VITE_API_URL}/api`)
        : 'https://auction-system-mern-xeyx.onrender.com/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// --- 2. Interceptor xử lý Request (Token & FormData) ---
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    
    // THÊM DÒNG NÀY: Ngăn chặn trình duyệt cache các request API (đặc biệt là lỗi)
    if (req.method === 'post' || req.method === 'get') {
        req.params = { ...req.params, _t: Date.now() };
    }

    if (req.data instanceof FormData) {
        delete req.headers['Content-Type'];
    }
    
    return req;
});

// --- 3. MỚI: Interceptor xử lý Response (Bắt lỗi 400/401) ---
API.interceptors.response.use(
    (response) => response, // Nếu thành công, trả về dữ liệu bình thường
    (error) => {
        // Chỉ xử lý Logout nếu gặp lỗi 401 (Hết hạn token)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Bạn có thể redirect về login nếu muốn: window.location.href = '/login';
        }

        // QUAN TRỌNG: Trả lỗi về để block catch ở trang WithdrawMoney có thể bắt được
        return Promise.reject(error);
    }
);

/**
 * --- 4. CÁC HÀM GỌI API ---
 */

// A. Nhóm Xác thực & Profile
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getMyProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// B. Nhóm Mã PIN Thanh Toán
export const setupPaymentPin = (data) => API.post('/auth/setup-payment-pin', data);
export const resetPaymentPinByOTP = (data) => API.post('/auth/reset-payment-pin', data);

// C. Nhóm Sản phẩm & Đấu giá
export const fetchProducts = () => API.get('/products');
export const fetchProductDetail = (id) => API.get(`/products/${id}`);
export const createProduct = (formData) => API.post('/products', formData);
export const placeBid = (data) => API.post('/products/bid', data);
export const getMyProducts = () => API.get('/products/my-products');
export const getMyBidHistory = () => API.get('/products/my-bids');
export const getChatHistory = (productId) => API.get(`/products/${productId}/chat`);

// D. Nhóm Tài chính & Giao dịch
export const depositMoney = (amount) => API.post('/user/deposit', { amount });
export const createWithdrawalRequest = (data) => API.post('/withdrawals/request', data);
export const getWithdrawalHistory = () => API.get('/withdrawals/my-history');

// E. Nhóm Thông báo
export const getNotifications = () => API.get('/notifications');
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const toggleFollow = (id) => API.post(`/users/follow/${id}`);

// F. Nhóm Admin
export const getPendingProducts = () => API.get('/products/admin/pending');
export const approveProduct = (id, status) => API.patch(`/products/admin/approve/${id}`, { status });
export const getAdminPendingWithdrawals = () => API.get('/withdrawals/admin/pending');
export const processWithdrawal = (id, action) => API.patch(`/withdrawals/admin/${id}`, { action });

export default API;