import React, { useEffect, useState } from 'react';
import { getPendingProducts, approveProduct } from '../../api';
import { toast } from 'react-toastify';

const AdminApproveProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await getPendingProducts();
      setProducts(res.data.products);
    } catch (error) {
      toast.error('Không thể tải danh sách chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAction = async (id, status) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${status === 'active' ? 'duyệt' : 'từ chối'} sản phẩm này?`
      )
    )
      return;

    try {
      await approveProduct(id, status);
      toast.success(status === 'active' ? 'Đã duyệt sản phẩm!' : 'đã từ chối sản phẩm!');
      // Cập nhật lại danh sách tại chỗ
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">Phê duyệt sản phẩm ({products.length})</h2>

      {products.length === 0 ? (
        <div className="rounded bg-gray-100 p-10 text-center">
          Không có sản phẩm nào đang chờ duyệt.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex items-center rounded-lg border bg-white p-4 shadow-sm"
            >
              <img
                src={product.image}
                alt={product.title}
                className="mr-4 h-24 w-24 rounded object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold">{product.title}</h3>
                <p className="line-clamp-1 text-sm text-gray-600">{product.description}</p>
                <p className="mt-1 font-semibold text-blue-600">
                  Giá khởi điểm: {product.initialPrice?.toLocaleString()} VNĐ
                </p>
                <span className="text-xs text-gray-400">Người đăng: {product.owner?.fullName}</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleAction(product._id, 'active')}
                  className="rounded bg-green-500 px-4 py-2 text-sm text-white transition hover:bg-green-600"
                >
                  Duyệt đăng
                </button>
                <button
                  onClick={() => handleAction(product._id, 'rejected')}
                  className="rounded bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
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
