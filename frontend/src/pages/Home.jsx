import { useEffect, useState, useRef } from 'react';
import API from '../api';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import UserNavIcon from '../components/UserNavIcon';
import CountdownTimer from '../components/CountdownTimer';
import socket from '../socket';

const Home = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  // Mặc định đóng sidebar trên mobile, mở trên desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const [filters, setFilters] = useState({
    search: '',
    category: 'Tất cả',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });

  const navigate = useNavigate();

  const getFullImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300';
    if (path.startsWith('http')) return path;
    const isDev = import.meta.env.MODE === 'development';
    const BACKEND_URL = isDev
      ? 'http://localhost:5000'
      : 'https://auction-system-mern-xeyx.onrender.com';
    return `${BACKEND_URL}/uploads/${path}`;
  };

  const [position, setPosition] = useState({
    x: window.innerWidth > 768 ? window.innerWidth / 2 - 100 : 20,
    y: window.innerWidth > 768 ? 100 : 80,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    offset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition({
        x: clientX - offset.current.x,
        y: clientY - offset.current.y,
      });
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'Tất cả') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);

      const [profileRes, productsRes, bidsRes, notifyRes] = await Promise.all([
        API.get('/auth/profile'),
        API.get(`/products?${params.toString()}`),
        API.get('/products/my-bids'),
        API.get('/notifications/unread-count'),
      ]);

      setUser(profileRes.data.data);
      setProducts(productsRes.data.data || []);
      if (bidsRes.data.success) {
        setMyBids(bidsRes.data.data.slice(0, 5));
      }
      setUnreadCount(notifyRes.data.count || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  useEffect(() => {
    if (user?._id) {
      socket.emit('join', user._id);
    }

    const handleNewProduct = (newProduct) => {
      setProducts((prev) => {
        const isMatch = filters.category === 'Tất cả' || newProduct.category === filters.category;
        if (isMatch && !prev.find((p) => p._id === newProduct._id)) {
          return [newProduct, ...prev];
        }
        return prev;
      });
      toast.info(`🔔 Sản phẩm mới: ${newProduct.title}`, { position: 'bottom-right' });
    };

    const handlePriceUpdate = (updatedProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p))
      );
      setMyBids((prev) =>
        prev.map((b) =>
          b._id === updatedProduct._id
            ? {
                ...b,
                currentPrice: updatedProduct.currentPrice,
                userStatus: updatedProduct.currentWinner?._id === user?._id ? 'LEADING' : 'OUTBID',
              }
            : b
        )
      );
    };

    socket.on('newProduct', handleNewProduct);
    socket.on('priceUpdate', handlePriceUpdate);
    socket.on('auctionEnded', (data) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === data.productId ? { ...p, status: 'ended' } : p))
      );
      toast.warn(`⌛ Phiên "${data.title}" đã kết thúc!`);
    });
    socket.on('newNotification', () => setUnreadCount((prev) => prev + 1));
    socket.on('depositSuccess', (data) => {
      setUser((prev) => (prev ? { ...prev, balance: data.newBalance } : prev));
      toast.success(data.message, { icon: '💰' });
    });

    return () => {
      socket.off('newProduct', handleNewProduct);
      socket.off('priceUpdate', handlePriceUpdate);
      socket.off('auctionEnded');
      socket.off('newNotification');
      socket.off('depositSuccess');
    };
  }, [user?._id, filters.category]);

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 md:flex-row">
      <ToastContainer />

      {/* VÍ BAY (FLOATING WALLET) */}
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="fixed transition-shadow select-none hover:shadow-2xl"
      >
        <div className="relative transform rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-center shadow-lg transition-all duration-300 hover:scale-105 md:px-6 md:py-3">
          {/* Nút cài đặt PIN nhỏ ở góc ví */}
          <button
            onMouseDown={(e) => e.stopPropagation()} // Ngăn chặn kéo ví khi bấm nút
            onClick={() => navigate('/settings/payment-pin')}
            className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-blue-600 shadow-md transition-colors hover:bg-blue-50"
            title="Thiết lập mã PIN"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <span className="text-[8px] font-semibold tracking-wider text-blue-100 uppercase md:text-[10px]">
            Ví (Kéo!)
          </span>
          <p className="text-sm font-bold text-white md:text-xl">
            {Number(user?.balance || 0).toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* --- SIDEBAR --- */}
      {/* Overlay cho mobile khi mở sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[40] bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0'
        } fixed top-0 z-[50] flex h-screen flex-col border-r border-gray-100 bg-white shadow-xl transition-all duration-300 md:sticky md:shadow-none`}
      >
        <div className="flex items-center justify-between p-6">
          {(isSidebarOpen || window.innerWidth > 768) && (
            <span className="text-xl font-black text-blue-600 italic">AUCTION.</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 text-gray-400 hover:bg-blue-50"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <nav className="custom-scrollbar mt-4 flex-1 space-y-2 overflow-y-auto px-4">
          <MenuLink icon="🏠" label="Trang chủ" active href="/" isOpen={isSidebarOpen} />
          <MenuLink icon="💰" label="Nạp tiền" href="/deposit" isOpen={isSidebarOpen} />
          <MenuLink icon="💸" label="Rút tiền" href="/withdraw" isOpen={isSidebarOpen} />
          {user?.role === 'admin' && (
            <>
              <MenuLink icon="🛠️" label="Duyệt nạp" href="/admin/deposit" isOpen={isSidebarOpen} />
              <MenuLink
                icon="🏦"
                label="Duyệt rút"
                href="/admin/withdrawal"
                isOpen={isSidebarOpen}
              />
            </>
          )}
          <MenuLink icon="👤" label="Hồ sơ" href="/profile" isOpen={isSidebarOpen} />
          <MenuLink icon="📦" label="Kho hàng" href="/manage-products" isOpen={isSidebarOpen} />
          <MenuLink
            icon="🔔"
            label="Thông báo"
            href="/notifications"
            isOpen={isSidebarOpen}
            badge={unreadCount}
          />

          {isSidebarOpen && myBids.length > 0 && (
            <div className="mt-6 border-t border-gray-50 pt-6">
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase">Đấu giá của bạn</h3>
                <Link to="/my-bids" className="text-[10px] font-bold text-blue-600 hover:underline">
                  Tất cả
                </Link>
              </div>
              <div className="space-y-3">
                {myBids.map((bid) => (
                  <Link
                    key={bid._id}
                    to={`/product/${bid._id}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-50 bg-white p-2 shadow-sm"
                  >
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                      <img src={bid.imageUrl} className="h-full w-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-gray-800">{bid.title}</p>
                      <p className="text-[9px] font-black text-red-500">
                        {Number(bid.currentPrice).toLocaleString()}đ
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <Link
            to="/create-product"
            className="mb-2 flex w-full items-center justify-center gap-3 rounded-xl border border-blue-600 bg-white p-3 font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white md:justify-start"
          >
            <span>➕</span> {isSidebarOpen && 'Đăng bán mới'}
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl p-3 font-medium text-red-500 hover:bg-red-50 md:justify-start"
          >
            <span>🚪</span> {isSidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="h-screen flex-1 overflow-y-auto p-4 md:p-8">
        {/* Nút mở sidebar cho mobile */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="mb-4 rounded-lg bg-white p-2 text-blue-600 shadow-sm md:hidden"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <header className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:rounded-3xl md:p-6">
          <div className="text-center md:text-left">
            <h1 className="text-xl font-bold text-gray-800 md:text-2xl">
              Chào, {user?.fullName || 'bạn'}! 👋
            </h1>
            <p className="text-xs text-gray-500 md:text-sm">Khám phá các sản phẩm hot hôm nay.</p>
          </div>
          <UserNavIcon user={user} />
        </header>

        {/* --- TOOLBAR: SEARCH & FILTERS --- */}
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 md:rounded-3xl md:p-6 lg:grid-cols-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="Tất cả">📁 Tất cả danh mục</option>
            <option value="Công nghệ">📱 Công nghệ</option>
            <option value="Thời trang">👕 Thời trang</option>
            <option value="Đồ cổ">🏺 Đồ cổ</option>
            <option value="Gia dụng">🏠 Gia dụng</option>
            <option value="Khác">📦 Khác</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Giá từ"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
            <input
              type="number"
              placeholder="Đến"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>

          <select
            className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">🆕 Mới nhất</option>
            <option value="price_asc">📈 Giá tăng dần</option>
            <option value="price_desc">📉 Giá giảm dần</option>
            <option value="ending_soon">⏳ Sắp kết thúc</option>
          </select>
        </div>

        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold md:text-xl">
          <span className="h-6 w-2 rounded-full bg-blue-600"></span>
          {filters.category !== 'Tất cả'
            ? `Sản phẩm: ${filters.category}`
            : 'Sàn đấu giá trực tuyến'}
        </h2>

        {/* Lưới sản phẩm - Tự động nhảy cột */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {products?.map((product) => (
            <div
              key={product._id}
              className="group relative rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl md:p-5"
            >
              {product.status === 'active' && (
                <div className="absolute top-6 left-6 z-10 origin-top-left scale-90 md:scale-100">
                  <div className="rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md">
                    <CountdownTimer endTime={product.endTime} />
                  </div>
                </div>
              )}

              <div className="relative mb-4 h-40 overflow-hidden rounded-2xl bg-gray-100 md:h-48">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={product.title}
                />
                <div
                  className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[9px] font-bold shadow-sm backdrop-blur-sm ${product.status === 'active' ? 'bg-white/90 text-blue-600' : 'bg-red-500 text-white'}`}
                >
                  {product.status === 'active' ? '🔥 LIVE' : '🔒 END'}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <div className="h-6 w-6 overflow-hidden rounded-full bg-blue-50">
                  {product.owner?.avatar ? (
                    <img
                      src={getFullImageUrl(product.owner.avatar)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-blue-400">
                      U
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-gray-500">
                  {product.owner?.fullName || 'User'}
                </span>
              </div>

              <h3 className="mb-2 truncate text-sm font-bold text-gray-800 md:text-base">
                {product.title}
              </h3>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Giá</p>
                  <p className="text-lg font-black text-blue-600 md:text-xl">
                    {Number(product.currentPrice || 0).toLocaleString()}đ
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/product/${product._id}`)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-all md:text-sm ${product.status === 'active' ? 'bg-gray-900 hover:bg-black' : 'bg-gray-400'}`}
                  disabled={product.status !== 'active'}
                >
                  {product.status === 'active' ? 'Đấu giá' : 'Hết hạn'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <span className="mb-4 text-4xl">🔍</span>
            <p className="font-medium text-gray-400">Không tìm thấy sản phẩm nào.</p>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  category: 'Tất cả',
                  minPrice: '',
                  maxPrice: '',
                  sort: 'newest',
                })
              }
              className="mt-4 font-bold text-blue-600 hover:underline"
            >
              Đặt lại
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const MenuLink = ({ icon, label, href, active, isOpen, badge }) => (
  <Link
    to={href}
    className={`relative flex items-center gap-4 rounded-xl p-3 transition-all ${active ? 'bg-blue-50 font-bold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
  >
    <div className="relative inline-flex items-center justify-center">
      <span className="text-xl">{icon}</span>
      {badge > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 animate-bounce items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    {isOpen && <span className="text-sm whitespace-nowrap">{label}</span>}
  </Link>
);

export default Home;
