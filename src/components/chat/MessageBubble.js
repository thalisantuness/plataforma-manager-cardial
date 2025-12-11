import React from 'react';
import './chat.css';

const MessageBubble = ({ mensagem, isMinhaMensagem, isMensagemFuncionario, usuarioLogado }) => {
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNomeRemetente = () => {
    if (isMinhaMensagem) return 'Você';
    if (isMensagemFuncionario) {
      return mensagem.Remetente?.nome || 'Funcionário';
    }
    return mensagem.Remetente?.nome || 'Cliente';
  };

  return (
    <div className={`message-bubble ${isMinhaMensagem ? 'message-sent' : 'message-received'}`}>
      {!isMinhaMensagem && (
        <div className="message-avatar">
          <img 
            src={mensagem.Remetente?.foto_perfil || 'https://via.placeholder.com/40'} 
            alt={getNomeRemetente()}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/40';
            }}
          />
        </div>
      )}
      
      <div className="message-content">
        {!isMinhaMensagem && (
          <div className="message-sender">
            {getNomeRemetente()}
            {isMensagemFuncionario && <span className="funcionario-badge">Funcionário</span>}
          </div>
        )}
        
        <div className="message-text">
          {mensagem.conteudo}
        </div>
        
        <div className="message-time">
          {formatarData(mensagem.data_envio)}
          {mensagem.lida && isMinhaMensagem && (
            <span className="message-read">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

