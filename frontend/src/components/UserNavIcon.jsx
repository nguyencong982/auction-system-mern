import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

const BASE_URL = 'http://localhost:5000/uploads';
const FALLBACK_AVATAR = 'https://ui-avatars.com/api/?background=random&color=fff&name=User';

const UserNavIcon = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // 1. Kiểm tra xem người dùng có sản phẩm nào không để hiện menu bán hàng
  useEffect(() => {
    const checkSellerStatus = async () => {
      if (user) {
        try {
          const res = await API.get('/products/check-has-products');
          if (res.data.success) {
            setHasProducts(res.data.hasProducts);
          }
        } catch (error) {
          console.error('Lỗi kiểm tra trạng thái người bán:', error);
        }
      }
    };
    checkSellerStatus();
  }, [user]);

  // 2. Xử lý đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFullImageUrl = (path) => {
    if (!path) return FALLBACK_AVATAR;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}?t=${new Date().getTime()}`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Nút Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition-transform focus:outline-none active:scale-90"
        title="Tài khoản của bạn"
      >
        <div
          className={`h-10 w-10 overflow-hidden rounded-full border-2 shadow-sm transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-400'}`}
        >
          <img
            src={getFullImageUrl(user.avatar)}
            alt={user.fullName}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_AVATAR;
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-[100] mt-3 w-64 rounded-3xl border border-gray-100 bg-white py-3 shadow-2xl duration-200">
          <div className="mb-2 border-b border-gray-50 px-4 py-2">
            <p className="text-xs font-black text-gray-400 uppercase">Tài khoản</p>
            <p className="truncate font-bold text-gray-800">{user.fullName}</p>
          </div>

          <Link
            to={`/profile/${user._id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <span className="text-xl">👤</span>
            <span className="font-medium">Trang cá nhân</span>
          </Link>

          <Link
            to="/my-bids"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <span className="text-xl">🔨</span>
            <span className="font-medium">Lịch sử đấu giá</span>
          </Link>

          {/* CHỈ HIỂN THỊ NẾU ĐÃ TỪNG ĐĂNG SẢN PHẨM */}
          {hasProducts && (
            <>
              <div className="mx-4 my-1 h-[1px] bg-gray-50"></div>
              <div className="px-4 py-2">
                <p className="text-[10px] font-black text-blue-500 uppercase">Dành cho người bán</p>
              </div>

              <Link
                to="/manage-products"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span className="text-xl">📦</span>
                <span className="font-medium">Quản lý kho hàng</span>
              </Link>

              <Link
                to="/sold-products"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-blue-700 transition-colors hover:bg-blue-50"
              >
                <span className="text-xl">💰</span>
                <span className="font-bold font-medium">Đơn hàng đã bán</span>
              </Link>
            </>
          )}

          <div className="mx-4 my-1 h-[1px] bg-gray-50"></div>

          <button
            onClick={() => {
              // Thêm logic Logout của bạn ở đây
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserNavIcon;
