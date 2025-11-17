import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit, FaPlus, FaBox, FaSync, FaTimes, FaExclamationTriangle, FaSave, FaFilter } from "react-icons/fa";
import axios from "axios";
import { usePlataforma } from "../../context/PlataformaContext";
import "./styles.css";
import { ToastContainer, toast } from 'react-toastify';
import { Link, useNavigate } from "react-router-dom";

function ProductListAdmin() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoDeleteModal, setShowPhotoDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [editingProduto, setEditingProduto] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    valor_custo: "",
    quantidade: "",
    tipo_comercializacao: "Venda",
    tipo_produto: "Eletrônico",
    foto_principal: ""
  });
  const [filtros, setFiltros] = useState({
    nome: "",
    tipo_produto: "",
    tipo_comercializacao: "",
    quantidade_min: "",
    quantidade_max: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  
  const { getAuthHeaders, isAuthenticated, loading: contextLoading, usuario: usuarioLogado } = usePlataforma();
  const navigate = useNavigate();

  // URL da API
  const API_URL = "https://back-pdv-production.up.railway.app/produtos";

  useEffect(() => {
    if (!contextLoading) {
      fetchProdutos();
    }
  }, [contextLoading]);

  const fetchProdutos = async (filtrosAplicados = {}) => {
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
        const produtosData = response.data.map(produto => ({
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
          data_update: produto.data_update
        }));

        setProdutos(produtosData);
      } else {
        console.warn("Estrutura de resposta inesperada:", response.data);
        setProdutos([]);
      }

      setLoading(false);
      
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao carregar produtos";
      
      if (error.response?.status === 401) {
        toast.error("Sessão expirada! Faça login novamente.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error("Acesso negado! Você não tem permissão para ver produtos.");
      } else if (error.response?.status === 404) {
        toast.info("Nenhum produto encontrado", {
          position: "top-right",
          autoClose: 4000,
        });
        setProdutos([]);
      } else {
        toast.error(errorMessage);
      }
      
      setLoading(false);
    }
  };

  const handleDeleteClick = (produto) => {
    setProdutoToDelete(produto);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!produtoToDelete) return;

    try {
      await axios.delete(`${API_URL}/${produtoToDelete.id}`, {
        headers: getAuthHeaders()
      });
      
      setProdutos(produtos.filter(produto => produto.id !== produtoToDelete.id));
      toast.success("Produto excluído com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      
      const errorMessage = error.response?.data?.message || "Erro ao excluir produto. Tente novamente!";
      
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
      setProdutoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProdutoToDelete(null);
  };

  // Funções para exclusão de fotos
  const handlePhotoDeleteClick = (produto, photo) => {
    setPhotoToDelete({ produto, photo });
    setShowPhotoDeleteModal(true);
  };

  const handlePhotoDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      // Chamada para deletar a foto
      await axios.delete(`${API_URL}/${photoToDelete.produto.id}/fotos/${photoToDelete.photo.photo_id}`, {
        headers: getAuthHeaders()
      });
      
      // Atualiza a lista de produtos removendo a foto
      setProdutos(produtos.map(produto => {
        if (produto.id === photoToDelete.produto.id) {
          return {
            ...produto,
            photos: produto.photos.filter(p => p.photo_id !== photoToDelete.photo.photo_id)
          };
        }
        return produto;
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
      console.error("Erro ao carregar dados do produto:", error);
      toast.error("Erro ao carregar dados do produto para edição");
    }
  };

  const handleAddProduct = () => {
    // Navega para a página de cadastro sem ID (novo produto)
    navigate("/add-product");
  };

  const handleRefresh = () => {
    fetchProdutos();
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
    fetchProdutos(filtrosAplicados);
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
    fetchProdutos();
    setShowFilterModal(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Calcular estatísticas
  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((total, produto) => total + (produto.quantidade || 0), 0);
  const categoriasUnicas = [...new Set(produtos.map(p => p.tipo_produto))].length;

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
        <p>Carregando produtos...</p>
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
              <h1>Gerenciar Produtos</h1>
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
                <FaPlus /> Adicionar Produto
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
                <div className="widget-value">{totalProdutos}</div>
                <div className="widget-label">Total de Produtos</div>
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

          {/* Lista de Produtos */}
          <div className="products-list-container">
            {produtos.length === 0 ? (
              <div className="not-found-message">
                <FaBox className="not-found-icon" />
                <h3>Nenhum produto encontrado</h3>
                <p>Clique em "Adicionar Produto" para cadastrar o primeiro produto</p>
              </div>
            ) : (
              <div className="products-table">
                <div className="table-header">
                  <div className="table-col photo">Foto</div>
                  <div className="table-col name">Produto</div>
                  <div className="table-col price">Preço</div>
                  <div className="table-col cost">Custo</div>
                  <div className="table-col stock">Estoque</div>
                  <div className="table-col category">Categoria</div>
                  <div className="table-col type">Tipo Venda</div>
                  <div className="table-col actions">Ações</div>
                </div>

                <div className="table-body">
                  {produtos.map((produto) => (
                    <div key={produto.id} className="table-row">
                      <div className="table-col photo" data-label="Foto">
                        <img 
                          src={produto.imageData || produto.foto_principal} 
                          alt={produto.nome}
                          className="product-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=Produto';
                          }}
                        />
                        {/* Mostrar miniaturas das fotos secundárias */}
                        {produto.photos && produto.photos.length > 0 && (
                          <div className="secondary-photos-mini">
                            {produto.photos.slice(0, 3).map((photo, index) => (
                              <div key={photo.photo_id} className="photo-mini-item">
                                <img 
                                  src={photo.imageData} 
                                  alt={`Foto ${index + 1}`}
                                  className="photo-mini"
                                />
                                <button
                                  onClick={() => handlePhotoDeleteClick(produto, photo)}
                                  className="photo-delete-mini"
                                  title="Excluir foto"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                            {produto.photos.length > 3 && (
                              <div className="photo-more">+{produto.photos.length - 3}</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="table-col name" data-label="Produto">
                        <div className="product-name">{produto.nome}</div>
                        <div className="product-id">ID: {produto.id}</div>
                      </div>
                      
                      <div className="table-col price" data-label="Preço">
                        <span className="price-value">{formatCurrency(produto.valor)}</span>
                      </div>
                      
                      <div className="table-col cost" data-label="Custo">
                        <span className="cost-value">{formatCurrency(produto.valor_custo)}</span>
                      </div>
                      
                      <div className="table-col stock" data-label="Estoque">
                        <div className="stock-quantity">{produto.quantidade} unidades</div>
                      </div>
                      
                      <div className="table-col category" data-label="Categoria">
                        <span className="category-tag">{produto.tipo_produto}</span>
                      </div>
                      
                      <div className="table-col type" data-label="Tipo Venda">
                        <span className="type-badge">{produto.tipo_comercializacao}</span>
                      </div>
                      
                      <div className="table-col actions" data-label="Ações">
                        <button 
                          className="action-btn edit-btn"
                          title="Editar produto"
                          onClick={() => handleEdit(produto.id)}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(produto)}
                          className="action-btn delete-btn"
                          title="Excluir produto"
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
              <h2>Filtrar Produtos</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="nome">Nome do Produto</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={filtros.nome}
                  onChange={handleFilterChange}
                  placeholder="Digite o nome do produto"
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

      {/* Modal de Confirmação de Exclusão de Produto */}
      {showDeleteModal && produtoToDelete && (
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
                <h3>Tem certeza que deseja excluir este produto?</h3>
              </div>
              
              <div className="product-to-delete">
                <div className="product-photo-container">
                  <img 
                    src={produtoToDelete.imageData || produtoToDelete.foto_principal} 
                    alt={produtoToDelete.nome}
                    className="product-photo-large"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=Produto';
                    }}
                  />
                </div>
                <div className="product-details">
                  <div className="product-name">{produtoToDelete.nome}</div>
                  <div className="product-id">ID: {produtoToDelete.id}</div>
                  <div className="product-price">{formatCurrency(produtoToDelete.valor)}</div>
                  <div className="product-category">{produtoToDelete.tipo_produto}</div>
                </div>
              </div>
              
              <div className="delete-warning-text">
                <p>Esta ação não pode ser desfeita. O produto será permanentemente removido do sistema.</p>
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
                Excluir Produto
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
                    alt="Foto do produto"
                    className="product-photo-large"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=Foto';
                    }}
                  />
                </div>
                <div className="product-details">
                  <div className="product-name">{photoToDelete.produto.nome}</div>
                  <div className="product-id">ID do Produto: {photoToDelete.produto.id}</div>
                  <div className="product-id">ID da Foto: {photoToDelete.photo.photo_id}</div>
                </div>
              </div>
              
              <div className="delete-warning-text">
                <p>Esta ação não pode ser desfeita. A foto será permanentemente removida do produto.</p>
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