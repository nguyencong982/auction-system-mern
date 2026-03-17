import axios from 'axios';

// 1. Cấu hình instance Axios
const API = axios.create({
    // Ưu tiên lấy link từ biến môi trường Vercel, nếu không có sẽ dùng thẳng link Render
    baseURL: import.meta.env.VITE_API_URL || 'https://auction-system-mern-xeyx.onrender.com/api'
});

// 2. Tự động đính kèm Token vào header
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// 3. Các hàm gọi API cụ thể

// Đăng nhập
export const login = async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
};

// Đăng ký
export const register = async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
};

// Gửi mã OTP về số điện thoại
export const sendOTP = async (phone) => {
    try {
        const response = await API.post('/auth/send-otp', { phone });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Không thể gửi mã OTP" };
    }
};

// Đặt lại mật khẩu (Cần truyền thêm otp để xác thực)
export const resetPassword = async (phone, otp, newPassword) => {
    try {
        // Gửi cả phone, otp và mật khẩu mới lên backend
        const response = await API.post('/auth/reset-password', { phone, otp, newPassword });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Lỗi kết nối server" };
    }
};

// Xuất instance API để dùng cho các chỗ khác (nếu cần)
export default API;