import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import ProfileHeader from '../../components/ProfileHeader';
import socket from '../../socket';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Sản phẩm');

  const BASE_URL = 'https://auction-system-mern-xeyx.onrender.com';

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.includes('localhost')) {
      return `${BASE_URL}/uploads/${path.split('/').pop()}`;
    }
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const getLocalUser = () => {
    const data = localStorage.getItem('user');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  };

  const currentUser = useMemo(() => getLocalUser(), []);
  const currentUserId = currentUser?._id || currentUser?.id;
  const isMyProfile = currentUserId?.toString() === id?.toString();

  useEffect(() => {
    if (!id) return;
    const eventName = `update_followers_${id}`;
    socket.on(eventName, (data) => {
      setProfileData((prev) => {
        if (!prev) return prev;
        return { ...prev, profile: { ...prev.profile, followers: data.followers } };
      });
    });
    return () => socket.off(eventName);
  }, [id]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/users/profile/${id}`);
        const data = res.data.data;
        setProfileData(data);
        if (data.profile.followers && currentUserId) {
          const followingStatus = data.profile.followers.some(
            (follower) =>
              (follower._id?.toString() || follower.toString()) === currentUserId.toString()
          );
          setIsFollowing(followingStatus);
        }
      } catch (error) {
        toast.error('Không tìm thấy người dùng');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id, currentUserId]);

  const handleUpdateImageSuccess = (updatedUser) => {
    setProfileData((prev) => ({ ...prev, profile: { ...prev.profile, ...updatedUser } }));
    const localData = getLocalUser();
    if (localData) localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
  };

  const handleFollow = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const latestUser = getLocalUser();
    const latestUserId = latestUser?._id || latestUser?.id;
    if (!latestUser || !latestUserId) return toast.warning('Vui lòng đăng nhập');
    if (latestUserId.toString() === id?.toString())
      return toast.info('Bạn không thể theo dõi chính mình');
    if (isFollowLoading) return;

    const previousFollowStatus = isFollowing;
    const previousFollowers = [...(profileData?.profile?.followers || [])];

    setIsFollowing(!previousFollowStatus);
    setIsFollowLoading(true);
    try {
      const res = await API.post(`/users/follow/${id}`);
      if (res.data.isFollowing !== undefined) setIsFollowing(res.data.isFollowing);
      toast.success(res.data.message);
    } catch (error) {
      setIsFollowing(previousFollowStatus);
      setProfileData((prev) => ({
        ...prev,
        profile: { ...prev.profile, followers: previousFollowers },
      }));
      toast.error('Thao tác thất bại');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );

  if (!profileData)
    return <div className="py-20 text-center font-bold">Người dùng không tồn tại.</div>;

  const { profile, products } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />

      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl">
          <ProfileHeader
            user={profile}
            isOwnProfile={isMyProfile}
            onUpdateSuccess={handleUpdateImageSuccess}
          />

          {/* Action Buttons: Tối ưu cho Mobile */}
          <div className="px-4 pb-4 md:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {isMyProfile ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-800 active:bg-gray-200 sm:w-auto sm:px-6"
                >
                  ✏️ Chỉnh sửa trang cá nhân
                </button>
              ) : (
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 sm:min-w-[140px] ${
                      isFollowing ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi'}
                  </button>
                  <button className="flex-1 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 active:bg-blue-100 sm:min-w-[120px]">
                    ✉ Nhắn tin
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs: Cuộn ngang trên mobile */}
          <div className="no-scrollbar flex overflow-x-auto border-t px-2">
            {['Sản phẩm', 'Giới thiệu', 'Người theo dõi'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`min-w-[100px] flex-1 border-b-2 py-4 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto mt-4 max-w-5xl px-4 md:mt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Mobile: Chỉ hiện giới thiệu khi ở tab Giới thiệu hoặc trên màn hình lớn */}
          {(activeTab === 'Giới thiệu' || window.innerWidth > 768) && (
            <div className="md:col-span-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-black text-gray-900">Giới thiệu</h2>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏠</span>
                    <p>
                      Sống tại{' '}
                      <span className="font-bold text-gray-800">
                        {profile.address || 'Chưa cập nhật'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xl">📧</span>
                    <p className="truncate">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <p>
                      Tham gia:{' '}
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                        : '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="md:col-span-8">
            {activeTab === 'Sản phẩm' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
                {products?.length > 0 ? (
                  products.map((product) => (
                    <div
                      key={product._id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={getFullImageUrl(product.imageUrl || product.image)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          alt={product.title}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-1 text-sm font-bold text-gray-800">
                          {product.title}
                        </h3>
                        <p className="mt-1 text-sm font-black text-blue-600">
                          {Number(product.currentPrice).toLocaleString()}đ
                        </p>
                        <button
                          onClick={() => navigate(`/product/${product._id}`)}
                          className="mt-3 w-full rounded-lg bg-gray-900 py-2 text-xs font-bold text-white active:bg-blue-600"
                        >
                          Đấu giá
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    Chưa có sản phẩm.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Người theo dõi' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {profile.followers?.length > 0 ? (
                    profile.followers.map((f, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/user/${f._id}`)}
                        className="flex items-center gap-3 rounded-xl border border-gray-50 p-3 active:bg-gray-50"
                      >
                        {f.avatar ? (
                          <img
                            src={getFullImageUrl(f.avatar)}
                            className="h-12 w-12 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                            {(f.fullName || f.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate text-sm font-bold text-gray-800">
                          {f.fullName || f.username || 'Người dùng'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full py-10 text-center text-gray-400">
                      Chưa có người theo dõi.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
