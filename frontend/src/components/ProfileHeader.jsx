import React, { useState, useCallback } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';

const BASE_URL = 'http://localhost:5000/uploads';
const FALLBACK_AVATAR = "https://ui-avatars.com/api/?background=random&color=fff&name=User";
const FALLBACK_COVER = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000";

const ImageCropperModal = ({ imageSrc, cropShape, aspectRatio, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => { setCrop(crop); };
  const onZoomChange = (zoom) => { setZoom(zoom); };

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const image = new Image();
      image.src = imageSrc;
      await new Promise(resolve => image.onload = resolve);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, croppedAreaPixels.width, croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Lỗi khi tạo file ảnh đã cắt");
          return;
        }
        const croppedFile = new File([blob], "cropped_image.png", { type: "image/png" });
        onCropComplete(croppedFile);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      toast.error("Lỗi trong quá trình cắt ảnh");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tùy chỉnh hình ảnh</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 relative bg-gray-950">
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
            classes={{ containerClassName: 'cropper-container', mediaClassName: 'cropper-media', cropAreaClassName: 'cropper-area' }}
          />
        </div>
        <div className="p-8 border-t border-gray-100 space-y-6 bg-white">
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-gray-400">Thu nhỏ</span>
             <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="flex-1 h-1 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
             <span className="text-xs font-bold text-gray-400">Phóng to</span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-8 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={handleCrop} className="px-10 py-3 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Cắt và Lưu</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileHeader = ({ user, isOwnProfile, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [cropperState, setCropperState] = useState({ isOpen: false, imageSrc: null, type: null, cropShape: 'round', aspectRatio: 1 });

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}?t=${new Date().getTime()}`;
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file hình ảnh!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({ isOpen: true, imageSrc: reader.result, type: type, cropShape: type === 'avatar' ? 'round' : 'rect', aspectRatio: type === 'avatar' ? 1 : 16 / 9 });
      e.target.value = null; 
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile) => {
    const { type } = cropperState;
    setCropperState(prev => ({ ...prev, isOpen: false, imageSrc: null }));
    const formData = new FormData();
    formData.append(type, croppedFile);
    setLoading(true);
    try {
      const endpoint = type === 'avatar' ? '/users/update-avatar' : '/users/update-cover';
      const res = await API.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success(`Đã cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}! ✨`);
        onUpdateSuccess(res.data.data); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {cropperState.isOpen && (
        <ImageCropperModal imageSrc={cropperState.imageSrc} cropShape={cropperState.cropShape} aspectRatio={cropperState.aspectRatio} onCropComplete={handleCropComplete} onClose={() => setCropperState(prev => ({ ...prev, isOpen: false, imageSrc: null }))} />
      )}

      <div className="relative h-64 bg-gray-200 rounded-b-[40px] overflow-hidden group shadow-inner">
        {user.cover ? (
          <img src={getFullImageUrl(user.cover)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_COVER; }} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 font-bold bg-gradient-to-r from-gray-200 to-gray-300">Chưa có ảnh bìa</div>
        )}
        {isOwnProfile && (
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
            <div className="bg-white/90 backdrop-blur-sm px-5 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
              {loading ? "⌛ Đang tải..." : "📷 Thay đổi ảnh bìa"}
            </div>
            <input type="file" className="hidden" accept="image/*" disabled={loading} onChange={(e) => handleFileChange(e, 'cover')} />
          </label>
        )}
      </div>

      <div className="px-10 -mt-16 flex items-end gap-6 relative">
        <div className="relative group">
          <div className="w-40 h-40 rounded-[40px] border-8 border-white bg-blue-100 overflow-hidden shadow-2xl relative">
            {user.avatar ? (
              <img src={getFullImageUrl(user.avatar)} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90" alt="Avatar" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-black text-blue-400 bg-blue-50">{user.fullName?.charAt(0).toUpperCase()}</div>
            )}
            {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
          
          {isOwnProfile && (
            <label className="absolute bottom-2 right-2 bg-blue-600 p-3 rounded-2xl text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg border-2 border-white flex items-center justify-center">
              {/* SỬA LỖI ICON CAMERA TẠI ĐÂY - Dùng SVG Path chuẩn không bị rotate */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <input type="file" className="hidden" accept="image/*" disabled={loading} onChange={(e) => handleFileChange(e, 'avatar')} />
            </label>
          )}
        </div>

        <div className="pb-4 flex-1">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            {user.fullName}
            {user.role === 'admin' && <span className="text-blue-500 text-xl" title="Admin">✅</span>}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-500 font-bold">{user.email}</p>
            <span className="text-gray-300">|</span>
            {/* THÊM CHỨC NĂNG SỐ LƯỢNG NGƯỜI THEO DÕI */}
            <div className="flex gap-4">
              <span className="cursor-default">
                <b className="text-gray-800">{user.followers?.length || 0}</b> 
                <small className="text-gray-500 font-bold uppercase ml-1">Người theo dõi</small>
              </span>
              <span className="cursor-default">
                <b className="text-gray-800">{user.following?.length || 0}</b> 
                <small className="text-gray-500 font-bold uppercase ml-1">Đang theo dõi</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;