import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Edit2, Trash2, Search, BookOpen, Download, UserCheck, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    cin: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    subject_id: ''
  });

  const fetchTeachers = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/subjects')
      ]);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error("Error fetching teachers", error);
      toast.error("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openModal = (teacher = null) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setFormData({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        cin: teacher.cin || '',
        email: teacher.email || '',
        password: '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        date_of_birth: teacher.date_of_birth || '',
        gender: teacher.gender || '',
        subject_id: teacher.subject_id || ''
      });
    } else {
      setCurrentTeacher(null);
      setFormData({
        first_name: '', last_name: '', cin: '', email: '', password: '', phone: '', address: '', date_of_birth: '', gender: '', subject_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (currentTeacher) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        await api.put(`/teachers/${currentTeacher.id}`, payload);
        toast.success("Teacher updated successfully!");
      } else {
        await api.post('/teachers', formData);
        toast.success("Teacher created successfully!");
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/teachers/${id}`);
        toast.success("Teacher deleted successfully!");
        fetchTeachers();
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("Failed to delete teacher.");
      }
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(124, 58, 237);
    doc.text('EduFlow — Liste des Enseignants', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${filteredTeachers.length} enseignant(s)`, 14, 28);
    doc.autoTable({
      startY: 35,
      head: [['Nom', 'Prénom', 'Email', 'Matière', 'Téléphone']],
      body: filteredTeachers.map(t => [t.last_name, t.first_name, t.email, t.subject?.name || '—', t.phone || '—']),
      headStyles: { fillColor: [124, 58, 237] },
      alternateRowStyles: { fillColor: [249, 247, 255] },
      theme: 'grid',
    });
    doc.save('Enseignants_EduFlow.pdf');
    toast.success('PDF exporté !');
  };

  const exportExcel = () => {
    const data = filteredTeachers.map(t => ({
      'Nom': t.last_name, 'Prénom': t.first_name, 'Email': t.email,
      'Matière': t.subject?.name || '', 'Téléphone': t.phone || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enseignants');
    XLSX.writeFile(wb, 'Enseignants_EduFlow.xlsx');
    toast.success('Excel exporté !');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Enseignants</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{teachers.length} enseignant(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium shadow-md shadow-primary/20 transition-all">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Name & Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={3} />
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="3">
                    <EmptyState
                      icon={UserCheck}
                      title={searchTerm ? 'Aucun résultat' : 'Aucun enseignant enregistré'}
                      subtitle={searchTerm ? `Aucun enseignant ne correspond à "${searchTerm}"` : 'Ajoutez votre premier enseignant.'}
                      action={!searchTerm && <button onClick={() => openModal()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90">Ajouter un enseignant</button>}
                    />
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {teacher.first_name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{teacher.first_name} {teacher.last_name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{teacher.email}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{teacher.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        Subject: {teacher.subject ? teacher.subject.name : 'Unassigned'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Date of Birth: {teacher.date_of_birth || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => openModal(teacher)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={currentTeacher ? "Edit Teacher" : "Add New Teacher"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
              <input 
                required type="text" name="first_name" value={formData.first_name} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
              <input 
                required type="text" name="last_name" value={formData.last_name} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CIN (ID Number) *</label>
              <input 
                required={!currentTeacher} disabled={!!currentTeacher} type="text" name="cin" value={formData.cin} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary disabled:opacity-50"
                placeholder={currentTeacher ? "Cannot be changed" : "Entry national ID"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input 
                required type="email" name="email" value={formData.email} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          
          {currentTeacher && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password (Leave empty to keep current)
              </label>
              <input 
                type="password" name="password" value={formData.password} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
              <input 
                required type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
              <input 
                required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
              <select 
                required name="subject_id" value={formData.subject_id} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              >
                <option value="">Select a subject...</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select 
                name="gender" value={formData.gender} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
            <textarea 
              required name="address" value={formData.address} onChange={handleInputChange} rows="2"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
            ></textarea>
          </div>
          
          <div className="mt-5 flex justify-end space-x-3">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
