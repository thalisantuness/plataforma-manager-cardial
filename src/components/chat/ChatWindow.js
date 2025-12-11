import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaArrowLeft, FaUser } from 'react-icons/fa';
import MessageBubble from './MessageBubble';
import './chat.css';

const ChatWindow = ({ 
  conversa, 
  mensagens, 
  onSendMessage, 
  onBack, 
  enviando,
  isMinhaMensagem,
  isMensagemFuncionario,
  usuarioLogado
}) => {
  const [novaMensagem, setNovaMensagem] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;

    const destinatarioId = conversa?.usuario1_id; // Cliente sempre é usuario1_id
    onSendMessage(novaMensagem, destinatarioId);
    setNovaMensagem('');
    inputRef.current?.focus();
  };

  if (!conversa) {
    return (
      <div className="chat-window empty">
        <div className="chat-empty-state">
          <FaUser className="empty-icon" />
          <h3>Selecione uma conversa</h3>
          <p>Escolha uma conversa da lista para começar a conversar</p>
        </div>
      </div>
    );
  }

  const cliente = conversa.Usuario1;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft />
        </button>
        
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {cliente?.foto_perfil ? (
              <img 
                src={cliente.foto_perfil} 
                alt={cliente.nome}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/40';
                }}
              />
            ) : (
              <FaUser className="avatar-placeholder" />
            )}
          </div>
          
          <div className="chat-header-details">
            <div className="chat-header-nome">
              {cliente?.nome || 'Cliente'}
            </div>
            <div className="chat-header-role">
              Cliente
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={messagesEndRef}>
        {mensagens.length === 0 ? (
          <div className="messages-empty">
            <p>Nenhuma mensagem ainda</p>
            <span>Envie a primeira mensagem para começar a conversa</span>
          </div>
        ) : (
          mensagens.map((mensagem) => (
            <MessageBubble
              key={mensagem.mensagem_id}
              mensagem={mensagem}
              isMinhaMensagem={isMinhaMensagem(mensagem)}
              isMensagemFuncionario={isMensagemFuncionario(mensagem)}
              usuarioLogado={usuarioLogado}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Digite sua mensagem..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          disabled={enviando}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!novaMensagem.trim() || enviando}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

