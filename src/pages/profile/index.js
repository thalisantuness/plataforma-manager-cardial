import React, { useState } from "react";
import SideBar from "../../components/SideBar";
import { usePlataforma } from "../../context/PlataformaContext";
import { API_ENDPOINTS } from "../../config/api";
import "./styles.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FaSave, FaSpinner, FaUpload } from "react-icons/fa";

function ProfilePage() {
  const { usuario, getAuthHeaders, login } = usePlataforma();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => ({
    nome: usuario?.nome || "",
    telefone: usuario?.telefone || "",
    email: usuario?.email || "",
    role: usuario?.role || "",
    foto_perfil: usuario?.foto_perfil || usuario?.imageData || "",
    senha: ""
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, foto_perfil: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario?.usuario_id) return;
    setSaving(true);
    try {
      const USERS_API_URL = API_ENDPOINTS.USUARIOS;
      const API_URL = `${USERS_API_URL}/${usuario.usuario_id}`;
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
      };
      // Envia senha apenas se preenchida
      if (formData.senha && formData.senha.length >= 6) {
        payload.senha = formData.senha;
      }

      const { data } = await axios.put(API_URL, payload, {
        headers: getAuthHeaders(),
      });

      // Atualiza usuário no contexto/localStorage para refletir na UI
      const respostaUsuario = data?.usuario || data;
      const usuarioAtualizado = {
        ...usuario,
        ...respostaUsuario,
        // mantém foto atual até o PATCH confirmar atualização
        foto_perfil: usuario.foto_perfil || formData.foto_perfil || respostaUsuario.foto_perfil,
        senha: undefined
      };
      login(usuarioAtualizado, localStorage.getItem("token"));

      // Atualização de foto via endpoint específico (PATCH /usuarios/:id/foto)
      if (formData.foto_perfil) {
        try {
          const respFoto = await axios.patch(
            `${USERS_API_URL}/${usuario.usuario_id}/foto`,
            { foto_perfil: formData.foto_perfil },
            { headers: getAuthHeaders() }
          );
          const dadosFoto = respFoto?.data?.usuario || respFoto?.data;
          if (dadosFoto && (dadosFoto.foto_perfil || dadosFoto.imageData)) {
            login({
              ...usuarioAtualizado,
              foto_perfil: dadosFoto.foto_perfil || dadosFoto.imageData
            }, localStorage.getItem("token"));
          }
        } catch (e) {
          // mantém a atualização local mesmo se o backend não persistir a foto
        }
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Erro ao atualizar perfil";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Mantido apenas caso seja necessário no futuro

  if (!usuario) {
    return (
      <div className="container">
        <SideBar />
        <div className="main-content">
          <div className="profile-container">
            <div className="profile-card">
              <h2>Carregando perfil...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <div className="profile-container">
          <div className="profile-card">
            <ToastContainer />
            <div className="profile-header">
              <div className="avatar">
                {formData.foto_perfil ? (
                  <img src={formData.foto_perfil} alt={usuario.nome} />
                ) : (
                  <div className="avatar-fallback">{usuario?.nome?.[0]?.toUpperCase() || "U"}</div>
                )}
              </div>
              <div className="profile-title">
                <h1>Meu Perfil</h1>
                <p>Informações da conta</p>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-info-grid">
                <div className="info-item">
                  <label>Nome</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label>Perfil</label>
                  <div className="info-badge">{formData.role}</div>
                </div>
                <div className="info-item">
                  <label>Nova Senha (opcional)</label>
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div className="info-item full">
                  <label>Foto de Perfil</label>
                  <div className="photo-row">
                    <label className="upload-btn">
                      <FaUpload /> Alterar Foto
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                    {formData.foto_perfil && (
                      <img className="photo-preview" src={formData.foto_perfil} alt="Preview" />
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <FaSpinner className="spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <FaSave /> Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;


