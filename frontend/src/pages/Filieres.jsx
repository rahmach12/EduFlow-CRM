import React, { useEffect, useState } from 'react';
import { Layers3, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';

const Filieres = () => {
  const [filieres, setFilieres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFiliere, setCurrentFiliere] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  const fetchData = async () => {
    try {
      const filieresRes = await api.get('/filieres');
      setFilieres(filieresRes.data);
    } catch {
      toast.error('Erreur chargement des filieres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFilieres = filieres.filter(f => 
    `${f.name} ${f.code || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (filiere = null) => {
    setCurrentFiliere(filiere);
    setFormData(filiere ? {
      name: filiere.name,
      code: filiere.code || ''
    } : { name: '', code: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentFiliere) {
        await api.put(`/filieres/${currentFiliere.id}`, formData);
        toast.success('Mise a jour reussie');
      } else {
        await api.post('/filieres', formData);
        toast.success('Filiere creee');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette filiere ?')) return;
    try {
      await api.delete(`/filieres/${id}`);
      toast.success('Supprime');
      fetchData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Layers3 className="h-6 w-6 text-primary" />
            Gestion des Filières
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Créez et gérez les filières (Big Data, IA, Génie Logiciel...).
          </p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Ajouter une Filière
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 p-4 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['ID', 'Filière', 'Code', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Chargement...</td></tr>
              ) : filteredFilieres.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4 text-sm">{f.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{f.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{f.code || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button onClick={() => openModal(f)} className="p-2 text-primary hover:bg-primary/10 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(f.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentFiliere ? 'Modifier la filière' : 'Nouvelle filière'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Nom *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Big Data" className="w-full px-3 py-2 border rounded-xl dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Code (Optionnel)</label>
            <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ex: BD" className="w-full px-3 py-2 border rounded-xl dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl dark:text-white">Annuler</button>
             <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-primary text-white rounded-xl disabled:opacity-50">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Filieres;
