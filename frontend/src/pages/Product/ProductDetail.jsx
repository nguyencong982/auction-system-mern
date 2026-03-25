import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import CountdownTimer from '../../components/CountdownTimer';

const BASE_URL = '';

const STICKERS = [
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b8/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b0/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b3/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a5/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f514/512.gif',
];

const EMOJIS = ['🔥', '💎', '🤝', '💰', '🚀', '⭐', '⚡', '😎'];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${id}`);
      setProduct(res.data.data);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await API.get(`/products/${id}/chat`);
      if (res.data.success) setMessages(res.data.data);
    } catch (error) {
      console.error('Lỗi tải lịch sử chat:', error);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchProduct();
    fetchChatHistory();
    const newSocket = io('https://auction-system-mern-xeyx.onrender.com', {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);
    newSocket.emit('joinChat', id);

    newSocket.on('bidUpdated', (data) => {
      if (data.productId === id) {
        fetchProduct();
        const displayPrice = Number(data.newPrice || 0).toLocaleString();
        toast.info(`🔥 Mức giá mới: ${displayPrice}đ bởi ${data.winnerName || 'ai đó'}`);
      }
    });

    newSocket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('auctionEnded', (data) => {
      if (data.productId === id) {
        setProduct((prev) => ({ ...prev, status: 'ended' }));
        toast.warn('⌛ Phiên đấu giá này đã kết thúc!', {
          position: 'top-center',
          autoClose: false,
          icon: '🔒',
        });
      }
    });

    return () => newSocket.disconnect();
  }, [id]);

  const handleSendChat = (content = null) => {
    const finalContent = typeof content === 'string' ? content : inputMessage;
    if (!finalContent.trim() || !socket) return;

    socket.emit('sendMessage', {
      productId: id,
      senderId: currentUser?._id || currentUser?.id,
      content: finalContent,
    });

    setInputMessage('');
    setShowPicker(false);
  };

  const handleBid = async () => {
    if (product?.status !== 'active') {
      return toast.error('Phiên đấu giá đã kết thúc, không thể đặt giá!');
    }

    try {
      const amount = Number(bidAmount);
      const minRequired = (Number(product.currentPrice) || 0) + (Number(product.stepPrice) || 0);

      if (!amount || amount < minRequired) {
        return toast.warning(`Giá đặt phải tối thiểu là ${minRequired.toLocaleString()}đ`);
      }

      const res = await API.post('/products/bid', {
        productId: id,
        bidAmount: amount,
      });

      if (res.data.success) {
        toast.success('Đặt giá thành công!');
        setBidAmount('');
        fetchProduct();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đặt giá');
    }
  };

  if (loading)
    return (
      <div className="flex h-screen animate-pulse items-center justify-center font-black text-blue-600">
        ĐANG TẢI DỮ LIỆU...
      </div>
    );

  if (!product) return <div className="p-20 text-center font-bold">Không tìm thấy sản phẩm.</div>;

  const currentUserId = currentUser?._id || currentUser?.id;
  const ownerId = product.owner?._id || product.owner;
  const isOwner = currentUserId?.toString() === ownerId?.toString();
  const isEnded = product.status !== 'active';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <style>{`
        @keyframes bounce-sticker {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-sticker {
          animation: bounce-sticker 1s infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      <ToastContainer />

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-full lg:w-64' : 'w-0 lg:w-24'} sticky top-0 z-[100] flex flex-col overflow-hidden border-r border-gray-100 bg-white transition-all duration-300 lg:h-screen lg:overflow-visible`}
      >
        <div className="flex items-center justify-between p-6 lg:p-8">
          {(isSidebarOpen || window.innerWidth > 1024) && (
            <span className="text-2xl font-black tracking-tighter text-blue-600">BID.</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 lg:block"
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
        {(isSidebarOpen || window.innerWidth > 1024) && (
          <nav className="flex-1 px-4 lg:px-6">
            <button
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-4 rounded-2xl p-4 font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
            >
              <span className="text-xl">🏠</span>
              {(isSidebarOpen || window.innerWidth > 1024) && 'Trang chủ'}
            </button>
          </nav>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 font-bold text-gray-400 transition-all hover:text-blue-600"
        >
          ← Quay lại
        </button>

        {/* Product Hero Section */}
        <div className="mx-auto mb-8 flex max-w-6xl flex-col overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm md:rounded-[50px] lg:mb-12 lg:flex-row">
          <div className="relative h-[300px] bg-gray-100 md:h-[500px] lg:h-[600px] lg:w-1/2">
            <img
              src={product.image || product.imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2 md:top-6 md:left-6">
              <span
                className={`rounded-2xl px-3 py-1.5 text-[9px] font-black uppercase shadow-sm backdrop-blur-md md:px-4 md:py-2 md:text-[10px] ${isEnded ? 'bg-red-500 text-white' : 'bg-white/90 text-black'}`}
              >
                {isEnded ? '🔴 Đã kết thúc' : '🟢 Đang diễn ra'}
              </span>
              {!isEnded && (
                <div className="rounded-2xl bg-black/80 px-3 py-1.5 text-white shadow-lg backdrop-blur-md md:px-4 md:py-2">
                  <p className="mb-0.5 text-[7px] font-bold text-gray-400 uppercase md:mb-1 md:text-[8px]">
                    Còn lại
                  </p>
                  <CountdownTimer endTime={product.endTime} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 md:p-8 lg:w-1/2 lg:p-12">
            <div className="mb-4 flex items-center gap-3 md:mb-6">
              <Link to={`/profile/${ownerId}`} className="group flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow-md transition-transform group-hover:scale-110 md:h-12 md:w-12">
                  {product.owner?.avatar ? (
                    <img
                      src={getFullImageUrl(product.owner.avatar)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-black text-blue-400 md:text-lg">
                      {product.owner?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black tracking-widest text-blue-500 uppercase md:text-[10px]">
                    Người bán
                  </span>
                  <span className="text-base font-bold text-gray-900 underline decoration-gray-300 decoration-dotted group-hover:text-blue-600 md:text-lg">
                    {product.owner?.fullName || 'Chủ sở hữu'}
                  </span>
                </div>
              </Link>
            </div>

            <h1 className="mb-4 text-2xl leading-tight font-black tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
              {product.title}
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-gray-500 italic md:mb-10 md:text-xl">
              "{product.description}"
            </p>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-12 md:gap-8">
              <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-5 md:rounded-[35px] md:p-8">
                <p className="mb-1 text-[9px] font-black text-blue-400 uppercase md:text-[10px]">
                  Giá hiện tại
                </p>
                <p className="text-xl font-black text-blue-600 md:text-4xl">
                  {Number(product.currentPrice || 0).toLocaleString()}đ
                </p>
              </div>
              <div className="rounded-[20px] border border-gray-100 bg-gray-50 p-5 md:rounded-[35px] md:p-8">
                <p className="mb-1 text-[9px] font-black text-gray-400 uppercase md:text-[10px]">
                  Bước giá
                </p>
                <p className="text-xl font-black text-gray-800 md:text-4xl">
                  +{Number(product.stepPrice || 0).toLocaleString()}đ
                </p>
              </div>
            </div>

            {isOwner ? (
              <div className="rounded-[20px] border border-amber-100 bg-amber-50 p-5 text-center md:rounded-[35px]">
                <p className="text-xs font-black text-amber-700 italic md:text-base">
                  ✋ Bạn không thể tự đấu giá
                </p>
              </div>
            ) : isEnded ? (
              <div className="rounded-[20px] border border-red-100 bg-red-50 p-5 text-center md:rounded-[35px]">
                <p className="text-xs font-black text-red-700 uppercase italic md:text-base">
                  🔒 Đã kết thúc
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-[20px] border border-gray-200 bg-gray-50 p-2 sm:flex-row md:rounded-[35px]">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Giá thầu..."
                  className="flex-1 bg-transparent px-5 py-3 text-lg font-black text-gray-800 outline-none md:py-5 md:text-xl"
                />
                <button
                  onClick={handleBid}
                  className="rounded-[15px] bg-blue-600 px-6 py-3 font-black text-white shadow-lg md:rounded-[30px] md:px-12 md:py-5"
                >
                  ĐẶT GIÁ
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* LỊCH SỬ ĐẤU GIÁ */}
          <section className="w-full">
            <h2 className="mb-6 text-xl font-black text-gray-900 italic underline decoration-blue-500 underline-offset-8 md:text-2xl">
              Lịch sử đấu giá
            </h2>
            <div className="overflow-hidden rounded-[25px] border border-gray-100 bg-white shadow-sm md:rounded-[40px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="p-4 text-[9px] font-black text-gray-400 uppercase md:p-6">
                      Người tham gia
                    </th>
                    <th className="p-4 text-right text-[9px] font-black text-gray-400 uppercase md:p-6">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {product.bidHistory?.length > 0 ? (
                    [...product.bidHistory]
                      .reverse()
                      .slice(0, 8)
                      .map((bid, index) => (
                        <tr
                          key={index}
                          className={`group transition-all hover:bg-blue-50/20 ${index === 0 ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="p-4 md:p-6">
                            <Link
                              to={`/profile/${bid.bidder?._id || bid.bidder}`}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-blue-100 ${index === 0 ? 'ring-2 ring-blue-600' : ''}`}
                              >
                                {bid.bidder?.avatar ? (
                                  <img
                                    src={getFullImageUrl(bid.bidder.avatar)}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-full items-center justify-center text-[10px] font-black text-blue-600 uppercase">
                                    {bid.bidder?.fullName?.charAt(0) || 'U'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="max-w-[80px] truncate text-xs font-bold text-gray-900 md:max-w-none">
                                  {bid.bidder?.fullName || 'Ẩn danh'}
                                </span>
                                {index === 0 && (
                                  <span className="text-[7px] font-black text-blue-500 uppercase">
                                    🔥 Dẫn đầu
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="p-4 text-right text-sm font-black text-gray-900 md:p-6 md:text-base">
                            {Number(bid.amount).toLocaleString()}đ
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="p-12 text-center font-bold text-gray-300 italic">
                        Chưa có lượt thầu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* KHUNG CHAT - Đã tối ưu Responsive */}
          <section className="flex w-full flex-col">
            <h2 className="mb-6 text-xl font-black text-gray-900 italic underline decoration-green-500 underline-offset-8 md:text-2xl">
              Thảo luận
            </h2>
            <div className="relative flex h-[500px] w-full flex-col overflow-hidden rounded-[25px] border border-gray-100 bg-white shadow-sm md:h-[600px] md:rounded-[40px]">
              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/30 p-3 md:p-6">
                {messages.length > 0 ? (
                  messages.map((m, i) => {
                    const isMe = m.sender?._id === currentUserId || m.sender === currentUserId;
                    const isSticker = m.content.startsWith('http');
                    return (
                      <div
                        key={i}
                        className={`flex gap-2 md:gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-blue-100 text-[9px] font-black text-blue-600 md:h-9 md:w-9">
                          {m.sender?.avatar ? (
                            <img
                              src={getFullImageUrl(m.sender.avatar)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            m.sender?.fullName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div
                          className={`max-w-[90%] md:max-w-[85%] ${isSticker ? 'bg-transparent shadow-none' : `rounded-[18px] p-3 shadow-sm md:rounded-[25px] md:p-4 ${isMe ? 'rounded-tr-none bg-blue-600 text-white' : 'rounded-tl-none border border-gray-100 bg-white text-gray-800'}`}`}
                        >
                          {!isMe && (
                            <p className="mb-1 text-[8px] font-black uppercase opacity-50">
                              {m.sender?.fullName}
                            </p>
                          )}
                          {isSticker ? (
                            <img
                              src={m.content}
                              className="animate-bounce-sticker h-16 w-16 object-contain md:h-24 md:w-24"
                            />
                          ) : (
                            <p className="text-xs font-medium md:text-sm">{m.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-300 italic">
                    <span className="mb-2 text-3xl">💬</span>
                    <p className="text-xs font-bold">Hãy thảo luận về sản phẩm!</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Picker Emoji/Sticker */}
              {showPicker && (
                <div className="absolute right-2 bottom-20 left-2 z-10 rounded-2xl border border-gray-100 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
                  <div className="scrollbar-hide mb-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-gray-100 pb-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setInputMessage((prev) => prev + emoji)}
                        className="text-xl transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
                    {STICKERS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        onClick={() => handleSendChat(url)}
                        className="h-12 w-12 cursor-pointer p-1 transition-all hover:scale-110 md:h-16 md:w-16"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="flex gap-2 border-t border-gray-100 bg-white p-2 md:p-4">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg md:h-12 md:w-12 ${showPicker ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  😊
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Hỏi về sản phẩm..."
                  className="flex-1 rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSendChat()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md md:h-12 md:w-12"
                >
                  ✈️
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
