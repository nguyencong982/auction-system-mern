import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import để điều hướng thoát trang
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { resetPaymentPinByOTP, setupPaymentPin } from '../../api';

const SetupPaymentPin = ({ user, onRefreshProfile }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // 1. Đồng bộ trạng thái giao diện khi dữ liệu User thay đổi
  useEffect(() => {
    setStep(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  }, [user?.hasPaymentPin]);

  // 2. Khởi tạo Recaptcha ẩn (Chống lặp trong StrictMode)
  useEffect(() => {
    const initRecaptcha = () => {
      if (!window.recaptchaVerifierPin) {
        window.recaptchaVerifierPin = new RecaptchaVerifier(auth, 'recaptcha-pin-container', {
          size: 'invisible',
        });
      }
    };
    initRecaptcha();

    return () => {
      if (window.recaptchaVerifierPin) {
        window.recaptchaVerifierPin.clear();
        delete window.recaptchaVerifierPin;
      }
    };
  }, []);

  // 3. Hàm gửi OTP qua Firebase
  const handleSendOtp = async () => {
    if (!user?.phone) return toast.error('Bạn chưa cập nhật số điện thoại!');
    setLoading(true);
    toast.dismiss();
    try {
      const appVerifier = window.recaptchaVerifierPin;
      const formatPhone = user.phone.startsWith('0') ? `+84${user.phone.slice(1)}` : user.phone;

      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('VERIFY_OTP');
      toast.success('Mã OTP đã được gửi đến số điện thoại của bạn!');
    } catch (error) {
      console.error('Firebase Error:', error);
      toast.error('Gửi OTP thất bại. Vui lòng thử lại sau.');
      if (window.recaptchaVerifierPin) window.recaptchaVerifierPin.render();
    } finally {
      setLoading(false);
    }
  };

  // 4. Thiết lập lần đầu (Thoát trang sau khi thành công)
  const handleInitialSetup = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return; // Chặn nhấn nhiều lần
    if (newPin.length !== 6) return toast.error('Mã PIN phải gồm 6 chữ số');
    if (!password) return toast.error('Vui lòng nhập mật khẩu đăng nhập');

    toast.dismiss(); // Xóa các thông báo lỗi cũ để tránh bị đè
    setLoading(true);

    try {
      const res = await setupPaymentPin({ pin: newPin, password });

      if (res.data.success) {
        toast.success('🎉 Thiết lập mã PIN thành công!');
        setPassword('');
        setNewPin('');

        // Gọi hàm làm mới dữ liệu từ Profile.jsx
        if (onRefreshProfile) await onRefreshProfile();

        // Tự động thoát về trang Profile sau 1.5s
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // 5. Xác thực OTP và lưu PIN mới (Quên/Đổi mã)
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    if (newPin.length !== 6) return toast.error('Mã PIN mới phải gồm 6 chữ số');
    if (otp.length < 6) return toast.error('Vui lòng nhập đủ mã OTP');

    toast.dismiss();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const res = await resetPaymentPinByOTP({ newPin });

      if (res.data.success) {
        toast.success('Cập nhật mã PIN mới thành công!');
        setOtp('');
        setNewPin('');
        if (onRefreshProfile) await onRefreshProfile();

        // Thoát về trang Profile sau khi đổi mã thành công
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      toast.error('Mã OTP không đúng hoặc lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
      <div id="recaptcha-pin-container"></div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-blue-600 uppercase">Mã PIN Thanh Toán</h2>
        <p className="mt-2 text-sm text-gray-500 italic">
          Bảo mật giao dịch cho tài khoản của Công
        </p>
      </div>

      <div className="mt-8">
        {step === 'CREATE_NEW' && (
          <form onSubmit={handleInitialSetup} className="space-y-4">
            <p className="rounded-lg bg-orange-50 py-2 text-center text-sm font-medium text-orange-500">
              Bạn chưa có mã PIN. Hãy thiết lập ngay!
            </p>
            <div>
              <label className="ml-1 text-xs font-bold text-gray-500">MẬT KHẨU ĐĂNG NHẬP</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                className="mt-1 w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="ml-1 text-xs font-bold text-gray-500">MÃ PIN MỚI (6 SỐ)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Ví dụ: 123456"
                className="mt-1 w-full rounded-xl border border-gray-200 p-4 text-center text-2xl font-bold tracking-[10px] outline-none focus:ring-2 focus:ring-blue-400"
                value={newPin}
                onChange={(e) => {
                  if (/^[0-9]*$/.test(e.target.value)) setNewPin(e.target.value);
                }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'THIẾT LẬP NGAY'}
            </button>
          </form>
        )}

        {step === 'MANAGEMENT' && (
          <div className="space-y-6 text-center">
            <div className="flex animate-pulse justify-center text-5xl">🛡️</div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-bold text-green-700">Trạng thái: Đã kích hoạt bảo mật</p>
              <p className="mt-1 text-[10px] text-green-600">
                Mã PIN sẽ được yêu cầu khi Công rút tiền
              </p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black active:scale-95 disabled:opacity-50"
            >
              {loading ? 'ĐANG GỬI OTP...' : 'QUÊN HOẶC ĐỔI MÃ PIN'}
            </button>
            <p className="text-[11px] text-gray-400">
              * Mã OTP sẽ gửi về SĐT:{' '}
              {user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : 'Chưa có SĐT'}
            </p>
          </div>
        )}

        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyAndSave} className="space-y-4">
            <div className="mb-2 rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xs font-bold text-blue-600">XÁC THỰC OTP QUA SMS</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="Mã OTP"
              className="w-full rounded-xl border-2 border-blue-400 bg-white p-4 text-center text-2xl font-bold tracking-[10px] outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <label className="ml-1 text-xs font-bold text-gray-400 uppercase">
              Nhập mã PIN mới (6 số)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              className="w-full rounded-xl border border-gray-200 p-4 text-center text-2xl font-bold tracking-[10px] outline-none focus:ring-2 focus:ring-blue-500"
              value={newPin}
              onChange={(e) => {
                if (/^[0-9]*$/.test(e.target.value)) setNewPin(e.target.value);
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 py-4 font-black text-white shadow-lg transition-all hover:bg-green-700 active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'ĐANG LƯU...' : 'XÁC NHẬN ĐỔI MÃ'}
            </button>
            <button
              type="button"
              onClick={() => setStep('MANAGEMENT')}
              className="w-full text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
            >
              Hủy bỏ & Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetupPaymentPin;
