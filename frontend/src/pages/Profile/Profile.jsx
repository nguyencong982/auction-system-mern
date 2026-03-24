import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import ProfileHeader
import ProfileHeader from '../../components/ProfileHeader';

const Profile = () => {
  const navigate = useNavigate();
  const [loadingFetch, setLoadingFetch] = useState(true); // Trạng thái chờ tải dữ liệu ban đầu
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    balance: 0,
    avatar: '',
    cover: '',
  });

  // 1. Lấy thông tin cá nhân từ Server
  const fetchProfile = async () => {
    try {
      setLoadingFetch(true);
      const res = await API.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin', error);
      toast.error('Không thể tải thông tin cá nhân. Vui lòng thử lại!');
    } finally {
      // Dừng loading bất kể thành công hay thất bại
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Hàm cập nhật lại State khi upload ảnh thành công từ ProfileHeader
  const handleUpdateImageSuccess = (updatedUser) => {
    setUser(updatedUser);
    // Đồng bộ với localStorage để Navbar/Sidebar cập nhật theo ngay lập tức
    const localData = JSON.parse(localStorage.getItem('user'));
    if (localData) {
      localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
    }
  };

  // 2. Hàm xử lý cập nhật thông tin chữ (Họ tên, SĐT, Địa chỉ)
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

        // Chuyển hướng sau khi lưu thành công
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật thông tin');
    }
  };

  // --- GIAO DIỆN KHI ĐANG TẢI DỮ LIỆU ---
  if (loadingFetch) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 font-bold text-gray-500">Đang tải hồ sơ của Công...</p>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="animate-fadeIn mx-auto max-w-4xl pb-10">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header chứa Ảnh bìa và Ảnh đại diện */}
      <ProfileHeader user={user} isOwnProfile={true} onUpdateSuccess={handleUpdateImageSuccess} />

      <div className="mx-auto mt-6 max-w-2xl rounded-[2rem] border border-gray-100 bg-white p-6 shadow-lg">
        <h2 className="mb-6 border-b pb-4 text-2xl font-black text-gray-800">
          Thông tin tài khoản
        </h2>

        {/* Hiển thị số dư ví */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <p className="mb-1 text-sm font-bold tracking-wider text-gray-500 uppercase">
            Số dư ví hiện tại
          </p>
          <p className="text-2xl font-black text-blue-600">
            {user.balance?.toLocaleString() || 0} <span className="text-sm font-normal">VNĐ</span>
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="mb-2 ml-1 block font-bold text-gray-600">Họ và tên</label>
            <input
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 font-medium transition-all outline-none focus:ring-2 focus:ring-blue-400"
              value={user.fullName || ''}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block font-bold text-gray-400">Email (Cố định)</label>
            <input
              className="w-full cursor-not-allowed rounded-2xl border border-gray-100 bg-gray-100 p-4 text-gray-500"
              value={user.email || ''}
              readOnly
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block font-bold text-gray-600">
              Số điện thoại liên lạc
            </label>
            <input
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 font-medium transition-all outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập SĐT của bạn"
              value={user.phone || ''}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block font-bold text-gray-600">Địa chỉ nhận hàng</label>
            <textarea
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 font-medium transition-all outline-none focus:ring-2 focus:ring-blue-400"
              rows="3"
              placeholder="Số nhà, tên đường, quận/huyện..."
              value={user.address || ''}
              onChange={(e) => setUser({ ...user, address: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl bg-gray-100 py-4 font-bold text-gray-600 transition-all hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-[2] rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
