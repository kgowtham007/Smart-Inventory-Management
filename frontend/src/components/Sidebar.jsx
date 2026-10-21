import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RoleGuard from './RoleGuard';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
  { to: '/suppliers', label: 'Suppliers', icon: '🚚' },
  { to: '/transactions', label: 'Transactions', icon: '📋' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
    }`;

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-blue-800 transition-transform duration-300 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          <span className="text-lg font-bold text-white">📦 SmartInv</span>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="border-b border-blue-700 px-4 pb-4">
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
              <span aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
          <RoleGuard roles={['admin']}>
            <NavLink to="/users" className={linkClass} onClick={onClose}>
              <span aria-hidden="true">👥</span>
              Users
            </NavLink>
          </RoleGuard>
        </nav>

        {/* Logout */}
        <div className="border-t border-blue-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
