import React, { useState, useEffect } from 'react';
import SideBar from '../../components/SideBar/index';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FaChartBar, FaChartPie, FaDollarSign, FaPercentage, FaCoins, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { usePlataforma } from '../../context/PlataformaContext';
import { API_ENDPOINTS } from '../../config/api';
import './styles.css';

function GraficosFaturamento() {
  const { getAuthHeaders } = usePlataforma();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cores para os gráficos
  const CORES = {
    faturamento: '#667eea',
    lucroBruto: '#48bb78',
    lucroLiquido: '#ed8936',
    custo: '#f56565',
    margemBruta: '#38b2ac',
    margemLiquida: '#ed8936',
    roi: '#9f7aea'
  };

  // Cores para gráfico de pizza
  const CORES_PIZZA = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#38b2ac', '#9f7aea'];

  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(API_ENDPOINTS.GRAFICO_FATURAMENTOS, {
        headers: getAuthHeaders()
      });

      setDados(response.data);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados dos gráficos');
      toast.error('Erro ao carregar dados dos gráficos');
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para gráfico de barras - Comparação mensal
  const prepararDadosComparacaoMensal = () => {
    if (!dados || !dados.comparacao_mensal) return [];
    
    return dados.comparacao_mensal.map(item => ({
      mes: item.mes,
      'Faturamento Bruto': item.faturamento_bruto || 0,
      'Lucro Bruto': item.lucro_bruto || 0,
      'Lucro Líquido': item.lucro_liquido || 0,
      'Custo Total': item.custo_total || 0
    }));
  };

  // Preparar dados para gráfico de barras - Resumo geral
  const prepararDadosResumoGeral = () => {
    if (!dados || !dados.resumo_geral) return [];
    
    return [
      {
        nome: 'Faturamento',
        valor: dados.resumo_geral.faturamento_bruto || 0
      },
      {
        nome: 'Lucro Bruto',
        valor: dados.resumo_geral.lucro_bruto || 0
      },
      {
        nome: 'Lucro Líquido',
        valor: dados.resumo_geral.lucro_liquido || 0
      },
      {
        nome: 'Custo Total',
        valor: dados.resumo_geral.custo_total || 0
      }
    ];
  };

  // Preparar dados para gráfico de pizza - Distribuição de receitas
  const prepararDadosPizzaReceitas = () => {
    if (!dados || !dados.resumo_geral) return [];
    
    return [
      { name: 'Lucro Bruto', value: dados.resumo_geral.lucro_bruto || 0 },
      { name: 'Custo Total', value: dados.resumo_geral.custo_total || 0 }
    ];
  };

  // Preparar dados para gráfico de pizza - Margens e ROI
  const prepararDadosPizzaIndicadores = () => {
    if (!dados || !dados.resumo_geral) return [];
    
    return [
      { name: 'Margem Bruta', value: dados.resumo_geral.margem_bruta || 0 },
      { name: 'Margem Líquida', value: dados.resumo_geral.margem_liquida || 0 },
      { name: 'ROI', value: dados.resumo_geral.roi || 0 }
    ];
  };

  // Formatar valor monetário
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Formatar porcentagem
  const formatarPorcentagem = (valor) => {
    return (valor || 0).toFixed(2) + '%';
  };

  // Custom Tooltip para gráficos de barra
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip para gráficos de pizza
  const CustomTooltipPizza = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p style={{ color: data.color }}>
            Valor: {formatarMoeda(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container">
        <SideBar />
        <div className="main-content">
          <div className="graficos-container">
            <div className="loading-container">
              <p>Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <SideBar />
        <div className="main-content">
          <div className="graficos-container">
            <div className="error-container">
              <p>Erro: {error}</p>
              <button onClick={buscarDados} className="retry-btn">
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="container">
        <SideBar />
        <div className="main-content">
          <div className="graficos-container">
            <div className="no-data-container">
              <p>Nenhum dado disponível</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dadosComparacao = prepararDadosComparacaoMensal();
  const dadosResumo = prepararDadosResumoGeral();
  const dadosPizzaReceitas = prepararDadosPizzaReceitas();
  const dadosPizzaIndicadores = prepararDadosPizzaIndicadores();

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <div className="graficos-container">
        {/* Header */}
        <div className="graficos-header">
          <div className="header-title">
            <h1>
              <FaChartBar className="header-icon" />
              Gráficos de Faturamento
            </h1>
            <p>Análise financeira e comparação mensal</p>
          </div>
          <button onClick={buscarDados} className="refresh-btn">
            Atualizar
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="resumo-cards-grid">
          <div className="resumo-card resumo-card-blue">
            <div className="card-icon">
              <FaDollarSign />
            </div>
            <div className="card-content">
              <p className="card-label">Faturamento Bruto</p>
              <p className="card-value">
                {formatarMoeda(dados.resumo_geral?.faturamento_bruto)}
              </p>
            </div>
          </div>

          <div className="resumo-card resumo-card-green">
            <div className="card-icon">
              <FaMoneyBillWave />
            </div>
            <div className="card-content">
              <p className="card-label">Lucro Bruto</p>
              <p className="card-value">
                {formatarMoeda(dados.resumo_geral?.lucro_bruto)}
              </p>
            </div>
          </div>

          <div className="resumo-card resumo-card-yellow">
            <div className="card-icon">
              <FaPercentage />
            </div>
            <div className="card-content">
              <p className="card-label">Margem Bruta</p>
              <p className="card-value">
                {formatarPorcentagem(dados.resumo_geral?.margem_bruta)}
              </p>
            </div>
          </div>

          <div className="resumo-card resumo-card-purple">
            <div className="card-icon">
              <FaCoins />
            </div>
            <div className="card-content">
              <p className="card-label">ROI</p>
              <p className="card-value">
                {formatarPorcentagem(dados.resumo_geral?.roi)}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras - Comparação Mensal */}
        {dadosComparacao.length > 0 && (
          <div className="grafico-card">
            <div className="grafico-header">
              <h2>
                <FaChartBar /> Comparação Mensal - Faturamento e Lucros
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosComparacao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#718096"
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatarMoeda(value)}
                  stroke="#718096"
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Faturamento Bruto" fill={CORES.faturamento} />
                <Bar dataKey="Lucro Bruto" fill={CORES.lucroBruto} />
                <Bar dataKey="Lucro Líquido" fill={CORES.lucroLiquido} />
                <Bar dataKey="Custo Total" fill={CORES.custo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Barras - Resumo Geral */}
        <div className="grafico-card">
          <div className="grafico-header">
            <h2>
              <FaChartBar /> Resumo Geral - Valores Financeiros
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosResumo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="nome" 
                stroke="#718096"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                tickFormatter={(value) => formatarMoeda(value)}
                stroke="#718096"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" fill={CORES.faturamento} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráficos de Pizza */}
        <div className="graficos-pizza-grid">
          <div className="grafico-card">
            <div className="grafico-header">
              <h2>
                <FaChartPie /> Distribuição: Lucro vs Custo
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizzaReceitas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizzaReceitas.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CORES_PIZZA[index % CORES_PIZZA.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPizza />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-card">
            <div className="grafico-header">
              <h2>
                <FaChartPie /> Indicadores: Margens e ROI
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizzaIndicadores}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatarPorcentagem(value)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizzaIndicadores.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CORES_PIZZA[index + 2]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPizza />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Resumo Detalhado */}
        {dados.comparacao_mensal && dados.comparacao_mensal.length > 0 && (
          <div className="grafico-card">
            <div className="grafico-header">
              <h2>Comparação Detalhada por Mês</h2>
            </div>
            <div className="tabela-resumo">
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Faturamento Bruto</th>
                    <th>Lucro Bruto</th>
                    <th>Lucro Líquido</th>
                    <th>Custo Total</th>
                    <th>Margem Bruta</th>
                    <th>Margem Líquida</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.comparacao_mensal.map((item, index) => {
                    const margemBruta = item.faturamento_bruto > 0 
                      ? ((item.lucro_bruto / item.faturamento_bruto) * 100).toFixed(2)
                      : '0.00';
                    const margemLiquida = item.faturamento_bruto > 0
                      ? ((item.lucro_liquido / item.faturamento_bruto) * 100).toFixed(2)
                      : '0.00';
                    
                    return (
                      <tr key={index}>
                        <td>{item.mes}</td>
                        <td>{formatarMoeda(item.faturamento_bruto)}</td>
                        <td>{formatarMoeda(item.lucro_bruto)}</td>
                        <td>{formatarMoeda(item.lucro_liquido)}</td>
                        <td>{formatarMoeda(item.custo_total)}</td>
                        <td>{margemBruta}%</td>
                        <td>{margemLiquida}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default GraficosFaturamento;

