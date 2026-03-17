import { useEffect, useState } from 'react';
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';

const SoldProducts = () => {
  const [soldItems, setSoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState(null);

  const fetchSoldItems = async () => {
    try {
      const res = await API.get('/products/my-sold-items');
      if (res.data.success) {
        setSoldItems(res.data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng đã bán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldItems();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Đang tải dữ liệu đơn hàng...</div>;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <ToastContainer />
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-full p-2 hover:bg-gray-100"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-black">Sản phẩm đã bán thành công</h1>
      </div>

      <div className="grid gap-6">
        {soldItems.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
            <p className="font-medium text-gray-500">
              Bạn chưa có sản phẩm nào được bán thành công.
            </p>
          </div>
        ) : (
          soldItems.map((item) => (
            <div
              key={item._id}
              className="flex flex-col items-center gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row"
            >
              <img src={item.imageUrl} className="h-24 w-24 rounded-2xl object-cover" alt="" />

              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                <div className="mt-1 flex gap-4">
                  <p className="text-lg font-black text-green-600">
                    Giá chốt: {item.currentPrice.toLocaleString()}đ
                  </p>
                  <p className="self-center text-sm text-gray-400">
                    | Kết thúc: {new Date(item.endTime).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={item.currentWinner?.avatar || 'https://via.placeholder.com/150'}
                    className="h-6 w-6 rounded-full"
                    alt=""
                  />
                  <p className="text-sm font-bold text-gray-700">
                    Người mua: {item.currentWinner?.fullName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWinner(item.currentWinner)}
                className="w-full rounded-2xl bg-black px-6 py-3 font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-gray-800 md:w-auto"
              >
                Thông tin giao hàng
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL THÔNG TIN CHI TIẾT NGƯỜI THẮNG */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl duration-300">
            <h2 className="mb-6 text-center text-2xl font-black">Địa chỉ giao hàng</h2>

            <div className="space-y-6">
              <div className="mb-4 flex flex-col items-center gap-2">
                <img
                  src={selectedWinner.avatar}
                  className="h-20 w-20 rounded-full border-4 border-blue-50"
                  alt=""
                />
                <p className="text-xl font-black text-gray-800">{selectedWinner.fullName}</p>
              </div>

              <div className="space-y-4 rounded-3xl bg-gray-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">📞</span>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Số điện thoại</p>
                    <p className="font-bold text-gray-800">
                      {selectedWinner.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">📍</span>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">
                      Địa chỉ nhận hàng
                    </p>
                    <p className="leading-relaxed font-bold text-gray-800">
                      {selectedWinner.address || 'Người mua chưa cung cấp địa chỉ'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">✉️</span>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Email liên hệ</p>
                    <p className="font-bold text-gray-800">{selectedWinner.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedWinner(null)}
              className="mt-8 w-full rounded-3xl bg-gray-100 py-4 font-bold text-gray-800 transition-all hover:bg-gray-200"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoldProducts;
