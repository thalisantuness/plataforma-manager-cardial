import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { FaTrash, FaPlus, FaSpinner, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlataforma } from '../../context/PlataformaContext';
import './styles.css';

function FormRegister({ productId }) {
  const { getAuthHeaders, isAuthenticated } = usePlataforma();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    valor_custo: '',
    quantidade: '',
    tipo_comercializacao: 'Venda',
    tipo_produto: 'Eletrônico',
    menu: '',
    empresas_autorizadas: [],
    foto_principal: ''
  });

  // Estados do componente
  const [loading, setLoading] = useState(false);
  const [produtoId, setProdutoId] = useState(id || productId || null);
  const [photos, setPhotos] = useState([]);
  const [newPhoto, setNewPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(!!(id || productId));
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const fileInputRef = useRef(null);
  const secondaryPhotosInputRef = useRef(null);

  // URL da API
  const API_URL = "https://back-pdv-production.up.railway.app/produtos";
  const USUARIOS_API_URL = "https://back-pdv-production.up.railway.app/usuarios";

  // Carrega dados do produto se estiver editando e empresas
  useEffect(() => {
    if (isEditing && produtoId) {
      fetchProductData();
    }
    carregarEmpresas();
  }, [isEditing, produtoId]);

  const carregarEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const response = await axios.get(USUARIOS_API_URL, {
        headers: getAuthHeaders()
      });
      
      const empresasFiltradas = response.data.filter(usuario => usuario.role === "empresa");
      setEmpresas(empresasFiltradas);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar lista de empresas!");
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${produtoId}`, {
        headers: getAuthHeaders()
      });
      
      const produto = response.data;
      setFormData({
        nome: produto.nome || '',
        valor: produto.valor || '',
        valor_custo: produto.valor_custo || '',
        quantidade: produto.quantidade || '',
        tipo_comercializacao: produto.tipo_comercializacao || 'Venda',
        tipo_produto: produto.tipo_produto || 'Eletrônico',
        menu: produto.menu || '',
        empresas_autorizadas: produto.empresas_autorizadas || [],
        foto_principal: produto.foto_principal || ''
      });

      // Carrega fotos secundárias
      if (produto.photos && Array.isArray(produto.photos)) {
        setPhotos(produto.photos);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do produto:', error);
      toast.error('Erro ao carregar dados do produto!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Manipuladores de eventos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value === '' ? '' : Number(value) });
  };

  const handleEmpresasChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(Number(options[i].value));
      }
    }
    setFormData({ ...formData, empresas_autorizadas: selected });
  };

  const handleMainImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto_principal: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      toast.error('Usuário não autenticado!');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        nome: formData.nome,
        valor: Number(formData.valor),
        valor_custo: Number(formData.valor_custo),
        quantidade: Number(formData.quantidade),
        tipo_comercializacao: formData.tipo_comercializacao,
        tipo_produto: formData.tipo_produto,
        menu: formData.menu || null,
        empresas_autorizadas: formData.empresas_autorizadas.length > 0 ? formData.empresas_autorizadas : null,
        foto_principal: formData.foto_principal || ""
      };

      let response;
      if (isEditing && produtoId) {
        // Edição de produto existente
        response = await axios.put(`${API_URL}/${produtoId}`, payload, {
          headers: getAuthHeaders()
        });
        toast.success('Produto atualizado com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        // Cadastro de novo produto
        response = await axios.post(API_URL, payload, {
          headers: getAuthHeaders()
        });
        const id = response.data.produto_id;
        setProdutoId(id);
        setIsEditing(true);
        toast.success('Produto cadastrado com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      const errorMessage = error.response?.data?.message || 
        (isEditing ? 'Erro ao atualizar produto!' : 'Erro ao cadastrar produto!');
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addSecondaryPhoto = async () => {
    if (!newPhoto || !produtoId) return;
    
    setUploadingPhoto(true);
    try {
      await axios.post(
        `${API_URL}/${produtoId}/fotos`,
        { imageBase64: newPhoto },
        { headers: getAuthHeaders() }
      );
      
      setNewPhoto(null);
      if (secondaryPhotosInputRef.current) {
        secondaryPhotosInputRef.current.value = '';
      }
      
      // Recarrega as fotos
      await fetchProductData();
      
      toast.success('Foto secundária adicionada com sucesso!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao adicionar foto secundária:', error);
      toast.error('Erro ao adicionar foto!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
    setUploadingPhoto(false);
  };

  const removeSecondaryPhoto = async (photoId) => {
    setDeletingPhoto(photoId);
    try {
      // Nota: Você precisará implementar um endpoint para deletar fotos secundárias
      // Por enquanto, vamos apenas remover da lista local
      setPhotos(photos.filter(photo => photo.photo_id !== photoId));
      
      toast.success('Foto removida com sucesso!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
    setDeletingPhoto(null);
  };

  const handleBack = () => {
    navigate('/produtos');
  };

  // Renderização
  return (
    <div className="product-form-container">
      <ToastContainer />
      
      {/* Header */}
      <div className="form-header">
        <button onClick={handleBack} className="back-button">
          <FaArrowLeft /> Voltar
        </button>
        <h2>{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
      </div>
      
      <form className="form-register" onSubmit={handleSubmit}>
        {/* Seção de informações básicas */}
        <div className="form-section">
          <h3>Informações do Produto</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome do Produto *</label>
              <input
                type="text"
                name="nome"
                placeholder="Ex: Smartphone Samsung Galaxy"
                value={formData.nome}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Categoria *</label>
              <select
                name="tipo_produto"
                value={formData.tipo_produto}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="Eletrônico">Eletrônico</option>
                <option value="Móvel">Móvel</option>
                <option value="Roupa">Roupa</option>
                <option value="Alimento">Alimento</option>
                <option value="Bebida">Bebida</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Seção de valores */}
        <div className="form-section">
          <h3>Valores e Estoque</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Preço de Venda *</label>
              <input
                type="number"
                name="valor"
                placeholder="R$ 0,00"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={handleNumberChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Preço de Custo *</label>
              <input
                type="number"
                name="valor_custo"
                placeholder="R$ 0,00"
                step="0.01"
                min="0"
                value={formData.valor_custo}
                onChange={handleNumberChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Quantidade em Estoque *</label>
              <input
                type="number"
                name="quantidade"
                placeholder="0"
                min="0"
                value={formData.quantidade}
                onChange={handleNumberChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Comercialização *</label>
              <select
                name="tipo_comercializacao"
                value={formData.tipo_comercializacao}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="Venda">Venda</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Serviço">Serviço</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Seção de menu */}
        <div className="form-section">
          <h3>Canal de Vendas e Autorizações</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Disponível em</label>
              <select
                name="menu"
                value={formData.menu}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Selecione um canal (opcional)</option>
                <option value="ecommerce">E-commerce</option>
                <option value="varejo">Varejo</option>
                <option value="ambos">Ambos</option>
              </select>
              <small className="field-hint">
                Define em qual canal este produto estará disponível. Deixe em branco para disponibilizar em todos os canais.
              </small>
            </div>
            
            <div className="form-group">
              <label>Empresas Autorizadas (Ctrl/Cmd + Clique para selecionar múltiplas)</label>
              <select
                multiple
                value={formData.empresas_autorizadas}
                onChange={handleEmpresasChange}
                disabled={loading || loadingEmpresas}
                style={{ minHeight: '120px' }}
              >
                {loadingEmpresas ? (
                  <option disabled>Carregando empresas...</option>
                ) : empresas.length === 0 ? (
                  <option disabled>Nenhuma empresa cadastrada</option>
                ) : (
                  empresas.map(empresa => (
                    <option key={empresa.usuario_id} value={empresa.usuario_id}>
                      {empresa.nome} ({empresa.email})
                    </option>
                  ))
                )}
              </select>
              <small className="field-hint">
                Selecione as empresas que podem usar este produto. Deixe em branco para permitir todas as empresas. Use Ctrl/Cmd + Clique para selecionar múltiplas.
              </small>
            </div>
          </div>
        </div>
        
        {/* Seção de imagem principal */}
        <div className="form-section">
          <h3>Imagem Principal (Opcional)</h3>
          <div className="form-group">
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                disabled={loading}
              />
              <span className="file-upload-button">
                {formData.foto_principal ? 'Alterar Imagem Principal' : 'Selecionar Imagem Principal'}
              </span>
              {formData.foto_principal && (
                <span className="file-upload-status">
                  <FaCheck className="success-icon" /> Imagem principal selecionada
                </span>
              )}
            </label>
            {formData.foto_principal && (
              <div className="image-preview">
                <img src={formData.foto_principal} alt="Preview principal" />
              </div>
            )}
          </div>
        </div>
        
        {/* Botão de submit */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" /> {isEditing ? 'Atualizando...' : 'Cadastrando...'}
              </>
            ) : (
              isEditing ? 'Atualizar Produto' : 'Cadastrar Produto'
            )}
          </button>
        </div>
      </form>

      {/* Seção de fotos secundárias (apenas quando editar) */}
      {isEditing && produtoId && (
        <div className="secondary-photos-section">
          <div className="section-header">
            <h3>Fotos Secundárias do Produto</h3>
            <p>Adicione fotos adicionais para mostrar diferentes ângulos do produto</p>
          </div>
          
          {/* Lista de fotos secundárias */}
          {photos.length > 0 ? (
            <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo.photo_id} className="photo-item">
                  <img src={photo.imageData} alt={`Produto ${photo.photo_id}`} />
                  <button
                    onClick={() => removeSecondaryPhoto(photo.photo_id)}
                    disabled={deletingPhoto === photo.photo_id}
                    className="delete-photo"
                    title="Remover foto"
                  >
                    {deletingPhoto === photo.photo_id ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-photos">Nenhuma foto secundária adicionada ainda.</p>
          )}
          
          {/* Formulário para adicionar nova foto secundária */}
          <div className="add-photo-container">
            <h4>Adicionar Nova Foto Secundária</h4>
            <div className="add-photo-form">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewPhotoUpload}
                  ref={secondaryPhotosInputRef}
                  disabled={uploadingPhoto}
                />
                <span className="file-upload-button">
                  <FaPlus /> Selecionar Foto Secundária
                </span>
              </label>
              
              {newPhoto && (
                <>
                  <div className="image-preview">
                    <img src={newPhoto} alt="Nova foto secundária" />
                  </div>
                  <button
                    onClick={addSecondaryPhoto}
                    disabled={uploadingPhoto}
                    className="add-photo-button"
                  >
                    {uploadingPhoto ? (
                      <>
                        <FaSpinner className="spinner" /> Enviando...
                      </>
                    ) : (
                      'Adicionar Foto Secundária'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormRegister;