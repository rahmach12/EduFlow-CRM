import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Clock, CheckCheck, Plus, ArrowLeft, Users, User, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const Messages = () => {
  const { user } = useAuth();
  const { echoInstance } = useNotifications();
  const role = user?.role?.name;

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [partners, setPartners] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Compose form state
  const [newThread, setNewThread] = useState({
    type: 'direct', // 'direct' or 'class'
    receiver_id: '',
    class_id: '',
    subject: '',
    body: '',
  });

  // Reply form state
  const [replyBody, setReplyBody] = useState('');

  const fetchThreads = async (autoSelectId = null) => {
    try {
      const res = await api.get('/messages');
      setThreads(res.data);
      
      // If we are currently viewing a thread, refresh its content in the view
      if (selectedThread) {
        const updated = res.data.find(t => t.id === selectedThread.id);
        if (updated) {
          setSelectedThread(updated);
        }
      } else if (autoSelectId) {
        const found = res.data.find(t => t.id === autoSelectId);
        if (found) {
          setSelectedThread(found);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des messages', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const partnersRes = await api.get('/messages/partners');
      setPartners(partnersRes.data);

      if (['Admin', 'Teacher', 'Scolarite'].includes(role)) {
        const classesRes = await api.get('/classes');
        setClasses(classesRes.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des partenaires/classes', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchThreads();
      fetchFormOptions();
    }
  }, [user]);

  // Echo Listener for real-time thread updates
  useEffect(() => {
    if (user && echoInstance) {
      const userChannel = echoInstance.channel(`user.${user.id}`);
      userChannel.listen('.MessageSent', (e) => {
        // Fetch threads and if current thread is active, auto-refresh
        fetchThreads();
      });

      let classChannel = null;
      if (user.student?.class_id) {
        classChannel = echoInstance.channel(`class.${user.student.class_id}`);
        classChannel.listen('.MessageSent', (e) => {
          fetchThreads();
        });
      }

      return () => {
        userChannel.stopListening('.MessageSent');
        if (classChannel) {
          classChannel.stopListening('.MessageSent');
        }
      };
    }
  }, [user, echoInstance, selectedThread?.id]);

  const openThread = async (thread) => {
    setSelectedThread(thread);
    setComposing(false);
    
    // Mark as read immediately on the frontend
    if (thread.is_unread) {
      setThreads(prev => 
        prev.map(t => t.id === thread.id ? { ...t, is_unread: false } : t)
      );
      try {
        await api.put(`/messages/${thread.id}/read`);
      } catch (err) {
        console.error('Erreur lors du marquage comme lu', err);
      }
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedThread) return;

    setSending(true);
    try {
      const res = await api.post('/messages', {
        parent_id: selectedThread.id,
        body: replyBody,
      });

      const newReply = res.data;
      setSelectedThread(prev => ({
        ...prev,
        replies: [...(prev.replies || []), newReply]
      }));
      setReplyBody('');
      toast.success('Message envoyé');
      fetchThreads();
    } catch (err) {
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThread.body.trim()) return;

    const isClassBroadcast = newThread.type === 'class';
    if (isClassBroadcast && !newThread.class_id) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }
    if (!isClassBroadcast && !newThread.receiver_id) {
      toast.error('Veuillez sélectionner un destinataire.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        subject: newThread.subject,
        body: newThread.body,
      };

      if (isClassBroadcast) {
        payload.class_id = newThread.class_id;
      } else {
        payload.receiver_id = newThread.receiver_id;
      }

      const res = await api.post('/messages', payload);
      toast.success('Message envoyé avec succès');
      setComposing(false);
      setNewThread({ type: 'direct', receiver_id: '', class_id: '', subject: '', body: '' });
      
      const created = res.data;
      created.replies = [];
      setSelectedThread(created);
      fetchThreads(created.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = threads.filter(t => t.is_unread).length;

  const filteredThreads = threads.filter(t => {
    const senderName = t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : '';
    const receiverName = t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : '';
    const className = t.classe ? t.classe.name : '';
    const subject = t.subject || '';

    const query = searchTerm.toLowerCase();
    return (
      senderName.toLowerCase().includes(query) ||
      receiverName.toLowerCase().includes(query) ||
      className.toLowerCase().includes(query) ||
      subject.toLowerCase().includes(query)
    );
  });

  const getThreadMeta = (t) => {
    const isSentByMe = t.sender_id === user?.id;
    let displayName = '';
    let description = '';
    let avatarChar = '?';

    if (t.class_id) {
      displayName = t.classe?.name || 'Groupe';
      description = `Diffusion de ${isSentByMe ? 'Moi' : `${t.sender?.first_name} ${t.sender?.last_name}`}`;
      avatarChar = 'C';
    } else {
      if (isSentByMe) {
        displayName = t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : 'Inconnu';
        description = `Destinataire: ${t.receiver?.role?.name || t.receiver?.role || 'Utilisateur'}`;
        avatarChar = t.receiver?.first_name?.charAt(0) || 'U';
      } else {
        displayName = t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'Inconnu';
        description = t.sender?.role?.name || t.sender?.role || 'Expéditeur';
        avatarChar = t.sender?.first_name?.charAt(0) || 'U';
      }
    }

    const colorIndex = (displayName.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];

    return { displayName, description, avatarChar, avatarColor, isSentByMe };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Messagerie Interne
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount} message(s) non lu(s)
          </p>
        </div>
        <button
          onClick={() => {
            setComposing(true);
            setSelectedThread(null);
            setNewThread({ type: 'direct', receiver_id: '', class_id: '', subject: '', body: '' });
          }}
          className="flex items-center px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-primary/90 transition shadow-md shadow-primary/20 text-sm font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" /> Nouveau Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Side: Threads List */}
        <div className="bg-white dark:bg-[#1E1B4B] rounded-3xl border border-slate-200 dark:border-[#2e2a6b] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-[#2e2a6b]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher une discussion..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2e2a6b] rounded-xl text-slate-800 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e2a6b]">
            {loading ? (
              <div className="text-center py-12 text-sm text-slate-400">Chargement de votre boîte de réception...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">Aucune discussion trouvée.</div>
            ) : (
              filteredThreads.map(thread => {
                const { displayName, description, avatarChar, avatarColor } = getThreadMeta(thread);
                const isSelected = selectedThread?.id === thread.id;
                const dateStr = thread.updated_at
                  ? new Date(thread.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                  : '';
                const timeStr = thread.updated_at
                  ? new Date(thread.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread)}
                    className={`w-full text-left px-4 py-4 hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50 transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-2xl ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {avatarChar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${thread.is_unread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                          {displayName}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{dateStr} {timeStr}</span>
                      </div>
                      <p className="text-xs text-primary font-medium truncate mt-0.5">{thread.subject}</p>
                      <p className={`text-xs truncate mt-0.5 leading-snug ${thread.is_unread ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-400'}`}>
                        {thread.body}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {description}
                        </span>
                        {thread.is_unread && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Detail / Compose */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E1B4B] rounded-3xl border border-slate-200 dark:border-[#2e2a6b] shadow-sm overflow-hidden flex flex-col">
          {composing ? (
            /* Compose Pane */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setComposing(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl dark:hover:bg-slate-800">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Nouveau Message</h3>
              </div>

              <form onSubmit={handleCreateThread} className="flex-1 flex flex-col gap-4">
                {/* Broadcast / Direct Selection */}
                {['Admin', 'Teacher', 'Scolarite'].includes(role) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type d'envoi</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          checked={newThread.type === 'direct'}
                          onChange={() => setNewThread({ ...newThread, type: 'direct', class_id: '' })}
                          className="text-primary focus:ring-primary"
                        />
                        Message Direct Personnel
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          checked={newThread.type === 'class'}
                          onChange={() => setNewThread({ ...newThread, type: 'class', receiver_id: '' })}
                          className="text-primary focus:ring-primary"
                        />
                        Diffusion / Annonce Groupe Classe
                      </label>
                    </div>
                  </div>
                )}

                {/* Recipient Input depending on type */}
                {newThread.type === 'class' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Classe de destination</label>
                    <select
                      required
                      value={newThread.class_id}
                      onChange={e => setNewThread({ ...newThread, class_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm"
                    >
                      <option value="">-- Choisir une classe --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Destinataire</label>
                    <select
                      required
                      value={newThread.receiver_id}
                      onChange={e => setNewThread({ ...newThread, receiver_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm"
                    >
                      <option value="">-- Choisir un destinataire --</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Objet / Sujet</label>
                  <input
                    type="text"
                    required
                    placeholder="Sujet du message..."
                    value={newThread.subject}
                    onChange={e => setNewThread({ ...newThread, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Corps du message</label>
                  <textarea
                    required
                    placeholder="Saisissez votre message ici..."
                    value={newThread.body}
                    onChange={e => setNewThread({ ...newThread, body: e.target.value })}
                    rows={8}
                    className="flex-1 w-full px-4 py-3 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setComposing(false)}
                    className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center px-5 py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50 font-semibold"
                  >
                    <Send className="h-4 w-4 mr-2" /> {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedThread ? (
            /* Thread View Pane */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 dark:border-[#2e2a6b] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedThread(null)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl dark:hover:bg-slate-800">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className={`h-10 w-10 rounded-2xl ${getThreadMeta(selectedThread).avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {getThreadMeta(selectedThread).avatarChar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{getThreadMeta(selectedThread).displayName}</h3>
                    <p className="text-xs text-slate-400">{getThreadMeta(selectedThread).description}</p>
                  </div>
                </div>
                {selectedThread.class_id && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                    <Users className="h-3.5 w-3.5" /> Diffusion de classe
                  </span>
                )}
              </div>

              {/* Message History list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/10">
                <div className="flex flex-col gap-1 border-b border-slate-150 dark:border-slate-800/80 pb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Objet</span>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-snug">{selectedThread.subject}</h4>
                </div>

                {/* Parent Message (Thread Starter) */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    {selectedThread.sender?.first_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 bg-white dark:bg-[#1E1B4B]/80 rounded-2xl p-4 border border-slate-150 dark:border-[#2e2a6b] shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {selectedThread.sender ? `${selectedThread.sender.first_name} ${selectedThread.sender.last_name}` : 'Inconnu'} 
                        <span className="font-normal text-slate-400 ml-1">({selectedThread.sender?.role?.name || 'Rôle'})</span>
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(selectedThread.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedThread.body}
                    </p>
                  </div>
                </div>

                {/* Replies list */}
                {selectedThread.replies && selectedThread.replies.map(reply => (
                  <div key={reply.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                      {reply.sender?.first_name?.charAt(0) || reply.sender_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 bg-white dark:bg-[#1E1B4B]/85 rounded-2xl p-4 border border-slate-150 dark:border-[#2e2a6b] shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          {reply.sender ? `${reply.sender.first_name} ${reply.sender.last_name}` : (reply.sender_name || 'Utilisateur')}
                          <span className="font-normal text-slate-400 ml-1">({reply.sender?.role?.name || 'Rôle'})</span>
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(reply.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {reply.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Composer at the bottom */}
              <div className="p-4 border-t border-slate-200 dark:border-[#2e2a6b] bg-white dark:bg-[#1E1B4B]">
                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Écrire votre réponse..."
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2e2a6b] rounded-xl text-slate-800 dark:text-white focus:ring-primary focus:border-primary focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className="flex items-center justify-center p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow shadow-primary/10 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
              <MessageSquare className="h-16 w-16 opacity-20 mb-4 text-primary" />
              <h4 className="font-bold text-slate-700 dark:text-slate-350 text-base">Aucune discussion sélectionnée</h4>
              <p className="text-xs mt-1 text-slate-500 text-center max-w-xs">
                Sélectionnez une discussion à gauche pour lire les messages et y répondre, ou envoyez un nouveau message à l'administration ou à vos enseignants.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
