import React, { useState } from "react";
import axios from "axios";
import "./styles.css";
import { ToastContainer, toast } from 'react-toastify';
import { usePlataforma } from "../../context/PlataformaContext";
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from "../../config/api";

export default function FormLogin() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = usePlataforma();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        API_ENDPOINTS.LOGIN,
        formData,
        { headers: { "Content-Type": "application/json" } }
      ); 
      
      const { usuario: usuarioData, token: tokenData } = response.data;
      
      if (tokenData && usuarioData) {
        toast.success("Login realizado com sucesso!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        
        // Usar a função login do contexto
        login(usuarioData, tokenData);
        
        // Redirecionar após um breve delay para mostrar o toast
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
        
      const errorMessage = error.response?.data?.message || "Erro desconhecido ao logar!";

      toast.error(`Erro ao logar: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <div className="login-card">
        <h2 className="login-title">Acesso Administrativo</h2>
        <p className="login-subtitle">Insira suas credenciais para acessar o painel</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              className="login-input"
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="senha" className="input-label">Senha</label>
            <input
              id="senha"
              className="login-input"
              type="password"
              name="senha"
              placeholder="••••••••"
              value={formData.senha}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (
              <span className="button-loader"></span>
            ) : (
              "Entrar"
            )}
          </button>

          <div className="login-footer">
            <p className="login-link-text">
              Não tem uma conta? <Link to="/registrar-empresa" className="login-link">Criar conta empresa</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}