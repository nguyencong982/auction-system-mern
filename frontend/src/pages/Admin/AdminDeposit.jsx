import { useEffect, useState } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // Thêm Link để quay về Home

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
      toast.error('Lỗi khi tải danh sách chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  // Hàm duyệt lệnh nạp
  const handleApprove = async (transactionId) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn DUYỆT lệnh nạp này? Tiền sẽ được cộng vào tài khoản user.'
      )
    )
      return;

    try {
      const res = await API.put(`/deposit/approve/${transactionId}`);
      if (res.data.success) {
        toast.success('Duyệt thành công! Tiền đã được cộng.');
        setPendingList((prev) => prev.filter((item) => item._id !== transactionId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt lệnh');
    }
  };

  // Hàm từ chối/xóa lệnh nạp (Xử lý các lệnh lỗi hoặc không có tiền)
  const handleReject = async (transactionId) => {
    if (
      !window.confirm('Bạn có chắc chắn muốn TỪ CHỐI lệnh này? Lệnh sẽ bị hủy và không cộng tiền.')
    )
      return;

    try {
      // Giả sử backend của bạn có route xóa hoặc update status thành 'rejected'
      // Nếu chưa có route riêng, bạn có thể dùng phương thức DELETE
      const res = await API.delete(`/deposit/reject/${transactionId}`);

      if (res.data.success) {
        toast.warn('Đã từ chối và xóa lệnh nạp lỗi.');
        setPendingList((prev) => prev.filter((item) => item._id !== transactionId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thực hiện thao tác');
      // Backup trường hợp backend chưa có route DELETE: xóa cứng ở UI để dọn rác
      // setPendingList(prev => prev.filter(item => item._id !== transactionId));
    }
  };

  if (loading)
    return (
      <div className="mt-20 animate-pulse text-center font-bold text-gray-400">
        Đang tải dữ liệu quản trị...
      </div>
    );

  return (
    <div className="mx-auto mt-10 max-w-6xl p-4 md:p-8">
      {/* Nút Quay về Home */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-bold text-gray-500 transition-colors hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Quay về Dashboard
        </Link>
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Phê duyệt nạp tiền</h2>
            <p className="text-sm text-gray-400">Quản lý các yêu cầu nạp tiền từ người dùng</p>
          </div>
          <button
            onClick={fetchPendingDeposits}
            className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-600 transition-all hover:bg-blue-100"
          >
            🔄 Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
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
                  <td colSpan="5" className="py-20 text-center font-medium text-gray-400">
                    <div className="mb-2 text-4xl">🏖️</div>
                    Hiện không có yêu cầu nào chờ xử lý.
                  </td>
                </tr>
              ) : (
                pendingList.map((item) => (
                  <tr key={item._id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="py-5">
                      <div className="font-bold text-gray-800">
                        {item.userId?.fullName || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">{item.userId?.email}</div>
                    </td>
                    <td className="py-5">
                      <div className="text-lg font-black text-blue-600">
                        {Number(item.amount).toLocaleString()}đ
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-black tracking-wider text-amber-600 uppercase">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-5 text-xs font-medium text-gray-500">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Nút Từ chối */}
                        <button
                          onClick={() => handleReject(item._id)}
                          className="rounded-xl border border-transparent p-2 text-red-400 shadow-sm transition-all hover:border-red-600 hover:bg-red-500 hover:text-white"
                          title="Từ chối/Xóa lệnh lỗi"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>

                        {/* Nút Duyệt */}
                        <button
                          onClick={() => handleApprove(item._id)}
                          className="rounded-xl bg-green-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95"
                        >
                          Duyệt ngay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDeposit;
