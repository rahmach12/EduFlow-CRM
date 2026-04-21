import React, { useState } from 'react';
import { MessageSquare, Send, Search, Clock, CheckCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Mock data for Messages — backend integration-ready
const MOCK_MESSAGES = [
  {
    id: 1,
    from: 'Administration EduFlow',
    avatar: 'A',
    color: 'bg-purple-500',
    subject: 'Réunion pédagogique — 20 Avril 2026',
    preview: 'Bonjour, veuillez noter que la réunion pédagogique aura lieu le...',
    body: 'Bonjour, veuillez noter que la réunion pédagogique aura lieu le 20 avril 2026 à 10h00 dans la salle de conférence principale. Votre présence est obligatoire.',
    date: '2026-04-13',
    time: '09:30',
    read: false,
    type: 'received',
  },
  {
    id: 2,
    from: 'Prof. Sami Ben Salah',
    avatar: 'S',
    color: 'bg-blue-500',
    subject: 'Concernant votre note en Algorithmique',
    preview: 'Suite à votre demande de révision de note, je vous informe que...',
    body: 'Suite à votre demande de révision de note, je vous informe que votre note a été réévaluée et confirmée. Si vous avez des questions, contactez-moi pendant les heures de bureau.',
    date: '2026-04-12',
    time: '14:15',
    read: true,
    type: 'received',
  },
  {
    id: 3,
    from: 'Moi',
    avatar: 'R',
    color: 'bg-violet-500',
    subject: 'Demande de certificat de scolarité',
    preview: 'Bonjour, je souhaiterais obtenir un certificat de scolarité pour...',
    body: 'Bonjour, je souhaiterais obtenir un certificat de scolarité pour la présentation à ma banque. Pourriez-vous me le fournir dans les meilleurs délais ? Merci.',
    date: '2026-04-10',
    time: '11:00',
    read: true,
    type: 'sent',
  },
];

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', body: '' });
  const [composing, setComposing] = useState(false);

  const unreadCount = messages.filter(m => !m.read && m.type === 'received').length;

  const filteredMessages = messages.filter(m =>
    m.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openMessage = (msg) => {
    setSelectedMessage(msg);
    setComposing(false);
    // Mark as read
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
  };

  const handleSend = (e) => {
    e.preventDefault();
    const sent = {
      id: Date.now(),
      from: 'Moi',
      avatar: user?.first_name?.charAt(0) || 'M',
      color: 'bg-violet-500',
      subject: newMessage.subject,
      preview: newMessage.body.slice(0, 60) + '...',
      body: newMessage.body,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: true,
      type: 'sent',
    };
    setMessages(prev => [sent, ...prev]);
    setComposing(false);
    setNewMessage({ to: '', subject: '', body: '' });
    setSelectedMessage(sent);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Messages
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} message(s) non lu(s)</p>
        </div>
        <button
          onClick={() => { setComposing(true); setSelectedMessage(null); }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20"
        >
          <Send className="h-4 w-4 mr-2" /> Nouveau Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-260px)] min-h-[500px]">
        {/* Messages List */}
        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-[#2e2a6b]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2e2a6b] rounded-lg text-slate-800 dark:text-white focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-[#2e2a6b]">
            {filteredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left px-4 py-4 hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 h-9 w-9 rounded-full ${msg.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${!msg.read && msg.type === 'received' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {msg.from}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{msg.time}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${!msg.read && msg.type === 'received' ? 'text-slate-800 dark:text-gray-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {msg.subject}
                    </p>
                    {!msg.read && msg.type === 'received' && (
                      <span className="inline-block mt-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Detail / Compose */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden flex flex-col">
          {composing ? (
            <div className="flex-1 flex flex-col p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Nouveau Message</h3>
              <form onSubmit={handleSend} className="flex-1 flex flex-col gap-4">
                <input type="text" placeholder="À (destinataire)..." value={newMessage.to} onChange={e => setNewMessage({ ...newMessage, to: e.target.value })} required
                  className="w-full px-4 py-2 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm" />
                <input type="text" placeholder="Objet..." value={newMessage.subject} onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })} required
                  className="w-full px-4 py-2 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm" />
                <textarea placeholder="Votre message..." value={newMessage.body} onChange={e => setNewMessage({ ...newMessage, body: e.target.value })} required rows={8}
                  className="flex-1 w-full px-4 py-3 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-white text-sm resize-none" />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setComposing(false)} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl">Annuler</button>
                  <button type="submit" className="flex items-center px-5 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition">
                    <Send className="h-4 w-4 mr-2" /> Envoyer
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="pb-4 border-b border-slate-100 dark:border-[#2e2a6b] mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`h-9 w-9 rounded-full ${selectedMessage.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {selectedMessage.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedMessage.type === 'sent' ? `À: ${selectedMessage.to || 'Administration'}` : `De: ${selectedMessage.from}`}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{selectedMessage.date} · {selectedMessage.time}
                      {selectedMessage.type === 'sent' && <CheckCheck className="h-3 w-3 text-blue-500 ml-2" />}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedMessage.body}</p>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#2e2a6b]">
                <button
                  onClick={() => { setComposing(true); setNewMessage({ to: selectedMessage.from, subject: `Re: ${selectedMessage.subject}`, body: '' }); }}
                  className="flex items-center text-sm text-primary font-medium hover:underline"
                >
                  <Send className="h-4 w-4 mr-2" /> Répondre
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
              <MessageSquare className="h-16 w-16 opacity-20 mb-4" />
              <p className="font-medium">Sélectionnez un message pour le lire</p>
              <p className="text-sm mt-1">ou composez un nouveau message</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
