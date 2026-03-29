import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { resetPaymentPinByOTP, setupPaymentPin } from '../../api';

const SetupPaymentPin = ({ user, onRefreshProfile }) => {
  const navigate = useNavigate();

  // Khởi tạo state dựa trên thông tin user hiện tại
  const [step, setStep] = useState(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // 1. Đồng bộ trạng thái giao diện khi dữ liệu profile thay đổi
  useEffect(() => {
    if (user) {
      setStep(user.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
    }
  }, [user?.hasPaymentPin]);

  // 2. Khởi tạo Recaptcha cho việc xác thực OTP
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
        window.recaptchaVerifierPin = null;
      }
    };
  }, []);

  // Hàm điều hướng chung sau khi thành công
  const handleSuccessNavigation = async () => {
    if (onRefreshProfile) await onRefreshProfile();
    // Đợi 1.5s để user kịp nhìn Toast thông báo rồi mới về Home
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  // 3. Gửi OTP qua số điện thoại
  const handleSendOtp = async () => {
    // 1. Ưu tiên lấy từ prop, nếu không có thì lấy từ LocalStorage
    const userData = user || JSON.parse(localStorage.getItem('user'));
    const phoneNumber = userData?.phone;

    if (!phoneNumber) {
      return toast.error(
        'Hệ thống chưa nhận diện được số điện thoại. Vui lòng cập nhật ở trang Hồ sơ!'
      );
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifierPin;
      // 2. Chuẩn hóa số điện thoại để Firebase không lỗi
      const cleanPhone = phoneNumber.trim();
      const formatPhone = cleanPhone.startsWith('0') ? `+84${cleanPhone.slice(1)}` : cleanPhone;

      console.log('Đang gửi OTP đến:', formatPhone); // Để Công debug trong F12

      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('VERIFY_OTP');
      toast.success('Mã OTP đã được gửi!');
    } catch (error) {
      console.error('Firebase Error:', error);
      toast.error('Gửi OTP thất bại. Hãy kiểm tra cấu hình Firebase hoặc Domain!');
    } finally {
      setLoading(false);
    }
  };

  // 4. Thiết lập mã PIN lần đầu
  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) return toast.error('Mã PIN phải gồm 6 chữ số');

    setLoading(true);
    try {
      const res = await setupPaymentPin({ pin: newPin, password });
      if (res.data.success) {
        toast.success('🎉 Thiết lập mã PIN thành công!');
        await handleSuccessNavigation();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '';
      toast.error(errorMsg || 'Lỗi thiết lập mã PIN');

      // Trường hợp Server báo đã có PIN nhưng Client chưa biết (Lỗi 400)
      if (errorMsg.includes('tồn tại')) {
        setStep('MANAGEMENT');
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Xác nhận OTP và lưu mã PIN mới (Quên/Đổi PIN)
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Vui lòng nhập đủ 6 số OTP');

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const res = await resetPaymentPinByOTP({ newPin });
      if (res.data.success) {
        toast.success('Cập nhật mã PIN thành công!');
        await handleSuccessNavigation();
      }
    } catch (error) {
      toast.error('Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
      <div id="recaptcha-pin-container"></div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-blue-600 uppercase">Mã PIN Thanh Toán</h2>
        <p className="mt-2 text-sm text-gray-500 italic">Bảo mật giao dịch tài khoản</p>
      </div>

      <div className="mt-8">
        {/* Bước 1: Thiết lập mới */}
        {step === 'CREATE_NEW' && (
          <div className="space-y-4">
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <p className="rounded-lg bg-orange-50 py-2 text-center text-sm font-medium text-orange-500">
                Bạn chưa có mã PIN. Hãy thiết lập ngay!
              </p>
              <div>
                <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                  Mật khẩu đăng nhập
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>
              <div>
                <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                  Mã PIN mới (6 số)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-4 text-center text-2xl font-bold tracking-[10px] outline-none focus:ring-2 focus:ring-blue-400"
                  value={newPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) setNewPin(e.target.value);
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

            <div className="mt-4 border-t border-gray-50 pt-4 text-center">
              <button
                type="button"
                onClick={() => setStep('MANAGEMENT')}
                className="text-xs font-bold text-blue-500 hover:underline"
              >
                Tôi đã có mã PIN? Quên mã PIN
              </button>
            </div>
          </div>
        )}

        {/* Bước 2: Quản lý/Đổi PIN */}
        {step === 'MANAGEMENT' && (
          <div className="space-y-6 text-center">
            <div className="flex animate-bounce justify-center text-5xl">🛡️</div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-bold text-green-700">Trạng thái: Đã kích hoạt bảo mật</p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black active:scale-95 disabled:opacity-50"
            >
              {loading ? 'ĐANG GỬI OTP...' : 'QUÊN HOẶC ĐỔI MÃ PIN'}
            </button>
            <p className="text-[11px] text-gray-400 italic">
              * OTP sẽ gửi về:{' '}
              {user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '...'}
            </p>
          </div>
        )}

        {/* Bước 3: Xác thực OTP */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyAndSave} className="space-y-4">
            <div className="mb-2 rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xs font-bold text-blue-600">XÁC THỰC OTP & NHẬP PIN MỚI</p>
            </div>
            <input
              type="text"
              placeholder="Nhập 6 số OTP"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-xl border-2 border-blue-400 p-4 text-center text-xl font-bold tracking-[10px] outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Mã PIN mới"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-xl border border-gray-200 p-4 text-center text-xl font-bold tracking-[10px] outline-none"
              value={newPin}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setNewPin(e.target.value);
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 py-4 font-black text-white shadow-lg transition-all hover:bg-green-700"
            >
              {loading ? 'ĐANG LƯU...' : 'XÁC NHẬN ĐỔI MÃ'}
            </button>
            <button
              type="button"
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
