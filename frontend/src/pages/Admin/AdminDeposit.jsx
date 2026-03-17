import { useEffect, useState } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';

const AdminDeposit = () => {
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingDeposits = async () => {
        try {
            setLoading(true);
            const res = await API.get('/deposit/pending-list');
            if (res.data.success) {
                setPendingList(res.data.data);
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách chờ duyệt");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDeposits();
    }, []);

    const handleApprove = async (transactionId) => {
        if (!window.confirm("Bạn có chắc chắn muốn duyệt lệnh nạp này không?")) return;

        try {
            const res = await API.put(`/deposit/approve/${transactionId}`);
            if (res.data.success) {
                toast.success("Duyệt thành công! Tiền đã được cộng.");
                // Cập nhật lại danh sách ngay lập tức
                setPendingList(prev => prev.filter(item => item._id !== transactionId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi duyệt lệnh");
        }
    };

    if (loading) return <div className="text-center mt-10 font-bold text-gray-400">Đang tải dữ liệu admin...</div>;

    return (
        <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-800">Phê duyệt nạp tiền</h2>
                <button 
                    onClick={fetchPendingDeposits}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                    🔄 Làm mới
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50 text-gray-400 text-xs uppercase tracking-widest font-bold">
                            <th className="pb-4">Người nạp</th>
                            <th className="pb-4">Số tiền</th>
                            <th className="pb-4">Mã nội dung</th>
                            <th className="pb-4">Thời gian</th>
                            <th className="pb-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {pendingList.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-10 text-center text-gray-400">Không có yêu cầu nào đang chờ xử lý.</td>
                            </tr>
                        ) : (
                            pendingList.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="font-bold text-gray-800">{item.userId?.fullName}</div>
                                        <div className="text-xs text-gray-400">{item.userId?.email}</div>
                                    </td>
                                    <td className="py-4 font-black text-blue-600">
                                        {Number(item.amount).toLocaleString()}đ
                                    </td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black border border-red-100 uppercase">
                                            {item.code}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-500 text-sm">
                                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => handleApprove(item._id)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-green-100 transition-all"
                                        >
                                            Duyệt lệnh
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDeposit;