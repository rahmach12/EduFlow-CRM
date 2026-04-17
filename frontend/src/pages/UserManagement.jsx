import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Trash2, Search, Shield, Users, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

// ── Role Badge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ name }) => {
  const colors = {
    Admin:               'bg-violet-100 text-violet-700',
    Administration:      'bg-violet-100 text-violet-700',
    Teacher:             'bg-blue-100 text-blue-700',
    Student:             'bg-emerald-100 text-emerald-700',
    'Finance Officer':   'bg-amber-100 text-amber-700',
    'Internship Officer':'bg-orange-100 text-orange-700',
    Scolarite:           'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[name] || 'bg-slate-100 text-slate-700'}`}>
      {name}
    </span>
  );
};

const UserManagement = () => {
  const [users, setUsers]   = useState([]);
  const [roles, setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '',
    gender: '', cin: '', role_id: '', phone: '', address: '',
    class_id: '', subject_id: '',
  });

  const [classes, setClasses]   = useState([]);
  const [subjects, setSubjects] = useState([]);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/classes'),
        api.get('/subjects'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (u = null) => {
    setCurrentUser(u);
    setFormData(u ? {
      first_name: u.first_name, last_name: u.last_name, email: u.email,
      password: '', gender: u.gender || '', cin: u.cin || '', role_id: u.role_id || '',
      phone: '', address: '', class_id: '', subject_id: '',
    } : { first_name: '', last_name: '', email: '', password: '', gender: '', cin: '', role_id: '', phone: '', address: '', class_id: '', subject_id: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${currentUser.id}`, payload);
        toast.success('Utilisateur mis à jour !');
      } else {
        await api.post('/users', formData);
        toast.success('Utilisateur créé !');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchData();
    } catch { toast.error('Suppression échouée'); }
  };

  const selectedRole = roles.find(r => r.id === parseInt(formData.role_id));
  const isStudent  = selectedRole?.name === 'Student';
  const isTeacher  = selectedRole?.name === 'Teacher';

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{users.length} compte(s) dans le système</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 shadow-md shadow-primary/20 transition">
          <Plus className="h-4 w-4" /> Nouveau Compte
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              placeholder="Rechercher par nom, email, rôle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Utilisateur', 'Email', 'CIN', 'Rôle', 'Actions'].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5">
                  <EmptyState icon={Users} title="Aucun utilisateur" subtitle="Créez le premier compte utilisateur." action={<button onClick={() => openModal()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90">Nouveau Compte</button>} />
                </td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-violet-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.first_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-slate-400">{u.gender || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{u.cin || '—'}</td>
                  <td className="px-5 py-4"><RoleBadge name={u.role?.name} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(u)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser ? 'Modifier Utilisateur' : 'Nouveau Compte Utilisateur'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prénom *</label>
              <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
              <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{currentUser ? 'Nouveau mot de passe' : 'Mot de passe *'}</label>
              <input required={!currentUser} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rôle *</label>
              <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                <option value="">Sélectionner un rôle...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Genre</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                <option value="">—</option>
                <option value="Male">Masculin</option>
                <option value="Female">Féminin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CIN</label>
            <input type="text" value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
          </div>
          {/* Role-specific fields */}
          {isStudent && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Classe</label>
              <select value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                <option value="">Sélectionner...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {isTeacher && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matière</label>
              <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                <option value="">Sélectionner...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
