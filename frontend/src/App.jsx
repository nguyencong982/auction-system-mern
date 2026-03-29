import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import API from './api'; // Đảm bảo bạn đã có file cấu hình axios/api

// Import Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Home from './pages/Home';
import CreateProduct from './pages/Product/CreateProduct';
import Notifications from './components/Notifications';
import Profile from './pages/Profile/Profile';
import UserProfile from './pages/Profile/UserProfile';
import ManageProducts from './pages/Product/ManageProducts';
import ProductDetail from './pages/Product/ProductDetail';
import Deposit from './pages/Profile/Deposit';
import FollowList from './pages/Profile/FollowList';
import MyBids from './pages/Profile/MyBids';
import SoldProducts from './pages/Product/SoldProducts';

// --- IMPORT TRANG MỚI ---
import WithdrawMoney from './pages/Profile/WithdrawMoney';
import AdminWithdrawal from './pages/Admin/AdminWithdrawal';
import AdminDeposit from './pages/Admin/AdminDeposit';
import SetupPaymentPin from './pages/Profile/SetupPaymentPin';

// Component tự động cuộn lên đầu trang khi đổi route
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Component bảo vệ Route (Yêu cầu đăng nhập)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState(null);

  // Hàm fetch thông tin user dùng chung cho toàn app
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await API.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
        // Lưu vào localStorage để các component khác có thể lấy nhanh nếu cần
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (error) {
      console.error('Lỗi đồng bộ dữ liệu User:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900 antialiased">
        <Routes>
          {/* --- AUTH ROUTES --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- PUBLIC ROUTES --- */}
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/sold-products" element={<SoldProducts />} />

          {/* --- PROTECTED ROUTES --- */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home user={user} />
              </PrivateRoute>
            }
          />

          <Route
            path="/create-product"
            element={
              <PrivateRoute>
                <CreateProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-products"
            element={
              <PrivateRoute>
                <ManageProducts />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-bids"
            element={
              <PrivateRoute>
                <MyBids />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile user={user} onRefresh={fetchUserData} />
              </PrivateRoute>
            }
          />

          <Route
            path="/deposit"
            element={
              <PrivateRoute>
                <Deposit />
              </PrivateRoute>
            }
          />
          <Route
            path="/follow-lists"
            element={
              <PrivateRoute>
                <FollowList />
              </PrivateRoute>
            }
          />
          <Route
            path="/withdraw"
            element={
              <PrivateRoute>
                <WithdrawMoney user={user} />
              </PrivateRoute>
            }
          />

          {/* --- ADMIN ROUTES --- */}
          <Route
            path="/admin/deposit"
            element={
              <PrivateRoute>
                <AdminDeposit />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/withdrawal"
            element={
              <PrivateRoute>
                <AdminWithdrawal />
              </PrivateRoute>
            }
          />

          {/* --- SETTINGS --- */}
          <Route
            path="/settings/payment-pin"
            element={
              <PrivateRoute>
                {/* Truyền user và hàm refresh vào đây để SetupPaymentPin nhận được số điện thoại */}
                <SetupPaymentPin user={user} onRefreshProfile={fetchUserData} />
              </PrivateRoute>
            }
          />

          {/* --- 404 HANDLER --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
