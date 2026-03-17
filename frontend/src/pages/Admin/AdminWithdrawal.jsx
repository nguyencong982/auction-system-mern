import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api';

const AdminWithdrawal = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lấy danh sách yêu cầu rút tiền
    const fetchRequests = async () => {
        try {
            // Lưu ý: Endpoint này bạn cần viết thêm ở Backend nếu chưa có
            // để lấy toàn bộ danh sách rút tiền (thường là GET /api/withdrawals)
            const res = await API.get('/withdrawals'); 
            setRequests(res.data.data);
        } catch (error) {
            toast.error("Không thể tải danh sách yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        const adminNote = status === 'success' 
            ? "Đã chuyển khoản thành công" 
            : prompt("Lý do từ chối rút tiền:");

        if (status === 'failed' && !adminNote) return; // Hủy nếu không nhập lý do từ chối

        try {
            const res = await API.put(`/withdrawals/${id}/status`, { status, adminNote });
            if (res.data.success) {
                toast.success("Cập nhật trạng thái thành công!");
                fetchRequests(); // Tải lại danh sách
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Rút Tiền</h1>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4">Người dùng</th>
                            <th className="p-4">Số tiền</th>
                            <th className="p-4">Thông tin ngân hàng</th>
                            <th className="p-4">Ngày tạo</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium">{item.userId?.fullName || 'N/A'}</td>
                                <td className="p-4 text-red-600 font-bold">
                                    {item.amount.toLocaleString()}đ
                                </td>
                                <td className="p-4 text-sm">
                                    <p className="font-bold">{item.bankName}</p>
                                    <p className="text-gray-600">{item.accountNumber}</p>
                                    <p className="text-gray-500 italic">{item.accountName}</p>
                                </td>
                                <td className="p-4 text-xs text-gray-500">
                                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        item.status === 'success' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {item.status === 'pending' ? 'Chờ duyệt' : 
                                         item.status === 'success' ? 'Thành công' : 'Đã từ chối'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {item.status === 'pending' && (
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleUpdateStatus(item._id, 'success')}
                                                className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600"
                                            >
                                                Duyệt
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(item._id, 'failed')}
                                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600"
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requests.length === 0 && (
                    <div className="p-10 text-center text-gray-500">Không có yêu cầu nào.</div>
                )}
            </div>
        </div>
    );
};

export default AdminWithdrawal;