import { useEffect, useState } from 'react';
import API from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

const FollowList = () => {
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('following'); // 'following' hoặc 'followers'
    const navigate = useNavigate();

    const fetchLists = async () => {
        try {
            setLoading(true);
            const res = await API.get('/users/follow-lists');
            setFollowing(res.data.following || []);
            setFollowers(res.data.followers || []);
        } catch (error) {
            toast.error("Không thể tải danh sách");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    const handleUnfollow = async (id) => {
        try {
            await API.post(`/users/follow/${id}`);
            toast.success("Đã bỏ theo dõi");
            fetchLists(); // Tải lại danh sách
        } catch (error) {
            toast.error("Lỗi khi thực hiện");
        }
    };

    if (loading) return <div className="text-center p-20 text-gray-400 font-bold">Đang tải danh sách...</div>;

    const currentList = activeTab === 'following' ? following : followers;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <ToastContainer />
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-all">
                        ⬅️
                    </button>
                    <h1 className="text-2xl font-black text-gray-800">Mạng lưới kết nối</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-200 p-1 rounded-2xl mb-6">
                    <button 
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'following' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Đang theo dõi ({following.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'followers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Người theo dõi ({followers.length})
                    </button>
                </div>

                {/* List Content */}
                <div className="space-y-4">
                    {currentList.length > 0 ? (
                        currentList.map(item => (
                            <div key={item._id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {item.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <Link to={`/profile/${item._id}`} className="font-bold text-gray-800 hover:text-blue-600">
                                            {item.fullName}
                                        </Link>
                                        <p className="text-xs text-gray-400">{item.email}</p>
                                    </div>
                                </div>

                                {activeTab === 'following' && (
                                    <button 
                                        onClick={() => handleUnfollow(item._id)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 rounded-xl text-xs font-bold transition-all"
                                    >
                                        Bỏ theo dõi
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                            Danh sách trống
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowList;