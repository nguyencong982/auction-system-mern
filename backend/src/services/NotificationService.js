import Notification from '../models/Notification.js';
import { io } from '../app.js';

class NotificationService {
    async createNotification(data) {
        try {
            const noti = new Notification(data);
            await noti.save();

            // Gửi Real-time đến đúng người nhận (nếu họ đang online)
            // Chúng ta dùng ID của người nhận làm tên "phòng" (Room)
            io.to(data.recipient.toString()).emit('newNotification', noti);
            
            return noti;
        } catch (error) {
            console.error('Lỗi tạo thông báo:', error);
        }
    }
}

export default new NotificationService();