import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import CountdownTimer from '../../components/CountdownTimer';

const BASE_URL = 'http://localhost:5000/uploads';

// Danh sách Sticker mẫu
const STICKERS = [
  // Nhóm: Cảm xúc (Dùng link CDN tĩnh của StaticFiles hoặc Gstatic ổn định hơn)
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif', // Lửa
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif', // Mắt sao
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif', // Ngầu
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif', // Party
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif', // Vỗ tay

  // Nhóm: Đấu giá & Tiền (Các link này thường rất ít khi chết)
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b8/512.gif', // Tiền bay
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b0/512.gif', // Túi tiền
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif', // Kim cương
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b3/512.gif', // Thẻ tín dụng
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a5/512.gif', // Boom

  // Nhóm: Tốc độ
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif', // Tên lửa
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif', // Cúp
  'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.gif', // Sét
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.gif', // Tâm điểm
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f514/512.gif', // Chuông
];

const EMOJIS = ['🔥', '💎', '🤝', '💰', '🚀', '⭐', '⚡', '😎'];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // MỚI: State cho Chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);

  // MỚI: State cho Emoji/Sticker Picker
  const [showPicker, setShowPicker] = useState(false);

  const getFullImageUrl = (path) => {
    if (!path) return null;

    // Nếu path đã là link full (Cloudinary, Google, v.v.) thì trả về luôn
    if (path.startsWith('http')) return path;

    // Nếu là đường dẫn cũ (Local), mới cần ghép BASE_URL
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

    const newSocket = io('http://localhost:5000');
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
    <div className="flex min-h-screen bg-gray-50">
      <style>{`
        @keyframes bounce-sticker {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-sticker {
          animation: bounce-sticker 1s infinite ease-in-out;
        }
      `}</style>
      <ToastContainer />

      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-24'} sticky top-0 z-50 flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-8">
          {isSidebarOpen && (
            <span className="text-2xl font-black tracking-tighter text-blue-600">BID.</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-50"
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
        <nav className="flex-1 px-6">
          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center gap-4 rounded-2xl p-4 font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
          >
            <span>🏠</span> {isSidebarOpen && 'Trang chủ'}
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 font-bold text-gray-400 transition-all hover:text-blue-600"
        >
          ← Quay lại
        </button>

        <div className="mx-auto mb-12 flex max-w-6xl flex-col overflow-hidden rounded-[50px] border border-gray-100 bg-white shadow-sm lg:flex-row">
          <div className="relative h-[600px] bg-gray-100 lg:w-1/2">
            <img
              src={product.image || product.imageUrl} // Dùng field 'image' mới, fallback về 'imageUrl' cũ nếu cần
              alt={product.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <span
                className={`rounded-2xl px-4 py-2 text-[10px] font-black uppercase shadow-sm backdrop-blur-md ${isEnded ? 'bg-red-500 text-white' : 'bg-white/90 text-black'}`}
              >
                {isEnded ? '🔴 Đã kết thúc' : '🟢 Đang diễn ra'}
              </span>
              {!isEnded && (
                <div className="rounded-2xl bg-black/80 px-4 py-2 text-white shadow-lg backdrop-blur-md">
                  <p className="mb-1 text-[8px] font-bold text-gray-400 uppercase">
                    Thời gian còn lại
                  </p>
                  <CountdownTimer endTime={product.endTime} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center p-12 lg:w-1/2">
            <div className="mb-6 flex items-center gap-3">
              <Link to={`/profile/${ownerId}`} className="group flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow-md transition-transform group-hover:scale-110">
                  {product.owner?.avatar ? (
                    <img
                      src={getFullImageUrl(product.owner.avatar)}
                      alt={product.owner.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span
                    className="text-lg font-black text-blue-400"
                    style={{ display: product.owner?.avatar ? 'none' : 'flex' }}
                  >
                    {product.owner?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                    Người đăng bán
                  </span>
                  <span className="text-lg font-bold text-gray-900 underline decoration-gray-300 decoration-dotted group-hover:text-blue-600">
                    {product.owner?.fullName || 'Chủ sở hữu'}
                  </span>
                </div>
              </Link>
            </div>

            <h1 className="mb-6 text-5xl leading-tight font-black tracking-tight text-gray-900">
              {product.title}
            </h1>
            <p className="mb-10 text-xl leading-relaxed text-gray-500 italic">
              "{product.description}"
            </p>

            <div className="mb-12 grid grid-cols-2 gap-8">
              <div className="rounded-[35px] border border-blue-100 bg-blue-50 p-8">
                <p className="mb-2 text-[10px] font-black text-blue-400 uppercase">Giá hiện tại</p>
                <p className="text-4xl font-black text-blue-600">
                  {Number(product.currentPrice || 0).toLocaleString()}đ
                </p>
              </div>
              <div className="rounded-[35px] border border-gray-100 bg-gray-50 p-8">
                <p className="mb-2 text-[10px] font-black text-gray-400 uppercase">
                  Bước giá tối thiểu
                </p>
                <p className="text-4xl font-black text-gray-800">
                  +{Number(product.stepPrice || 0).toLocaleString()}đ
                </p>
              </div>
            </div>

            {isOwner ? (
              <div className="rounded-[35px] border border-amber-100 bg-amber-50 p-8 text-center">
                <p className="font-black text-amber-700 italic">
                  ✋ Bạn không thể tự đấu giá sản phẩm của chính mình
                </p>
              </div>
            ) : isEnded ? (
              <div className="rounded-[35px] border border-red-100 bg-red-50 p-8 text-center">
                <p className="font-black text-red-700 uppercase italic">
                  🔒 Phiên đấu giá đã kết thúc
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-[35px] border border-gray-200 bg-gray-50 p-2 transition-all focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Nhập giá muốn thầu..."
                    className="flex-1 bg-transparent px-8 py-5 text-xl font-black text-gray-800 outline-none"
                  />
                  <button
                    onClick={handleBid}
                    className="rounded-[30px] bg-blue-600 px-12 py-5 font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
                  >
                    ĐẶT GIÁ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2">
          {/* CỘT TRÁI: LỊCH SỬ ĐẤU GIÁ */}
          <section>
            <h2 className="mb-8 text-2xl font-black text-gray-900 italic underline decoration-blue-500 underline-offset-8">
              Lịch sử đấu giá
            </h2>
            <div className="overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase">
                      Người tham gia
                    </th>
                    <th className="p-6 text-right text-[10px] font-black text-gray-400 uppercase">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {product.bidHistory?.length > 0 ? (
                    [...product.bidHistory]
                      .reverse()
                      .slice(0, 10)
                      .map((bid, index) => {
                        const bidderId = bid.bidder?._id || bid.bidder;
                        return (
                          <tr
                            key={index}
                            className={`group transition-all hover:bg-blue-50/20 ${index === 0 ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="p-6">
                              <Link
                                to={`/profile/${bidderId}`}
                                className="group/user flex items-center gap-3"
                              >
                                <div
                                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100 shadow-sm transition-transform group-hover/user:scale-110 ${index === 0 ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                                >
                                  {bid.bidder?.avatar ? (
                                    <img
                                      src={getFullImageUrl(bid.bidder.avatar)}
                                      alt={bid.bidder.fullName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[12px] font-black text-blue-600">
                                      {bid.bidder?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-900 transition-colors group-hover/user:text-blue-600">
                                    {bid.bidder?.fullName || 'Người dùng ẩn danh'}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-[8px] font-black tracking-tighter text-blue-500 uppercase">
                                      🔥 Dẫn đầu
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </td>
                            <td className="p-6 text-right font-black text-gray-900">
                              <span className={index === 0 ? 'text-blue-600' : ''}>
                                {Number(bid.amount).toLocaleString()}đ
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="2" className="p-20 text-center font-bold text-gray-300 italic">
                        Chưa có lượt thầu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* CỘT PHẢI: KHUNG CHAT + EMOJI/STICKER */}
          <section className="flex flex-col">
            <h2 className="mb-8 text-2xl font-black text-gray-900 italic underline decoration-green-500 underline-offset-8">
              Thảo luận trực tiếp
            </h2>
            <div className="relative flex h-[500px] flex-1 flex-col overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-sm">
              {/* Danh sách tin nhắn */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/30 p-6">
                {messages.length > 0 ? (
                  messages.map((m, i) => {
                    const isMe = m.sender?._id === currentUserId || m.sender === currentUserId;
                    const isSticker = m.content.startsWith('http');

                    return (
                      <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-blue-100 text-[10px] font-black text-blue-600 shadow-sm">
                          {m.sender?.avatar ? (
                            <img
                              src={getFullImageUrl(m.sender.avatar)}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            m.sender?.fullName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] ${isSticker ? 'bg-transparent shadow-none' : `rounded-[25px] p-4 shadow-sm ${isMe ? 'rounded-tr-none bg-blue-600 text-white' : 'rounded-tl-none border border-gray-100 bg-white text-gray-800'}`}`}
                        >
                          {!isMe && (
                            <p className="mb-1 text-[9px] font-black tracking-tighter uppercase opacity-50">
                              {m.sender?.fullName}
                            </p>
                          )}
                          {isSticker ? (
                            <img
                              src={m.content}
                              alt="sticker"
                              className="animate-bounce-sticker h-24 w-24 object-contain"
                              // Giải pháp xử lý ảnh lỗi:
                              onError={(e) => {
                                // Ẩn sticker đi để không hiện icon "hình vỡ" của trình duyệt
                                e.target.style.display = 'none';
                                console.warn(`Sticker không tải được: ${m.content}`);
                              }}
                            />
                          ) : (
                            <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-300 italic">
                    <span className="mb-2 text-4xl">💬</span>
                    <p className="text-sm font-bold">Hãy là người đầu tiên thảo luận!</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {showPicker && (
                <div className="absolute right-4 bottom-20 left-4 z-10 rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all">
                  <div className="mb-3 flex max-h-20 flex-wrap gap-2 overflow-y-auto border-b border-gray-100 pb-3">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setInputMessage((prev) => prev + emoji)}
                        className="p-1 text-2xl transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Khu vực Sticker có thanh cuộn ngang mượt mà */}
                  <div className="scrollbar-hide custom-scrollbar flex gap-4 overflow-x-auto pb-2">
                    {STICKERS.map((url, idx) => (
                      <div key={idx} className="shrink-0">
                        <img
                          src={url}
                          onClick={() => handleSendChat(url)}
                          className="h-16 w-16 cursor-pointer rounded-xl border border-transparent p-2 transition-all hover:scale-110 hover:border-blue-100 hover:bg-blue-50 active:scale-90"
                          alt="sticker"
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-2 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Chọn sticker để gửi ngay
                  </p>
                </div>
              )}

              {/* Ô nhập liệu */}
              <div className="relative flex gap-2 border-t border-gray-100 bg-white p-4">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all ${showPicker ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  😊
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Hỏi về sản phẩm..."
                  className="flex-1 rounded-2xl border-none bg-gray-50 px-5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSendChat()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 active:scale-90"
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
