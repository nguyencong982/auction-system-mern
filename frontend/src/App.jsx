import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import API from './api';

// --- IMPORT TOASTIFY ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import AdminApproveProduct from './pages/Admin/AdminApproveProduct';
import SetupPaymentPin from './pages/Profile/SetupPaymentPin';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) return <Navigate to="/login" replace />;

  if (roleRequired === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await API.get('/auth/profile');
      if (res.data.success) {
        const newUser = res.data.data;
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Lỗi đồng bộ dữ liệu User:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <Router>
      <ScrollToTop />

      {/* SỬA TẠI ĐÂY: 
          1. Đưa ToastContainer lên đầu ngay dưới Router.
          2. Thêm style cưỡng bức zIndex cực cao (999999).
          3. Thêm thuộc tính stacked để dễ nhìn khi có nhiều lỗi cùng lúc.
      */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        stacked
        style={{ zIndex: 999999 }}
      />

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
              <PrivateRoute roleRequired="admin">
                <AdminDeposit />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/withdrawal"
            element={
              <PrivateRoute roleRequired="admin">
                <AdminWithdrawal />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/approve-products"
            element={
              <PrivateRoute roleRequired="admin">
                <AdminApproveProduct />
              </PrivateRoute>
            }
          />

          {/* --- SETTINGS --- */}
          <Route
            path="/settings/payment-pin"
            element={
              <PrivateRoute>
                <SetupPaymentPin user={user} onRefreshProfile={fetchUserData} />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
