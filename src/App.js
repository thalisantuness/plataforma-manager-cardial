import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { PlataformaProvider } from "./context/PlataformaContext";
import "./global.css";

import Home from "./pages/home";
import ImovelListPage from "./pages/imovel-list";
import ImovelListDetails from "./pages/imovel-details";
import RegisterProduct from "./pages/register-product-admin";
import UserListAdmin from "./pages/user-list-admin"; // Adicionei o import para o componente de usuários
import LoginAdmin from "./pages/login-admin";
import ProtectRoute from "./components/ProtectRoute"; // Corrigi para usar apenas um nome (ProtectedRoute -> ProtectRoute)
import EditImovel from "./pages/edit-product-admin";
import OrdersPage from "./pages/orders";
import ReferralsPage from "./pages/referrals";

function App() {
  return (
    <PlataformaProvider>
      <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={<LoginAdmin />} />

            {/* Rotas protegidas */}
            <Route
              path="/home"
              element={
                <ProtectRoute>
                  <Home />
                </ProtectRoute>
              }
            />

            <Route
              path="/produtos"
              element={
                <ProtectRoute>
                  <ImovelListPage />
                </ProtectRoute>
              }
            />

            <Route
              path="/vender/"
              element={
                <ProtectRoute>
                  <ImovelListDetails />
                </ProtectRoute>
              }
            />

            <Route
              path="/add-product/"
              element={
                <ProtectRoute>
                  <RegisterProduct />
                </ProtectRoute>
              }
            />

            <Route
              path="/pedidos"
              element={
                <ProtectRoute>
                  <OrdersPage />
                </ProtectRoute>
              }
            />

            <Route
              path="/indicacoes"
              element={
                <ProtectRoute>
                  <ReferralsPage />
                </ProtectRoute>
              }
            />

            <Route
              path="/editar-produto/:id"
              element={
                <ProtectRoute>
                  <EditImovel />
                </ProtectRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectRoute>
                  <UserListAdmin />
                </ProtectRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </PlataformaProvider>
  );
}

export default App;
