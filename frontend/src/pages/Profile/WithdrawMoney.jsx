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

  const handleConfirmWithdraw = async () => {
    if (pin.length !== 6) {
      return toast.error('Vui lòng nhập đủ 6 số PIN');
    }

    setLoading(true);
    try {
      const res = await createWithdrawalRequest({
        ...formData,
        pin: pin,
      });

      if (res.data.success) {
        // THÀNH CÔNG: Thông báo -> Đóng Modal -> Về trang Home
        toast.success(res.data.message || 'Yêu cầu rút tiền thành công!');
        setShowPinModal(false);
        // Chuyển hướng về Home sau 1.5s để người dùng kịp nhìn thông báo thành công
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      console.error('FULL ERROR:', error);
      let message = 'Lỗi hệ thống';

      // Lấy message từ Backend
      if (error.response && error.response.data) {
        const data = error.response.data;
        message = data.message || data.error || (typeof data === 'string' ? data : message);
      } else if (error.message) {
        message = error.message;
      }

      // THẤT BẠI: Hiện lỗi ngay lập tức, giữ nguyên Modal để người dùng nhập lại PIN hoặc kiểm tra
      toast.error(message);
      setPin(''); // Reset mã PIN sai để nhập lại
      // KHÔNG đóng modal, KHÔNG navigate đi nơi khác
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
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

      <form onSubmit={handleOpenPinModal} className="space-y-4">
        {/* Input Số tiền */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số tiền rút (VNĐ)</label>
          <input
            type="number"
            required
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        {/* Ngân hàng */}
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

        {/* STK */}
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

        {/* Tên chủ TK */}
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

      {/* Modal PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in zoom-in w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl duration-200">
            <h3 className="mb-2 text-center text-xl font-bold text-gray-800">Xác nhận mã PIN</h3>
            <p className="mb-8 px-4 text-center text-sm text-gray-500">
              Nhập mã PIN 6 số để rút tiền.
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
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200"
              >
                HỦY
              </button>
              <button
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
