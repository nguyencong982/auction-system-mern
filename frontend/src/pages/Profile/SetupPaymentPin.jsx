import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { resetPaymentPinByOTP, setupPaymentPin } from '../../api';

const SetupPaymentPin = ({ user, onRefreshProfile }) => {
  const navigate = useNavigate();

  // Khởi tạo step dựa trên props user truyền xuống từ Profile.jsx
  const [step, setStep] = useState(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // 1. ĐỒNG BỘ TRẠNG THÁI: Quan trọng nhất để sửa lỗi của Công
  useEffect(() => {
    // Ép kiểu boolean để kiểm tra chính xác
    const hasPin = !!user?.hasPaymentPin;
    if (hasPin) {
      setStep('MANAGEMENT');
    } else {
      setStep('CREATE_NEW');
    }
  }, [user?.hasPaymentPin]); // Tự động chạy lại khi user ở Profile.jsx thay đổi

  // 2. Khởi tạo Recaptcha (Giữ nguyên)
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

  // 3. Hàm gửi OTP (Giữ nguyên)
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
      toast.success('Mã OTP đã được gửi!');
    } catch (error) {
      toast.error('Gửi OTP thất bại. Thử lại sau!');
      if (window.recaptchaVerifierPin) window.recaptchaVerifierPin.render();
    } finally {
      setLoading(false);
    }
  };

  // 4. Thiết lập lần đầu
  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (newPin.length !== 6) return toast.error('Mã PIN phải gồm 6 chữ số');

    toast.dismiss();
    setLoading(true);

    try {
      const res = await setupPaymentPin({ pin: newPin, password });

      if (res.data.success) {
        toast.success('🎉 Thiết lập mã PIN thành công!');
        setPassword('');
        setNewPin('');

        // Cập nhật dữ liệu ở trang cha (Profile.jsx)
        // Khi hàm này chạy, user.hasPaymentPin sẽ thành true -> useEffect ở trên sẽ tự chuyển step
        if (onRefreshProfile) {
          await onRefreshProfile();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi thiết lập mã PIN');
    } finally {
      setLoading(false);
    }
  };

  // 5. Xác thực OTP và lưu PIN mới (Giữ nguyên)
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const res = await resetPaymentPinByOTP({ newPin });
      if (res.data.success) {
        toast.success('Cập nhật mã PIN thành công!');
        setOtp('');
        setNewPin('');
        if (onRefreshProfile) await onRefreshProfile();
      }
    } catch (error) {
      toast.error('Mã OTP không đúng');
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
              className="w-full rounded-xl bg-blue-600 py-4 font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:bg-gray-400"
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
              * Gửi về:{' '}
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
              className="w-full rounded-xl border-2 border-blue-400 p-4 text-center text-2xl font-bold tracking-[10px] outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 py-4 font-black text-white shadow-lg transition-all hover:bg-green-700 active:scale-95"
            >
              {loading ? 'ĐANG LƯU...' : 'XÁC NHẬN ĐỔI MÃ'}
            </button>
            <button
              onClick={() => setStep('MANAGEMENT')}
              className="w-full text-sm font-bold text-gray-400"
            >
              Hủy
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetupPaymentPin;
