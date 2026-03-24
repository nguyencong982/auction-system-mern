import { useEffect, useState, useRef } from 'react';
import API from '../api';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import UserNavIcon from '../components/UserNavIcon';
import CountdownTimer from '../components/CountdownTimer';
import socket from '../socket';

const BASE_URL = 'http://localhost:5000/uploads';

const Home = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- STATE CHO LỌC VÀ TÌM KIẾM ---
  const [filters, setFilters] = useState({
    search: '',
    category: 'Tất cả',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });

  const navigate = useNavigate();

  const getFullImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300'; // Ảnh mặc định nếu lỗi

    // Nếu path đã là một link hoàn chỉnh (bắt đầu bằng http từ Cloudinary)
    if (path.startsWith('http')) return path;

    // Trường hợp dự phòng nếu bạn vẫn còn ảnh cũ ở local (chỉ dùng khi dev)
    const isDev = import.meta.env.MODE === 'development';
    const BACKEND_URL = isDev
      ? 'http://localhost:5000'
      : 'https://auction-system-mern-xeyx.onrender.com';

    return `${BACKEND_URL}/uploads/${path}`;
  };

  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 100,
    y: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- FETCH DATA ---
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
    // 2. Tham gia room cá nhân khi có user
    if (user?._id) {
      socket.emit('join', user._id);
    }

    // 3. Định nghĩa các hàm callback để dễ dàng gỡ bỏ (cleanup)
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

    // 4. Đăng ký sự kiện
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

    // 5. Cleanup: Gỡ bỏ listener khi component unmount hoặc dependency thay đổi
    return () => {
      socket.off('newProduct', handleNewProduct);
      socket.off('priceUpdate', handlePriceUpdate);
      socket.off('auctionEnded');
      socket.off('newNotification');
      socket.off('depositSuccess');
      // Lưu ý: KHÔNG ngắt kết nối socket.disconnect() ở đây nếu bạn muốn giữ kết nối xuyên suốt ứng dụng
    };
  }, [user?._id, filters.category]); // Lắng nghe lại khi user hoặc category thay đổi logic lọc

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gray-50">
      <ToastContainer />

      {/* VÍ BAY (FLOATING WALLET) */}
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="fixed transition-shadow select-none hover:shadow-2xl"
      >
        <div className="transform rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <span className="text-[10px] font-semibold tracking-wider text-blue-100 uppercase">
            Số dư ví (Kéo tôi!)
          </span>
          <p className="mt-1 text-xl font-bold text-white">
            {Number(user?.balance || 0).toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} sticky top-0 flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-6">
          {isSidebarOpen && (
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

        <nav className="mt-4 space-y-2 px-4">
          <MenuLink icon="🏠" label="Trang chủ" active href="/" isOpen={isSidebarOpen} />
          <MenuLink icon="💰" label="Nạp tiền ví" href="/deposit" isOpen={isSidebarOpen} />
          {/* Rút tiền cho User */}
          <MenuLink icon="💸" label="Rút tiền về NH" href="/withdraw" isOpen={isSidebarOpen} />

          {user?.role === 'admin' && (
            <>
              <MenuLink
                icon="🛠️"
                label="Duyệt nạp tiền"
                href="/admin/deposit"
                isOpen={isSidebarOpen}
              />
              {/* Duyệt rút tiền chỉ Admin thấy */}
              <MenuLink
                icon="🏦"
                label="Duyệt rút tiền"
                href="/admin/withdrawal"
                isOpen={isSidebarOpen}
              />
            </>
          )}

          <MenuLink icon="👤" label="Hồ sơ của tôi" href="/profile" isOpen={isSidebarOpen} />
          <MenuLink icon="📦" label="Kho hàng" href="/manage-products" isOpen={isSidebarOpen} />
          <MenuLink
            icon="🔔"
            label="Thông báo"
            href="/notifications"
            isOpen={isSidebarOpen}
            badge={unreadCount}
          />
        </nav>

        {isSidebarOpen && myBids.length > 0 && (
          <div className="mt-6 flex flex-1 flex-col overflow-hidden border-t border-gray-50 px-4 pt-6">
            <div className="mb-4 flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Đấu giá của bạn
              </h3>
              <Link to="/my-bids" className="text-[10px] font-bold text-blue-600 hover:underline">
                Tất cả
              </Link>
            </div>
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
              {myBids.map((bid) => (
                <Link
                  key={bid._id}
                  to={`/product/${bid._id}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-50 bg-white p-2 shadow-sm transition-all hover:border-blue-200"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={bid.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-gray-800">{bid.title}</p>
                    <p className="text-[10px] font-black text-red-500">
                      {Number(bid.currentPrice).toLocaleString()}đ
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${bid.userStatus === 'LEADING' ? 'bg-green-500' : 'animate-pulse bg-orange-500'}`}
                  ></div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 p-4">
          <Link
            to="/create-product"
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-blue-600 bg-white p-3 font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white"
          >
            <span>➕</span> {isSidebarOpen && 'Đăng bán mới'}
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 font-medium text-red-500 transition-all hover:bg-red-50"
          >
            <span>🚪</span> {isSidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="h-screen flex-1 overflow-y-auto p-8">
        <header className="mb-6 flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              Chào mừng, {user?.fullName || 'bạn'}! 👋
            </h1>
            <p className="text-sm text-gray-500">Khám phá các sản phẩm hot hôm nay.</p>
          </div>
          <UserNavIcon user={user} />
        </header>

        {/* --- TOOLBAR: SEARCH & FILTERS --- */}
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:grid-cols-4">
          <div className="relative lg:col-span-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm tên sản phẩm..."
              className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pr-4 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="lg:col-span-1">
            <select
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          <div className="flex items-center gap-2 lg:col-span-1">
            <input
              type="number"
              placeholder="Giá từ"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
            <span className="text-gray-300">-</span>
            <input
              type="number"
              placeholder="Đến"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>

          <div className="lg:col-span-1">
            <select
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="newest">🆕 Mới đăng nhất</option>
              <option value="price_asc">📈 Giá tăng dần</option>
              <option value="price_desc">📉 Giá giảm dần</option>
              <option value="ending_soon">⏳ Sắp kết thúc</option>
            </select>
          </div>
        </div>

        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
          <span className="h-6 w-2 rounded-full bg-blue-600"></span>
          {filters.category !== 'Tất cả'
            ? `Sản phẩm: ${filters.category}`
            : 'Sàn đấu giá trực tuyến'}
        </h2>

        {/* Lưới sản phẩm */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => (
            <div
              key={product._id}
              className="group relative rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl"
            >
              {product.status === 'active' && (
                <div className="absolute top-8 left-8 z-10">
                  <div className="rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md">
                    <CountdownTimer endTime={product.endTime} />
                  </div>
                </div>
              )}

              <div className="relative mb-4 h-48 overflow-hidden rounded-2xl bg-gray-100">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={product.title}
                />
                <div
                  className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm ${product.status === 'active' ? 'bg-white/90 text-blue-600' : 'bg-red-500 text-white'}`}
                >
                  {product.status === 'active' ? '🔥 ĐANG DIỄN RA' : '🔒 ĐÃ KẾT THÚC'}
                </div>
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-sm">
                  {product.category || 'Khác'}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-blue-50">
                  {product.owner?.avatar ? (
                    <img
                      src={getFullImageUrl(product.owner.avatar)}
                      alt={product.owner.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-blue-400">
                      {product.owner?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <Link
                  to={`/profile/${product.owner?._id}`}
                  className="text-xs font-semibold text-gray-500 transition-colors hover:text-blue-600"
                >
                  {product.owner?.fullName || 'Người dùng'}
                </Link>
              </div>

              <h3 className="mb-2 truncate font-bold text-gray-800" title={product.title}>
                {product.title}
              </h3>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Giá hiện tại</p>
                  <p className="text-xl font-black text-blue-600">
                    {Number(product.currentPrice || 0).toLocaleString()}đ
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/product/${product._id}`)}
                  className={`transform rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${product.status === 'active' ? 'bg-gray-900 hover:bg-black' : 'cursor-not-allowed bg-gray-400'}`}
                  disabled={product.status !== 'active'}
                >
                  {product.status === 'active' ? 'Đấu giá ngay' : 'Hết hạn'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <span className="mb-4 text-4xl">🔍</span>
            <p className="font-medium text-gray-400">
              Không tìm thấy sản phẩm nào khớp với bộ lọc.
            </p>
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
              Đặt lại bộ lọc
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
    {isOpen && <span className="whitespace-nowrap">{label}</span>}
  </Link>
);

export default Home;
