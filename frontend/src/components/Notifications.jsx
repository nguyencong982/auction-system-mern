import { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleReadNotif = async (notifId, isRead) => {
    if (isRead) return;

    setNotifications(prev => 
      prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
    );

    try {
      await API.put(`/notifications/${notifId}/read`);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đã đọc:", error);
      fetchNotifications();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Thông báo của tôi</h2>
        <button 
          onClick={() => navigate('/')} 
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
        >
          <span>←</span> Quay lại sàn
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              onClick={() => handleReadNotif(notif._id, notif.isRead)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                notif.isRead 
                ? 'bg-white border-gray-100' 
                : 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50'
              }`}
            >
              {!notif.isRead && (
                <span className="absolute top-5 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              )}

              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2.5 rounded-xl transition-colors ${notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                   {/* HIỂN THỊ ICON THEO LOẠI THÔNG BÁO */}
                   {notif.type === 'winner_announced' ? '🏆' : 
                    notif.type === 'new_follower' ? '👤' : '🔔'}
                </div>
                <div className="flex-1">
                  <p className={`leading-relaxed transition-colors ${notif.isRead ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
                    {notif.content}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                    {new Date(notif.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <span className="text-4xl">🏜️</span>
            <p className="text-gray-400 font-medium mt-3">Trống không... Bạn chưa có thông báo mới.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;