import React, { useEffect, useState } from 'react';
import { getPendingProducts, approveProduct } from '../../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // 1. Import Link

const AdminApproveProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getPendingProducts();
      const incomingData = res.data?.products || res.data?.data || res.data;

      if (Array.isArray(incomingData)) {
        setProducts(incomingData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      toast.error('Không thể tải danh sách chờ duyệt');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAction = async (id, status) => {
    const actionText = status === 'active' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} sản phẩm này?`)) return;

    try {
      await approveProduct(id, status);
      toast.success(status === 'active' ? 'Đã duyệt sản phẩm thành công!' : 'Đã từ chối sản phẩm!');
      setProducts((prevProducts) => prevProducts.filter((p) => p._id !== id));
    } catch (error) {
      toast.error('Thao tác thất bại. Vui lòng thử lại.');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const BACKEND_URL =
      import.meta.env.MODE === 'development'
        ? 'http://localhost:5000'
        : 'https://auction-system-mern-xeyx.onrender.com';
    return `${BACKEND_URL}/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 font-medium text-gray-600">Đang tải danh sách chờ duyệt...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* 2. Nút quay về Home */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
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
          Quay lại trang chủ
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Phê duyệt sản phẩm
          <span className="ml-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600">
            {products?.length || 0}
          </span>
        </h2>
        <button
          onClick={loadProducts}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Làm mới <span>🔄</span>
        </button>
      </div>

      {!products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 shadow-sm">
          <span className="mb-4 text-5xl">📦</span>
          <p className="text-lg font-medium text-gray-500">
            Hiện không có sản phẩm nào đang chờ duyệt.
          </p>
          <Link to="/" className="mt-4 text-blue-600 hover:underline">
            Về trang chủ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="group flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
            >
              <div className="relative mb-4 h-32 w-full flex-shrink-0 overflow-hidden rounded-xl md:mb-0 md:h-28 md:w-28">
                <img
                  src={getImageUrl(product.imageUrl || product.image)}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <div className="flex-1 md:ml-6">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                    Chờ duyệt
                  </span>
                  <span className="text-xs text-gray-400">ID: {product._id.slice(-6)}</span>
                </div>
                <h3 className="line-clamp-1 text-lg font-bold text-gray-800">{product.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="font-bold text-blue-600">
                    Khởi điểm: {Number(product.initialPrice || 0).toLocaleString()}đ
                  </p>
                  <p className="text-sm text-gray-600">
                    👤{' '}
                    <span className="font-medium text-gray-800">
                      {product.owner?.fullName || 'Ẩn danh'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex w-full gap-3 border-t border-gray-50 pt-4 md:mt-0 md:w-auto md:flex-col md:border-0 md:pt-0 md:pl-6">
                <button
                  onClick={() => handleAction(product._id, 'active')}
                  className="flex-1 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 md:w-32"
                >
                  Duyệt đăng
                </button>
                <button
                  onClick={() => handleAction(product._id, 'rejected')}
                  className="flex-1 rounded-xl border border-red-100 bg-white px-6 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95 md:w-32"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApproveProduct;
