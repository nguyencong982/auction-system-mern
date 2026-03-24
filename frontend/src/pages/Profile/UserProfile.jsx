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

  // --- HÀM XỬ LÝ ẢNH TRONG USER PROFILE ---
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

  // QUẢN LÝ SOCKET
  useEffect(() => {
    if (!id) return;
    const eventName = `update_followers_${id}`;
    socket.on(eventName, (data) => {
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            followers: data.followers,
          },
        };
      });
    });
    return () => socket.off(eventName);
  }, [id]);

  // FETCH DỮ LIỆU PROFILE
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
        console.error('Lỗi tải hồ sơ:', error);
        toast.error('Không tìm thấy người dùng');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id, currentUserId]);

  const handleUpdateImageSuccess = (updatedUser) => {
    setProfileData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updatedUser },
    }));
    const localData = getLocalUser();
    if (localData) {
      localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
    }
  };

  const handleFollow = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const latestUser = getLocalUser();
    const latestUserId = latestUser?._id || latestUser?.id;
    if (!latestUser || !latestUserId) {
      toast.warning('Vui lòng đăng nhập để theo dõi');
      return;
    }
    if (latestUserId.toString() === id?.toString()) {
      toast.info('Bạn không thể theo dõi chính mình');
      return;
    }
    if (isFollowLoading) return;

    const previousFollowStatus = isFollowing;
    const previousFollowers = [...(profileData?.profile?.followers || [])];

    setIsFollowing(!previousFollowStatus);
    setProfileData((prev) => {
      if (!prev) return prev;
      const currentFollowers = prev.profile.followers || [];
      const updatedFollowers = !previousFollowStatus
        ? [...currentFollowers, { _id: latestUserId }]
        : currentFollowers.filter(
            (f) => (f._id?.toString() || f.toString()) !== latestUserId.toString()
          );
      return { ...prev, profile: { ...prev.profile, followers: updatedFollowers } };
    });

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
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  if (!profileData)
    return <div className="py-20 text-center font-bold">Người dùng không tồn tại.</div>;

  const { profile, products } = profileData;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white shadow">
        <div className="relative mx-auto max-w-5xl">
          <ProfileHeader
            user={profile}
            isOwnProfile={isMyProfile}
            onUpdateSuccess={handleUpdateImageSuccess}
          />

          <div className="relative z-[40] -mt-6 flex flex-col items-center justify-end gap-4 px-6 pb-4 md:-mt-12 md:flex-row">
            <div className="flex w-full gap-2 md:w-auto">
              {isMyProfile ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 cursor-pointer rounded-lg bg-gray-200 px-6 py-2 font-bold text-black transition-all hover:bg-gray-300 active:scale-95 md:flex-none"
                >
                  ✏️ Chỉnh sửa trang cá nhân
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`min-w-[140px] flex-1 rounded-lg px-8 py-2 font-bold shadow-md transition-all md:flex-none ${isFollowing ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white hover:bg-blue-700'} ${isFollowLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi'}
                  </button>
                  <button className="cursor-pointer rounded-lg bg-blue-100 px-6 py-2 font-bold text-blue-700 transition-all hover:bg-blue-200">
                    ✉ Nhắn tin
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="no-scrollbar relative z-10 mt-4 flex gap-8 overflow-x-auto border-t px-4 font-bold text-gray-500">
            {['Sản phẩm', 'Giới thiệu', 'Người theo dõi'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer border-b-4 py-4 whitespace-nowrap transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-12">
        <div className="space-y-4 md:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black">Giới thiệu</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-2">
                🏠{' '}
                <span>
                  Sống tại <span className="font-bold">{profile.address || 'Chưa cập nhật'}</span>
                </span>
              </li>
              <li className="flex items-center gap-2 truncate">
                📧 <span>{profile.email}</span>
              </li>
              <li className="flex items-center gap-2">
                📅{' '}
                <span>
                  Tham gia:{' '}
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                    : '---'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="md:col-span-8">
          {activeTab === 'Sản phẩm' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products?.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product._id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md"
                  >
                    {/* SỬA TẠI ĐÂY: Dùng getFullImageUrl cho ảnh sản phẩm */}
                    <img
                      src={getFullImageUrl(product.imageUrl || product.image)}
                      className="h-48 w-full object-cover"
                      alt={product.title}
                    />
                    <div className="p-4">
                      <h3 className="truncate font-black text-gray-800">{product.title}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="font-black text-blue-600">
                          {Number(product.currentPrice).toLocaleString()}đ
                        </p>
                        <button
                          onClick={() => navigate(`/product/${product._id}`)}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-blue-600"
                        >
                          Đấu giá
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  Chưa có sản phẩm nào.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Người theo dõi' && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
              {profile.followers?.length > 0 ? (
                profile.followers.map((f, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => navigate(`/user/${f._id}`)}
                  >
                    {/* SỬA TẠI ĐÂY: Dùng getFullImageUrl cho avatar người theo dõi */}
                    {f.avatar ? (
                      <img
                        src={getFullImageUrl(f.avatar)}
                        className="h-10 w-10 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                        {(f.fullName || f.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-gray-800">
                      {f.fullName || f.username || 'Người dùng'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="col-span-full py-10 text-center text-gray-500">
                  Chưa có người theo dõi.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
