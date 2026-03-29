import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { resetPaymentPinByOTP, setupPaymentPin } from '../../api';

const SetupPaymentPin = ({ user, onRefreshProfile }) => {
  const [step, setStep] = useState(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Đồng bộ step khi dữ liệu user từ Profile cha thay đổi
  useEffect(() => {
    setStep(user?.hasPaymentPin ? 'MANAGEMENT' : 'CREATE_NEW');
  }, [user?.hasPaymentPin]);

  // Khởi tạo Recaptcha an toàn hơn
  useEffect(() => {
    const initRecaptcha = () => {
      if (!window.recaptchaVerifierPin) {
        window.recaptchaVerifierPin = new RecaptchaVerifier(auth, 'recaptcha-pin-container', {
          size: 'invisible',
          callback: (response) => {
            // Recaptcha resolved - có thể tự động gửi lại OTP nếu cần
          },
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

  const handleSendOtp = async () => {
    if (!user?.phone) return toast.error('Bạn chưa cập nhật số điện thoại!');
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifierPin;
      // Chuẩn hóa SĐT sang định dạng +84
      const formatPhone = user.phone.startsWith('0') ? `+84${user.phone.slice(1)}` : user.phone;

      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('VERIFY_OTP');
      toast.success('Mã OTP đã được gửi đến số điện thoại của bạn!');
    } catch (error) {
      console.error('Firebase Error:', error);
      toast.error('Gửi OTP thất bại. Vui lòng thử lại sau.');
      // Nếu lỗi do recaptcha cũ, hãy reset nó
      if (window.recaptchaVerifierPin) window.recaptchaVerifierPin.render();
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (newPin.length !== 6) return toast.error('Mã PIN phải gồm 6 chữ số');

    setLoading(true);
    try {
      const res = await setupPaymentPin({ pin: newPin, password });

      if (res.data.success) {
        toast.success('🎉 Thiết lập mã PIN thành công!');
        // Reset form
        setPassword('');
        setNewPin('');
        // Thông báo cho cha cập nhật lại state hasPaymentPin
        if (onRefreshProfile) await onRefreshProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (newPin.length !== 6) return toast.error('Mã PIN mới phải gồm 6 chữ số');
    if (otp.length < 6) return toast.error('Vui lòng nhập đủ mã OTP');

    setLoading(true);
    try {
      // 1. Xác thực với Firebase
      await confirmationResult.confirm(otp);

      // 2. Gửi lệnh đổi PIN lên Backend
      const res = await resetPaymentPinByOTP({ newPin });

      if (res.data.success) {
        toast.success('Cập nhật mã PIN mới thành công!');
        setOtp('');
        setNewPin('');
        if (onRefreshProfile) await onRefreshProfile();
      }
    } catch (error) {
      toast.error('Mã OTP không đúng hoặc lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // ... (Phần Return giữ nguyên các UI Tailwind của bạn vì nó đã rất đẹp rồi)
  return (
    /* Giữ nguyên phần UI của bạn */
    <div className="mx-auto mt-4 max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
      {/* ... */}
    </div>
  );
};

export default SetupPaymentPin;
