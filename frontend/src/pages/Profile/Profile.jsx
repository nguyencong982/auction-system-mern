import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import API from '../../api'; 
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
// Import ProfileHeader
import ProfileHeader from '../../components/ProfileHeader';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        balance: 0,
        avatar: '', // Thêm để quản lý ảnh đại diện
        cover: ''   // Thêm để quản lý ảnh bìa
    });

    // 1. Lấy thông tin cá nhân
    const fetchProfile = async () => {
        try {
            const res = await API.get('/auth/profile');
            setUser(res.data.data);
        } catch (error) {
            console.error("Lỗi lấy thông tin", error);
            toast.error("Không thể tải thông tin cá nhân");
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Hàm callback cập nhật lại State khi upload ảnh thành công từ ProfileHeader
    const handleUpdateImageSuccess = (updatedUser) => {
        setUser(updatedUser);
        // Đồng bộ với localStorage để các component khác (như Navbar) cập nhật theo
        const localData = JSON.parse(localStorage.getItem('user'));
        if (localData) {
            localStorage.setItem('user', JSON.stringify({ ...localData, ...updatedUser }));
        }
    };

    // 2. Hàm xử lý cập nhật thông tin chữ
    const handleUpdate = async (e) => {
        e.preventDefault(); 
        try {
            const res = await API.put('/auth/profile', {
                fullName: user.fullName,
                phone: user.phone,
                address: user.address
            });

            if (res.data.success || res.status === 200) {
                toast.success("🎉 Cập nhật thông tin thành công!");

                // Cập nhật lại state local với dữ liệu mới từ server
                setUser(res.data.data);

                setTimeout(() => {
                    navigate('/home'); 
                }, 1500);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10"> {/* Mở rộng max-width để Header đẹp hơn */}
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* --- THÊM PROFILE HEADER VÀO ĐÂY --- */}
            <ProfileHeader 
                user={user} 
                isOwnProfile={true} 
                onUpdateSuccess={handleUpdateImageSuccess} 
            />

            <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-[2rem] mt-6 border border-gray-100">
                <h2 className="text-2xl font-black mb-6 text-gray-800 border-b pb-4">Thông tin tài khoản</h2>
                
                <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Số dư ví hiện tại</p>
                    <p className="font-black text-blue-600 text-2xl">{user.balance?.toLocaleString()} <span className="text-sm font-normal">VNĐ</span></p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-gray-600 font-bold mb-2 ml-1">Họ và tên</label>
                        <input 
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none font-medium transition-all"
                            value={user.fullName}
                            onChange={(e) => setUser({...user, fullName: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 font-bold mb-2 ml-1">Email (Cố định)</label>
                        <input 
                            className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-100 cursor-not-allowed text-gray-500"
                            value={user.email}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-bold mb-2 ml-1">Số điện thoại liên lạc</label>
                        <input 
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none font-medium transition-all"
                            placeholder="Nhập SĐT của bạn"
                            value={user.phone}
                            onChange={(e) => setUser({...user, phone: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-bold mb-2 ml-1">Địa chỉ nhận hàng</label>
                        <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none font-medium transition-all"
                            rows="3"
                            placeholder="Số nhà, tên đường..."
                            value={user.address}
                            onChange={(e) => setUser({...user, address: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95"
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