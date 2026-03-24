import React, { useState, useCallback } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';

const BASE_URL = 'https://auction-system-mern-xeyx.onrender.com';
const FALLBACK_AVATAR = 'https://ui-avatars.com/api/?background=random&color=fff&name=User';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000';

const ImageCropperModal = ({ imageSrc, cropShape, aspectRatio, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Lỗi khi tạo file ảnh đã cắt');
          return;
        }
        const croppedFile = new File([blob], 'cropped_image.png', { type: 'image/png' });
        onCropComplete(croppedFile);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi trong quá trình cắt ảnh');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="text-2xl font-black tracking-tight text-gray-900">Tùy chỉnh hình ảnh</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="relative flex-1 bg-gray-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            classes={{
              containerClassName: 'cropper-container',
              mediaClassName: 'cropper-media',
              cropAreaClassName: 'cropper-area',
            }}
          />
        </div>
        <div className="space-y-6 border-t border-gray-100 bg-white p-8">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400">Thu nhỏ</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-100 accent-blue-600"
            />
            <span className="text-xs font-bold text-gray-400">Phóng to</span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-8 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCrop}
              className="rounded-xl bg-blue-600 px-10 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              Cắt và Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileHeader = ({ user, isOwnProfile, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: null,
    type: null,
    cropShape: 'round',
    aspectRatio: 1,
  });

  // --- HÀM ĐÃ ĐƯỢC CẬP NHẬT ĐỂ CHẶN LOCALHOST ---
  const getFullImageUrl = (path) => {
    if (!path) return null;

    // 1. Xử lý nếu path chứa localhost (lỗi do dữ liệu cũ trong DB)
    if (path.includes('localhost')) {
      // Tách lấy tên file cuối cùng (ví dụ: avatar-123.png)
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      // Ép về link server Render
      return `${BASE_URL}/uploads/${fileName}`;
    }

    // 2. Nếu đã là link tuyệt đối chuẩn (Cloudinary hoặc link https khác)
    if (path.startsWith('http')) {
      return path;
    }

    // 3. Nếu là path tương đối lưu trong DB
    const serverUrl = import.meta.env.VITE_API_URL || BASE_URL;
    const cleanServerUrl = serverUrl.replace(/\/api$/, '').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanServerUrl}${cleanPath}`;
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({
        isOpen: true,
        imageSrc: reader.result,
        type: type,
        cropShape: type === 'avatar' ? 'round' : 'rect',
        aspectRatio: type === 'avatar' ? 1 : 16 / 9,
      });
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile) => {
    const { type } = cropperState;
    setCropperState((prev) => ({ ...prev, isOpen: false, imageSrc: null }));
    const formData = new FormData();
    formData.append(type, croppedFile);
    setLoading(true);
    try {
      const endpoint = type === 'avatar' ? '/users/update-avatar' : '/users/update-cover';
      const res = await API.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success(`Đã cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}! ✨`);
        onUpdateSuccess(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi upload ảnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {cropperState.isOpen && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          cropShape={cropperState.cropShape}
          aspectRatio={cropperState.aspectRatio}
          onCropComplete={handleCropComplete}
          onClose={() => setCropperState((prev) => ({ ...prev, isOpen: false, imageSrc: null }))}
        />
      )}

      <div className="group relative h-64 overflow-hidden rounded-b-[40px] bg-gray-200 shadow-inner">
        {user.cover ? (
          <img
            src={getFullImageUrl(user.cover)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt="Cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_COVER;
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-r from-gray-200 to-gray-300 font-bold text-gray-400">
            Chưa có ảnh bìa
          </div>
        )}
        {isOwnProfile && (
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="translate-y-2 transform rounded-full bg-white/90 px-5 py-2 text-sm font-bold shadow-lg backdrop-blur-sm transition-transform group-hover:translate-y-0">
              {loading ? '⌛ Đang tải...' : '📷 Thay đổi ảnh bìa'}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              disabled={loading}
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </label>
        )}
      </div>

      <div className="relative -mt-16 flex items-end gap-6 px-10">
        <div className="group relative">
          <div className="relative h-40 w-40 overflow-hidden rounded-[40px] border-8 border-white bg-blue-100 shadow-2xl">
            {user.avatar ? (
              <img
                src={getFullImageUrl(user.avatar)}
                className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                alt="Avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_AVATAR;
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 text-5xl font-black text-blue-400">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {isOwnProfile && (
            <label className="absolute right-2 bottom-2 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-blue-600 p-3 text-white shadow-lg transition-all hover:scale-110 active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={loading}
                onChange={(e) => handleFileChange(e, 'avatar')}
              />
            </label>
          )}
        </div>

        <div className="flex-1 pb-4">
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-gray-800">
            {user.fullName}
            {user.role === 'admin' && (
              <span className="text-xl text-blue-500" title="Admin">
                ✅
              </span>
            )}
          </h1>
          <div className="mt-1 flex items-center gap-4">
            <p className="font-bold text-gray-500">{user.email}</p>
            <span className="text-gray-300">|</span>
            <div className="flex gap-4">
              <span className="cursor-default">
                <b className="text-gray-800">{user.followers?.length || 0}</b>
                <small className="ml-1 font-bold text-gray-500 uppercase">Người theo dõi</small>
              </span>
              <span className="cursor-default">
                <b className="text-gray-800">{user.following?.length || 0}</b>
                <small className="ml-1 font-bold text-gray-500 uppercase">Đang theo dõi</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
