import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo-transparente.png";
import "./styles.css";

export default function SideBar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Botão hamburger para mobile */}
      {isMobile && (
        <button className="menu-toggle" onClick={toggleMobileMenu}>
          ☰
        </button>
      )}

      <header className={`navbar ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="logo-container">
          <Link to="/" onClick={closeMobileMenu}>
            <img src={Logo} className="logo-img" alt="Logo" />
          </Link>
        </div>

        <div className="links">
          <Link to="/produtos" onClick={closeMobileMenu}>
            Produtos
          </Link>

          <Link to="/pedidos" onClick={closeMobileMenu}>
            Pedidos
          </Link>

          {/* <Link to="/indicacoes" onClick={closeMobileMenu}>
            Indicações
          </Link> */}

          <Link to="/usuarios" onClick={closeMobileMenu}>
            Usuários
          </Link>

          {/* <Link to="/vender" onClick={closeMobileMenu}>
            Vender
          </Link> */}
        </div>
      </header>
    </>
  );
}