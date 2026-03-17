import React, { useEffect, useState } from 'react';
import API from '../../api';
import { Link } from 'react-router-dom';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBids = async () => {
      try {
        const res = await API.get('/products/my-bids');
        setBids(res.data.data);
      } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyBids();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      LEADING: 'bg-green-100 text-green-700',
      OUTBID: 'bg-orange-100 text-orange-700',
      WON: 'bg-blue-600 text-white',
      LOST: 'bg-gray-400 text-white',
    };
    return (
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>
    );
  };

  if (loading) return <div className="p-10 text-center">Đang tải lịch sử...</div>;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Lịch sử đấu giá của tôi</h1>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Giá hiện tại</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((product) => (
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td className="flex items-center gap-3 p-4">
                  <img src={product.imageUrl} className="h-12 w-12 rounded object-cover" alt="" />
                  <span className="font-medium">{product.title}</span>
                </td>
                <td className="p-4 font-bold text-red-600">
                  {product.currentPrice.toLocaleString()}đ
                </td>
                <td className="p-4">{getStatusBadge(product.userStatus)}</td>
                <td className="p-4">
                  <Link to={`/product/${product._id}`} className="text-blue-500 hover:underline">
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bids.length === 0 && (
          <p className="p-10 text-center text-gray-500">Bạn chưa tham gia đấu giá sản phẩm nào.</p>
        )}
      </div>
    </div>
  );
};

export default MyBids;
