import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { FaTrash, FaPlus, FaSpinner, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlataforma } from '../../context/PlataformaContext';
import { API_ENDPOINTS } from '../../config/api';
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
    tipo_comercializacao: 'ambos', // Sempre será 'ambos'
    tipo_produto: 'Eletrônico',
    menu: 'ambos', // Sempre será 'ambos'
    empresas_autorizadas: [],
    foto_principal: ''
  });

  // Estados do componente
  const [loading, setLoading] = useState(false);
  const [produtoId] = useState(id || productId || null);
  const [photos, setPhotos] = useState([]);
  const [newPhoto, setNewPhoto] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]); // Fotos aguardando produto ser criado
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(null);
  const [isEditing] = useState(!!(id || productId));
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const secondaryPhotosInputRef = useRef(null);

  // URL da API
  const API_URL = API_ENDPOINTS.PROJETOS;

  // Carrega categorias únicas dos projetos existentes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axios.get(API_URL, {
          headers: getAuthHeaders()
        });
        
        // Extrai categorias únicas dos projetos
        const projetos = response.data || [];
        const categoriasUnicas = [...new Set(projetos.map(p => p.tipo_produto).filter(Boolean))];
        
        // Converte para formato de opções do select
        const categoriasFormatadas = categoriasUnicas.map((nome, index) => ({
          categoria_id: index + 1,
          nome: nome
        }));
        
        // Adiciona categorias padrão se não existirem
        const categoriasPadrao = ['Eletrônico', 'Móvel', 'Roupa', 'Alimento', 'Bebida', 'Outro'];
        categoriasPadrao.forEach(cat => {
          if (!categoriasUnicas.includes(cat)) {
            categoriasFormatadas.push({
              categoria_id: categoriasFormatadas.length + 1,
              nome: cat
            });
          }
        });
        
        setCategories(categoriasFormatadas);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Se der erro, usa categorias padrão como fallback
        setCategories([
          { categoria_id: 1, nome: 'Eletrônico' },
          { categoria_id: 2, nome: 'Móvel' },
          { categoria_id: 3, nome: 'Roupa' },
          { categoria_id: 4, nome: 'Alimento' },
          { categoria_id: 5, nome: 'Bebida' },
          { categoria_id: 6, nome: 'Outro' }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega dados do produto se estiver editando (não ao criar, pois navega logo em seguida)
  useEffect(() => {
    // Só carrega se estiver editando um produto existente (não após criar um novo)
    if (isEditing && produtoId && id) {
      fetchProductData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Depende apenas do id da URL (produto existente)

  const fetchProductData = async () => {
    // Validação: não faz requisição se produtoId não existe ou é null
    if (!produtoId) {
      console.warn('fetchProductData chamado sem produtoId');
      return;
    }
    
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
        tipo_comercializacao: produto.tipo_comercializacao || 'ambos',
        tipo_produto: produto.tipo_produto || 'Eletrônico',
        menu: produto.menu || 'ambos',
        empresas_autorizadas: produto.empresas_autorizadas || [],
        // Usa foto_principal ou imageData retornado pela API
        foto_principal: produto.foto_principal || produto.imageData || ''
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

  const handleCreateCategory = () => {
    if (!newCategoryName || newCategoryName.trim() === '') {
      toast.error('O nome da categoria é obrigatório!');
      return;
    }

    const categoriaNome = newCategoryName.trim();
    
    // Verifica se a categoria já existe
    const categoriaExiste = categories.some(cat => cat.nome.toLowerCase() === categoriaNome.toLowerCase());
    
    if (categoriaExiste) {
      toast.warning('Esta categoria já existe!');
      // Seleciona a categoria existente
      const categoriaExistente = categories.find(cat => cat.nome.toLowerCase() === categoriaNome.toLowerCase());
      setFormData({ ...formData, tipo_produto: categoriaExistente.nome });
    } else {
      // Adiciona a nova categoria à lista local
      const newCategory = {
        categoria_id: categories.length + 1,
        nome: categoriaNome
      };
      setCategories([...categories, newCategory]);
      
      // Seleciona automaticamente a nova categoria
      setFormData({ ...formData, tipo_produto: newCategory.nome });
      
      toast.success('Categoria adicionada! Ela será salva quando você criar o produto.');
    }
    
    // Fecha o modal e limpa o campo
    setShowCategoryModal(false);
    setNewCategoryName('');
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
        menu: 'ambos', // Sempre será 'ambos'
        empresas_autorizadas: formData.empresas_autorizadas.length > 0 ? formData.empresas_autorizadas : null,
        foto_principal: formData.foto_principal || undefined
      };

      // Ao editar, se a foto principal não foi alterada, não envia o campo para não sobrescrever no backend
      if (isEditing && !formData.foto_principal) {
        delete payload.foto_principal;
      }

      // Ao criar novo produto, inclui fotos secundárias no payload se houver
      if (!isEditing && pendingPhotos.length > 0) {
        payload.fotos_secundarias = pendingPhotos;
      }

      if (isEditing && produtoId) {
        // Edição de produto existente
        await axios.put(`${API_URL}/${produtoId}`, payload, {
          headers: getAuthHeaders()
        });
        toast.success('Produto atualizado com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        // Cadastro de novo produto
        await axios.post(API_URL, payload, {
          headers: getAuthHeaders()
        });
        // Verifica se havia fotos secundárias antes de limpar
        const tinhaFotosSecundarias = pendingPhotos.length > 0;
        
        // Limpa fotos pendentes após criar (já foram enviadas no payload)
        setPendingPhotos([]);
        
        if (tinhaFotosSecundarias) {
          toast.success('Produto cadastrado com sucesso! Fotos secundárias adicionadas.', {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          toast.success('Produto cadastrado com sucesso!', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
        
        // Navegar para a listagem de projetos após criar (não atualiza estado pois vai navegar)
        setTimeout(() => {
          navigate('/projetos');
        }, 2000); // Aguarda 2s para o usuário ver a mensagem de sucesso
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
    if (!newPhoto) return;
    
    // Se o produto ainda não foi criado, adiciona à lista de pendentes
    if (!produtoId) {
      setPendingPhotos([...pendingPhotos, newPhoto]);
      setNewPhoto(null);
      if (secondaryPhotosInputRef.current) {
        secondaryPhotosInputRef.current.value = '';
      }
      toast.success('Foto adicionada! Será enviada junto com o produto ao salvar.', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }
    
    // Se o produto já existe, envia para o backend
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
    if (!produtoId) {
      toast.error('ID do produto não encontrado!');
      return;
    }
    
    setDeletingPhoto(photoId);
    try {
      // Chamar a API para deletar a foto no backend
      await axios.delete(`${API_URL}/${produtoId}/fotos/${photoId}`, {
        headers: getAuthHeaders()
      });
      
      // Remover da lista local apenas após sucesso na API
      setPhotos(photos.filter(photo => photo.photo_id !== photoId));
      
      toast.success('Foto removida com sucesso!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao remover foto!';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleBack = () => {
    navigate('/projetos');
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
              <div className="category-select-container">
                <select
                  name="tipo_produto"
                  value={formData.tipo_produto}
                  onChange={handleChange}
                  required
                  disabled={loading || loadingCategories}
                  className="category-select"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.categoria_id} value={category.nome}>
                      {category.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="add-category-btn"
                  disabled={loading || loadingCategories}
                  title="Criar nova categoria"
                >
                  <FaPlus />
                </button>
              </div>
              {loadingCategories && (
                <small className="field-hint">Carregando categorias...</small>
              )}
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
                <option value="Dropshipping">Dropshipping</option>
              </select>
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

      {/* Seção de fotos secundárias (sempre disponível) */}
      <div className="secondary-photos-section">
          <div className="section-header">
            <h3>Fotos Secundárias do Produto</h3>
            <p>Adicione fotos adicionais para mostrar diferentes ângulos do produto</p>
          </div>
          
            {/* Lista de fotos secundárias */}
            {(photos.length > 0 || pendingPhotos.length > 0) ? (
              <div className="photos-grid">
                {/* Mostra fotos pendentes (antes de criar produto) */}
                {pendingPhotos.map((photo, index) => (
                  <div key={`pending-${index}`} className="photo-item">
                    <img src={photo} alt={`Foto pendente ${index + 1}`} />
                    <button
                      onClick={() => {
                        setPendingPhotos(pendingPhotos.filter((_, i) => i !== index));
                      }}
                      className="delete-photo"
                      title="Remover foto"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {/* Mostra fotos já salvas (após criar produto) */}
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
                    disabled={uploadingPhoto || loading}
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

      {/* Modal de Criar Categoria */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Categoria</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="newCategoryName">Nome da Categoria *</label>
                <input
                  type="text"
                  id="newCategoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Eletrônico, Roupa, Alimento..."
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
              >
                <FaCheck /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormRegister;