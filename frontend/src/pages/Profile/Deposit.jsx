import { useState } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';

const Deposit = () => {
    const [amount, setAmount] = useState('');
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);

    // Thông tin ngân hàng của bạn (Admin)
    const MY_BANK = {
        name: "Vietcombank",
        accountNumber: "1234567890",
        accountName: "NGUYEN VAN A"
    };

    const handleCreateDeposit = async () => {
        if (!amount || amount < 10000) {
            return toast.error("Số tiền nạp tối thiểu là 10.000đ");
        }

        try {
            setLoading(true);
            const res = await API.post('/deposit/create', { amount: Number(amount) });
            if (res.data.success) {
                setTransaction(res.data.data); // Lưu thông tin giao dịch để hiện QR
                toast.success("Đã tạo lệnh nạp, vui lòng thanh toán!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi tạo lệnh nạp");
        } finally {
            setLoading(false);
        }
    };

    if (transaction) {
        // Sử dụng VietQR để tạo mã QR tự động (rất chuyên nghiệp)
        const qrUrl = `https://img.vietqr.io/image/${MY_BANK.name}-${MY_BANK.accountNumber}-compact2.jpg?amount=${transaction.amount}&addInfo=${transaction.code}&accountName=${MY_BANK.accountName}`;

        return (
            <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 text-center">
                <h2 className="text-2xl font-black text-gray-800 mb-2">Quét mã để nạp tiền</h2>
                <p className="text-gray-500 text-sm mb-6">Vui lòng không thay đổi nội dung chuyển khoản</p>

                <div className="bg-gray-50 p-4 rounded-3xl mb-6 border-2 border-dashed border-blue-100">
                    <img src={qrUrl} alt="QR Thanh toán" className="w-full rounded-2xl shadow-sm" />
                </div>

                <div className="space-y-4 text-left">
                    <div className="flex justify-between p-3 bg-blue-50 rounded-xl">
                        <span className="text-gray-500 text-sm">Số tiền:</span>
                        <span className="font-bold text-blue-600">{transaction.amount.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <span className="text-gray-500 text-sm">Nội dung:</span>
                        <span className="font-black text-red-600 uppercase tracking-widest">{transaction.code}</span>
                    </div>
                </div>

                <button 
                    onClick={() => setTransaction(null)}
                    className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                    Tôi đã chuyển khoản
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-[2.5rem] shadow-xl border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Nạp tiền vào ví</h2>
            
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Số tiền muốn nạp (VNĐ)</label>
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ví dụ: 500000"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                />
            </div>

            {/* Các nút gợi ý nhanh */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[50000, 100000, 500000].map(val => (
                    <button 
                        key={val}
                        onClick={() => setAmount(val)}
                        className="py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                        +{val.toLocaleString()}
                    </button>
                ))}
            </div>

            <button 
                onClick={handleCreateDeposit}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
                {loading ? "Đang xử lý..." : "Tiếp tục"}
            </button>
        </div>
    );
};

export default Deposit;