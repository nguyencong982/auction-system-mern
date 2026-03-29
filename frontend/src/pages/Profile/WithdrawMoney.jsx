import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const WithdrawMoney = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  // State mới cho PIN và Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  // Bước 1: Khi bấm nút Rút Tiền - Chỉ kiểm tra sơ bộ và hiện Modal PIN
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

  // Bước 2: Khi đã nhập xong PIN và xác nhận rút tiền thật sự
  const handleConfirmWithdraw = async () => {
    if (pin.length !== 6) {
      return toast.error('Vui lòng nhập đủ 6 số PIN');
    }

    setLoading(true);
    try {
      // Gửi kèm mã pin vào formData
      const res = await API.post('/withdrawals/request', { ...formData, pin });

      if (res.data.success) {
        toast.success('Yêu cầu rút tiền thành công!');
        setShowPinModal(false);
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã PIN không chính xác hoặc lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      {/* Form cũ giữ nguyên, chỉ thay onSubmit */}
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
        <h2 className="text-2xl font-bold text-gray-800">Rút Tiền</h2>
        <div className="w-6"></div>
      </div>

      <form onSubmit={handleOpenPinModal} className="space-y-4">
        {/* ... Các trường input của bạn giữ nguyên ... */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Số tiền muốn rút (VNĐ)
          </label>
          <input
            type="number"
            required
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên ngân hàng</label>
          <select
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên chủ tài khoản</label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.accountName}
            onChange={(e) =>
              setFormData({ ...formData, accountName: e.target.value.toUpperCase() })
            }
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          TIẾP TỤC
        </button>
      </form>

      {/* MODAL NHẬP MÃ PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-80 rounded-2xl bg-white p-6 shadow-2xl duration-300">
            <h3 className="mb-4 text-center text-xl font-bold text-gray-800">Xác nhận mã PIN</h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              Vui lòng nhập mã PIN 6 số để hoàn tất rút tiền
            </p>

            <input
              type="password"
              maxLength={6}
              autoFocus
              className="mb-6 w-full border-b-2 border-blue-500 pb-2 text-center text-3xl font-bold tracking-[1rem] outline-none"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 rounded-lg bg-gray-100 py-2 font-semibold text-gray-600 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmWithdraw}
                disabled={loading || pin.length < 6}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {loading ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawMoney;
