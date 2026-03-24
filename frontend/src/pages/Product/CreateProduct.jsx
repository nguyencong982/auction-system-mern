import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const CreateProduct = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    initialPrice: '',
    stepPrice: '',
    endTime: '',
    category: 'Công nghệ', // Đã sửa: Khớp với option đầu tiên hiển thị trên UI
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile)); // Tạo link tạm để hiển thị
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra nhanh trước khi gửi
    if (!file) {
      return alert('Vui lòng chọn một tấm ảnh thật đẹp cho sản phẩm!');
    }

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('initialPrice', formData.initialPrice);
      data.append('stepPrice', formData.stepPrice);
      data.append('category', formData.category);

      // Tính toán durationHours từ endTime nếu Backend của bạn dùng durationHours
      // Hoặc nếu bạn đã sửa Backend nhận endTime thì giữ nguyên line dưới:
      data.append('endTime', formData.endTime);

      // KEY NÀY PHẢI KHỚP: upload.single('image') ở Backend
      data.append('image', file);

      // KHUYÊN DÙNG: Để Axios tự xử lý Header cho FormData
      await API.post('/products', data);

      alert('🚀 Đăng sản phẩm thành công!');
      navigate('/');
    } catch (error) {
      console.error('Lỗi khi đăng sản phẩm:', error.response?.data);
      alert(error.response?.data?.message || 'Lỗi server (500) hoặc lỗi đường truyền');
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
      <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">Đăng sản phẩm đấu giá</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Khu vực Upload & Preview ảnh */}
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-colors hover:border-blue-400">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="mb-4 h-48 w-48 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="mb-4 flex h-48 w-48 flex-col items-center justify-center rounded-2xl bg-gray-200 text-gray-400">
              <span className="mb-2 text-4xl">📸</span>
              <span className="text-sm">Chưa có ảnh</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Tên sản phẩm"
            required
            className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          {/* --- THÊM Ô CHỌN DANH MỤC --- */}
          <div>
            <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
              Danh mục sản phẩm
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Công nghệ">📱 Công nghệ</option>
              <option value="Thời trang">👕 Thời trang</option>
              <option value="Đồ cổ">🏺 Đồ cổ</option>
              <option value="Gia dụng">🏠 Gia dụng</option>
              <option value="Khác">📦 Khác</option>
            </select>
          </div>
          {/* ---------------------------- */}

          <textarea
            placeholder="Mô tả chi tiết sản phẩm..."
            required
            className="h-32 w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                Giá khởi điểm
              </label>
              <input
                type="number"
                placeholder="VNĐ"
                required
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({ ...formData, initialPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                Bước giá tối thiểu
              </label>
              <input
                type="number"
                placeholder="VNĐ"
                required
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({ ...formData, stepPrice: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
              Thời gian kết thúc
            </label>
            <input
              type="datetime-local"
              required
              className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          Xác nhận đăng bán
        </button>
      </form>
    </div>
  );
};

export default CreateProduct;
