import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProfileHeader from '../../components/ProfileHeader';
// 1. Import Component SetupPaymentPin (Đảm bảo đúng đường dẫn)
import SetupPaymentPin from './SetupPaymentPin';

const Profile = () => {
  const navigate = useNavigate();
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    balance: 0,
    avatar: '',
    cover: '',
    hasPaymentPin: false, // Thêm trường này để đồng bộ state ban đầu
  });

  const fetchProfile = async () => {
    try {
      setLoadingFetch(true);
      const res = await API.get('/auth/profile');
      if (res.data.success) {
        // Kiểm tra log này ở Console F12
        console.log('Dữ liệu User từ Server:', res.data.data);
        setUser(res.data.data);

        // Cập nhật lại LocalStorage để đồng bộ toàn bộ App
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin', error);
      toast.error('Không thể tải thông tin cá nhân.');
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateImageSuccess = (updatedUser) => {
    setUser(updatedUser);
    const localData = JSON.parse(localStorage.getItem('user'));
    if (localData) {
      localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put('/auth/profile', {
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
      });

      if (res.data.success || res.status === 200) {
        toast.success('🎉 Cập nhật thông tin thành công!');
        setUser(res.data.data);
        // Lưu ý: Có thể bỏ navigate('/home') nếu muốn người dùng ở lại thiết lập mã PIN
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật thông tin');
    }
  };

  if (loadingFetch) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 font-bold text-gray-500">Đang tải hồ sơ của Công...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn mx-auto max-w-4xl px-4 pb-10">
      <ToastContainer position="top-right" autoClose={3000} />

      <ProfileHeader user={user} isOwnProfile={true} onUpdateSuccess={handleUpdateImageSuccess} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CỘT 1: THÔNG TIN CÁ NHÂN */}
        <div className="h-fit rounded-[2rem] border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-6 border-b pb-4 text-xl font-black text-gray-800">
            Thông tin tài khoản
          </h2>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Số dư ví hiện tại
            </p>
            <p className="text-xl font-black text-blue-600">
              {user.balance?.toLocaleString() || 0} <span className="text-sm font-normal">VNĐ</span>
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 ml-1 block text-sm font-bold text-gray-600">Họ và tên</label>
              <input
                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
                value={user.fullName || ''}
                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 ml-1 block text-sm font-bold text-gray-400">Email</label>
              <input
                className="w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-100 p-3 text-sm text-gray-500"
                value={user.email || ''}
                readOnly
              />
            </div>

            <div>
              <label className="mb-1 ml-1 block text-sm font-bold text-gray-600">
                Số điện thoại
              </label>
              <input
                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
                value={user.phone || ''}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
              >
                Lưu hồ sơ
              </button>
            </div>
          </form>
        </div>

        {/* CỘT 2: QUẢN LÝ MÃ PIN (Nằm ngoài form chính) */}
        <div className="space-y-6">
          <SetupPaymentPin user={user} onRefreshProfile={fetchProfile} />

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-center text-[11px] leading-relaxed text-gray-500">
              Mã PIN thanh toán giúp bảo vệ số dư của Công khi thực hiện các giao dịch rút tiền hoặc
              thanh toán hóa đơn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
