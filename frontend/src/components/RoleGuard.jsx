import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Renders children only if current user has one of the allowed roles.
 */
const RoleGuard = ({ roles = [], children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return fallback;
  }

  return children;
};

export default RoleGuard;
