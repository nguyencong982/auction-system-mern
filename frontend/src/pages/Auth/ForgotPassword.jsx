import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../api';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Dùng ref để kiểm soát việc khởi tạo reCAPTCHA
  const recaptchaInitialized = useRef(false);

  useEffect(() => {
    const initRecaptcha = () => {
      if (!window.recaptchaVerifier && !recaptchaInitialized.current) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => console.log('reCAPTCHA verified'),
            'expired-callback': () => toast.warning("Phiên làm việc hết hạn. Vui lòng gửi lại mã.")
          });
          recaptchaInitialized.current = true;
        } catch (err) {
          console.error("Lỗi khởi tạo reCAPTCHA:", err);
        }
      }
    };

    initRecaptcha();

    // Cleanup: Xóa verifier khi chuyển trang để không bị lỗi "element removed"
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        recaptchaInitialized.current = false;
      }
    };
  }, []);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) return toast.error('Vui lòng nhập số điện thoại hợp lệ!');

    setLoading(true);
    try {
      // Nếu vì lý do nào đó verifier bị mất, khởi tạo lại ngay lập tức
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }

      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phone.startsWith('0') ? `+84${phone.slice(1)}` : phone;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      toast.success('Mã xác thực đã được gửi!');
    } catch (error) {
      console.error("Lỗi Firebase:", error);
      
      // Reset reCAPTCHA để người dùng có thể bấm lại ngay
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((id) => window.grecaptcha.reset(id));
      }

      if (error.message.includes('removed')) {
        toast.error("Lỗi hệ thống xác thực. Vui lòng tải lại trang.");
      } else {
        toast.error(error.code === 'auth/too-many-requests' ? 'Quá nhiều yêu cầu. Thử lại sau!' : 'Gửi mã thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp!');
    if (newPassword.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự!');

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const res = await resetPassword(phone, otp, newPassword);

      if (res.success || res.status === 200) {
        toast.success('Đổi mật khẩu thành công!');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.code === 'auth/invalid-verification-code' ? 'Mã OTP không đúng' : 'Lỗi đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-12">
      {/* Để container ở ngoài cùng để React không can thiệp vào DOM của nó */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md rounded-3xl border border-gray-50 bg-white p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black tracking-tighter text-blue-600 uppercase">Xác minh OTP</h2>
          <p className="mt-2 text-sm text-gray-400">Bảo mật tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold text-gray-400 uppercase">Số điện thoại</label>
            <div className="relative">
              <input
                type="tel"
                disabled={isOtpSent}
                className={`w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-400 ${isOtpSent ? 'opacity-60' : ''}`}
                placeholder="0386871xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {!isOtpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="absolute top-2 right-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '...' : 'Gửi mã'}
                </button>
              )}
            </div>
          </div>

          {isOtpSent && (
            <div className="animate-fadeIn space-y-4">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold text-gray-400 uppercase">Mã xác thực OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold text-gray-400 uppercase">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold text-gray-400 uppercase">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-2xl p-4 font-bold text-white shadow-lg shadow-blue-100 transition active:scale-95 ${loading ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 border-t border-gray-50 pt-6 text-center">
          <button
            type="button"
            onClick={() => setIsOtpSent(false)}
            className="text-xs font-bold text-gray-400 hover:text-blue-600"
          >
            Thử lại với số điện thoại khác
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;