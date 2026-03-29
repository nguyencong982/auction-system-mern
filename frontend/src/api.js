import axios from 'axios';

// 1. Cấu hình instance Axios
const API = axios.create({
    // Logic này đảm bảo LUÔN LUÔN có đuôi /api
    baseURL: (import.meta.env.VITE_API_URL 
        ? (import.meta.env.VITE_API_URL.endsWith('/api') 
            ? import.meta.env.VITE_API_URL 
            : `${import.meta.env.VITE_API_URL}/api`)
        : 'https://auction-system-mern-xeyx.onrender.com/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. Interceptor xử lý Token và FormData
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    
    if (req.data instanceof FormData) {
        delete req.headers['Content-Type'];
    }
    
    return req;
});

// --- 3. CÁC HÀM GỌI API (EXPORT CHI TIẾT) ---

// A. Nhóm Xác thực & Profile
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getMyProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// B. Nhóm Mã PIN Thanh Toán (MỚI)
// Thiết lập lần đầu (cần password đăng nhập)
export const setupPaymentPin = (data) => API.post('/auth/setup-payment-pin', data);
// Đổi/Quên mã PIN (sau khi xác thực OTP)
export const resetPaymentPinByOTP = (data) => API.post('/auth/reset-payment-pin', data);

// C. Nhóm Sản phẩm & Đấu giá
export const fetchProducts = () => API.get('/products');
export const fetchProductDetail = (id) => API.get(`/products/${id}`);
export const createProduct = (formData) => API.post('/products', formData);
export const placeBid = (data) => API.post('/products/bid', data);
export const getMyProducts = () => API.get('/products/my-products');

// D. Nhóm Tài chính & Rút tiền (MỚI)
export const depositMoney = (amount) => API.post('/user/deposit', { amount });
// Gửi yêu cầu rút tiền (Body phải chứa paymentPin)
export const createWithdrawalRequest = (data) => API.post('/withdrawals/request', data);
export const getWithdrawalHistory = () => API.get('/withdrawals/my-history');

// E. Nhóm Thông báo & Tương tác
export const getNotifications = () => API.get('/notifications');
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const toggleFollow = (id) => API.post(`/users/follow/${id}`);

export default API;