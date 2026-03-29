import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
// Import hàm từ api.js
import { resetPaymentPinByOTP, setupPaymentPin } from '../../api';

const SetupPaymentPin = ({ user, onRefreshProfile }) => {
  // Xác định trạng thái ban đầu: Nếu có PIN rồi thì vào MANAGEMENT, chưa có thì CREATE_NEW
  const [step, setStep] = useState(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [password, setPassword] = useState(''); // Thêm password cho thiết lập lần đầu
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (!window.recaptchaVerifierPin) {
      window.recaptchaVerifierPin = new RecaptchaVerifier(auth, 'recaptcha-pin-container', {
        size: 'invisible',
      });
    }
  }, []);

  // Hàm gửi OTP Firebase
  const handleSendOtp = async () => {
    if (!user?.phone) return toast.error('Bạn chưa cập nhật số điện thoại!');
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifierPin;
      const formatPhone = user.phone.startsWith('0') ? `+84${user.phone.slice(1)}` : user.phone;

      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('VERIFY_OTP');
      toast.success('Mã OTP xác thực đã được gửi!');
    } catch (error) {
      toast.error('Lỗi gửi OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm thiết lập lần đầu (Dùng Password thay vì OTP cho tiện)
  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) return toast.error('Mã PIN phải đủ 6 số');

    setLoading(true);
    try {
      const res = await setupPaymentPin({ pin: newPin, password });
      if (res.data.success) {
        toast.success('Thiết lập mã PIN thành công!');
        onRefreshProfile();
        setStep('MANAGEMENT');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // Hàm đổi PIN qua OTP
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) return toast.error('Mã PIN phải đủ 6 số');

    setLoading(true);
    try {
      // 1. Xác thực OTP với Firebase
      await confirmationResult.confirm(otp);

      // 2. Gọi hàm resetPaymentPinByOTP từ api.js
      const res = await resetPaymentPinByOTP({ newPin });

      if (res.data.success) {
        toast.success('Cập nhật mã PIN mới thành công!');
        onRefreshProfile();
        setStep('MANAGEMENT');
        setOtp('');
        setNewPin('');
      }
    } catch (error) {
      toast.error('Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
      <div id="recaptcha-pin-container"></div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-blue-600">MÃ PIN THANH TOÁN</h2>
        <p className="mt-2 text-sm text-gray-500 italic">Bảo mật 2 lớp cho mọi giao dịch</p>
      </div>

      <div className="mt-8">
        {/* CHẾ ĐỘ 1: THIẾT LẬP LẦN ĐẦU */}
        {step === 'CREATE_NEW' && (
          <form onSubmit={handleInitialSetup} className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              Bạn chưa có mã PIN. Hãy thiết lập để bảo mật số dư.
            </p>
            <input
              type="password"
              placeholder="Mật khẩu đăng nhập"
              className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="text"
              maxLength={6}
              placeholder="Mã PIN 6 số (VD: 123456)"
              className="w-full rounded-xl border border-gray-200 p-4 text-center text-2xl font-bold tracking-[10px] outline-none"
              value={newPin}
              onChange={(e) => {
                if (/^[0-9]*$/.test(e.target.value)) setNewPin(e.target.value);
              }}
              required
            />
            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700"
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'THIẾT LẬP NGAY'}
            </button>
          </form>
        )}

        {/* CHẾ ĐỘ 2: ĐÃ CÓ PIN - QUẢN LÝ */}
        {step === 'MANAGEMENT' && (
          <div className="space-y-6 text-center">
            <div className="flex animate-bounce justify-center text-5xl">🛡️</div>
            <p className="rounded-lg bg-green-50 py-2 text-sm font-medium text-green-600">
              Trạng thái: Đã kích hoạt bảo vệ
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-xl bg-gray-800 py-4 font-bold text-white transition-all hover:bg-black"
            >
              {loading ? 'ĐANG GỬI OTP...' : 'QUÊN HOẶC ĐỔI MÃ PIN'}
            </button>
            <p className="text-[10px] text-gray-400 italic">
              * Xác thực qua SĐT: {user?.phone?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
            </p>
          </div>
        )}

        {/* CHẾ ĐỘ 3: XÁC THỰC OTP ĐỂ ĐỔI PIN */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyAndSave} className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Mã OTP từ điện thoại
            </label>
            <input
              type="text"
              maxLength={6}
              required
              className="w-full rounded-xl border-2 border-blue-400 bg-blue-50 p-4 text-center text-2xl font-bold tracking-[10px] outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <label className="text-xs font-bold text-gray-400 uppercase">
              Nhập mã PIN mới (6 số)
            </label>
            <input
              type="password"
              maxLength={6}
              required
              className="w-full rounded-xl border border-gray-200 p-4 text-center text-2xl font-bold tracking-[10px] outline-none focus:ring-2 focus:ring-blue-500"
              value={newPin}
              onChange={(e) => {
                if (/^[0-9]*$/.test(e.target.value)) setNewPin(e.target.value);
              }}
            />
            <button
              disabled={loading}
              className="w-full rounded-xl bg-green-600 py-4 font-bold text-white shadow-lg transition-all hover:bg-green-700"
            >
              {loading ? 'ĐANG LƯU...' : 'XÁC NHẬN ĐỔI MÃ'}
            </button>
            <button
              type="button"
              onClick={() => setStep('MANAGEMENT')}
              className="w-full text-sm text-gray-400"
            >
              Hủy bỏ
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetupPaymentPin;
