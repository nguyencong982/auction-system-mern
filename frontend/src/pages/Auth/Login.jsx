import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Gửi request đăng nhập
      const response = await API.post('/auth/login', { email, password });
      const resData = response.data;

      // 2. Lưu thông tin vào LocalStorage
      if (resData.token) {
        localStorage.setItem('token', resData.token);

        // Đảm bảo lưu đúng object user
        const userToStore = resData.user || resData;
        localStorage.setItem('user', JSON.stringify(userToStore));

        console.log('Đã lưu User và Token mới');

        alert('Đăng nhập thành công!');

        // 3. Điều hướng và Ép tải lại trang để API Interceptor nhận Token mới
        // Thay vì dùng navigate + reload, ta dùng window.location.href để dứt điểm lỗi 401 ban đầu
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      alert(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md rounded-3xl border border-gray-50 bg-white p-10 shadow-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tighter text-blue-600 uppercase">
            BID ONLINE
          </h2>
          <p className="mt-2 text-gray-400">Nơi đấu giá công bằng & nhanh chóng</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Nhập Email */}
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold text-gray-400 uppercase">
              Tài khoản Email
            </label>
            <input
              type="email"
              required
              placeholder="ten@email.com"
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Nhập Mật khẩu */}
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold text-gray-400 uppercase">Mật khẩu</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* VỊ TRÍ MỚI: Nằm dưới khung nhập và căn lề phải */}
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="mt-1 text-xs font-bold text-blue-500 transition-colors hover:text-blue-700"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl p-4 font-bold text-white shadow-lg shadow-blue-100 transition active:scale-95 ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-50 pt-6 text-center">
          <p className="text-sm text-gray-500">
            Bạn chưa có tài khoản?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-blue-600 hover:underline"
            >
              Đăng ký miễn phí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
