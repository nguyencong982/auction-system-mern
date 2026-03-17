import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Thêm useNavigate để điều hướng nếu cần
import API from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import { io } from 'socket.io-client';
// Import ProfileHeader
import ProfileHeader from '../../components/ProfileHeader';

const UserProfile = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false); 
    const [activeTab, setActiveTab] = useState('Sản phẩm');

    // Hàm lấy User từ localStorage an toàn
    const getLocalUser = () => {
        const data = localStorage.getItem('user');
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    };

    // 1. QUẢN LÝ THÔNG TIN USER HIỆN TẠI
    const currentUser = useMemo(() => getLocalUser(), []);
    const currentUserId = currentUser?._id || currentUser?.id;
    const isMyProfile = currentUserId?.toString() === id?.toString();

    // 2. QUẢN LÝ SOCKET (Giữ nguyên logic của bạn)
    useEffect(() => {
        if (!id) return;
        const socket = io("http://localhost:5000"); 

        socket.on(`update_followers_${id}`, (data) => {
            setProfileData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    profile: { 
                        ...prev.profile, 
                        followers: data.followers 
                    }
                };
            });
        });

        return () => {
            socket.off(`update_followers_${id}`);
            socket.disconnect();
        };
    }, [id]);

    // 3. FETCH DỮ LIỆU PROFILE
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/users/profile/${id}`);
                const data = res.data.data;
                setProfileData(data);
                
                if (data.profile.followers && currentUserId) {
                    const followingStatus = data.profile.followers.some(
                        follower => (follower._id?.toString() || follower.toString()) === currentUserId.toString()
                    );
                    setIsFollowing(followingStatus);
                }
            } catch (error) {
                console.error("Lỗi tải hồ sơ:", error);
                toast.error("Không tìm thấy người dùng");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfile();
    }, [id, currentUserId]);

    // Hàm callback khi upload ảnh thành công (chỉ dành cho chính mình)
    const handleUpdateImageSuccess = (updatedUser) => {
        setProfileData(prev => ({
            ...prev,
            profile: { ...prev.profile, ...updatedUser }
        }));
        // Cập nhật localStorage
        const localData = getLocalUser();
        if (localData) {
            localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
        }
    };

    // 4. XỬ LÝ THEO DÕI
    const handleFollow = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const latestUser = getLocalUser();
        const latestUserId = latestUser?._id || latestUser?.id;

        if (!latestUser || !latestUserId) {
            toast.warning("Vui lòng đăng nhập để theo dõi");
            return;
        }

        if (latestUserId.toString() === id?.toString()) {
            toast.info("Bạn không thể theo dõi chính mình");
            return;
        }

        if (isFollowLoading) return;

        const previousFollowStatus = isFollowing;
        const previousFollowers = [...(profileData?.profile?.followers || [])];

        setIsFollowing(!previousFollowStatus);
        setProfileData(prev => {
            if (!prev) return prev;
            const currentFollowers = prev.profile.followers || [];
            const updatedFollowers = !previousFollowStatus
                ? [...currentFollowers, { _id: latestUserId }]
                : currentFollowers.filter(f => (f._id?.toString() || f.toString()) !== latestUserId.toString());
            
            return { ...prev, profile: { ...prev.profile, followers: updatedFollowers } };
        });

        setIsFollowLoading(true);

        try {
            const res = await API.post(`/users/follow/${id}`);
            if (res.data.isFollowing !== undefined) {
                setIsFollowing(res.data.isFollowing);
            }
            toast.success(res.data.message);
        } catch (error) {
            setIsFollowing(previousFollowStatus);
            setProfileData(prev => ({
                ...prev,
                profile: { ...prev.profile, followers: previousFollowers }
            }));
            toast.error(error.response?.data?.message || "Thao tác thất bại");
        } finally {
            setIsFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!profileData) return <div className="text-center py-20 font-bold">Người dùng không tồn tại.</div>;

    const { profile, products } = profileData;

    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="bg-white shadow">
                <div className="max-w-5xl mx-auto relative">
                    
                    {/* SỬ DỤNG PROFILE HEADER MỚI */}
                    <ProfileHeader 
                        user={profile} 
                        isOwnProfile={isMyProfile} 
                        onUpdateSuccess={handleUpdateImageSuccess} 
                    />

                    {/* PHẦN ACTION BUTTONS (Theo dõi, Nhắn tin, Chỉnh sửa) */}
                    <div className="px-6 pb-4 flex flex-col md:flex-row justify-end items-center -mt-6 md:-mt-12 gap-4 relative z-[40]">
                        <div className="flex gap-2 w-full md:w-auto">
                            {isMyProfile ? (
                                <button 
                                    onClick={() => navigate('/profile')}
                                    className="flex-1 md:flex-none px-6 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                    ✏️ Chỉnh sửa trang cá nhân
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleFollow}
                                        disabled={isFollowLoading}
                                        className={`flex-1 md:flex-none px-8 py-2 rounded-lg font-bold transition-all shadow-md min-w-[140px] 
                                        ${isFollowing ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white hover:bg-blue-700'} 
                                        ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                    >
                                        {isFollowLoading ? '...' : (isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi')}
                                    </button>
                                    <button className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-all cursor-pointer">
                                        ✉ Nhắn tin
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* TABS NAVIGATION */}
                    <div className="border-t mt-4 px-4 flex gap-8 overflow-x-auto no-scrollbar text-gray-500 font-bold relative z-10">
                        {['Sản phẩm', 'Giới thiệu', 'Người theo dõi'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 border-b-4 transition-all whitespace-nowrap cursor-pointer ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PHẦN NỘI DUNG CHI TIẾT (Giữ nguyên logic của bạn) */}
            <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 px-4">
                <div className="md:col-span-4 space-y-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-black mb-4">Giới thiệu</h2>
                        <ul className="space-y-4 text-gray-700">
                            <li className="flex items-center gap-2">🏠 <span>Sống tại <span className="font-bold">{profile.address || 'Chưa cập nhật'}</span></span></li>
                            <li className="truncate flex items-center gap-2">📧 <span>{profile.email}</span></li>
                            <li className="flex items-center gap-2">📅 <span>Tham gia: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '---'}</span></li>
                        </ul>
                    </div>
                </div>

                <div className="md:col-span-8">
                    {activeTab === 'Sản phẩm' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {products?.length > 0 ? products.map(product => (
                                <div key={product._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                                    <img src={product.imageUrl} className="w-full h-48 object-cover" alt="" />
                                    <div className="p-4">
                                        <h3 className="font-black text-gray-800 truncate">{product.title}</h3>
                                        <div className="mt-4 flex justify-between items-center">
                                            <p className="text-blue-600 font-black">{Number(product.currentPrice).toLocaleString()}đ</p>
                                            <button className="bg-gray-900 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-all">Đấu giá</button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white p-10 rounded-xl text-center border border-dashed border-gray-300 col-span-full">
                                    Chưa có sản phẩm nào.
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'Người theo dõi' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profile.followers?.length > 0 ? profile.followers.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                        {(f.fullName || f.username || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">{f.fullName || f.username || "Người dùng"}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center col-span-full py-10">Chưa có người theo dõi.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;