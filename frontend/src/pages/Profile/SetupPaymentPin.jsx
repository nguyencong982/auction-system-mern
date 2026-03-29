import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const SetupPaymentPin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Xác nhận pass, 2: Nhập PIN mới

  const [formData, setFormData] = useState({
    password: '',
    pin: '',
    confirmPin: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 2 && formData.pin !== formData.confirmPin) {
      return toast.error('Mã PIN xác nhận không khớp!');
    }

    if (step === 2 && formData.pin.length !== 6) {
      return toast.error('Mã PIN phải bao gồm 6 chữ số!');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/setup-payment-pin', {
        password: formData.password,
        pin: formData.pin,
      });

      if (res.data.success) {
        toast.success('Thiết lập mã PIN thanh toán thành công!');
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      if (step === 1) setStep(1); // Nếu sai pass ở bước 1 thì ở lại
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      <h2 className="mb-2 text-2xl font-bold text-gray-800">Mã PIN Thanh Toán</h2>
      <p className="mb-6 text-sm text-gray-500">
        Dùng để bảo vệ tài sản của bạn khi thực hiện rút tiền.
      </p>

      <form
        onSubmit={
          step === 1
            ? (e) => {
                e.preventDefault();
                setStep(2);
              }
            : handleSubmit
        }
        className="space-y-5"
      >
        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mật khẩu đăng nhập
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu để xác minh"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700"
            >
              TIẾP THEO
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mã PIN mới (6 số)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Ví dụ: 123456"
                className="w-full rounded-xl border border-gray-200 p-3 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })
                }
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Xác nhận mã PIN
              </label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Nhập lại mã PIN"
                className="w-full rounded-xl border border-gray-200 p-3 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.confirmPin}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPin: e.target.value.replace(/[^0-9]/g, '') })
                }
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200"
              >
                QUAY LẠI
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 rounded-xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'ĐANG LƯU...' : 'HOÀN TẤT'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SetupPaymentPin;
