import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { createWithdrawalRequest } from '../../api';

const WithdrawMoney = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Mở Modal nhập PIN
  const handleOpenPinModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (Number(formData.amount) < 50000) {
      return toast.error('Số tiền rút tối thiểu là 50.000đ');
    }
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      return toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng');
    }
    setShowPinModal(true);
  };

  // 2. Xác nhận rút tiền (Gọi API)
  const handleConfirmWithdraw = async (e) => {
    // Chặn nổ bọt sự kiện để tránh Re-render ngoài ý muốn
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (pin.length !== 6) {
      return toast.error('Vui lòng nhập đủ 6 số PIN');
    }

    setLoading(true);

    // Dọn sạch các thông báo cũ để ưu tiên thông báo lỗi/thành công mới
    toast.dismiss();

    try {
      const res = await createWithdrawalRequest({
        ...formData,
        pin: pin,
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Yêu cầu rút tiền thành công!');
        setShowPinModal(false);

        // Chuyển hướng sau 2 giây
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi rút tiền:', error);

      // Lấy message lỗi từ Server (Mã PIN sai / Số dư thiếu)
      const errorMessage = error.response?.data?.message || 'Lỗi hệ thống';

      // HIỆN THÔNG BÁO LỖI NGAY TẠI ĐÂY
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000, // Tăng thời gian để người dùng kịp nhìn
        toastId: 'withdraw-error-fixed', // Tránh hiện trùng lặp
        theme: 'colored',
      });

      // Reset PIN để nhập lại trên Modal, không thoát Modal
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      {/* Nút Quay lại */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-2xl font-bold text-gray-800">Rút Tiền</h2>
        <div className="w-6"></div>
      </div>

      {/* Form điền thông tin */}
      <form onSubmit={handleOpenPinModal} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số tiền rút (VNĐ)</label>
          <input
            type="number"
            required
            placeholder="Ví dụ: 100000"
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên ngân hàng</label>
          <select
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            required
          >
            <option value="">-- Chọn ngân hàng --</option>
            <option value="Vietcombank">Vietcombank</option>
            <option value="MB Bank">MB Bank</option>
            <option value="Techcombank">Techcombank</option>
            <option value="Agribank">Agribank</option>
            <option value="MoMo">Ví MoMo</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số tài khoản</label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tên chủ tài khoản (Viết hoa)
          </label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 p-3 uppercase outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.accountName}
            onChange={(e) =>
              setFormData({ ...formData, accountName: e.target.value.toUpperCase() })
            }
          />
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
        >
          TIẾP TỤC
        </button>
      </form>

      {/* Modal xác nhận mã PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="mb-2 text-center text-xl font-bold text-gray-800">Xác nhận mã PIN</h3>
            <p className="mb-8 px-4 text-center text-sm text-gray-500">
              Nhập mã PIN 6 số để rút tiền.
            </p>

            <input
              type="password"
              maxLength={6}
              autoFocus
              className="mb-8 w-full border-b-2 border-blue-500 bg-transparent pb-2 text-center text-4xl font-bold tracking-[0.8rem] outline-none"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            />

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinModal(false);
                  setPin('');
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200"
                disabled={loading}
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={loading || pin.length < 6}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawMoney;
