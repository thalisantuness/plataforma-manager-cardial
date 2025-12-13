import React, { useState, useEffect } from "react";
import SideBar from "../../components/SideBar/index";
import { FaPlus, FaTimes, FaSearch, FaDollarSign, FaUser, FaCalendar, FaEdit, FaTrash, FaEye, FaCheck, FaBan, FaShoppingCart, FaMoneyBillWave, FaChartLine, FaCalendarCheck, FaCoins } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { usePlataforma } from "../../context/PlataformaContext";
import { API_ENDPOINTS } from "../../config/api";
import "./styles.css";

function OrdersPage() {
  const API_URL = API_ENDPOINTS.PEDIDOS;
  const PROJETOS_API_URL = API_ENDPOINTS.PROJETOS;
  const USUARIOS_API_URL = API_ENDPOINTS.USUARIOS;
  
  const { getAuthHeaders, usuario: usuarioLogado } = usePlataforma();
  
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pedidoParaDeletar, setPedidoParaDeletar] = useState(null);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    produto_id: "",
    quantidade: "1",
    cliente_id: "",
    empresa_id: "",
    data_hora_entrega: "",
    status: "pendente",
    observacao: ""
  });

  // Carregar projetos e usuários primeiro, depois pedidos (para ter valor_custo disponível)
  useEffect(() => {
    const carregarDados = async () => {
      const projetosCarregados = await carregarProjetos();
      await carregarUsuarios();
      await carregarPedidos(projetosCarregados); // Passar projetos diretamente para garantir que estão disponíveis
    };
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarPedidos = async (projetosParaUsar = null) => {
    try {
      setLoadingOrders(true);
      // Adicionar cache busting para evitar 304 Not Modified
      const response = await axios.get(`${API_URL}?_t=${Date.now()}`, {
        headers: getAuthHeaders()
      });

      // Usar projetos passados como parâmetro ou o estado (priorizar parâmetro)
      const projetosDisponiveis = projetosParaUsar || projetos;

      const pedidosMapeados = response.data.map(pedido => {
        // Tratar caso onde Produto é null
        const produto = pedido.Produto || null;
        
        // Buscar projeto completo na lista de projetos carregados para pegar valor_custo
        // O objeto Projeto do pedido não tem valor_custo, então precisamos buscar na lista
        // O backend retorna projeto_id, mas o pedido pode ter produto_id (legado)
        // Os projetos mapeados têm campo 'id' que é o projeto_id
        const projetoCompleto = projetosDisponiveis.find(p => {
          const projetoId = p.id || p.projeto_id || p.produto_id;
          const pedidoProjetoId = pedido.produto_id || pedido.projeto_id;
          return projetoId === pedidoProjetoId;
        });
        
        // Usar projeto completo da lista se disponível, senão usar o do pedido
        // Mas sempre priorizar valor_custo da lista de projetos
        const projetoFinal = projetoCompleto || produto;
        
        // Garantir que valor_custo seja um número válido
        // O valor_custo só vem na lista de projetos, não no objeto Projeto do pedido
        const valorVenda = parseFloat(projetoFinal?.valor || produto?.valor || 0) || 0;
        const valorCusto = parseFloat(projetoCompleto?.valor_custo || 0) || 0;
        const quantidade = parseFloat(pedido.quantidade) || 1;
        
        // Debug: logar se valor_custo estiver zerado e projeto não foi encontrado
        if (valorCusto === 0 && valorVenda > 0 && !projetoCompleto) {
          console.warn(`⚠️ Projeto ID ${pedido.produto_id || pedido.projeto_id} não encontrado na lista de projetos. Lucro será igual ao faturamento.`, {
            produto_id: pedido.produto_id || pedido.projeto_id,
            projetos_carregados: projetosDisponiveis.length,
            projeto_ids_disponiveis: projetosDisponiveis.map(p => p.id || p.projeto_id || p.produto_id)
          });
        }
        
        return {
          id: `${String(pedido.pedido_id).padStart(3, '0')}`,
          pedido_id: pedido.pedido_id,
          produto_id: pedido.produto_id,
          quantidade: quantidade,
          // Informações do Cliente
          cliente_id: pedido.cliente_id,
          cliente: pedido.Cliente?.nome || "Cliente não informado",
          cliente_email: pedido.Cliente?.email || "-",
          cliente_telefone: pedido.Cliente?.telefone || "-",
          cliente_endereco: pedido.Cliente?.cliente_endereco || pedido.Cliente?.endereco || null,
          cliente_role: pedido.Cliente?.role || "-",
          // Informações da Empresa
          empresa_id: pedido.empresa_id,
          empresa_nome: pedido.Empresa?.nome || "Empresa não informada",
          empresa_email: pedido.Empresa?.email || "-",
          empresa_telefone: pedido.Empresa?.telefone || "-",
          empresa_role: pedido.Empresa?.role || "-",
          // Informações do Produto (com verificação de null)
          produto_nome: produto?.nome || "Produto não informado",
          produto_valor: valorVenda,
          produto_valor_custo: valorCusto,
          produto_foto: produto?.foto_principal || null,
          produto_menu: produto?.menu || null,
          // Calcular total
          total: valorVenda * quantidade,
          // Calcular lucro (valor de venda - valor de custo) * quantidade
          lucro: (valorVenda - valorCusto) * quantidade,
          // Outras informações
          status: pedido.status,
          data_hora_entrega: pedido.data_hora_entrega,
          observacao: pedido.observacao || "Sem observações",
          data_cadastro: pedido.data_cadastro,
          data_update: pedido.data_update
        };
      });

      setOrders(pedidosMapeados);
      console.log(`✅ ${pedidosMapeados.length} pedidos carregados. Projetos disponíveis: ${projetosDisponiveis.length}`);
      
      // Verificar se todos os projetos dos pedidos foram encontrados
      const projetosNaoEncontrados = pedidosMapeados.filter(p => {
        const projetoCompleto = projetosDisponiveis.find(prod => 
          prod.id === p.produto_id || 
          (prod.projeto_id && prod.projeto_id === p.produto_id)
        );
        return !projetoCompleto && p.produto_valor > 0;
      });
      
      if (projetosNaoEncontrados.length > 0) {
        console.warn(`⚠️ ${projetosNaoEncontrados.length} pedidos com projetos não encontrados na lista. IDs:`, 
          projetosNaoEncontrados.map(p => p.produto_id));
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos da API!");
    } finally {
      setLoadingOrders(false);
    }
  };

  const carregarProjetos = async () => {
    try {
      setLoadingProjetos(true);
      const response = await axios.get(PROJETOS_API_URL, {
        headers: getAuthHeaders()
      });
      
      // Mapear projetos para ter campo 'id' consistente (backend retorna projeto_id)
      let projetosMapeados = response.data.map(projeto => ({
        ...projeto,
        id: projeto.projeto_id || projeto.produto_id || projeto.id,
        produto_id: projeto.projeto_id || projeto.produto_id || projeto.id // Manter compatibilidade
      }));
      
      // Filtrar projetos baseado nas empresas autorizadas
      let projetosFiltrados = projetosMapeados;
      
      // Se o usuário for empresa, mostrar apenas projetos que ele pode usar
      if (usuarioLogado?.role === "empresa") {
        projetosFiltrados = projetosMapeados.filter(projeto => {
          // Se empresas_autorizadas está vazio ou null, projeto disponível para todos
          if (!projeto.empresas_autorizadas || projeto.empresas_autorizadas.length === 0) {
            return true;
          }
          // Se empresas_autorizadas tem IDs, verificar se a empresa está na lista
          return projeto.empresas_autorizadas.includes(usuarioLogado.usuario_id);
        });
      }
      
      setProjetos(projetosFiltrados);
      console.log(`✅ ${projetosFiltrados.length} projetos carregados para cálculo de lucro`);
      
      // Retornar projetos para uso imediato (antes do estado ser atualizado)
      return projetosFiltrados;
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast.error("Erro ao carregar lista de projetos!");
      return []; // Retornar array vazio em caso de erro
    } finally {
      setLoadingProjetos(false);
    }
  };

  const carregarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await axios.get(USUARIOS_API_URL, {
        headers: getAuthHeaders()
      });
      
      // Separar clientes e empresas
      const clientesFiltrados = response.data.filter(user => user.role === "cliente");
      const empresasFiltradas = response.data.filter(user => 
        user.role === "empresa" || user.role === "admin"
      );
      
      setClientes(clientesFiltrados);
      setEmpresas(empresasFiltradas);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar lista de usuários!");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Calcular estatísticas financeiras
  const calcularEstatisticas = () => {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Faturamento realizado (pedidos confirmados e entregues)
    const faturamentoRealizado = orders
      .filter(o => o && (o.status === 'confirmado' || o.status === 'entregue'))
      .reduce((total, o) => total + (o.total || 0), 0);
    
    // Lucro realizado (pedidos confirmados e entregues)
    const lucroRealizado = orders
      .filter(o => o && (o.status === 'confirmado' || o.status === 'entregue'))
      .reduce((total, o) => total + (o.lucro || 0), 0);
    
    // Previsão de faturamento (pedidos pendentes e em transporte)
    const previsaoFaturamento = orders
      .filter(o => o && (o.status === 'pendente' || o.status === 'em_transporte'))
      .reduce((total, o) => total + (o.total || 0), 0);
    
    // Previsão de lucro (pedidos pendentes e em transporte)
    const previsaoLucro = orders
      .filter(o => o && (o.status === 'pendente' || o.status === 'em_transporte'))
      .reduce((total, o) => total + (o.lucro || 0), 0);
    
    // Pedidos de hoje (com verificação de data_hora_entrega)
    const pedidosHoje = orders.filter(o => {
      if (!o || !o.data_hora_entrega) return false;
      try {
        return o.data_hora_entrega.split('T')[0] === hoje;
      } catch {
        return false;
      }
    });
    
    const faturamentoHoje = pedidosHoje
      .filter(o => o && (o.status === 'confirmado' || o.status === 'entregue'))
      .reduce((total, o) => total + (o.total || 0), 0);
    
    const previsaoHoje = pedidosHoje
      .filter(o => o && (o.status === 'pendente' || o.status === 'em_transporte'))
      .reduce((total, o) => total + (o.total || 0), 0);

    return {
      faturamentoRealizado,
      lucroRealizado,
      previsaoFaturamento,
      previsaoLucro,
      faturamentoHoje,
      previsaoHoje,
      pedidosHoje: pedidosHoje.length,
      totalPedidos: orders.length,
      pendentesCount: orders.filter(o => o.status === 'pendente').length,
      confirmadosCount: orders.filter(o => o.status === 'confirmado').length,
      emTransporteCount: orders.filter(o => o.status === 'em_transporte').length,
      entreguessCount: orders.filter(o => o.status === 'entregue').length,
      canceladosCount: orders.filter(o => o.status === 'cancelado').length,
    };
  };

  const estatisticas = calcularEstatisticas();

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.cliente || "").toLowerCase().includes(searchLower) ||
      (order.id || "").toLowerCase().includes(searchLower) ||
      (order.produto_nome || "").toLowerCase().includes(searchLower) ||
      (order.empresa_nome || "").toLowerCase().includes(searchLower);
    
    if (filter === "all") return matchesSearch;
    return order.status === filter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { label: "Pendente", class: "status-pending" },
      confirmado: { label: "Confirmado", class: "status-confirmed" },
      em_transporte: { label: "Em Transporte", class: "status-transport" },
      entregue: { label: "Entregue", class: "status-delivered" },
      cancelado: { label: "Cancelado", class: "status-cancelled" }
    };
    return statusConfig[status] || { label: status, class: "status-default" };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirModalNovo = () => {
    setPedidoEditando(null);
    
    // Preencher automaticamente baseado no role do usuário
    let formInicial = {
      produto_id: "",
      quantidade: "1",
      cliente_id: "",
      empresa_id: "",
      data_hora_entrega: "",
      status: "pendente",
      observacao: ""
    };

    if (usuarioLogado?.role === "cliente") {
      formInicial.cliente_id = usuarioLogado.usuario_id.toString();
    } else if (usuarioLogado?.role === "empresa" || usuarioLogado?.role === "admin") {
      formInicial.empresa_id = usuarioLogado.usuario_id.toString();
    }

    setFormData(formInicial);
    setShowModal(true);
  };

  const abrirModalEditar = (pedido) => {
    setPedidoEditando(pedido);
    setFormData({
      produto_id: pedido.produto_id?.toString() || "",
      quantidade: pedido.quantidade?.toString() || "1",
      cliente_id: pedido.cliente_id?.toString() || "",
      empresa_id: pedido.empresa_id?.toString() || "",
      data_hora_entrega: pedido.data_hora_entrega ? 
        new Date(pedido.data_hora_entrega).toISOString().slice(0, 16) : "",
      status: pedido.status,
      observacao: pedido.observacao || ""
    });
    setShowModal(true);
  };

  const abrirModalDetalhes = (pedido) => {
    setPedidoEditando(pedido);
    setShowDetailModal(true);
  };

  const abrirModalDeletar = (pedido) => {
    setPedidoParaDeletar(pedido);
    setShowDeleteModal(true);
  };

  const fecharModais = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setPedidoEditando(null);
    setPedidoParaDeletar(null);
    setFormData({
      produto_id: "",
      quantidade: "1",
      cliente_id: "",
      empresa_id: "",
      data_hora_entrega: "",
      status: "pendente",
      observacao: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        produto_id: parseInt(formData.produto_id),
        quantidade: parseInt(formData.quantidade),
        cliente_id: parseInt(formData.cliente_id),
        empresa_id: parseInt(formData.empresa_id),
        data_hora_entrega: new Date(formData.data_hora_entrega).toISOString(),
        status: formData.status,
        observacao: formData.observacao || ""
      };

      // Validação
      if (!payload.produto_id || !payload.cliente_id || !payload.empresa_id || !payload.data_hora_entrega) {
        toast.error("Por favor, preencha todos os campos obrigatórios!");
        setLoading(false);
        return;
      }

      if (pedidoEditando) {
        // Editar pedido existente
        await axios.put(`${API_URL}/${pedidoEditando.pedido_id}`, payload, {
          headers: getAuthHeaders()
        });
        toast.success("Pedido atualizado com sucesso!");
      } else {
        // Criar novo pedido
        await axios.post(API_URL, payload, {
          headers: getAuthHeaders()
        });
        toast.success("Pedido criado com sucesso!");
      }

      await carregarPedidos();
      fecharModais();

    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      
      // Mensagens de erro específicas
      const errorData = error.response?.data;
      let errorMessage = `Erro ao ${pedidoEditando ? 'atualizar' : 'criar'} pedido. Tente novamente!`;
      
      if (errorData?.error) {
        if (errorData.error.includes("não autorizada")) {
          errorMessage = "⚠️ Empresa não autorizada a usar este projeto. Por favor, selecione outro projeto ou entre em contato com o administrador.";
        } else {
          errorMessage = errorData.error;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      toast.error(errorMessage, {
        autoClose: 5000, // 5 segundos para mensagens de erro
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pedidoParaDeletar) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${pedidoParaDeletar.pedido_id}`, {
        headers: getAuthHeaders()
      });
      
      toast.success("Pedido deletado com sucesso!");
      await carregarPedidos();
      fecharModais();
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
      toast.error("Erro ao deletar pedido. Tente novamente!");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pedidoId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/${pedidoId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      toast.success(`Pedido ${getStatusText(newStatus)} com sucesso!`, {
        position: "top-right",
        autoClose: 3000,
      });

      await carregarPedidos();
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      toast.error("Erro ao atualizar pedido!");
    }
  };

  const handleCancelar = async (pedidoId) => {
    try {
      await axios.put(
        `${API_URL}/${pedidoId}/cancelar`,
        {},
        { headers: getAuthHeaders() }
      );

      toast.success("Pedido cancelado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });

      await carregarPedidos();
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast.error("Erro ao cancelar pedido!");
    }
  };

  const getStatusText = (status) => {
    const statusTexts = {
      confirmado: "confirmado",
      em_transporte: "marcado como em transporte",
      entregue: "marcado como entregue",
      cancelado: "cancelado"
    };
    return statusTexts[status] || "atualizado";
  };

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <div className="orders-container">
          <ToastContainer />
          
          <div className="orders-header">
            <div className="header-actions">
              <div className="header-title">
                <h1>Pedidos</h1>
                <p>Gerencie os pedidos realizados</p>
              </div>
              <div className="header-buttons">
                <button 
                  className="new-order-btn"
                  onClick={abrirModalNovo}
                >
                  <FaPlus /> Novo Pedido
                </button>
              </div>
            </div>
          </div>

          {/* Big Numbers - Estatísticas Financeiras */}
          <div className="big-numbers-grid">
            <div className="big-number-card revenue-card">
              <div className="big-number-icon">
                <FaMoneyBillWave />
              </div>
              <div className="big-number-content">
                <span className="big-number-value">
                  {formatCurrency(estatisticas.faturamentoRealizado)}
                </span>
                <span className="big-number-label">Faturamento Realizado</span>
                <span className="big-number-subtitle">Pedidos Confirmados/Entregues</span>
              </div>
            </div>

            <div className="big-number-card forecast-card">
              <div className="big-number-icon">
                <FaChartLine />
              </div>
              <div className="big-number-content">
                <span className="big-number-value">
                  {formatCurrency(estatisticas.previsaoFaturamento)}
                </span>
                <span className="big-number-label">Previsão de Faturamento</span>
                <span className="big-number-subtitle">Pedidos Pendentes/Em Transporte</span>
              </div>
            </div>

            <div className="big-number-card today-card">
              <div className="big-number-icon">
                <FaCalendarCheck />
              </div>
              <div className="big-number-content">
                <span className="big-number-value">
                  {estatisticas.pedidosHoje}
                </span>
                <span className="big-number-label">Pedidos Hoje</span>
                <div className="today-details">
                  <span className="today-revenue">
                    Confirmados: {formatCurrency(estatisticas.faturamentoHoje)}
                  </span>
                  <span className="today-forecast">
                    Pendentes: {formatCurrency(estatisticas.previsaoHoje)}
                  </span>
                </div>
              </div>
            </div>

            <div className="big-number-card profit-card">
              <div className="big-number-icon">
                <FaCoins />
              </div>
              <div className="big-number-content">
                <span className="big-number-value">
                  {formatCurrency(estatisticas.lucroRealizado)}
                </span>
                <span className="big-number-label">Lucro Realizado</span>
                <span className="big-number-subtitle">Pedidos Confirmados/Entregues</span>
                {estatisticas.previsaoLucro > 0 && (
                  <span className="profit-forecast">
                    Previsão: {formatCurrency(estatisticas.previsaoLucro)}
                  </span>
                )}
              </div>
            </div>

            <div className="big-number-card total-card">
              <div className="big-number-icon">
                <FaShoppingCart />
              </div>
              <div className="big-number-content">
                <span className="big-number-value">
                  {estatisticas.totalPedidos}
                </span>
                <span className="big-number-label">Total de Pedidos</span>
                <div className="status-breakdown">
                  <span className="status-item pending">{estatisticas.pendentesCount} pendentes</span>
                  <span className="status-item confirmed">{estatisticas.confirmadosCount} confirmados</span>
                  <span className="status-item cancelled">{estatisticas.canceladosCount} cancelados</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controles (Busca e Filtros) */}
          <div className="orders-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por cliente, ID, projeto ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="orders-filters">
              <button 
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Todos
              </button>
              <button 
                className={`filter-btn ${filter === "pendente" ? "active" : ""}`}
                onClick={() => setFilter("pendente")}
              >
                Pendentes
              </button>
              <button 
                className={`filter-btn ${filter === "confirmado" ? "active" : ""}`}
                onClick={() => setFilter("confirmado")}
              >
                Confirmados
              </button>
              <button 
                className={`filter-btn ${filter === "em_transporte" ? "active" : ""}`}
                onClick={() => setFilter("em_transporte")}
              >
                Em Transporte
              </button>
              <button 
                className={`filter-btn ${filter === "entregue" ? "active" : ""}`}
                onClick={() => setFilter("entregue")}
              >
                Entregues
              </button>
              <button 
                className={`filter-btn ${filter === "cancelado" ? "active" : ""}`}
                onClick={() => setFilter("cancelado")}
              >
                Cancelados
              </button>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="orders-list">
            {loadingOrders ? (
              <div className="no-orders">
                <p>Carregando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                return (
                  <div key={order.pedido_id} className="order-card">
                    <div className="order-card-content">
                      {/* Código da foto removido - ver ANIMATION_CODE_BACKUP.md para reaproveitar a animação
                      {order.produto_foto && (
                        <div className="order-image">
                          <img 
                            src={order.produto_foto} 
                            alt={order.produto_nome}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      */}

                      <div className="order-info-container">
                        <div className="order-header">
                          <div className="order-info">
                            <h3 className="order-id">{order.id}</h3>
                            <div className="order-summary">
                              <span className="order-total">
                                <FaDollarSign /> {formatCurrency(order.total)}
                              </span>
                              <span className="order-date">
                                <FaCalendar /> {formatDate(order.data_hora_entrega)}
                              </span>
                            </div>
                          </div>
                          <div className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </div>
                        </div>

                        {/* Detalhes do Projeto */}
                        <div className="products-details-section">
                          <h4>📦 Projeto</h4>
                          <div className="product-item">
                            <div className="product-info">
                              <strong>{order.produto_nome}</strong>
                              <span>Quantidade: {order.quantidade}</span>
                              <span>Valor Unitário: {formatCurrency(order.produto_valor)}</span>
                              <span>Total: {formatCurrency(order.total)}</span>
                            </div>
                            {order.produto_menu && (
                              <div className="product-menu">
                                <strong>Menu:</strong> {order.produto_menu}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="order-details">
                          <div className="customer-info">
                            <h4><FaUser /> Cliente</h4>
                            <p><strong>Nome:</strong> {order.cliente}</p>
                            <p><strong>Email:</strong> {order.cliente_email}</p>
                            <p><strong>Telefone:</strong> {order.cliente_telefone}</p>
                            {order.cliente_endereco && 
                             order.cliente_endereco !== "-" && 
                             order.cliente_endereco !== null && 
                             order.cliente_endereco !== undefined &&
                             String(order.cliente_endereco).trim() !== "" && (
                              <p><strong> Endereço:</strong> {order.cliente_endereco}</p>
                            )}
                          </div>

                          <div className="company-info">
                            <h4>🏢 Empresa</h4>
                            <p><strong>Nome:</strong> {order.empresa_nome}</p>
                            <p><strong>Email:</strong> {order.empresa_email}</p>
                            <p><strong>Telefone:</strong> {order.empresa_telefone}</p>
                          </div>

                          <div className="delivery-info">
                            <h4><FaCalendar /> Entrega</h4>
                            <div className="delivery-details">
                              <p><strong>Data/Hora:</strong> {formatDateTime(order.data_hora_entrega)}</p>
                              <p><strong>Status:</strong> {statusInfo.label}</p>
                              <p><strong>Cadastro:</strong> {formatDateTime(order.data_cadastro)}</p>
                              {order.data_update && (
                                <p><strong>Atualização:</strong> {formatDateTime(order.data_update)}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {order.observacao && order.observacao !== "Sem observações" && (
                          <div className="notes-section">
                            <h4>Observações</h4>
                            <p className="notes">{order.observacao}</p>
                          </div>
                        )}

                        <div className="order-actions">
                          <button 
                            className="action-btn details-btn"
                            onClick={() => abrirModalDetalhes(order)}
                          >
                            <FaEye /> Detalhes
                          </button>
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => abrirModalEditar(order)}
                          >
                            <FaEdit /> Editar
                          </button>
                          
                          {/* Botões para pedidos com status "pendente" */}
                          {order.status === "pendente" && (
                            <>
                              <button
                                className="action-btn confirm-btn"
                                onClick={() => handleStatusUpdate(order.pedido_id, "confirmado")}
                              >
                                <FaCheck /> Confirmar
                              </button>
                              <button
                                className="action-btn cancel-btn"
                                onClick={() => handleCancelar(order.pedido_id)}
                              >
                                <FaBan /> Cancelar
                              </button>
                            </>
                          )}

                          {/* Botões para pedidos com status "confirmado" */}
                          {order.status === "confirmado" && (
                            <>
                              <button
                                className="action-btn transport-btn"
                                onClick={() => handleStatusUpdate(order.pedido_id, "em_transporte")}
                              >
                                🚚 Em Transporte
                              </button>
                              <button
                                className="action-btn cancel-btn"
                                onClick={() => handleCancelar(order.pedido_id)}
                              >
                                <FaBan /> Cancelar
                              </button>
                            </>
                          )}

                          {/* Botões para pedidos com status "em_transporte" */}
                          {/* Apenas CLIENTE pode marcar como entregue quando está em transporte */}
                          {order.status === "em_transporte" && usuarioLogado?.role === "cliente" && (
                            <>
                              <button
                                className="action-btn delivered-btn"
                                onClick={() => handleStatusUpdate(order.pedido_id, "entregue")}
                              >
                                ✅ Marcar como Entregue
                              </button>
                            </>
                          )}
                          
                          {/* Empresa não vê botão de entregue quando está em transporte */}
                          {order.status === "em_transporte" && (usuarioLogado?.role === "empresa" || usuarioLogado?.role === "empresa-funcionario") && (
                            <div className="info-message">
                              <p>📦 Pedido em transporte. Aguardando confirmação do cliente.</p>
                            </div>
                          )}

                          {/* Botões para pedidos com status "cancelado" */}
                          {order.status === "cancelado" && (
                            <button
                              className="action-btn confirm-btn"
                              onClick={() => handleStatusUpdate(order.pedido_id, "pendente")}
                            >
                              <FaCheck /> Reativar
                            </button>
                          )}

                          <button 
                            className="action-btn delete-btn"
                            onClick={() => abrirModalDeletar(order)}
                          >
                            <FaTrash /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Adicionar/Editar Pedido */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content order-modal">
            <div className="modal-header">
              <h2>{pedidoEditando ? 'Editar Pedido' : 'Novo Pedido'}</h2>
              <button className="modal-close" onClick={fecharModais}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-section">
                <h3>Informações do Pedido</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="produto_id">Projeto *</label>
                    <select
                      id="produto_id"
                      name="produto_id"
                      value={formData.produto_id}
                      onChange={handleInputChange}
                      required
                      disabled={loadingProjetos}
                    >
                      <option value="">Selecione o projeto</option>
                      {projetos.map(produto => {
                        // Verificar se o projeto está disponível para a empresa selecionada
                        const empresaSelecionadaId = parseInt(formData.empresa_id);
                        let disponivel = true;
                        let motivoIndisponivel = '';
                        
                        if (empresaSelecionadaId && produto.empresas_autorizadas && produto.empresas_autorizadas.length > 0) {
                          disponivel = produto.empresas_autorizadas.includes(empresaSelecionadaId);
                          if (!disponivel) {
                            motivoIndisponivel = ' ⚠️ (Empresa não autorizada)';
                          }
                        }
                        
                        const projetoId = produto.id || produto.projeto_id || produto.produto_id;
                        return (
                          <option 
                            key={projetoId} 
                            value={projetoId}
                            disabled={!disponivel}
                            style={{ color: disponivel ? 'inherit' : '#cbd5e0' }}
                          >
                            {produto.nome} - {formatCurrency(produto.valor)} {produto.menu ? `(${produto.menu})` : ''}{motivoIndisponivel}
                          </option>
                        );
                      })}
                    </select>
                    {loadingProjetos && <p className="loading-text">Carregando projetos...</p>}
                    {formData.empresa_id && (
                      <p className="info-text">
                        💡 Projetos marcados com ⚠️ não estão disponíveis para a empresa selecionada
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantidade">Quantidade *</label>
                    <input
                      type="number"
                      id="quantidade"
                      name="quantidade"
                      value={formData.quantidade}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cliente_id">Cliente *</label>
                    <select
                      id="cliente_id"
                      name="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleInputChange}
                      required
                      disabled={loadingUsuarios || usuarioLogado?.role === "cliente"}
                    >
                      <option value="">Selecione o cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.usuario_id} value={cliente.usuario_id}>
                          {cliente.nome} - {cliente.email}
                        </option>
                      ))}
                    </select>
                    {usuarioLogado?.role === "cliente" && (
                      <p className="info-text">Cliente definido automaticamente</p>
                    )}
                    {loadingUsuarios && <p className="loading-text">Carregando clientes...</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="empresa_id">Empresa *</label>
                    <select
                      id="empresa_id"
                      name="empresa_id"
                      value={formData.empresa_id}
                      onChange={handleInputChange}
                      required
                      disabled={loadingUsuarios || usuarioLogado?.role === "empresa"}
                    >
                      <option value="">Selecione a empresa</option>
                      {empresas.map(empresa => (
                        <option key={empresa.usuario_id} value={empresa.usuario_id}>
                          {empresa.nome} - {empresa.email}
                        </option>
                      ))}
                    </select>
                    {usuarioLogado?.role === "empresa" && (
                      <p className="info-text">Empresa definida automaticamente</p>
                    )}
                    {loadingUsuarios && <p className="loading-text">Carregando empresas...</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="data_hora_entrega">Data e Hora de Entrega *</label>
                    <input
                      type="datetime-local"
                      id="data_hora_entrega"
                      name="data_hora_entrega"
                      value={formData.data_hora_entrega}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="em_transporte">Em Transporte</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="observacao">Observações</label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Observações sobre o pedido..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={fecharModais}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : (pedidoEditando ? "Atualizar Pedido" : "Criar Pedido")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailModal && pedidoEditando && (
        <div className="modal-overlay">
          <div className="modal-content order-modal">
            <div className="modal-header">
              <h2>Detalhes do Pedido</h2>
              <button className="modal-close" onClick={fecharModais}>
                <FaTimes />
              </button>
            </div>

            <div className="order-details-modal">
              {/* Código da foto removido - ver ANIMATION_CODE_BACKUP.md para reaproveitar a animação
              {pedidoEditando.produto_foto && (
                <div className="detail-image">
                  <img src={pedidoEditando.produto_foto} alt={pedidoEditando.produto_nome} />
                </div>
              )}
              */}
              
              <div className="detail-info">
                <div className="detail-group">
                  <h3>Informações do Pedido</h3>
                  <p><strong>ID:</strong> {pedidoEditando.id}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${getStatusBadge(pedidoEditando.status).class}`}>
                      {getStatusBadge(pedidoEditando.status).label}
                    </span>
                  </p>
                  <p><strong>Data/Hora Entrega:</strong> {formatDateTime(pedidoEditando.data_hora_entrega)}</p>
                  {pedidoEditando.observacao && pedidoEditando.observacao !== "Sem observações" && (
                    <p><strong>Observações:</strong> {pedidoEditando.observacao}</p>
                  )}
                </div>

                <div className="detail-group">
                  <h3>Projeto</h3>
                  <p><strong>Nome:</strong> {pedidoEditando.produto_nome}</p>
                  <p><strong>Quantidade:</strong> {pedidoEditando.quantidade}</p>
                  <p><strong>Valor Unitário:</strong> {formatCurrency(pedidoEditando.produto_valor)}</p>
                  <p><strong>Valor Total:</strong> {formatCurrency(pedidoEditando.total)}</p>
                  {pedidoEditando.produto_menu && (
                    <p><strong>Menu:</strong> {pedidoEditando.produto_menu}</p>
                  )}
                </div>

                <div className="detail-group">
                  <h3>Cliente</h3>
                  <p><strong>Nome:</strong> {pedidoEditando.cliente}</p>
                  <p><strong>Email:</strong> {pedidoEditando.cliente_email}</p>
                  <p><strong>Telefone:</strong> {pedidoEditando.cliente_telefone}</p>
                  {pedidoEditando.cliente_endereco && pedidoEditando.cliente_endereco !== "-" && pedidoEditando.cliente_endereco.trim() !== "" && (
                    <p><strong> Endereço:</strong> {pedidoEditando.cliente_endereco}</p>
                  )}
                </div>

                <div className="detail-group">
                  <h3>Empresa</h3>
                  <p><strong>Nome:</strong> {pedidoEditando.empresa_nome}</p>
                  <p><strong>Email:</strong> {pedidoEditando.empresa_email}</p>
                  <p><strong>Telefone:</strong> {pedidoEditando.empresa_telefone}</p>
                </div>

                <div className="detail-group">
                  <h3>Datas</h3>
                  <p><strong>Cadastro:</strong> {formatDateTime(pedidoEditando.data_cadastro)}</p>
                  {pedidoEditando.data_update && (
                    <p><strong>Atualização:</strong> {formatDateTime(pedidoEditando.data_update)}</p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={fecharModais}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => {
                    setShowDetailModal(false);
                    abrirModalEditar(pedidoEditando);
                  }}
                >
                  <FaEdit /> Editar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && pedidoParaDeletar && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="modal-close" onClick={fecharModais}>
                <FaTimes />
              </button>
            </div>

            <div className="delete-content">
              <div className="warning-icon">
                <FaTrash />
              </div>
              <h3>Tem certeza que deseja excluir este pedido?</h3>
              <p><strong>{pedidoParaDeletar.id}</strong></p>
              <p><strong>Cliente:</strong> {pedidoParaDeletar.cliente}</p>
              <p><strong>Projeto:</strong> {pedidoParaDeletar.produto_nome}</p>
              <p><strong>Total:</strong> {formatCurrency(pedidoParaDeletar.total)}</p>
              <p className="warning-text">Esta ação não pode ser desfeita!</p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={fecharModais}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
