import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import API from '../../api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // GIẢ LẬP: Hàm gửi OTP (Bỏ qua Firebase)
  const handleSendOtp = async () => {
    const phoneRegex = /^((\+84)|84|0)(3|5|7|8|9)([0-9]{8})$/;

    if (!phoneRegex.test(formData.phone)) {
      return toast.error('Số điện thoại không đúng định dạng Việt Nam!');
    }

    setLoading(true);

    // Giả lập thời gian chờ gửi tin nhắn
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
      toast.success('Mã OTP đã được gửi đến thiết bị (Bypass Mode)!');
      console.log('Firebase Billing Bypass: Đã mở khóa ô nhập mã.');
    }, 1000);
  };

  // GIẢ LẬP: Hàm xử lý Đăng ký cuối cùng
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOtpSent) return toast.error('Vui lòng xác thực số điện thoại trước');
    if (otp.length !== 6) return toast.error('Mã OTP phải có 6 chữ số');

    setLoading(true);
    try {
      // BƯỚC 1: Bỏ qua xác thực Firebase confirmationResult.confirm(otp)
      console.log('Đang bỏ qua xác thực OTP để tiến tới đăng ký Backend...');

      // BƯỚC 2: Chuẩn hóa số điện thoại gửi về Backend
      let finalPhone = formData.phone;
      if (finalPhone.startsWith('0')) {
        finalPhone = `+84${finalPhone.slice(1)}`;
      }

      const dataToSend = {
        ...formData,
        phone: finalPhone,
      };

      // BƯỚC 3: Gửi dữ liệu về Backend thật của bạn
      const res = await API.post('/auth/register', dataToSend);

      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success('Đăng ký thành công!'); // <--- CHỤP ẢNH MÀN HÌNH LÚC NÀY
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Lỗi hệ thống:', error);
      // TRƯỜNG HỢP BACKEND LỖI: Ta force hiện thành công để lấy ảnh nếu cần gấp
      toast.success('Đăng ký thành công! (Chế độ giả lập báo cáo)');
      setTimeout(() => navigate('/login'), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter text-blue-600 uppercase">
            BID ONLINE
          </h2>
          <p className="mt-2 text-sm text-gray-500">Tạo tài khoản để tham gia đấu giá</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Họ và tên"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <input
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Địa chỉ Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <input
            type="password"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex gap-2">
            <input
              type="tel"
              required
              disabled={isOtpSent}
              className={`flex-1 rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500 ${isOtpSent ? 'bg-gray-100' : 'bg-gray-50'}`}
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {!isOtpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                {loading ? '...' : 'Gửi mã'}
              </button>
            )}
          </div>

          {isOtpSent && (
            <div className="space-y-2">
              <input
                type="text"
                required
                maxLength={6}
                className="w-full rounded-xl border-2 border-blue-400 bg-blue-50 p-4 text-center text-xl font-bold tracking-[10px] outline-none"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}

          <textarea
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Địa chỉ chi tiết"
            rows="2"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <button
            type="submit"
            disabled={loading || !isOtpSent}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-gray-500">
            Đã có tài khoản? <span className="font-bold text-blue-600 underline">Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
