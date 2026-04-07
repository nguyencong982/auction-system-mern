import { useState } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 2. Khởi tạo navigate

  // Thông tin ngân hàng của bạn (Admin)
  const MY_BANK = {
    name: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN A',
  };

  const handleCreateDeposit = async () => {
    if (!amount || amount < 10000) {
      return toast.error('Số tiền nạp tối thiểu là 10.000đ');
    }

    try {
      setLoading(true);
      const res = await API.post('/deposit/create', { amount: Number(amount) });
      if (res.data.success) {
        setTransaction(res.data.data);
        toast.success('Đã tạo lệnh nạp, vui lòng thanh toán!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tạo lệnh nạp');
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm xử lý sau khi người dùng bấm "Tôi đã chuyển khoản"
  const handleConfirmTransfer = () => {
    toast.info('Yêu cầu nạp tiền đã được gửi. Vui lòng đợi Admin phê duyệt!', {
      position: 'top-center',
      autoClose: 5000,
    });

    // Chuyển về trang chủ sau khi thông báo
    setTimeout(() => {
      navigate('/');
    }, 1000); // Đợi 1 giây để user kịp nhìn thấy hiệu ứng
  };

  if (transaction) {
    const qrUrl = `https://img.vietqr.io/image/${MY_BANK.name}-${MY_BANK.accountNumber}-compact2.jpg?amount=${transaction.amount}&addInfo=${transaction.code}&accountName=${MY_BANK.accountName}`;

    return (
      <div className="mx-auto mt-10 max-w-md rounded-[2.5rem] border border-gray-100 bg-white p-8 text-center shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-gray-800">Quét mã để nạp tiền</h2>
        <p className="mb-6 text-sm font-medium text-gray-500">
          Vui lòng không thay đổi nội dung chuyển khoản
        </p>

        <div className="mb-6 rounded-3xl border-2 border-dashed border-blue-100 bg-gray-50 p-4">
          <img src={qrUrl} alt="QR Thanh toán" className="w-full rounded-2xl shadow-sm" />
        </div>

        <div className="space-y-4 text-left">
          <div className="flex justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <span className="text-sm font-bold text-blue-600 uppercase">Số tiền</span>
            <span className="text-lg font-black text-blue-700">
              {transaction.amount.toLocaleString()}đ
            </span>
          </div>
          <div className="flex justify-between rounded-2xl border border-red-100 bg-red-50 p-4">
            <span className="text-sm font-bold text-red-600 uppercase">Nội dung</span>
            <span className="text-lg font-black tracking-widest text-red-700 uppercase">
              {transaction.code}
            </span>
          </div>
        </div>

        {/* 4. Cập nhật nút bấm */}
        <button
          onClick={handleConfirmTransfer}
          className="mt-8 w-full rounded-2xl bg-gray-900 py-4 font-black text-white shadow-lg transition-all hover:bg-black hover:shadow-xl active:scale-95"
        >
          Tôi đã chuyển khoản
        </button>

        <button
          onClick={() => setTransaction(null)}
          className="mt-4 text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
        >
          Hủy bỏ giao dịch
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-2xl font-black text-gray-800">Nạp tiền vào ví</h2>

      <div className="mb-6">
        <label className="mb-2 ml-1 block text-xs font-bold text-gray-400 uppercase italic">
          Số tiền muốn nạp (VNĐ)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ví dụ: 500000"
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-2xl font-black text-blue-600 outline-none placeholder:font-normal focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[50000, 100000, 500000].map((val) => (
          <button
            key={val}
            onClick={() => setAmount(val)}
            className="rounded-xl bg-blue-50 py-3 text-xs font-black text-blue-600 transition-all hover:bg-blue-600 hover:text-white active:scale-90"
          >
            +{val.toLocaleString()}
          </button>
        ))}
      </div>

      <button
        onClick={handleCreateDeposit}
        disabled={loading}
        className="w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : 'Tiếp tục ngay'}
      </button>
    </div>
  );
};

export default Deposit;
