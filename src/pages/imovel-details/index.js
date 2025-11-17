import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaSearch } from "react-icons/fa";
import axios from "axios";
import { usePlataforma } from "../../context/PlataformaContext";
import "./styles.css";
import { ToastContainer, toast } from 'react-toastify';
import SideBar from "../../components/SideBar/index";

function PDVVendas() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { getAuthHeaders, isAuthenticated } = usePlataforma();

  // URL da API
  const API_URL = "https://back-pdv-production.up.railway.app/produtos";

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        if (!isAuthenticated()) {
          toast.error("Usuário não autenticado!");
          return;
        }

        const response = await axios.get(API_URL, {
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
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error("Erro ao carregar produtos!");
      }
    };

    fetchProdutos();
  }, [isAuthenticated]);

  useEffect(() => {
    // Filtrar produtos baseado no termo de pesquisa (nome ou código)
    const filtered = produtos.filter(produto =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.id.toString().includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, produtos]);

  const adicionarAoCarrinho = (produto) => {
    // Verificar se há estoque disponível
    if (produto.quantidade <= 0) {
      toast.error("Produto sem estoque disponível!");
      return;
    }

    setCarrinho(prev => {
      const existingItem = prev.find(item => item.id === produto.id);
      
      if (existingItem) {
        // Verificar se a quantidade no carrinho não excede o estoque
        if (existingItem.quantidadeCarrinho + 1 > produto.quantidade) {
          toast.error("Quantidade solicitada excede o estoque disponível!");
          return prev;
        }
        
        return prev.map(item =>
          item.id === produto.id
            ? { ...item, quantidadeCarrinho: item.quantidadeCarrinho + 1 }
            : item
        );
      } else {
        return [...prev, { 
          ...produto, 
          quantidadeCarrinho: 1,
          valor: produto.valor // Garantir que o preço de venda seja usado
        }];
      }
    });
    toast.success("Produto adicionado ao carrinho!", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev => prev.filter(item => item.id !== produtoId));
    toast.info("Produto removido do carrinho!", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const ajustarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade < 1) {
      removerDoCarrinho(produtoId);
      return;
    }

    // Encontrar o produto para verificar o estoque
    const produtoNoCarrinho = carrinho.find(item => item.id === produtoId);
    const produtoOriginal = produtos.find(p => p.id === produtoId);

    if (produtoOriginal && novaQuantidade > produtoOriginal.quantidade) {
      toast.error("Quantidade solicitada excede o estoque disponível!");
      return;
    }

    setCarrinho(prev =>
      prev.map(item =>
        item.id === produtoId
          ? { ...item, quantidadeCarrinho: novaQuantidade }
          : item
      )
    );
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.valor * item.quantidadeCarrinho), 0);
  };

  const calcularTotalItens = () => {
    return carrinho.reduce((total, item) => total + item.quantidadeCarrinho, 0);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast.error("Adicione produtos ao carrinho primeiro!");
      return;
    }

    try {
      // Atualizar estoque para cada produto vendido
      const promises = carrinho.map(async (item) => {
        const novaQuantidade = item.quantidade - item.quantidadeCarrinho;
        
        await axios.put(`${API_URL}/${item.id}`, {
          nome: item.nome,
          valor: item.valor,
          valor_custo: item.valor_custo,
          quantidade: novaQuantidade,
          tipo_comercializacao: item.tipo_comercializacao,
          tipo_produto: item.tipo_produto,
          foto_principal: item.foto_principal
        }, {
          headers: getAuthHeaders()
        });
      });

      await Promise.all(promises);

      toast.success(`Venda finalizada! Total: R$ ${calcularTotal().toFixed(2)}`, {
        position: "top-center",
        autoClose: 3000,
      });
      
      // Recarregar produtos para atualizar estoque
      const response = await axios.get(API_URL, {
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
      }
      
      setCarrinho([]);
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      toast.error("Erro ao finalizar venda. Tente novamente!");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStockStatus = (quantidade) => {
    if (quantidade > 10) return { label: "Em Estoque", class: "in-stock" };
    if (quantidade > 0) return { label: "Estoque Baixo", class: "low-stock" };
    return { label: "Sem Estoque", class: "out-of-stock" };
  };

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <div className="pdv-vendas-container">
          <ToastContainer />
          
          {/* Header do PDV */}
          <div className="pdv-header">
            <h1>Ponto de Venda - Produtos</h1>
            <div className="carrinho-info">
              <FaShoppingCart className="carrinho-icon" />
              <span className="carrinho-count">{calcularTotalItens()} itens</span>
              <span className="carrinho-total">{formatCurrency(calcularTotal())}</span>
              <button 
                className="finalizar-venda-btn"
                onClick={finalizarVenda}
                disabled={carrinho.length === 0}
              >
                Finalizar Venda
              </button>
            </div>
          </div>

          <div className="pdv-content">
            {/* Seção de Pesquisa e Lista de Produtos */}
            <div className="produtos-section">
              <div className="search-section">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou código do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="produtos-lista">
                <h3>Produtos Encontrados ({filteredProducts.length})</h3>
                {filteredProducts.length === 0 ? (
                  <div className="no-products">
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="products-mini-list">
                    {filteredProducts.map((produto) => {
                      const stockStatus = getStockStatus(produto.quantidade);
                      return (
                        <div key={produto.id} className="product-mini-item">
                          <div className="product-mini-info">
                            <div className="product-mini-name">{produto.nome}</div>
                            <div className="product-mini-code">Cód: {produto.id}</div>
                            <div className="product-mini-price">{formatCurrency(produto.valor)}</div>
                            <div className={`stock-mini ${stockStatus.class}`}>
                              {produto.quantidade} unidades
                            </div>
                          </div>
                          <div className="product-mini-actions">
                            <button 
                              onClick={() => adicionarAoCarrinho(produto)}
                              className="add-btn"
                              title="Adicionar ao carrinho"
                              disabled={produto.quantidade <= 0}
                            >
                              <FaPlus />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lista Completa de Produtos */}
              <div className="produtos-completa">
                <h3>Todos os Produtos ({produtos.length})</h3>
                <div className="produtos-grid">
                  {produtos.map((produto) => {
                    const stockStatus = getStockStatus(produto.quantidade);
                    return (
                      <div key={produto.id} className="produto-card">
                        <div className="produto-image-container">
                          <img 
                            src={produto.imageData || produto.foto_principal} 
                            alt={produto.nome} 
                            className="produto-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+Indisponível';
                            }}
                          />
                        </div>
                        
                        <div className="produto-details">
                          <h4 className="produto-title">{produto.nome}</h4>
                          <div className="produto-code">Código: {produto.id}</div>
                          
                          <div className="produto-info">
                            <div className="info-item">
                              <span>Categoria:</span>
                              <strong>{produto.tipo_produto}</strong>
                            </div>
                            <div className="info-item">
                              <span>Tipo:</span>
                              <strong>{produto.tipo_comercializacao}</strong>
                            </div>
                            <div className="info-item">
                              <span>Estoque:</span>
                              <strong className={stockStatus.class}>
                                {produto.quantidade} unidades
                              </strong>
                            </div>
                            <div className="info-item">
                              <span>Custo:</span>
                              <strong className="cost-value">
                                {formatCurrency(produto.valor_custo)}
                              </strong>
                            </div>
                          </div>
                          
                          <div className="produto-preco-section">
                            <div className="produto-preco">
                              <span className="preco-valor">{formatCurrency(produto.valor)}</span>
                            </div>
                            <button 
                              onClick={() => adicionarAoCarrinho(produto)}
                              className="add-carrinho-btn"
                              disabled={produto.quantidade <= 0}
                            >
                              <FaPlus /> Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Carrinho de Compras */}
            <div className="carrinho-section">
              <h2>Carrinho de Vendas</h2>
              <div className="carrinho-container">
                {carrinho.length === 0 ? (
                  <div className="carrinho-vazio">
                    <FaShoppingCart className="carrinho-vazio-icon" />
                    <p>Seu carrinho está vazio</p>
                    <span>Adicione produtos para iniciar uma venda</span>
                  </div>
                ) : (
                  <div className="carrinho-itens">
                    {carrinho.map((item) => (
                      <div key={item.id} className="carrinho-item">
                        <div className="item-info">
                          <div className="item-image">
                            <img 
                              src={item.imageData || item.foto_principal} 
                              alt={item.nome}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50x50?text=Img';
                              }}
                            />
                          </div>
                          <div className="item-details">
                            <h4>{item.nome}</h4>
                            <div className="item-code">Cód: {item.id}</div>
                            <span className="item-preco">{formatCurrency(item.valor)}</span>
                            <div className="item-stock">
                              Estoque: {item.quantidade} unidades
                            </div>
                          </div>
                        </div>
                        
                        <div className="item-controls">
                          <div className="quantidade-controller">
                            <button 
                              onClick={() => ajustarQuantidade(item.id, item.quantidadeCarrinho - 1)}
                              className="quantidade-btn"
                            >
                              <FaMinus />
                            </button>
                            <span className="quantidade">{item.quantidadeCarrinho}</span>
                            <button 
                              onClick={() => ajustarQuantidade(item.id, item.quantidadeCarrinho + 1)}
                              className="quantidade-btn"
                              disabled={item.quantidadeCarrinho >= item.quantidade}
                            >
                              <FaPlus />
                            </button>
                          </div>
                          
                          <div className="item-total">
                            {formatCurrency(item.valor * item.quantidadeCarrinho)}
                          </div>
                          
                          <button 
                            onClick={() => removerDoCarrinho(item.id)}
                            className="remover-item-btn"
                            title="Remover do carrinho"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="carrinho-total-section">
                      <div className="total-line">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calcularTotal())}</span>
                      </div>
                      <div className="total-line">
                        <span>Desconto:</span>
                        <span>R$ 0,00</span>
                      </div>
                      <div className="total-line final">
                        <span>Total:</span>
                        <strong>{formatCurrency(calcularTotal())}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDVVendas;