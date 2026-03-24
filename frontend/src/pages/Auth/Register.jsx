import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase'; // Đảm bảo đường dẫn này đúng
import API from '../../api';
import firebase from '../../firebase';
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
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Khởi tạo reCAPTCHA ngay khi component mount để tránh lỗi render
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, // ✅ auth đứng đầu
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha verified');
          },
          'expired-callback': () => {
            toast.warning('Phiên làm việc hết hạn, vui lòng thử lại.');
          },
        }
      );
    }
  }, []);

  const handleSendOtp = async () => {
    // Regex mới: Chấp nhận +84, 84, hoặc 0 ở đầu
    const phoneRegex = /^((\+84)|84|0)(3|5|7|8|9)([0-9]{8})$/;

    if (!phoneRegex.test(formData.phone)) {
      return toast.error('Số điện thoại không đúng định dạng Việt Nam!');
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;

      // Chuẩn hóa chuẩn: Xóa số 0 đầu thay bằng +84, hoặc thêm + nếu đã có 84
      let formatPhone = formData.phone;
      if (formatPhone.startsWith('0')) {
        formatPhone = `+84${formatPhone.slice(1)}`;
      } else if (formatPhone.startsWith('84')) {
        formatPhone = `+${formatPhone}`;
      } else if (!formatPhone.startsWith('+')) {
        formatPhone = `+${formatPhone}`;
      }

      console.log('Số điện thoại gửi đi Firebase:', formatPhone);

      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      toast.success('Mã OTP đã được gửi!');
    } catch (error) {
      console.error('🔥 Firebase error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOtpSent) return toast.error('Vui lòng xác thực số điện thoại trước');
    if (otp.length !== 6) return toast.error('Mã OTP phải có 6 chữ số');

    setLoading(true);
    try {
      // 1. Xác thực mã OTP với Firebase
      await confirmationResult.confirm(otp);

      // 2. Chuẩn hóa số điện thoại một lần nữa để gửi về Backend
      // (Đảm bảo Backend nhận được số y hệt số đã xác thực với Firebase)
      let finalPhone = formData.phone;
      if (finalPhone.startsWith('0')) {
        finalPhone = `+84${finalPhone.slice(1)}`;
      } else if (finalPhone.startsWith('84') && !finalPhone.startsWith('+')) {
        finalPhone = `+${finalPhone}`;
      }

      // Tạo object dữ liệu mới để gửi về Backend
      const dataToSend = {
        ...formData,
        phone: finalPhone, // Gửi số đã chuẩn hóa +84
      };

      console.log('Dữ liệu gửi về Backend:', dataToSend);

      // 3. Gửi dữ liệu về Backend
      const res = await API.post('/auth/register', dataToSend);

      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success('Đăng ký thành công!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Chi tiết lỗi:', error);

      // Đọc thông báo lỗi từ Backend trả về để biết lý do chính xác (400 là do cái gì)
      const serverMessage = error.response?.data?.message;

      toast.error(
        serverMessage ||
          (error.code === 'auth/invalid-verification-code'
            ? 'Mã OTP không chính xác'
            : 'Đăng ký thất bại')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Container bắt buộc cho reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter text-blue-600 uppercase">
            BID ONLINE
          </h2>
          <p className="mt-2 text-sm text-gray-500">Tạo tài khoản để tham gia đấu giá</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {/* Họ tên */}
          <input
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Họ và tên"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          {/* Email */}
          <input
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Địa chỉ Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          {/* Mật khẩu */}
          <input
            type="password"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {/* Số điện thoại & Gửi mã */}
          <div className="flex gap-2">
            <input
              type="tel"
              required
              disabled={isOtpSent}
              className={`flex-1 rounded-xl border border-gray-200 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-500 ${isOtpSent ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {!isOtpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '...' : 'Gửi mã'}
              </button>
            )}
          </div>

          {/* Ô nhập OTP khi đã gửi mã */}
          {isOtpSent && (
            <div className="space-y-2">
              <input
                type="text"
                required
                maxLength={6}
                className="w-full rounded-xl border-2 border-blue-400 bg-blue-50 p-4 text-center text-xl font-bold tracking-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-gray-400 italic">* Đang chờ mã gửi về...</span>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Đổi số khác?
                </button>
              </div>
            </div>
          )}

          {/* Địa chỉ */}
          <textarea
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Địa chỉ nhận hàng chi tiết"
            rows="2"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <button
            type="submit"
            disabled={loading || !isOtpSent}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
          >
            Đã có tài khoản? <span className="font-bold text-blue-600 underline">Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
