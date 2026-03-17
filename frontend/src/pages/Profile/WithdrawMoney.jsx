import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import API from '../../api';

const WithdrawMoney = () => {
  const navigate = useNavigate(); // 2. Khởi tạo điều hướng
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(formData.amount) < 50000) {
      return toast.error('Số tiền rút tối thiểu là 50.000đ');
    }

    setLoading(true);
    try {
      const res = await API.post('/withdrawals/request', formData);

      if (res.data.success) {
        // 3. Hiển thị thông báo thành công trước
        toast.success('Yêu cầu rút tiền thành công! Số dư đã được tạm trừ.');

        // 4. Điều hướng về trang chủ sau 500ms để user kịp nhìn thấy toast
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      console.error('Lỗi rút tiền:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        {/* Nút quay lại nhanh nếu user đổi ý */}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... các input giữ nguyên ... */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Số tiền muốn rút (VNĐ)
          </label>
          <input
            type="number"
            required
            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ví dụ: 100000"
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
            placeholder="Nhập STK của bạn"
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
            placeholder="VÍ DỤ: NGUYEN THE CONG"
            value={formData.accountName}
            onChange={(e) =>
              setFormData({ ...formData, accountName: e.target.value.toUpperCase() })
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-gray-400"
        >
          {loading ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU RÚT TIỀN'}
        </button>
      </form>
    </div>
  );
};

export default WithdrawMoney;
