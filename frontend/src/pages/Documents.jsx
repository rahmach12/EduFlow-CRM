import React, { useState } from 'react';
import { FileText, Download, Search, Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const MOCK_DOCS = [
  {
    id: 1,
    title: "Certificat de Scolarité",
    category: "Administratif",
    description: "Document attestant de votre inscription pour l'année académique en cours.",
    icon: "📋",
    color: "from-blue-500 to-blue-700",
    status: "available",
    date: "2026-04-01",
  },
  {
    id: 2,
    title: "Bulletin de Notes Semestre 1",
    category: "Académique",
    description: "Relevé officiel de vos notes et moyennes pour le premier semestre.",
    icon: "📊",
    color: "from-violet-500 to-purple-700",
    status: "available",
    date: "2026-02-15",
    action: 'bulletin',
  },
  {
    id: 3,
    title: "Attestation de Réussite",
    category: "Académique",
    description: "Attestation officielle délivrée après validation de l'année académique.",
    icon: "🎓",
    color: "from-emerald-500 to-teal-700",
    status: "pending",
    date: null,
  },
  {
    id: 4,
    title: "Règlement Intérieur",
    category: "Administratif",
    description: "Document officiel décrivant les règles et règlements de l'établissement.",
    icon: "📜",
    color: "from-amber-500 to-orange-600",
    status: "available",
    date: "2026-01-10",
  },
  {
    id: 5,
    title: "Emploi du Temps Semestre 2",
    category: "Emploi du temps",
    description: "Emploi du temps officiel pour le second semestre de l'année académique.",
    icon: "📅",
    color: "from-cyan-500 to-sky-700",
    status: "available",
    date: "2026-03-01",
  },
  {
    id: 6,
    title: "Carte Étudiant Virtuelle",
    category: "Administratif",
    description: "Version numérique de votre carte d'identification étudiant.",
    icon: "🪪",
    color: "from-rose-500 to-pink-700",
    status: "available",
    date: "2026-01-01",
  },
];

const Documents = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const categories = ['Tous', ...new Set(MOCK_DOCS.map(d => d.category))];

  const filteredDocs = MOCK_DOCS.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'Tous' || d.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleDownload = async (doc) => {
    if (doc.status === 'pending') {
      toast.error("Ce document n'est pas encore disponible.");
      return;
    }

    if (doc.action === 'bulletin') {
      // Generate real PDF bulletin
      const t = toast.loading('Génération du bulletin...');
      try {
        const studentId = user?.student?.id;
        if (!studentId) throw new Error('No student ID');
        const res = await api.get(`/students/${studentId}/average`);
        const d = res.data;

        const pdf = new jsPDF();
        pdf.setFontSize(22);
        pdf.setTextColor(124, 58, 237);
        pdf.text('EduFlow — Bulletin de Notes', 14, 22);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Étudiant(e): ${d.student}`, 14, 38);
        pdf.text(`Classe: ${user?.student?.classe?.name || '—'}`, 14, 46);
        pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 54);

        const tableData = d.subjects.map(s => [s.subject, s.coefficient.toString(), s.average?.toString() ?? 'N/A']);
        pdf.autoTable({
          startY: 63,
          head: [['Matière', 'Coefficient', 'Moyenne']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [124, 58, 237] },
        });

        const y = pdf.lastAutoTable.finalY + 12;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Moyenne Générale: ${d.general_average} / 20`, 14, y);
        pdf.setTextColor(d.status === 'Excellent' ? 22 : d.status === 'Weak' ? 220 : 0, 100, 50);
        pdf.text(`Appréciation: ${d.status}`, 14, y + 9);

        pdf.save(`Bulletin_${d.student.replace(/\s+/g, '_')}.pdf`);
        toast.success('Bulletin téléchargé !', { id: t });
      } catch {
        toast.error('Erreur lors de la génération.', { id: t });
      }
      return;
    }

    // Generate simple placeholder PDF for other docs
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.setTextColor(124, 58, 237);
    pdf.text('EduFlow', 14, 20);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(doc.title, 14, 35);
    pdf.setFontSize(11);
    pdf.text(`Étudiant(e): ${user?.first_name} ${user?.last_name}`, 14, 50);
    pdf.text(`Classe: ${user?.student?.classe?.name || '—'}`, 14, 58);
    pdf.text(`Date de délivrance: ${new Date().toLocaleDateString('fr-FR')}`, 14, 66);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text('Ce document est généré automatiquement par le système EduFlow.', 14, 85);
    pdf.save(`${doc.title.replace(/\s+/g, '_')}.pdf`);
    toast.success(`${doc.title} téléchargé !`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Mes Documents
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Téléchargez vos documents administratifs et académiques.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-white dark:bg-[#1E1B4B] text-slate-800 dark:text-white text-sm focus:ring-primary focus:border-primary" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white dark:bg-[#1E1B4B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2e2a6b] hover:bg-slate-50 dark:hover:bg-[#2e2a6b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-shadow group">
            <div className={`h-2 bg-gradient-to-r ${doc.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{doc.icon}</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  doc.status === 'available'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {doc.status === 'available' ? '✓ Disponible' : '⏳ En attente'}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">{doc.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{doc.description}</p>

              <div className="mt-4 flex items-center justify-between">
                {doc.date ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(doc.date).toLocaleDateString('fr-FR')}
                  </p>
                ) : <span />}
                <button
                  onClick={() => handleDownload(doc)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    doc.status === 'available'
                      ? 'bg-primary text-white hover:bg-primary/90 group-hover:shadow-md group-hover:shadow-primary/20'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {doc.status === 'available' ? (
                    <><Download className="h-3.5 w-3.5" /> Télécharger</>
                  ) : (
                    <><AlertCircle className="h-3.5 w-3.5" /> Indisponible</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Documents;
