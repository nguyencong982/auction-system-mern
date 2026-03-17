import { useEffect, useState } from 'react';
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State để quản lý việc hiển thị thông tin người thắng
  const [selectedWinner, setSelectedWinner] = useState(null);
  const fetchMyProducts = async () => {
    try {
      const res = await API.get('/products/my-products');
      setProducts(res.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Đã xóa sản phẩm thành công!');
      fetchMyProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Đang tải kho hàng...</div>;

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
        <h1 className="text-2xl font-black">Quản lý kho hàng</h1>
      </div>

      <div className="grid gap-6">
        {products.length === 0 ? (
          <p className="py-10 text-center text-gray-500">Bạn chưa đăng sản phẩm nào.</p>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:flex-row"
            >
              <img
                src={p.imageUrl}
                className="h-40 w-full rounded-2xl object-cover md:w-40"
                alt=""
              />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{p.title}</h3>
                    <p className="text-lg font-bold text-blue-600">
                      {p.status === 'ended' ? 'Giá chốt: ' : 'Giá hiện tại: '}
                      {p.currentPrice.toLocaleString()}đ
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${p.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                  >
                    {p.status === 'active' ? '● Đang đấu giá' : '● Đã kết thúc'}
                  </span>
                </div>

                {/* LỊCH SỬ ĐẤU GIÁ HOẶC THÔNG TIN NGƯỜI THẮNG TÓM TẮT */}
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  {p.status === 'ended' && p.currentWinner ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">
                            Người thắng cuộc
                          </p>
                          <p className="font-bold text-gray-800">{p.currentWinner.fullName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 italic">Đã thanh toán qua ví</p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-[10px] font-black text-gray-400 uppercase">
                        Lịch sử đấu giá gần nhất
                      </p>
                      {p.bidHistory && p.bidHistory.length > 0 ? (
                        <div className="space-y-2">
                          {p.bidHistory
                            .slice(-2)
                            .reverse()
                            .map((bid, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">👤 {bid.bidderName}</span>
                                <span className="font-bold text-gray-800">
                                  {bid.amount.toLocaleString()}đ
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Chưa có ai đấu giá</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-2 md:flex-col">
                {/* NÚT XEM THÔNG TIN GIAO HÀNG (CHỈ HIỆN KHI CÓ NGƯỜI THẮNG) */}
                {p.status === 'ended' && p.currentWinner ? (
                  <button
                    onClick={() => setSelectedWinner(p.currentWinner)}
                    className="rounded-xl bg-black px-6 py-2 font-bold text-white shadow-lg shadow-gray-100 transition-all hover:bg-gray-800"
                  >
                    Giao hàng ngay
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => (window.location.href = `/edit-product/${p._id}`)}
                      className="rounded-xl bg-blue-50 px-6 py-2 font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="rounded-xl bg-red-50 px-6 py-2 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CHI TIẾT GIAO HÀNG */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="animate-in zoom-in w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl duration-200">
            <h2 className="mb-6 text-center text-2xl font-black text-gray-800">
              Thông tin khách hàng
            </h2>

            <div className="space-y-4 rounded-3xl bg-gray-50 p-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Họ và tên</p>
                <p className="text-lg font-bold text-gray-800">{selectedWinner.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Số điện thoại</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedWinner.phone || 'Chưa cập nhật'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Địa chỉ nhận hàng</p>
                <p className="leading-relaxed font-bold text-gray-700">
                  {selectedWinner.address || 'Người mua chưa cung cấp địa chỉ'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                <p className="font-medium text-gray-600">{selectedWinner.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedWinner(null)}
              className="mt-6 w-full rounded-2xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
