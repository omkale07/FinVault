import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User pages
import DashboardPage from './pages/dashboard/DashboardPage';
import WalletsPage from './pages/wallets/WalletsPage';
import WalletDetailPage from './pages/wallets/WalletDetailPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import TransactionDetailPage from './pages/transactions/TransactionDetailPage';
import TransferPage from './pages/money/TransferPage';
import TransactPage from './pages/money/TransactPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import ProfilePage from './pages/account/ProfilePage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminWalletsPage from './pages/admin/AdminWalletsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected user routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/wallets/:id" element={<WalletDetailPage />} />
            <Route path="/wallets/:id/transact" element={<TransactPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/wallets" element={<AdminWalletsPage />} />
              <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
