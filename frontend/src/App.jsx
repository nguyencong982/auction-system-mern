import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

// --- IMPORT 2 TRANG MỚI ---
import WithdrawMoney from './pages/Profile/WithdrawMoney';
import AdminWithdrawal from './pages/Admin/AdminWithdrawal';
import AdminDeposit from './pages/Admin/AdminDeposit';

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
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/sold-products" element={<SoldProducts />} />

          {/* --- PROTECTED ROUTES (Cần login) --- */}
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
                <Profile />
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

          {/* --- ROUTE RÚT TIỀN (USER) --- */}
          <Route
            path="/withdraw"
            element={
              <PrivateRoute>
                <WithdrawMoney />
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

          {/* --- ROUTE QUẢN LÝ RÚT TIỀN (ADMIN) --- */}
          <Route
            path="/admin/withdrawal"
            element={
              <PrivateRoute>
                <AdminWithdrawal />
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
