// components/ProtectedRoute/index.js
import React from "react";
import { Navigate } from "react-router-dom";
import { usePlataforma } from "../../context/PlataformaContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePlataforma();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;