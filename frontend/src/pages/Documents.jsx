import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Clock, CheckCircle, AlertCircle, Plus, Send, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const DOC_TYPE_LABELS = {
  attestation_presence: 'Attestation de présence',
  attestation_inscription: 'Attestation d\'inscription',
  releve_notes: 'Relevé de notes / Bulletin',
  convention_stage: 'Convention de stage',
  stage_papers: 'Papiers de stage'
};

const DOC_TYPE_DESCRIPTIONS = {
  attestation_presence: 'Atteste que vous suivez régulièrement vos études pour le semestre en cours.',
  attestation_inscription: 'Prouve votre inscription officielle pour l\'année universitaire actuelle.',
  releve_notes: 'Bulletin de notes officiel contenant vos moyennes, notes d\'examens et appréciation.',
  convention_stage: 'Accord tripartite obligatoire entre l\'université, l\'étudiant et l\'entreprise.',
  stage_papers: 'Documents administratifs complémentaires pour l\'encadrement du stage.'
};

const STATUS_BADGE_STYLE = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const STATUS_LABELS = {
  pending: 'En attente',
  approved: 'Approuvé',
  ready: 'Prêt',
  rejected: 'Rejeté'
};

const Documents = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [docType, setDocType] = useState('attestation_presence');
  const [selectedInternshipId, setSelectedInternshipId] = useState('');
  
  // Manual internship details for convention (fallback)
  const [manualInternship, setManualInternship] = useState({
    company_name: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    supervisor_name: '',
    supervisor_email: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentId = user?.student?.id;
      if (!studentId) return;

      const [requestsRes, internshipsRes] = await Promise.all([
        api.get('/document-requests'),
        api.get(`/internships?student_id=${studentId}`)
      ]);

      setRequests(requestsRes.data);
      setInternships(internshipsRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement de vos documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const approvedInternships = internships.filter(i => i.status === 'Approved');

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // If student requests convention_stage and has manual details or bound approved internship,
      // we could save details in the document request if needed. But in this implementation,
      // the document request controller simply registers the document_type.
      // We will store the request.
      await api.post('/document-requests', {
        document_type: docType,
      });

      toast.success('Votre demande de document a été soumise avec succès.');
      setIsModalOpen(false);
      // Reset form
      setDocType('attestation_presence');
      setSelectedInternshipId('');
      setManualInternship({
        company_name: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        supervisor_name: '',
        supervisor_email: '',
      });

      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── PDF HEADERS & FOOTERS (Tunisian Standard Formatting) ────────────────────
  const drawTunisianHeader = (doc, title) => {
    // Left: University Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('EduFlow University', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Etablissement Privé d\'Enseignement Supérieur', 14, 23);
    doc.text('Tunis, Tunisie', 14, 27);

    // Right: Ministry details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('République Tunisienne', 140, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Ministère de l\'Enseignement Supérieur', 140, 23);
    doc.text('et de la Recherche Scientifique', 140, 27);

    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75); // Dark Indigo
    doc.text(title, 105, 45, { align: 'center' });
    doc.setTextColor(0, 0, 0); // reset
  };

  const drawFooter = (doc, pageNum) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Ce document officiel est généré électroniquement par le portail EduFlow CRM.', 14, 280);
    doc.text(`Page ${pageNum}`, 196, 280, { align: 'right' });
  };

  const drawSignatureBlock = (doc, y, label = "Le Directeur de l'Établissement") => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Fait à Tunis, le ' + new Date().toLocaleDateString('fr-FR'), 130, y);
    doc.text(label, 130, y + 6);
    
    // Signature rectangle box
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(130, y + 10, 55, 25);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('[Cachet & Signature]', 140, y + 24);
  };

  // ── PDF GENERATOR ROUTER ────────────────────────────────────────────────────
  const handleDownloadPDF = async (request) => {
    if (request.status !== 'ready') {
      toast.error('Ce document n\'est pas encore marqué comme prêt par l\'administration.');
      return;
    }

    const t = toast.loading('Génération du document officiel en cours...');
    
    const studentName = `${user?.first_name} ${user?.last_name}`;
    const matricule = user?.student?.matricule || 'N/A';
    const cin = user?.cin || 'N/A';
    const dob = user?.student?.date_of_birth ? new Date(user.student.date_of_birth).toLocaleDateString('fr-FR') : '—';
    const className = user?.student?.classe?.name || 'Non affecté';
    const filiereName = user?.student?.classe?.filiere?.name || 'Option Standard';
    const academicYear = user?.student?.classe?.academic_year || '2025-2026';

    try {
      if (request.document_type === 'releve_notes') {
        // Fetch real averages from backend
        const res = await api.get(`/students/${user?.student?.id}/average`);
        const d = res.data;

        const doc = new jsPDF();
        drawTunisianHeader(doc, 'RELEVÉ DE NOTES');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Étudiant(e) : ${studentName}`, 14, 54);
        doc.text(`Matricule : ${matricule} | CIN : ${cin}`, 14, 60);
        doc.text(`Classe : ${className} | Filière : ${filiereName}`, 14, 66);
        doc.text(`Année Académique : ${academicYear}`, 14, 72);

        // Grade list table
        const tableData = d.subjects.map(s => [
          s.subject,
          s.coefficient.toString(),
          s.cc !== '-' ? s.cc.toString() : '—',
          s.ds !== '-' ? s.ds.toString() : '—',
          s.tp !== '-' ? s.tp.toString() : '—',
          s.exam !== '-' ? s.exam.toString() : '—',
          s.average !== '-' ? s.average.toString() : '—'
        ]);

        doc.autoTable({
          startY: 78,
          head: [['Matière / Module', 'Coef', 'CC', 'DS', 'TP', 'Exam', 'Moyenne']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 27, 75] }, // Dark Indigo
          columnStyles: {
            0: { cellWidth: 70 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center', fontStyle: 'bold' }
          }
        });

        const y = doc.lastAutoTable.finalY + 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Moyenne Générale : ${d.general_average} / 20`, 14, y);

        doc.setFont('helvetica', 'normal');
        doc.text(`Mention Académique : ${d.mention}`, 14, y + 6);
        doc.text(`Taux d'absence cumulé : ${d.absence_rate}%`, 14, y + 12);

        if (d.is_eliminated) {
          doc.setTextColor(220, 38, 38); // red
          doc.text('Statut : ÉLIMINÉ(E) POUR ABSENCES', 14, y + 18);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text(`Résultat : ${d.general_average >= 10 ? 'Admis(e)' : 'Ajourné(e)'}`, 14, y + 18);
        }

        drawSignatureBlock(doc, y + 28);
        drawFooter(doc, 1);

        doc.save(`Releve_Notes_${studentName.replace(/\s+/g, '_')}.pdf`);
        toast.success('Relevé de notes téléchargé !', { id: t });
      } 
      else if (request.document_type === 'attestation_presence') {
        const doc = new jsPDF();
        drawTunisianHeader(doc, 'ATTESTATION DE PRÉSENCE');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setLineHeightFactor(1.6);

        const text = `Le Directeur de l'établissement d'enseignement supérieur EduFlow University atteste par la présente que l'étudiant(e) :\n\n` +
          `Nom & Prénom : ${studentName}\n` +
          `Date de naissance : ${dob}\n` +
          `Numéro de C.I.N : ${cin}\n` +
          `Matricule : ${matricule}\n\n` +
          `Est régulièrement inscrit(e) et suit d'une façon continue ses cours au sein de notre établissement pour l'année universitaire ${academicYear}.\n` +
          `La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`;

        doc.text(text, 14, 60);
        drawSignatureBlock(doc, 145);
        drawFooter(doc, 1);

        doc.save(`Attestation_Presence_${studentName.replace(/\s+/g, '_')}.pdf`);
        toast.success('Attestation de présence téléchargée !', { id: t });
      } 
      else if (request.document_type === 'attestation_inscription') {
        const doc = new jsPDF();
        drawTunisianHeader(doc, "ATTESTATION D'INSCRIPTION");

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setLineHeightFactor(1.6);

        const text = `Le Directeur de l'établissement d'enseignement supérieur EduFlow University atteste par la présente que l'étudiant(e) :\n\n` +
          `Nom & Prénom : ${studentName}\n` +
          `Date de naissance : ${dob}\n` +
          `Numéro de C.I.N : ${cin}\n` +
          `Matricule : ${matricule}\n\n` +
          `Est inscrit(e) en classe de : ${className}\n` +
          `Option / Filière : ${filiereName}\n` +
          `Pour l'année universitaire : ${academicYear}.\n\n` +
          `L'étudiant(e) s'est acquitté(e) de ses obligations d'inscription administrative pour l'année en cours.\n` +
          `Cette attestation est délivrée pour servir à toutes fins utiles.`;

        doc.text(text, 14, 60);
        drawSignatureBlock(doc, 150);
        drawFooter(doc, 1);

        doc.save(`Attestation_Inscription_${studentName.replace(/\s+/g, '_')}.pdf`);
        toast.success('Attestation d\'inscription téléchargée !', { id: t });
      } 
      else if (request.document_type === 'convention_stage') {
        // Try to bind approved internship details
        const activeInternship = approvedInternships[0] || {};
        const companyName = activeInternship.company_name || 'Entreprise d\'accueil à préciser';
        const projectTitle = activeInternship.title || 'Projet professionnel à définir';
        const projectDesc = activeInternship.description || 'Description détaillée à renseigner dans la fiche de stage';
        const startDate = activeInternship.start_date || 'A définir';
        const endDate = activeInternship.end_date || 'A définir';
        const supervisor = activeInternship.supervisor_name || 'Responsable industriel à désigner';
        const supervisorEmail = activeInternship.supervisor_email || 'Email à spécifier';

        const doc = new jsPDF();
        drawTunisianHeader(doc, 'CONVENTION DE STAGE');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('ENTRE LES SOUSSIGNÉS :', 14, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setLineHeightFactor(1.4);

        const textParties = `1. L'Établissement d'Enseignement : EduFlow University, représenté par son Directeur.\n` +
          `2. L'Entreprise d'accueil : ${companyName}\n` +
          `3. L'Étudiant(e) : ${studentName}, inscrit(e) en classe de ${className}, option ${filiereName}.`;
        doc.text(textParties, 14, 62);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('IL A ÉTÉ CONVENU CE QUI SUIT :', 14, 85);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const textArticles = `Article 1 - Objet de la convention : La présente convention régit les conditions d'exécution du stage obligatoire de l'étudiant.\n\n` +
          `Article 2 - Spécifications du Stage :\n` +
          `   - Sujet / Projet : ${projectTitle}\n` +
          `   - Description : ${projectDesc}\n` +
          `   - Dates : du ${startDate} au ${endDate}\n` +
          `   - Tuteur en entreprise : ${supervisor} (${supervisorEmail})\n\n` +
          `Article 3 - Devoirs : L'étudiant s'engage à respecter le règlement intérieur de l'entreprise d'accueil, son horaire et ses règles de sécurité. Un rapport de stage écrit doit être remis à l'établissement à l'issue de cette période.\n\n` +
          `Article 4 - Statut de l'étudiant : L'étudiant conserve son statut universitaire tout au long du stage et reste couvert par l'assurance responsabilité de l'établissement scolaire.`;
        
        doc.text(textArticles, 14, 92);

        // Signatures block (3 boxes)
        const sigY = 200;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Pour l\'Université', 14, sigY);
        doc.text('Pour l\'Entreprise', 80, sigY);
        doc.text('L\'Étudiant(e)', 150, sigY);

        doc.setDrawColor(200, 200, 200);
        doc.rect(14, sigY + 3, 50, 22);
        doc.rect(80, sigY + 3, 50, 22);
        doc.rect(150, sigY + 3, 50, 22);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('[Cachet & Signature]', 20, sigY + 15);
        doc.text('[Cachet & Signature]', 86, sigY + 15);
        doc.text('[Signature]', 162, sigY + 15);

        drawFooter(doc, 1);

        doc.save(`Convention_Stage_${studentName.replace(/\s+/g, '_')}.pdf`);
        toast.success('Convention de stage générée avec succès !', { id: t });
      } 
      else {
        // Generic stage documents / other
        const doc = new jsPDF();
        drawTunisianHeader(doc, 'DOCUMENTS DE STAGE');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Étudiant(e) : ${studentName}`, 14, 60);
        doc.text(`Classe : ${className} | Option : ${filiereName}`, 14, 68);
        doc.text(`Ce document fait office de validation administrative des prérequis de stage.`, 14, 80);

        drawSignatureBlock(doc, 130);
        drawFooter(doc, 1);

        doc.save(`Papiers_Stage_${studentName.replace(/\s+/g, '_')}.pdf`);
        toast.success('Document de stage téléchargé !', { id: t });
      }
    } catch (err) {
      toast.error('Erreur lors de la génération du fichier PDF', { id: t });
    }
  };

  const filteredRequests = requests.filter(req => {
    return DOC_TYPE_LABELS[req.document_type]?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Mes Documents Administratifs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Demandez vos documents universitaires et téléchargez vos attestations officielles une fois prêtes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
        >
          <Plus className="h-4 w-4" /> Nouvelle Demande
        </button>
      </div>

      {/* Info Warning Alert */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary flex items-start gap-2.5">
        <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Procédure administrative :</span> Une fois la demande effectuée, la Scolarité examine et met à jour l'état. Le document passe en statut <span className="font-semibold">"Prêt"</span>, débloquant son impression immédiate en PDF professionnel conforme aux normes tunisiennes.
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par type de document..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#2e2a6b] rounded-xl bg-white dark:bg-[#1E1B4B] text-slate-800 dark:text-white text-sm focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="text-center text-sm text-slate-500 py-12">Chargement de votre espace documentaire...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 dark:border-slate-700 dark:bg-slate-800">
          <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">Aucun document</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Soumettez une demande pour éditer vos certificats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => {
            const badgeClass = STATUS_BADGE_STYLE[req.status] || 'bg-slate-100 text-slate-700';
            const isReady = req.status === 'ready';

            return (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
                    {DOC_TYPE_LABELS[req.document_type]}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {DOC_TYPE_DESCRIPTIONS[req.document_type]}
                  </p>

                  {req.status === 'rejected' && req.rejection_reason && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-3 rounded-2xl text-xs mb-4">
                      <strong>Motif de refus :</strong> {req.rejection_reason}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDownloadPDF(req)}
                  disabled={!isReady}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition ${
                    isReady 
                      ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  {isReady ? 'Télécharger le PDF' : 'En attente de validation'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Create Request */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Demande Administrative">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type de document
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {DOC_TYPE_DESCRIPTIONS[docType]}
            </p>
          </div>

          {docType === 'convention_stage' && (
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Liaison d'un stage approuvé
              </h4>
              {approvedInternships.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Sélectionner le stage validé
                  </label>
                  <select
                    value={selectedInternshipId}
                    onChange={e => setSelectedInternshipId(e.target.value)}
                    className="w-full border border-slate-350 bg-white dark:bg-slate-700 text-xs rounded-lg px-2.5 py-2 text-slate-800 dark:text-white"
                  >
                    <option value="">-- Utiliser le stage le plus récent --</option>
                    {approvedInternships.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.company_name} - {i.title || 'Projet'} (Approuvé)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs text-amber-600">
                  ⚠️ Aucun stage approuvé n'a été détecté. Si vous soumettez cette demande de convention administrative, elle restera en attente jusqu'à l'approbation d'une fiche de stage.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Soumission...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
