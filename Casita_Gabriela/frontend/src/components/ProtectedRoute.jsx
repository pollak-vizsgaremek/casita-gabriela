import React from 'react'
import { Navigate } from 'react-router'

// Védett útvonal: ellenőrzi a tokent és opcionálisan az admin jogosultságot
const ProtectedRoute = ({ children, adminOnly = true }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !(user && (user.isAdmin === true || user.isAdmin === 1))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute
