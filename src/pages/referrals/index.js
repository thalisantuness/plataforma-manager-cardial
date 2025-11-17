// pages/referrals/index.js
import React, { useState } from "react";
import SideBar from "../../components/SideBar/index";
import Footer from "../../components/Footer/index";
import { FaUserPlus, FaGift, FaPhone, FaEnvelope, FaCheckCircle, FaClock } from "react-icons/fa";
import "./styles.css";

function ReferralsPage() {
  const [filter, setFilter] = useState("all"); // all, pending, converted, expired

  // Dados fictícios de indicações
  const referrals = [
    {
      id: "IND-001",
      referrer: "João Silva",
      referrerPhone: "(11) 99999-9999",
      referredName: "Carlos Santos",
      referredPhone: "(11) 98888-8888",
      referredEmail: "carlos.santos@email.com",
      date: "2024-03-20",
      status: "converted",
      conversionDate: "2024-03-22",
      reward: "R$ 50,00",
      notes: "Cliente comprou 2 camisas do Flamengo"
    },
    {
      id: "IND-002",
      referrer: "Maria Oliveira",
      referrerPhone: "(11) 97777-7777",
      referredName: "Ana Paula Lima",
      referredPhone: "(11) 96666-6666",
      referredEmail: "ana.lima@email.com",
      date: "2024-03-19",
      status: "pending",
      conversionDate: null,
      reward: "Pendente",
      notes: "Indicada interessada em camisas infantis"
    },
    {
      id: "IND-003",
      referrer: "Pedro Costa",
      referrerPhone: "(11) 95555-5555",
      referredName: "Roberto Almeida",
      referredPhone: "(11) 94444-4444",
      referredEmail: "roberto.almeida@email.com",
      date: "2024-03-18",
      status: "converted",
      conversionDate: "2024-03-20",
      reward: "R$ 30,00",
      notes: "Comprou uma camisa do Corinthians"
    },
    {
      id: "IND-004",
      referrer: "Ana Santos",
      referrerPhone: "(11) 93333-3333",
      referredName: "Mariana Ferreira",
      referredPhone: "(11) 92222-2222",
      referredEmail: "mariana.ferreira@email.com",
      date: "2024-03-15",
      status: "expired",
      conversionDate: null,
      reward: "Expirada",
      notes: "Não retornou o contato após 7 dias"
    },
    {
      id: "IND-005",
      referrer: "Luiz Pereira",
      referrerPhone: "(11) 91111-1111",
      referredName: "Fernando Silva",
      referredPhone: "(11) 90000-0000",
      referredEmail: "fernando.silva@email.com",
      date: "2024-03-21",
      status: "pending",
      conversionDate: null,
      reward: "Pendente",
      notes: "Agendado para visita na sexta-feira"
    }
  ];

  const filteredReferrals = referrals.filter(referral => {
    if (filter === "all") return true;
    return referral.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", class: "status-pending", icon: <FaClock /> },
      converted: { label: "Convertido", class: "status-converted", icon: <FaCheckCircle /> },
      expired: { label: "Expirada", class: "status-expired", icon: <FaClock /> }
    };
    return statusConfig[status] || { label: status, class: "status-default", icon: null };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleContact = (phone, name) => {
    // Aqui você implementaria o contato via WhatsApp
    const message = `Olá ${name}! Vi que você foi indicado(a) para nossa loja. Gostaria de conhecer nossos produtos?`;
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleMarkAsConverted = (referralId) => {
    // Aqui você implementaria a atualização no backend
    console.log(`Marcando indicação ${referralId} como convertida`);
    alert(`Indicação ${referralId} marcada como convertida!`);
  };

  const totalRewards = referrals
    .filter(r => r.status === 'converted')
    .reduce((total, referral) => {
      const value = parseFloat(referral.reward.replace('R$ ', '').replace(',', '.'));
      return total + value;
    }, 0);

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <div className="referrals-container">
          <div className="referrals-header">
            <div className="header-title">
              <h1>Programa de Indicações</h1>
              <p>Acompanhe as indicações feitas pelos seus clientes</p>
            </div>
            <button className="new-referral-btn">
              <FaUserPlus />
              Nova Indicação
            </button>
          </div>

          {/* Estatísticas */}
          <div className="referrals-stats">
            <div className="stat-card">
              <span className="stat-number">{referrals.length}</span>
              <span className="stat-label">Total de Indicações</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {referrals.filter(r => r.status === 'converted').length}
              </span>
              <span className="stat-label">Clientes Convertidos</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {referrals.filter(r => r.status === 'pending').length}
              </span>
              <span className="stat-label">Pendentes</span>
            </div>
            <div className="stat-card highlight">
              <span className="stat-number">R$ {totalRewards.toFixed(2)}</span>
              <span className="stat-label">Recompensas Distribuídas</span>
            </div>
          </div>

          {/* Filtros */}
          <div className="referrals-filters">
            <button 
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            <button 
              className={`filter-btn ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pendentes
            </button>
            <button 
              className={`filter-btn ${filter === "converted" ? "active" : ""}`}
              onClick={() => setFilter("converted")}
            >
              Convertidas
            </button>
            <button 
              className={`filter-btn ${filter === "expired" ? "active" : ""}`}
              onClick={() => setFilter("expired")}
            >
              Expiradas
            </button>
          </div>

          {/* Lista de Indicações */}
          <div className="referrals-list">
            {filteredReferrals.length === 0 ? (
              <div className="no-referrals">
                <FaUserPlus className="empty-icon" />
                <p>Nenhuma indicação encontrada</p>
                <span>Quando receber indicações, elas aparecerão aqui</span>
              </div>
            ) : (
              filteredReferrals.map((referral) => {
                const statusInfo = getStatusBadge(referral.status);
                return (
                  <div key={referral.id} className="referral-card">
                    <div className="referral-header">
                      <div className="referral-info">
                        <h3 className="referral-id">{referral.id}</h3>
                        <span className="referral-date">{formatDate(referral.date)}</span>
                      </div>
                      <div className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="referral-details">
                      <div className="referrer-info">
                        <h4>Quem Indicou</h4>
                        <div className="person-card">
                          <FaUserPlus className="person-icon" />
                          <div className="person-details">
                            <strong>{referral.referrer}</strong>
                            <span>{referral.referrerPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="referred-info">
                        <h4>Quem foi Indicado</h4>
                        <div className="person-card">
                          <FaUserPlus className="person-icon" />
                          <div className="person-details">
                            <strong>{referral.referredName}</strong>
                            <span>{referral.referredPhone}</span>
                            <span>{referral.referredEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="referral-meta">
                        <div className="meta-item">
                          <FaGift className="meta-icon" />
                          <div className="meta-details">
                            <span className="meta-label">Recompensa</span>
                            <span className="meta-value">{referral.reward}</span>
                          </div>
                        </div>
                        {referral.conversionDate && (
                          <div className="meta-item">
                            <FaCheckCircle className="meta-icon" />
                            <div className="meta-details">
                              <span className="meta-label">Convertido em</span>
                              <span className="meta-value">{formatDate(referral.conversionDate)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="referral-notes">
                      <h4>Observações</h4>
                      <p>{referral.notes}</p>
                    </div>

                    <div className="referral-actions">
                      {referral.status === "pending" && (
                        <>
                          <button 
                            className="action-btn contact-btn"
                            onClick={() => handleContact(referral.referredPhone, referral.referredName)}
                          >
                            <FaPhone />
                            Entrar em Contato
                          </button>
                          <button 
                            className="action-btn convert-btn"
                            onClick={() => handleMarkAsConverted(referral.id)}
                          >
                            <FaCheckCircle />
                            Marcar como Convertido
                          </button>
                        </>
                      )}
                      {referral.status === "converted" && (
                        <button className="action-btn details-btn">
                          <FaEnvelope />
                          Enviar Agradecimento
                        </button>
                      )}
                      {referral.status === "expired" && (
                        <button className="action-btn contact-btn">
                          <FaPhone />
                          Tentar Contato Novamente
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default ReferralsPage;