import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Search, Shield, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const ROLE_COLORS = {
  Admin: 'bg-violet-100 text-violet-700',
  'Finance Officer': 'bg-amber-100 text-amber-700',
  'Internship Manager': 'bg-fuchsia-100 text-fuchsia-700',
  Scolarite: 'bg-rose-100 text-rose-700',
};

const RoleBadge = ({ name }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[name] || 'bg-slate-100 text-slate-700'}`}>
    {name}
  </span>
);

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  gender: '',
  cin: '',
  role_id: '',
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (user = null) => {
    setCurrentUser(user);
    setFormData(user ? {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      gender: user.gender || '',
      cin: user.cin || '',
      role_id: user.role_id || '',
    } : EMPTY_FORM);
    setIsModalOpen(true);
  };

  const filteredUsers = useMemo(() => users.filter((user) => {
    const haystack = `${user.first_name} ${user.last_name} ${user.email} ${user.cin || ''} ${user.role?.name || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [searchTerm, users]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      if (currentUser) {
        await api.put(`/users/${currentUser.id}`, payload);
        toast.success('Compte mis a jour');
      } else {
        await api.post('/users', payload);
        toast.success('Compte cree');
      }

      setIsModalOpen(false);
      setCurrentUser(null);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success('Compte supprime');
      fetchData();
    } catch {
      toast.error('Suppression impossible');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Shield className="h-6 w-6 text-primary" />
            Utilisateurs internes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            L&apos;admin ne peut creer que les comptes internes: Admin, Finance Officer, Internship Manager et Scolarite.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau compte
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher nom, email, CIN ou role..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            {users.length} comptes internes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Utilisateur', 'Email', 'CIN', 'Role', 'Actions'].map((title) => (
                  <th key={title} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon={Users}
                      title="Aucun compte interne"
                      subtitle="Les comptes etudiants et enseignants doivent passer par leurs espaces d'inscription."
                      action={<button onClick={() => openModal()} className="rounded-xl bg-primary px-4 py-2 text-sm text-white">Creer un compte</button>}
                    />
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-700 text-sm font-bold text-white">
                        {user.first_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-400">{user.gender || 'Non renseigne'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-600 dark:text-slate-300">{user.cin || '—'}</td>
                  <td className="px-5 py-4"><RoleBadge name={user.role?.name} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(user)} className="rounded-xl p-2 text-primary transition hover:bg-primary/10">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser ? 'Modifier un compte interne' : 'Nouveau compte interne'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prenom</label>
              <input value={formData.first_name} onChange={(event) => setFormData({ ...formData, first_name: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom</label>
              <input value={formData.last_name} onChange={(event) => setFormData({ ...formData, last_name: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{currentUser ? 'Nouveau mot de passe' : 'Mot de passe'}</label>
              <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required={!currentUser} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={formData.role_id} onChange={(event) => setFormData({ ...formData, role_id: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Selectionner...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Genre</label>
              <select value={formData.gender} onChange={(event) => setFormData({ ...formData, gender: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Non renseigne</option>
                <option value="Male">Masculin</option>
                <option value="Female">Feminin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CIN</label>
            <input value={formData.cin} onChange={(event) => setFormData({ ...formData, cin: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Les comptes etudiants et enseignants sont exclus de cette interface et doivent utiliser leurs espaces d&apos;inscription respectifs.
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
