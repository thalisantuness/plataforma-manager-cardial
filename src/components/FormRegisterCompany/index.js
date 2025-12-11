import React, { useState } from "react";
import axios from "axios";
import "./styles.css";
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from "../../config/api";

export default function FormRegisterCompany() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    telefone: "",
    cliente_endereco: "",
    foto_perfil: null
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto_perfil: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        email: formData.email,
        senha: formData.senha,
        nome: formData.nome,
        telefone: formData.telefone,
        cliente_endereco: formData.cliente_endereco || null,
        role: "empresa",
        foto_perfil: formData.foto_perfil || null
      };

      await axios.post(
        API_ENDPOINTS.CADASTRO,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Conta empresa criada com sucesso!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });

      // Redirecionar para login após sucesso
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error("Erro ao criar conta empresa:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao criar conta empresa. Tente novamente!";

      toast.error(`Erro: ${errorMessage}`, {
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
    <div className="register-container">
      <ToastContainer />
      <div className="register-card">
        <h2 className="register-title">Criar Conta Empresa</h2>
        <p className="register-subtitle">Preencha os dados para criar sua conta empresa</p>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome" className="input-label">Nome da Empresa *</label>
            <input
              id="nome"
              className="register-input"
              type="text"
              name="nome"
              placeholder="Nome da sua empresa"
              value={formData.nome}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="input-label">Email *</label>
            <input
              id="email"
              className="register-input"
              type="email"
              name="email"
              placeholder="empresa@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="senha" className="input-label">Senha *</label>
            <input
              id="senha"
              className="register-input"
              type="password"
              name="senha"
              placeholder="••••••••"
              value={formData.senha}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefone" className="input-label">Telefone *</label>
            <input
              id="telefone"
              className="register-input"
              type="tel"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente_endereco" className="input-label">Endereço</label>
            <input
              id="cliente_endereco"
              className="register-input"
              type="text"
              name="cliente_endereco"
              placeholder="Endereço completo (opcional)"
              value={formData.cliente_endereco}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="foto_perfil" className="input-label">Foto do Perfil</label>
            <input
              id="foto_perfil"
              className="register-input"
              type="file"
              name="foto_perfil"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            {formData.foto_perfil && (
              <div className="preview-image">
                <img src={formData.foto_perfil} alt="Preview" />
              </div>
            )}
          </div>
          
          <button className="register-button" type="submit" disabled={loading}>
            {loading ? (
              <span className="button-loader"></span>
            ) : (
              "Criar Conta"
            )}
          </button>

          <div className="register-footer">
            <p className="register-link-text">
              Já tem uma conta? <Link to="/" className="register-link">Fazer login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

