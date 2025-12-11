import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { usePlataforma } from './PlataformaContext';
import { toast } from 'react-toastify';
import { SOCKET_URL, API_ENDPOINTS } from '../config/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { usuario, token, getAuthHeaders } = usePlataforma();
  const [conversas, setConversas] = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const socketRef = useRef(null);

  // Marcar mensagem como lida
  const marcarComoLida = useCallback(async (mensagemId) => {
    try {
      await axios.put(API_ENDPOINTS.MARCAR_LIDA(mensagemId), {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  }, [getAuthHeaders]);

  // Conectar Socket.IO
  useEffect(() => {
    if (!token || !usuario) return;

    // Conectar socket com autenticação
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Eventos do socket
    socket.on('connect', () => {
      console.log('✅ Conectado ao Socket.IO');
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do Socket.IO');
    });

    const handleReceivedMessage = (mensagemData) => {
      console.log('📨 Nova mensagem recebida:', mensagemData);
      
      // Garantir que os dados do remetente estejam presentes
      let mensagemCompleta = { ...mensagemData };
      
      // Se não tiver dados do Remetente, tentar buscar da conversa atual
      if (!mensagemCompleta.Remetente && conversaAtual?.conversa_id === mensagemData.conversa_id) {
        // Se o remetente é o cliente da conversa
        if (mensagemData.remetente_id === conversaAtual.usuario1_id && conversaAtual.Usuario1) {
          mensagemCompleta.Remetente = conversaAtual.Usuario1;
        }
      }
      
      // Se ainda não tiver Remetente, criar um objeto básico
      if (!mensagemCompleta.Remetente) {
        mensagemCompleta.Remetente = {
          usuario_id: mensagemData.remetente_id,
          nome: mensagemData.Remetente?.nome || 'Cliente',
          foto_perfil: mensagemData.Remetente?.foto_perfil || null
        };
      }
      
      // Se a conversa está aberta e não é você quem enviou, marcar como lida automaticamente
      const conversaEstaAberta = conversaAtual?.conversa_id === mensagemData.conversa_id;
      const naoFuiEu = mensagemData.remetente_id !== usuario?.usuario_id;
      
      if (conversaEstaAberta && naoFuiEu) {
        // Marcar como lida no backend
        marcarComoLida(mensagemCompleta.mensagem_id);
        mensagemCompleta.lida = true;
      }
      
      // Adicionar mensagem ao estado
      setMensagens(prev => {
        // Evitar duplicatas
        const existe = prev.find(m => m.mensagem_id === mensagemCompleta.mensagem_id);
        if (existe) return prev;
        return [...prev, mensagemCompleta];
      });

      // Atualizar preview da conversa e badge
      setConversas(prev => {
        const conversaExiste = prev.find(conv => conv.conversa_id === mensagemData.conversa_id);
        
        if (conversaExiste) {
          // Se a conversa já existe, atualizar
          return prev.map(conv => {
            if (conv.conversa_id === mensagemData.conversa_id) {
              // Se a conversa está aberta, não incrementar badge (já foi marcada como lida)
              // Se a conversa não está aberta e não foi você quem enviou, incrementar badge
              let novoNaoLidas = conv.nao_lidas || 0;
              
              if (conversaEstaAberta) {
                // Conversa aberta = mensagem já foi vista, badge = 0
                novoNaoLidas = 0;
              } else if (naoFuiEu) {
                // Conversa fechada e não foi você = incrementar badge
                novoNaoLidas = novoNaoLidas + 1;
              }
              
              // Persistir no localStorage
              const storageKey = `chat_nao_lidas_${usuario?.usuario_id}_${conv.conversa_id}`;
              localStorage.setItem(storageKey, novoNaoLidas.toString());
              
              console.log('🔔 Atualizando badge da conversa:', {
                conversa_id: conv.conversa_id,
                conversaEstaAberta,
                naoFuiEu,
                nao_lidas_anterior: conv.nao_lidas,
                nao_lidas_novo: novoNaoLidas
              });
              
              return { 
                ...conv, 
                nao_lidas: novoNaoLidas,
                ultima_mensagem_texto: mensagemData.conteudo || mensagemData.texto || '',
                ultima_mensagem: mensagemData.data_envio || new Date().toISOString()
              };
            }
            return conv;
          });
        } else {
          // Se a conversa não existe, adicionar com badge = 1 (se não for você quem enviou)
          const naoLidas = mensagemData.remetente_id !== usuario?.usuario_id && 
                          mensagemData.conversa_id !== conversaAtual?.conversa_id 
                          ? 1 
                          : 0;
          
          // Criar objeto de conversa básico
          const novaConversa = {
            conversa_id: mensagemData.conversa_id,
            usuario1_id: mensagemData.remetente_id === usuario?.usuario_id 
              ? mensagemData.destinatario_id 
              : mensagemData.remetente_id,
            Usuario1: mensagemData.Remetente || { nome: 'Cliente' },
            nao_lidas: naoLidas,
            ultima_mensagem_texto: mensagemData.conteudo || mensagemData.texto || '',
            ultima_mensagem: mensagemData.data_envio || new Date().toISOString()
          };
          
          return [novaConversa, ...prev];
        }
      });

      // Notificação se não for você quem enviou
      if (mensagemData.remetente_id !== usuario.usuario_id) {
        toast.info(`Nova mensagem de ${mensagemData.Remetente?.nome || 'Cliente'}`, {
          position: 'top-right',
          autoClose: 3000
        });
      }
    };

    socket.on('receivedMessage', handleReceivedMessage);

    socket.on('error', (error) => {
      console.error('❌ Erro no Socket.IO:', error);
      toast.error(error.message || 'Erro na conexão do chat');
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off('receivedMessage', handleReceivedMessage);
        socket.disconnect();
      }
    };
  }, [token, usuario, conversaAtual, marcarComoLida]);

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CONVERSAS, {
        headers: getAuthHeaders()
      });

      // Normalizar dados das conversas e mapear campo do texto da última mensagem
      // Preservar o estado atual de nao_lidas se for maior que o do backend (atualizado via socket)
      setConversas(prevConversas => {
        const conversasNormalizadas = response.data.map(conv => {
          const naoLidasBackend = conv.nao_lidas !== undefined && conv.nao_lidas !== null 
            ? Number(conv.nao_lidas) 
            : (conv.nao_lidas_count !== undefined ? Number(conv.nao_lidas_count) : 0);
          
          // Verificar se já existe uma conversa no estado atual com nao_lidas maior
          const conversaExistente = prevConversas.find(c => c.conversa_id === conv.conversa_id);
          const naoLidasAtual = conversaExistente?.nao_lidas || 0;
          
          // Tentar recuperar do localStorage (persistido via socket)
          const storageKey = `chat_nao_lidas_${usuario?.usuario_id}_${conv.conversa_id}`;
          const naoLidasStorage = localStorage.getItem(storageKey);
          const naoLidasPersistido = naoLidasStorage ? Number(naoLidasStorage) : 0;
          
          // Usar o maior valor entre backend, estado atual e localStorage
          const naoLidas = Math.max(naoLidasBackend, naoLidasAtual, naoLidasPersistido);
          
          return {
            ...conv,
            ultima_mensagem_texto: conv.ultima_mensagem_texto || 
                                   conv.ultima_mensagem_conteudo || 
                                   conv.UltimaMensagem?.conteudo || 
                                   conv.UltimaMensagem?.texto ||
                                   '',
            // Garantir que nao_lidas seja um número válido, preservando atualizações do socket
            nao_lidas: naoLidas
          };
        });

        // Ordenar por última mensagem (mais recente primeiro)
        const conversasOrdenadas = conversasNormalizadas.sort((a, b) => {
          const dataA = new Date(a.ultima_mensagem || 0);
          const dataB = new Date(b.ultima_mensagem || 0);
          return dataB - dataA;
        });

        return conversasOrdenadas;
      });
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, usuario]);

  // Carregar mensagens de uma conversa
  const carregarMensagens = useCallback(async (conversaId) => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.MENSAGENS(conversaId), {
        headers: getAuthHeaders()
      });

      // Ordenar por data de envio (mais antiga primeiro)
      const mensagensOrdenadas = response.data.sort((a, b) => {
        const dataA = new Date(a.data_envio || 0);
        const dataB = new Date(b.data_envio || 0);
        return dataA - dataB;
      });

      setMensagens(mensagensOrdenadas);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Criar nova conversa
  const criarConversa = useCallback(async (destinatarioId) => {
    try {
      setLoading(true);
      const response = await axios.post(API_ENDPOINTS.CONVERSAS, {
        destinatario_id: destinatarioId
      }, {
        headers: getAuthHeaders()
      });

      toast.success('Conversa criada com sucesso');
      
      // Recarregar conversas
      await carregarConversas();
      
      // Abrir a nova conversa
      if (response.data.conversa) {
        setConversaAtual(response.data.conversa);
        await carregarMensagens(response.data.conversa.conversa_id);
      }

      return response.data.conversa;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar conversa';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, carregarConversas, carregarMensagens]);

  // Enviar mensagem
  const enviarMensagem = useCallback(async (conteudo, destinatarioId) => {
    if (!conteudo.trim() || !socketRef.current) return;

    try {
      setEnviando(true);
      
      // Enviar via Socket.IO
      socketRef.current.emit('sendMessage', {
        destinatario_id: destinatarioId,
        conteudo: conteudo.trim()
      });

      // A mensagem será adicionada ao estado quando o servidor confirmar via 'receivedMessage'
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  }, []);

  // Selecionar conversa
  const selecionarConversa = useCallback(async (conversa) => {
    setConversaAtual(conversa);
    await carregarMensagens(conversa.conversa_id);
    
    // Aguardar um pouco para garantir que as mensagens foram carregadas
    setTimeout(async () => {
      // Marcar mensagens não lidas como lidas
      setMensagens(prev => {
        const mensagensNaoLidas = prev.filter(m => 
          m.conversa_id === conversa.conversa_id &&
          !m.lida && 
          m.remetente_id !== usuario?.usuario_id
        );
        
        // Marcar como lidas no backend
        mensagensNaoLidas.forEach(msg => {
          marcarComoLida(msg.mensagem_id);
        });
        
        return prev;
      });
    }, 100);

    // Atualizar conversa para remover badge imediatamente
    setConversas(prev => prev.map(conv => {
      if (conv.conversa_id === conversa.conversa_id) {
        // Limpar do localStorage também
        const storageKey = `chat_nao_lidas_${usuario?.usuario_id}_${conv.conversa_id}`;
        localStorage.removeItem(storageKey);
        return { ...conv, nao_lidas: 0 };
      }
      return conv;
    }));
  }, [carregarMensagens, usuario, marcarComoLida]);

  // Verificar se mensagem foi enviada por você
  const isMinhaMensagem = useCallback((mensagem) => {
    return mensagem.remetente_id === usuario?.usuario_id;
  }, [usuario]);

  // Verificar se mensagem foi enviada por outro funcionário
  const isMensagemFuncionario = useCallback((mensagem) => {
    if (!usuario) return false;
    // Se não é você e não é o cliente (usuario1_id), é outro funcionário
    const clienteId = conversaAtual?.usuario1_id;
    return mensagem.remetente_id !== usuario.usuario_id && 
           mensagem.remetente_id !== clienteId;
  }, [usuario, conversaAtual]);

  // Calcular total de mensagens não lidas
  const totalNaoLidas = useMemo(() => {
    return conversas.reduce((total, conv) => {
      return total + (Number(conv.nao_lidas) || 0);
    }, 0);
  }, [conversas]);

  const value = {
    conversas,
    conversaAtual,
    mensagens,
    loading,
    enviando,
    totalNaoLidas,
    carregarConversas,
    carregarMensagens,
    criarConversa,
    enviarMensagem,
    marcarComoLida,
    selecionarConversa,
    isMinhaMensagem,
    isMensagemFuncionario
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};

