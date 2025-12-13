import React, { useState, useEffect } from "react";
import { FaTrash, FaPlus, FaBox, FaSync, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import { usePlataforma } from "../../context/PlataformaContext";
import { API_ENDPOINTS } from "../../config/api";
import "./styles.css";
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

function ProductListAdmin() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoDeleteModal, setShowPhotoDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [filtros, setFiltros] = useState({
    nome: "",
    tipo_produto: "",
    tipo_comercializacao: "",
    quantidade_min: "",
    quantidade_max: ""
  });
  
  const { getAuthHeaders, isAuthenticated, loading: contextLoading } = usePlataforma();
  const navigate = useNavigate();

  // URL da API
  const API_URL = API_ENDPOINTS.PROJETOS;

  useEffect(() => {
    if (!contextLoading) {
      fetchProjetos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading]);

  const fetchProjetos = async (filtrosAplicados = {}) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        toast.error("Usuário não autenticado! Redirecionando para login...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      Object.keys(filtrosAplicados).forEach(key => {
        if (filtrosAplicados[key]) {
          params.append(key, filtrosAplicados[key]);
        }
      });

      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;

      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });

      if (Array.isArray(response.data)) {
        const projetosData = response.data.map(produto => ({
          id: produto.produto_id,
          nome: produto.nome,
          valor: produto.valor,
          valor_custo: produto.valor_custo,
          quantidade: produto.quantidade,
          tipo_comercializacao: produto.tipo_comercializacao,
          tipo_produto: produto.tipo_produto,
          foto_principal: produto.foto_principal,
          imageData: produto.imageData,
          photos: produto.photos || [],
          data_cadastro: produto.data_cadastro,
          data_update: produto.data_update,
          empresa_id: produto.empresa_id,
          empresa_nome: produto.Empresa?.nome || produto.empresa_nome || null,
          empresa: produto.Empresa || null
        }));

        setProjetos(projetosData);
      } else {
        console.warn("Estrutura de resposta inesperada:", response.data);
        setProjetos([]);
      }

      setLoading(false);
      
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao carregar projetos";
      
      if (error.response?.status === 401) {
        toast.error("Sessão expirada! Faça login novamente.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error("Acesso negado! Você não tem permissão para ver projetos.");
      } else if (error.response?.status === 404) {
        toast.info("Nenhum projeto encontrado", {
          position: "top-right",
          autoClose: 4000,
        });
        setProjetos([]);
      } else {
        toast.error(errorMessage);
      }
      
      setLoading(false);
    }
  };

  const handleDeleteClick = (projeto) => {
    setProjetoToDelete(projeto);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projetoToDelete) return;

    try {
      await axios.delete(`${API_URL}/${projetoToDelete.id}`, {
        headers: getAuthHeaders()
      });
      
      setProjetos(projetos.filter(projeto => projeto.id !== projetoToDelete.id));
      toast.success("Projeto excluído com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao excluir projeto. Tente novamente!";
      
      if (error.response?.status === 401) {
        toast.error("Sessão expirada! Faça login novamente.");
        navigate("/");
      } else {
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setShowDeleteModal(false);
      setProjetoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProjetoToDelete(null);
  };

  // Funções para exclusão de fotos
  const handlePhotoDeleteClick = (projeto, photo) => {
    setPhotoToDelete({ projeto, photo });
    setShowPhotoDeleteModal(true);
  };

  const handlePhotoDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      // Chamada para deletar a foto
      await axios.delete(`${API_URL}/${photoToDelete.projeto.id}/fotos/${photoToDelete.photo.photo_id}`, {
        headers: getAuthHeaders()
      });
      
      // Atualiza a lista de projetos removendo a foto
      setProjetos(projetos.map(projeto => {
        if (projeto.id === photoToDelete.projeto.id) {
          return {
            ...projeto,
            photos: projeto.photos.filter(p => p.photo_id !== photoToDelete.photo.photo_id)
          };
        }
        return projeto;
      }));

      toast.success("Foto excluída com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao excluir foto. Tente novamente!";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setShowPhotoDeleteModal(false);
      setPhotoToDelete(null);
    }
  };

  const handlePhotoDeleteCancel = () => {
    setShowPhotoDeleteModal(false);
    setPhotoToDelete(null);
  };

  const handleEdit = async (id) => {
    try {
      // Navega para a página de edição passando o ID como parâmetro
      navigate(`/editar-produto/${id}`);
    } catch (error) {
      console.error("Erro ao carregar dados do projeto:", error);
      toast.error("Erro ao carregar dados do projeto para edição");
    }
  };

  const handleAddProduct = () => {
    // Navega para a página de cadastro sem ID (novo projeto)
    navigate("/add-product");
  };

  const handleRefresh = () => {
    fetchProjetos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = () => {
    const filtrosAplicados = {};
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        filtrosAplicados[key] = filtros[key];
      }
    });
    fetchProjetos(filtrosAplicados);
    setShowFilterModal(false);
  };

  const limparFiltros = () => {
    setFiltros({
      nome: "",
      tipo_produto: "",
      tipo_comercializacao: "",
      quantidade_min: "",
      quantidade_max: ""
    });
    fetchProjetos();
    setShowFilterModal(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Calcular estatísticas
  const totalProjetos = projetos.length;
  const totalEstoque = projetos.reduce((total, projeto) => total + (projeto.quantidade || 0), 0);
  const categoriasUnicas = [...new Set(projetos.map(p => p.tipo_produto))].length;

  // Loading do contexto
  if (contextLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Verificação de autenticação
  if (!isAuthenticated()) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div className="product-admin-container">
      <ToastContainer />
          
          {/* Header */}
          <div className="product-admin-header">
            <div className="header-title">
              <FaBox className="header-icon" />
              <h1>Gerenciar Projetos</h1>
            </div>
            <div className="header-actions">
              {/* <button 
                onClick={() => setShowFilterModal(true)}
                className="filter-btn"
              >
                <FaFilter /> Filtrar
              </button> */}
              <button 
                onClick={handleRefresh}
                className="refresh-btn"
              >
                <FaSync /> Atualizar
              </button>
              <button 
                onClick={handleAddProduct}
                className="add-product-btn"
              >
                <FaPlus /> Adicionar Projeto
              </button>
            </div>
          </div>

          {/* Widgets em Linha */}
          <div className="widgets-container">
            <div className="widget-card">
              <div className="widget-icon total-products">
                <FaBox />
              </div>
              <div className="widget-content">
                <div className="widget-value">{totalProjetos}</div>
                <div className="widget-label">Total de Projetos</div>
              </div>
            </div>

            <div className="widget-card">
              <div className="widget-icon total-stock">
                <FaBox />
              </div>
              <div className="widget-content">
                <div className="widget-value">{totalEstoque}</div>
                <div className="widget-label">Total em Estoque</div>
              </div>
            </div>

            <div className="widget-card">
              <div className="widget-icon categories">
                <FaBox />
              </div>
              <div className="widget-content">
                <div className="widget-value">{categoriasUnicas}</div>
                <div className="widget-label">Categorias</div>
              </div>
            </div>
          </div>

          {/* Lista de Projetos */}
          <div className="products-list-container">
            {projetos.length === 0 ? (
              <div className="not-found-message">
                <FaBox className="not-found-icon" />
                <h3>Nenhum projeto encontrado</h3>
                <p>Clique em "Adicionar Projeto" para cadastrar o primeiro projeto</p>
              </div>
            ) : (
              <div className="products-table">
                <div className="table-header">
                  <div className="table-col photo">Foto</div>
                  <div className="table-col name">Projeto</div>
                  <div className="table-col price">Preço</div>
                  <div className="table-col cost">Custo</div>
                  <div className="table-col stock">Estoque</div>
                  <div className="table-col category">Categoria</div>
                  <div className="table-col type">Tipo Venda</div>
                  <div className="table-col actions">Ações</div>
                </div>

                <div className="table-body">
                  {projetos.map((projeto) => (
                    <div key={projeto.id} className="table-row">
                      <div className="table-col photo" data-label="Foto">
                        <img 
                          src={projeto.imageData || projeto.foto_principal} 
                          alt={projeto.nome}
                          className="product-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=Projeto';
                          }}
                        />
                        {/* Mostrar miniaturas das fotos secundárias */}
                        {projeto.photos && projeto.photos.length > 0 && (
                          <div className="secondary-photos-mini">
                            {projeto.photos.slice(0, 3).map((photo, index) => (
                              <div key={photo.photo_id} className="photo-mini-item">
                                <img 
                                  src={photo.imageData} 
                                  alt={`Foto ${index + 1}`}
                                  className="photo-mini"
                                />
                                <button
                                  onClick={() => handlePhotoDeleteClick(projeto, photo)}
                                  className="photo-delete-mini"
                                  title="Excluir foto"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                            {projeto.photos.length > 3 && (
                              <div className="photo-more">+{projeto.photos.length - 3}</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="table-col name" data-label="Projeto">
                        <div className="product-name">{projeto.nome}</div>
                        <div className="product-id">ID: {projeto.id}</div>
                      </div>
                      
                      <div className="table-col price" data-label="Preço">
                        <span className="price-value">{formatCurrency(projeto.valor)}</span>
                      </div>
                      
                      <div className="table-col cost" data-label="Custo">
                        <span className="cost-value">{formatCurrency(projeto.valor_custo)}</span>
                      </div>
                      
                      <div className="table-col stock" data-label="Estoque">
                        <div className="stock-quantity">{projeto.quantidade} unidades</div>
                      </div>
                      
                      <div className="table-col category" data-label="Categoria">
                        <span className="category-tag">{projeto.tipo_produto}</span>
                      </div>
                      
                      <div className="table-col type" data-label="Tipo Venda / Empresa">
                        <div className="type-badge-container">
                          <span className="type-badge">{projeto.tipo_comercializacao}</span>
                          {projeto.empresa_nome && (
                            <span className="empresa-badge" title={`Vendido por: ${projeto.empresa_nome}`}>
                              🏢 {projeto.empresa_nome}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="table-col actions" data-label="Ações">
                        <button 
                          className="action-btn edit-btn"
                          title="Editar projeto"
                          onClick={() => handleEdit(projeto.id)}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(projeto)}
                          className="action-btn delete-btn"
                          title="Excluir projeto"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal de Filtros */}
          {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content filter-modal">
            <div className="modal-header">
              <h2>Filtrar Projetos</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="nome">Nome do Projeto</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={filtros.nome}
                  onChange={handleFilterChange}
                  placeholder="Digite o nome do projeto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo_produto">Categoria</label>
                <select
                  id="tipo_produto"
                  name="tipo_produto"
                  value={filtros.tipo_produto}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas as categorias</option>
                  <option value="Eletrônico">Eletrônico</option>
                  <option value="Móvel">Móvel</option>
                  <option value="Roupa">Roupa</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Bebida">Bebida</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tipo_comercializacao">Tipo de Venda</label>
                <select
                  id="tipo_comercializacao"
                  name="tipo_comercializacao"
                  value={filtros.tipo_comercializacao}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os tipos</option>
                  <option value="Venda">Venda</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Serviço">Serviço</option>
                  <option value="Dropshipping">Dropshipping</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantidade_min">Estoque Mínimo</label>
                  <input
                    type="number"
                    id="quantidade_min"
                    name="quantidade_min"
                    value={filtros.quantidade_min}
                    onChange={handleFilterChange}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantidade_max">Estoque Máximo</label>
                  <input
                    type="number"
                    id="quantidade_max"
                    name="quantidade_max"
                    value={filtros.quantidade_max}
                    onChange={handleFilterChange}
                    min="0"
                    placeholder="999"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={limparFiltros}
              >
                Limpar Filtros
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={aplicarFiltros}
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Projeto */}
      {showDeleteModal && projetoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation-modal">
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="modal-close" onClick={handleDeleteCancel}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle className="warning-icon" />
                <h3>Tem certeza que deseja excluir este projeto?</h3>
              </div>
              
              <div className="product-to-delete">
                <div className="product-photo-container">
                  <img 
                    src={projetoToDelete.imageData || projetoToDelete.foto_principal} 
                    alt={projetoToDelete.nome}
                    className="product-photo-large"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=Projeto';
                    }}
                  />
                </div>
                <div className="product-details">
                  <div className="product-name">{projetoToDelete.nome}</div>
                  <div className="product-id">ID: {projetoToDelete.id}</div>
                  <div className="product-price">{formatCurrency(projetoToDelete.valor)}</div>
                  <div className="product-category">{projetoToDelete.tipo_produto}</div>
                </div>
              </div>
              
              <div className="delete-warning-text">
                <p>Esta ação não pode ser desfeita. O projeto será permanentemente removido do sistema.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleDeleteCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handleDeleteConfirm}
              >
                <FaTrash />
                Excluir Projeto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Foto */}
      {showPhotoDeleteModal && photoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation-modal photo-delete-modal">
            <div className="modal-header">
              <h2>Confirmar Exclusão de Foto</h2>
              <button className="modal-close" onClick={handlePhotoDeleteCancel}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle className="warning-icon" />
                <h3>Tem certeza que deseja excluir esta foto?</h3>
              </div>
              
              <div className="product-to-delete">
                <div className="product-photo-container">
                  <img 
                    src={photoToDelete.photo.imageData} 
                    alt="Foto do projeto"
                    className="product-photo-large"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=Foto';
                    }}
                  />
                </div>
                <div className="product-details">
                  <div className="product-name">{photoToDelete.projeto.nome}</div>
                  <div className="product-id">ID do Projeto: {photoToDelete.projeto.id}</div>
                  <div className="product-id">ID da Foto: {photoToDelete.photo.photo_id}</div>
                </div>
              </div>
              
              <div className="delete-warning-text">
                <p>Esta ação não pode ser desfeita. A foto será permanentemente removida do projeto.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handlePhotoDeleteCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handlePhotoDeleteConfirm}
              >
                <FaTrash />
                Excluir Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductListAdmin;