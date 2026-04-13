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

  // 1. Mở Modal nhập PIN (Xử lý tiền kỳ)
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

  // 2. Xác nhận rút tiền (Gọi API & Xử lý lỗi cưỡng bức)
  const handleConfirmWithdraw = async (e) => {
    // Ngăn chặn tuyệt đối mọi hành vi reload trang của trình duyệt
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (pin.length !== 6) {
      return toast.error('Vui lòng nhập đủ 6 số PIN');
    }

    setLoading(true);

    // Xóa sạch các thông báo đang treo để ưu tiên thông báo lỗi mới nhất
    toast.dismiss();

    try {
      console.log('>>> ĐANG GỬI YÊU CẦU RÚT TIỀN:', { ...formData, pin: '******' });

      const res = await createWithdrawalRequest({
        amount: formData.amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        pin: pin,
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Yêu cầu rút tiền thành công!');
        setShowPinModal(false);
        // Chuyển hướng sau 2 giây để người dùng kịp đọc thông báo thành công
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 2000);
      }
    } catch (error) {
      // LOG CHI TIẾT LỖI RA CONSOLE ĐỂ KIỂM TRA TRONG F12
      console.error('--- BẮT ĐƯỢC LỖI TỪ SERVER ---');
      console.log('Trạng thái (Status):', error.response?.status);
      console.log('Dữ liệu lỗi (Data):', error.response?.data);

      // Lấy thông điệp lỗi chính xác (Mã PIN sai / Số dư không đủ)
      const errorMessage = error.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại sau';

      // HIỂN THỊ THÔNG BÁO LỖI (Bỏ hoàn toàn toastId để hiện lại mỗi lần bấm)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000, // Để 5 giây cho chắc chắn nhìn thấy
        theme: 'colored',
        pauseOnFocusLoss: false,
        closeOnClick: true,
      });

      // Reset PIN để người dùng nhập lại ngay trên Modal
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      {/* Nút Quay lại */}
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

      {/* Form thông tin rút tiền */}
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
            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
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
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-center text-xl font-bold text-gray-800">Xác nhận mã PIN</h3>
            <p className="mb-8 text-center text-sm text-gray-500">Nhập mã PIN 6 số để hoàn tất.</p>

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
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200"
                disabled={loading}
              >
                HỦY
              </button>
              <button
                type="button"
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
