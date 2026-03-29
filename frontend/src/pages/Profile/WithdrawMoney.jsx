import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// Sửa lại import: dùng các hàm đã export từ api.js
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

  // Bước 1: Kiểm tra thông tin trước khi hiện Modal PIN
  const handleOpenPinModal = (e) => {
    e.preventDefault();
    if (Number(formData.amount) < 50000) {
      return toast.error('Số tiền rút tối thiểu là 50.000đ');
    }
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      return toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng');
    }
    setShowPinModal(true);
  };

  // Bước 2: Xác nhận rút tiền với mã PIN
  const handleConfirmWithdraw = async () => {
    if (pin.length !== 6) {
      return toast.error('Vui lòng nhập đủ 6 số PIN');
    }

    setLoading(true);
    try {
      // SỬ DỤNG HÀM TỪ API.JS: Gửi kèm PIN vào request body
      const res = await createWithdrawalRequest({
        ...formData,
        paymentPin: pin, // Key này phải khớp với requirePin middleware ở Backend
      });

      if (res.data.success) {
        toast.success('Yêu cầu rút tiền đã được gửi! Chờ Admin phê duyệt.');
        setShowPinModal(false);
        // Chuyển hướng về trang chủ hoặc lịch sử rút tiền sau 1.5s
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      // Xử lý lỗi mã PIN sai hoặc số dư không đủ từ Backend
      toast.error(error.response?.data?.message || 'Mã PIN không đúng hoặc lỗi hệ thống');
      setPin(''); // Xóa mã PIN cũ để người dùng nhập lại
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      {/* Header & Nút Back */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 transition-colors hover:text-blue-600"
        >
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

      <form onSubmit={handleOpenPinModal} className="space-y-4">
        {/* Input Số tiền */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Số tiền muốn rút (VNĐ)
          </label>
          <input
            type="number"
            required
            placeholder="Ví dụ: 500000"
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        {/* Chọn Ngân hàng */}
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

        {/* Số tài khoản */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số tài khoản</label>
          <input
            type="text"
            required
            placeholder="Nhập số tài khoản"
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          />
        </div>

        {/* Tên chủ tài khoản */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tên chủ tài khoản (Viết hoa)
          </label>
          <input
            type="text"
            required
            placeholder="NGUYEN VAN A"
            className="w-full rounded-xl border border-gray-200 p-3 uppercase outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.accountName}
            onChange={(e) =>
              setFormData({ ...formData, accountName: e.target.value.toUpperCase() })
            }
          />
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          TIẾP TỤC
        </button>
      </form>

      {/* --- MODAL NHẬP MÃ PIN --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in zoom-in fade-in w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl duration-200">
            <h3 className="mb-2 text-center text-xl font-bold text-gray-800">Xác nhận mã PIN</h3>
            <p className="mb-8 px-4 text-center text-sm text-gray-500">
              Nhập mã PIN thanh toán gồm 6 chữ số để xác thực giao dịch này.
            </p>

            <div className="relative mb-8">
              <input
                type="password"
                maxLength={6}
                autoFocus
                className="w-full border-b-2 border-blue-500 bg-transparent pb-2 text-center text-4xl font-bold tracking-[0.8rem] outline-none"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200"
              >
                HỦY
              </button>
              <button
                onClick={handleConfirmWithdraw}
                disabled={loading || pin.length < 6}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 disabled:bg-gray-300"
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
