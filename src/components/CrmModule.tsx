import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  FileText,
  FileDown,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Tag,
  MapPin,
  ExternalLink,
  Zap,
  Flame,
  Wifi,
  Car,
  UserPlus,
  CheckCircle2,
  X,
  Filter,
  Save,
  BellRing,
  FileSpreadsheet,
  Pin,
  PinOff,
  StickyNote,
  CalendarClock,
  PhoneCall,
  CheckSquare,
  Square,
  User,
  MessageCircle,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  SearchCheck,
  Check,
  Sparkle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  CustomerContact,
  CustomerOptimizationProcess,
  OptimizationStage,
  ContractRecord,
  ServiceType,
  ConsultationType,
  NoteType,
  CustomerNoteEntry
} from '../types';
import { ProviderLogo } from './ProviderLogos';

interface CrmModuleProps {
  contacts: CustomerContact[];
  onUpdateContact: (contact: CustomerContact) => void;
  onAddContact: (contact: CustomerContact) => void;
  onDeleteContact: (contactId: string) => void;
  onOpenNachzahlungCheck: (clientName: string, email: string, phone: string, service: ServiceType, monthly: number, kwh?: number) => void;
  onSendNotification: (msg: string) => void;
}

export const STAGE_CONFIG: Record<OptimizationStage, { label: string; stepNumber: number; color: string; desc: string }> = {
  dokumenten_pruefung: {
    label: '1. Unterlagen-Check',
    stepNumber: 1,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Alte Abrechnung & Zähler geprüft'
  },
  tarif_vergleich: {
    label: '2. KI-Vergleich',
    stepNumber: 2,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Beste Einspartarife berechnet'
  },
  angebot_versendet: {
    label: '3. Angebot vorgelegt',
    stepNumber: 3,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Angebot per Mail/WhatsApp gesendet'
  },
  vollmacht_erteilt: {
    label: '4. Vollmacht erteilt',
    stepNumber: 4,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Kundenfreigabe & Vollmacht unterschrieben'
  },
  wechsel_eingereicht: {
    label: '5. Wechsel eingereicht',
    stepNumber: 5,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Kündigung & Neuantrag beim Anbieter eingereicht'
  },
  erfolgreich_aktiv: {
    label: '6. Erfolgreich aktiv',
    stepNumber: 6,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Belieferung bestätigt & Ersparnis realisiert'
  },
  wiedervorlage: {
    label: '7. Fristen-Wächter',
    stepNumber: 7,
    color: 'border-slate-700 bg-slate-800/70 text-slate-200',
    desc: 'Dauerüberwachung vor Laufzeitende'
  }
};

const STAGE_ORDER: OptimizationStage[] = [
  'dokumenten_pruefung',
  'tarif_vergleich',
  'angebot_versendet',
  'vollmacht_erteilt',
  'wechsel_eingereicht',
  'erfolgreich_aktiv',
  'wiedervorlage'
];

export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; badge: string; color: string; bgSoft: string }> = {
  telefonat: {
    label: 'Telefonat',
    badge: '📞 Telefonat',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  },
  beratung_vor_ort: {
    label: 'Vor-Ort Beratung',
    badge: '📍 Vor-Ort (Leipzig)',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  },
  whatsapp: {
    label: 'WhatsApp-Chat',
    badge: '💬 WhatsApp',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  },
  email: {
    label: 'E-Mail',
    badge: '✉️ E-Mail',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  },
  notiz: {
    label: 'Interne Notiz',
    badge: '📝 Notiz',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  },
  wiedervorlage: {
    label: 'Wiedervorlage / Frist',
    badge: '⏰ Wiedervorlage',
    color: 'text-slate-200 border-slate-700 bg-slate-800/60',
    bgSoft: 'bg-slate-900/40'
  }
};

export const CrmModule: React.FC<CrmModuleProps> = ({
  contacts,
  onUpdateContact,
  onAddContact,
  onDeleteContact,
  onOpenNachzahlungCheck,
  onSendNotification
}) => {
  // Dedicated Search & Filter States
  const [customerNameQuery, setCustomerNameQuery] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState<'alle' | ServiceType | 'kombi'>('alle');
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>('and'); // 'and' = Name UND Vertragstyp, 'or' = Name ODER Vertragstyp
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'urgency' | 'savings_desc' | 'recent'>('name_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'alle' | 'in_optimierung' | 'fristen_alarm' | 'erfolgreich' | 'interessent' | 'mit_aufgaben'>('alle');
  
  // Selected Customer for Detailed Dossier
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerContact | null>(null);

  // Modal states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddProcessOpen, setIsAddProcessOpen] = useState(false);
  const [targetCustomerForProcess, setTargetCustomerForProcess] = useState<CustomerContact | null>(null);

  // New Note Modal State
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [targetCustomerForNote, setTargetCustomerForNote] = useState<CustomerContact | null>(null);
  const [noteType, setNoteType] = useState<NoteType>('telefonat');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Daryos Kreis');
  const [noteDate, setNoteDate] = useState('');
  const [noteActionRequired, setNoteActionRequired] = useState(false);
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');
  const [notePinned, setNotePinned] = useState(false);

  // Expanded notes state per customer card id
  const [expandedNotesMap, setExpandedNotesMap] = useState<Record<string, boolean>>({});

  // Filter inside Dossier Modal for note types
  const [dossierNoteFilter, setDossierNoteFilter] = useState<'alle' | NoteType>('alle');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('Rotfuchsstraße 1');
  const [newCustCity, setNewCustCity] = useState('Leipzig');
  const [newCustPostal, setNewCustPostal] = useState('04329');
  const [newCustContactPref, setNewCustContactPref] = useState<ConsultationType>('whatsapp');
  const [newCustTags, setNewCustTags] = useState('Privatkunde, Leipzig-Ost');
  const [newCustNotes, setNewCustNotes] = useState('Interesse an Tarifoptimierung für Strom & Gas.');
  const [newCustService, setNewCustService] = useState<ServiceType>('gas');
  const [newCustProvider, setNewCustProvider] = useState('Stadtwerke Leipzig');
  const [newCustMonthly, setNewCustMonthly] = useState<number>(140);
  const [newCustKwh, setNewCustKwh] = useState<number>(18000);

  // New Optimization Process State
  const [procService, setProcService] = useState<ServiceType>('strom');
  const [procCurrentProvider, setProcCurrentProvider] = useState('Stadtwerke Leipzig');
  const [procTargetProvider, setProcTargetProvider] = useState('Yello Strom');
  const [procTargetTariff, setProcTargetTariff] = useState('Yello Strom Klima Plus');
  const [procSavings, setProcSavings] = useState<number>(360);
  const [procMonthly, setProcMonthly] = useState<number>(110);
  const [procStage, setProcStage] = useState<OptimizationStage>('dokumenten_pruefung');
  const [procNotes, setProcNotes] = useState('Abrechnung geprüft, Wechselantrag in Vorbereitung.');

  // Helper to calculate days remaining from end date (YYYY-MM-DD)
  const calculateDaysRemaining = (endDateStr: string): number => {
    try {
      const targetDate = new Date(endDateStr);
      const today = new Date();
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 999;
    }
  };

  // Helper to calculate progress percentage of a contract
  const calculateContractProgress = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      const now = new Date().getTime();
      if (end <= start) return 100;
      const progress = ((now - start) / (end - start)) * 100;
      return Math.min(100, Math.max(0, Math.round(progress)));
    } catch (e) {
      return 50;
    }
  };

  // KPI Calculations
  const kpiTotalContacts = contacts.length;
  
  const kpiActiveOptimizations = useMemo(() => {
    return contacts.reduce((sum, c) => {
      const activeProcs = c.optimizationProcesses.filter(
        p => p.stage !== 'erfolgreich_aktiv' && p.stage !== 'wiedervorlage'
      ).length;
      return sum + activeProcs;
    }, 0);
  }, [contacts]);

  const kpiExpiringContracts = useMemo(() => {
    let count = 0;
    contacts.forEach(c => {
      c.contracts.forEach(ct => {
        const days = calculateDaysRemaining(ct.endDate);
        if (days <= 90) count++;
      });
    });
    return count;
  }, [contacts]);

  const kpiTotalSavings = useMemo(() => {
    return contacts.reduce((sum, c) => sum + (c.totalAnnualSavingsCalculated || 0), 0);
  }, [contacts]);

  const kpiOpenTasksCount = useMemo(() => {
    return contacts.reduce((sum, c) => {
      const openTasks = (c.noteEntries || []).filter(n => n.actionRequired && !n.actionDone).length;
      return sum + openTasks;
    }, 0);
  }, [contacts]);

  // Dynamic counts per Vertragstyp across all contacts
  const contractTypeCounts = useMemo(() => {
    let strom = 0;
    let gas = 0;
    let internet = 0;
    let kfz = 0;
    let kombi = 0;

    contacts.forEach((c) => {
      const hasStrom = c.contracts.some(ct => ct.service === 'strom') || c.optimizationProcesses.some(p => p.service === 'strom');
      const hasGas = c.contracts.some(ct => ct.service === 'gas') || c.optimizationProcesses.some(p => p.service === 'gas');
      const hasInternet = c.contracts.some(ct => ct.service === 'internet') || c.optimizationProcesses.some(p => p.service === 'internet');
      const hasKfz = c.contracts.some(ct => ct.service === 'kfz') || c.optimizationProcesses.some(p => p.service === 'kfz');

      if (hasStrom) strom++;
      if (hasGas) gas++;
      if (hasInternet) internet++;
      if (hasKfz) kfz++;
      if (hasStrom && hasGas) kombi++;
    });

    return {
      alle: contacts.length,
      strom,
      gas,
      internet,
      kfz,
      kombi,
    };
  }, [contacts]);

  // Highlighting helper for customer name
  const renderHighlightedName = (name: string, query: string) => {
    if (!query.trim()) return name;
    const q = query.trim().toLowerCase();
    const idx = name.toLowerCase().indexOf(q);
    if (idx === -1) return name;
    return (
      <span>
        {name.substring(0, idx)}
        <mark className="bg-amber-400/25 text-amber-200 px-1 py-0.5 rounded font-bold border border-amber-400/40">
          {name.substring(idx, idx + q.length)}
        </mark>
        {name.substring(idx + q.length)}
      </span>
    );
  };

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    const nameQ = customerNameQuery.toLowerCase().trim();
    const globalQ = searchQuery.toLowerCase().trim();
    const hasNameFilter = nameQ.length > 0;
    const hasContractTypeFilter = contractTypeFilter !== 'alle';

    return contacts
      .filter((c) => {
        // 1. Check Name match
        const matchesName = !hasNameFilter || c.fullName.toLowerCase().includes(nameQ);

        // 2. Check Contract Type match
        let matchesContractType = true;
        if (hasContractTypeFilter) {
          if (contractTypeFilter === 'kombi') {
            const hasStrom = c.contracts.some(ct => ct.service === 'strom') || c.optimizationProcesses.some(p => p.service === 'strom');
            const hasGas = c.contracts.some(ct => ct.service === 'gas') || c.optimizationProcesses.some(p => p.service === 'gas');
            matchesContractType = hasStrom && hasGas;
          } else {
            const hasContractService = c.contracts.some(ct => ct.service === contractTypeFilter);
            const hasProcessService = c.optimizationProcesses.some(p => p.service === contractTypeFilter);
            matchesContractType = hasContractService || hasProcessService;
          }
        }

        // Apply AND vs. OR logic between Name and ContractType
        if (hasNameFilter && hasContractTypeFilter) {
          if (filterLogic === 'or') {
            // Entweder Name ODER Vertragstyp trifft zu
            if (!matchesName && !matchesContractType) return false;
          } else {
            // Beide Kriterien müssen erfüllt sein
            if (!matchesName || !matchesContractType) return false;
          }
        } else if (hasNameFilter && !matchesName) {
          return false;
        } else if (hasContractTypeFilter && !matchesContractType) {
          return false;
        }

        // 3. Global search query (Telefon, KD-Nr., Ort, Notizen, Zähler)
        if (globalQ) {
          const matchesGlobal = (
            c.fullName.toLowerCase().includes(globalQ) ||
            c.customerNumber.toLowerCase().includes(globalQ) ||
            c.phone.toLowerCase().includes(globalQ) ||
            c.email.toLowerCase().includes(globalQ) ||
            (c.city && c.city.toLowerCase().includes(globalQ)) ||
            (c.address && c.address.toLowerCase().includes(globalQ)) ||
            c.contracts.some(ct =>
              ct.provider.toLowerCase().includes(globalQ) ||
              ct.tariffName.toLowerCase().includes(globalQ) ||
              (ct.meterNumber && ct.meterNumber.toLowerCase().includes(globalQ))
            ) ||
            (c.noteEntries || []).some(n =>
              n.title.toLowerCase().includes(globalQ) ||
              n.content.toLowerCase().includes(globalQ)
            )
          );
          if (!matchesGlobal) return false;
        }

        // 4. Status Filter
        if (statusFilter === 'in_optimierung') {
          const hasActiveOpt = c.optimizationProcesses.some(
            p => p.stage !== 'erfolgreich_aktiv' && p.stage !== 'wiedervorlage'
          );
          if (!hasActiveOpt) return false;
        } else if (statusFilter === 'fristen_alarm') {
          const hasExpiring = c.contracts.some(ct => calculateDaysRemaining(ct.endDate) <= 90);
          if (!hasExpiring) return false;
        } else if (statusFilter === 'erfolgreich') {
          const hasCompleted = c.contracts.length > 0 || c.optimizationProcesses.some(p => p.stage === 'erfolgreich_aktiv');
          if (!hasCompleted) return false;
        } else if (statusFilter === 'interessent') {
          if (c.status !== 'interessent' && c.contracts.length > 0) return false;
        } else if (statusFilter === 'mit_aufgaben') {
          const hasOpenTask = (c.noteEntries || []).some(n => n.actionRequired && !n.actionDone);
          if (!hasOpenTask) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName, 'de');
        } else if (sortBy === 'name_desc') {
          return b.fullName.localeCompare(a.fullName, 'de');
        } else if (sortBy === 'savings_desc') {
          return (b.totalAnnualSavingsCalculated || 0) - (a.totalAnnualSavingsCalculated || 0);
        } else if (sortBy === 'urgency') {
          // Geringste verbleibende Tage zuerst
          const minDaysA = a.contracts.length > 0
            ? Math.min(...a.contracts.map(ct => calculateDaysRemaining(ct.endDate)))
            : 9999;
          const minDaysB = b.contracts.length > 0
            ? Math.min(...b.contracts.map(ct => calculateDaysRemaining(ct.endDate)))
            : 9999;
          return minDaysA - minDaysB;
        } else if (sortBy === 'recent') {
          return b.id.localeCompare(a.id);
        }
        return 0;
      });
  }, [contacts, customerNameQuery, contractTypeFilter, filterLogic, searchQuery, statusFilter, sortBy]);

  // Open Note Modal
  const handleOpenAddNoteModal = (customer: CustomerContact, defaultType: NoteType = 'telefonat') => {
    setTargetCustomerForNote(customer);
    setNoteType(defaultType);
    setNoteTitle('');
    setNoteContent('');
    setNoteAuthor('Daryos Kreis');
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('de-DE')}, ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
    setNoteDate(dateFormatted);
    setNoteActionRequired(false);
    setNoteFollowUpDate('');
    setNotePinned(false);
    setIsAddNoteModalOpen(true);
  };

  // Submit New Note / Protocol
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomerForNote || !noteContent.trim()) {
      alert('Bitte geben Sie ein Gesprächsprotokoll oder Notiztext ein.');
      return;
    }

    const defaultTitle = noteTitle.trim() || NOTE_TYPE_CONFIG[noteType].label;
    const nowStr = noteDate.trim() || `${new Date().toLocaleDateString('de-DE')}, ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;

    const newNoteEntry: CustomerNoteEntry = {
      id: `note-${Date.now()}`,
      date: nowStr,
      type: noteType,
      author: noteAuthor.trim() || 'Daryos Kreis',
      title: defaultTitle,
      content: noteContent.trim(),
      actionRequired: noteActionRequired,
      actionDone: false,
      followUpDate: noteActionRequired && noteFollowUpDate ? noteFollowUpDate : undefined,
      pinned: notePinned
    };

    const existingEntries = targetCustomerForNote.noteEntries || [];
    // Pinned or latest first
    const updatedEntries = [newNoteEntry, ...existingEntries];

    const updatedCustomer: CustomerContact = {
      ...targetCustomerForNote,
      noteEntries: updatedEntries,
      notes: `${targetCustomerForNote.notes || ''}\n[${newNoteEntry.date} - ${NOTE_TYPE_CONFIG[noteType].label}]: ${newNoteEntry.title} - ${newNoteEntry.content}`.trim()
    };

    onUpdateContact(updatedCustomer);
    if (selectedCustomer && selectedCustomer.id === targetCustomerForNote.id) {
      setSelectedCustomer(updatedCustomer);
    }

    // Automatically expand notes for this card so user sees it right away
    setExpandedNotesMap(prev => ({ ...prev, [targetCustomerForNote.id]: true }));

    setIsAddNoteModalOpen(false);
    setTargetCustomerForNote(null);
    onSendNotification(`Gesprächsprotokoll für ${updatedCustomer.fullName} gespeichert!`);
  };

  // Toggle Pin on Note
  const handleTogglePinNote = (customer: CustomerContact, noteId: string) => {
    const existing = customer.noteEntries || [];
    const updatedEntries = existing.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n);
    const updatedCustomer: CustomerContact = {
      ...customer,
      noteEntries: updatedEntries
    };
    onUpdateContact(updatedCustomer);
    if (selectedCustomer && selectedCustomer.id === customer.id) {
      setSelectedCustomer(updatedCustomer);
    }
    const toggled = updatedEntries.find(n => n.id === noteId);
    onSendNotification(toggled?.pinned ? 'Notiz angepinnt 📌' : 'Anpinnung aufgehoben');
  };

  // Toggle Action Done on Note
  const handleToggleActionDone = (customer: CustomerContact, noteId: string) => {
    const existing = customer.noteEntries || [];
    const updatedEntries = existing.map(n => n.id === noteId ? { ...n, actionDone: !n.actionDone } : n);
    const updatedCustomer: CustomerContact = {
      ...customer,
      noteEntries: updatedEntries
    };
    onUpdateContact(updatedCustomer);
    if (selectedCustomer && selectedCustomer.id === customer.id) {
      setSelectedCustomer(updatedCustomer);
    }
    const toggled = updatedEntries.find(n => n.id === noteId);
    onSendNotification(toggled?.actionDone ? 'Rückruf/Aufgabe als erledigt markiert ✓' : 'Aufgabe wieder offen');
  };

  // Delete Note
  const handleDeleteNote = (customer: CustomerContact, noteId: string) => {
    if (!confirm('Möchten Sie diesen Protokolleintrag wirklich löschen?')) return;
    const existing = customer.noteEntries || [];
    const updatedEntries = existing.filter(n => n.id !== noteId);
    const updatedCustomer: CustomerContact = {
      ...customer,
      noteEntries: updatedEntries
    };
    onUpdateContact(updatedCustomer);
    if (selectedCustomer && selectedCustomer.id === customer.id) {
      setSelectedCustomer(updatedCustomer);
    }
    onSendNotification('Protokolleintrag gelöscht.');
  };

  // Handle Advancing an Optimization Process to next stage
  const handleAdvanceStage = (contact: CustomerContact, processId: string) => {
    const proc = contact.optimizationProcesses.find(p => p.id === processId);
    if (!proc) return;

    const currentIdx = STAGE_ORDER.indexOf(proc.stage);
    if (currentIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIdx + 1];
      const todayStr = new Date().toLocaleDateString('de-DE');
      
      const updatedProcesses = contact.optimizationProcesses.map(p => {
        if (p.id === processId) {
          return {
            ...p,
            stage: nextStage,
            lastUpdatedDate: todayStr,
            notes: `${p.notes} · [${todayStr}]: Status geändert auf "${STAGE_CONFIG[nextStage].label}"`
          };
        }
        return p;
      });

      // Also append an automatic note entry
      const autoNote: CustomerNoteEntry = {
        id: `note-auto-${Date.now()}`,
        date: `${todayStr}, ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`,
        type: 'notiz',
        author: 'System / Daryos Kreis',
        title: `${proc.service.toUpperCase()}-Status weitergerückt`,
        content: `Optimierungsprozess für ${proc.service.toUpperCase()} erfolgreich auf "${STAGE_CONFIG[nextStage].label}" gesetzt.`,
        pinned: false
      };

      const updatedContact: CustomerContact = {
        ...contact,
        optimizationProcesses: updatedProcesses,
        noteEntries: [autoNote, ...(contact.noteEntries || [])],
        notes: `${contact.notes}\n[${todayStr}]: ${proc.service.toUpperCase()}-Prozess auf "${STAGE_CONFIG[nextStage].label}" vorgerückt.`
      };

      onUpdateContact(updatedContact);
      if (selectedCustomer && selectedCustomer.id === contact.id) {
        setSelectedCustomer(updatedContact);
      }

      onSendNotification(`Status für ${contact.fullName} (${proc.service.toUpperCase()}) auf "${STAGE_CONFIG[nextStage].label}" gesetzt!`);
    }
  };

  // Handle Direct Stage Change
  const handleSetStage = (contact: CustomerContact, processId: string, newStage: OptimizationStage) => {
    const todayStr = new Date().toLocaleDateString('de-DE');
    const updatedProcesses = contact.optimizationProcesses.map(p => {
      if (p.id === processId) {
        return {
          ...p,
          stage: newStage,
          lastUpdatedDate: todayStr,
          notes: `${p.notes} · [${todayStr}]: Status manuell geändert auf "${STAGE_CONFIG[newStage].label}"`
        };
      }
      return p;
    });

    const updatedContact: CustomerContact = {
      ...contact,
      optimizationProcesses: updatedProcesses,
      notes: `${contact.notes}\n[${todayStr}]: ${STAGE_CONFIG[newStage].label} eingestellt.`
    };

    onUpdateContact(updatedContact);
    if (selectedCustomer && selectedCustomer.id === contact.id) {
      setSelectedCustomer(updatedContact);
    }
    onSendNotification(`Status für ${contact.fullName} aktualisiert!`);
  };

  // Quick WhatsApp Trigger with automatic protocol prompt
  const handleOpenWhatsApp = (contact: CustomerContact, process?: CustomerOptimizationProcess) => {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const serviceName = process ? process.service.toUpperCase() : 'Energie & Verträge';
    const text = encodeURIComponent(
      `Hallo ${contact.fullName}, hier ist Daryos Kreis aus Leipzig bezüglich Ihrer Optimierung (${serviceName}). Wir haben Neuigkeiten zu Ihren Tarifen und Einsparungen!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    onSendNotification(`WhatsApp-Chat für ${contact.fullName} geöffnet!`);
  };

  // Quick Mail Trigger
  const handleOpenMail = (contact: CustomerContact, process?: CustomerOptimizationProcess) => {
    const subject = encodeURIComponent(`Ihre Tarifoptimierung bei Daryos® Leipzig · Kundennummer: ${contact.customerNumber}`);
    const body = encodeURIComponent(
      `Sehr geehrte(r) ${contact.fullName},\n\n` +
      `wir haben den aktuellen Status Ihrer Tarifoptimierung geprüft.\n` +
      (process ? `Sparte: ${process.service.toUpperCase()}\nStatus: ${STAGE_CONFIG[process.stage].label}\nErwartete Ersparnis: ca. ${process.potentialAnnualSavings} €/Jahr\n\n` : '') +
      `Für Rückfragen stehen wir Ihnen jederzeit gerne persönlich in Leipzig zur Verfügung.\n\n` +
      `Mit freundlichen Grüßen\n` +
      `Daryos Kreis · Ihr Energieberater in Leipzig\nRotfuchsstraße 1, 04329 Leipzig`
    );
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    onSendNotification(`E-Mail-Entwurf für ${contact.fullName} geöffnet!`);
  };

  // Create New Customer
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Bitte geben Sie mindestens Name und Telefonnummer an.');
      return;
    }

    const newId = `kd-${Date.now()}`;
    const custNum = `KD-2026-${String(contacts.length + 1).padStart(3, '0')}`;
    const todayStr = new Date().toLocaleDateString('de-DE');

    const newProcess: CustomerOptimizationProcess = {
      id: `proc-${Date.now()}`,
      service: newCustService,
      stage: 'dokumenten_pruefung',
      currentProvider: newCustProvider,
      potentialAnnualSavings: Math.round(newCustMonthly * 12 * 0.25),
      currentMonthlyInstallment: newCustMonthly,
      startedDate: todayStr,
      lastUpdatedDate: todayStr,
      notes: `Erstaufnahme über CRM. Bisheriger Abschlag: ${newCustMonthly} € / Monat. Jahresverbrauch ca. ${newCustKwh} kWh.`
    };

    const initialNote: CustomerNoteEntry = {
      id: `note-init-${Date.now()}`,
      date: `${todayStr}, ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`,
      type: 'beratung_vor_ort',
      author: 'Daryos Kreis',
      title: 'Kunden-Neuanlage & Erstberatung',
      content: newCustNotes.trim() || `Kunde in Leipzig erfasst. Sparte ${newCustService.toUpperCase()} mit bisherigem Abschlag ${newCustMonthly} €/M. aufgenommen.`,
      pinned: true
    };

    const newCustomer: CustomerContact = {
      id: newId,
      customerNumber: custNum,
      fullName: newCustName.trim(),
      email: newCustEmail.trim() || 'kunde@daryos-energie.de',
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      city: newCustCity.trim() || 'Leipzig',
      postalCode: newCustPostal.trim() || '04329',
      preferredContact: newCustContactPref,
      customerSince: todayStr,
      tags: newCustTags.split(',').map(t => t.trim()).filter(Boolean),
      contracts: [],
      optimizationProcesses: [newProcess],
      notes: newCustNotes.trim(),
      noteEntries: [initialNote],
      totalAnnualSavingsCalculated: newProcess.potentialAnnualSavings,
      status: 'in_optimierung'
    };

    onAddContact(newCustomer);
    setIsAddCustomerOpen(false);

    // Reset Form
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    onSendNotification(`Neuer Kunde ${newCustomer.fullName} (${custNum}) im CRM angelegt!`);
  };

  // Add Process to existing customer
  const handleAddProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomerForProcess) return;

    const todayStr = new Date().toLocaleDateString('de-DE');
    const newProc: CustomerOptimizationProcess = {
      id: `proc-${Date.now()}`,
      service: procService,
      stage: procStage,
      currentProvider: procCurrentProvider,
      targetProvider: procTargetProvider,
      targetTariff: procTargetTariff,
      potentialAnnualSavings: procSavings,
      currentMonthlyInstallment: procMonthly,
      startedDate: todayStr,
      lastUpdatedDate: todayStr,
      notes: procNotes
    };

    const procNote: CustomerNoteEntry = {
      id: `note-proc-${Date.now()}`,
      date: `${todayStr}, ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`,
      type: 'notiz',
      author: 'Daryos Kreis',
      title: `Neuer Optimierungsprozess: ${procService.toUpperCase()}`,
      content: `Zusätzliche Sparte ${procService.toUpperCase()} aufgenommen. Bisheriger Anbieter: ${procCurrentProvider} (${procMonthly} €/M.). Geplante Ersparnis: ca. +${procSavings} €/Jahr.`,
      pinned: false
    };

    const updatedContact: CustomerContact = {
      ...targetCustomerForProcess,
      optimizationProcesses: [...targetCustomerForProcess.optimizationProcesses, newProc],
      noteEntries: [procNote, ...(targetCustomerForProcess.noteEntries || [])],
      totalAnnualSavingsCalculated: (targetCustomerForProcess.totalAnnualSavingsCalculated || 0) + procSavings,
      status: 'in_optimierung'
    };

    onUpdateContact(updatedContact);
    if (selectedCustomer && selectedCustomer.id === targetCustomerForProcess.id) {
      setSelectedCustomer(updatedContact);
    }
    setIsAddProcessOpen(false);
    setTargetCustomerForProcess(null);
    onSendNotification(`Neuer Optimierungsprozess (${procService.toUpperCase()}) für ${updatedContact.fullName} hinzugefügt!`);
  };

  // Export CRM Contacts as CSV
  const exportCrmCSV = () => {
    const headers = [
      'Kundennummer',
      'Name',
      'Telefon',
      'E-Mail',
      'PLZ / Ort',
      'Kunde seit',
      'Aktive Verträge',
      'Vertragslaufzeiten bis',
      'Laufende Optimierungen',
      'Aktueller Optimierungs-Status',
      'Anzahl Protokolle/Notizen',
      'Kalkulierte Ersparnis (€/Jahr)'
    ];

    const rows = contacts.map(c => [
      c.customerNumber,
      `"${c.fullName}"`,
      c.phone,
      c.email,
      `"${c.postalCode || ''} ${c.city}"`,
      c.customerSince,
      c.contracts.length,
      `"${c.contracts.map(ct => `${ct.service.toUpperCase()}: ${ct.endDate}`).join(' | ')}"`,
      c.optimizationProcesses.length,
      `"${c.optimizationProcesses.map(p => `${p.service.toUpperCase()}: ${STAGE_CONFIG[p.stage].label}`).join(' | ')}"`,
      (c.noteEntries || []).length,
      c.totalAnnualSavingsCalculated
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daryos_CRM_Kundenkontakte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSendNotification('CRM-Kundenkontakte als CSV exportiert!');
  };

  // Export Customer Dossier as PDF with full Conversation Protocols & Notes
  const exportCustomerDossierPDF = (c: CustomerContact) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    // Header Banner
    doc.setFillColor(11, 12, 16);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 27, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('Daryos', margin, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('(R)', margin + 27, 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(165, 180, 252);
    doc.text('Kunden-Dossier & Protokoll-Chronik', margin, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`KUNDENNUMMER: ${c.customerNumber}`, pageWidth - margin, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Stichtag: ${new Date().toLocaleDateString('de-DE')} · Daryos Kreis · Leipzig`, pageWidth - margin, 17, { align: 'right' });

    y = 36;

    // Client Profile Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(c.fullName, margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Telefon: ${c.phone}   |   E-Mail: ${c.email}`, margin + 4, y + 14);
    doc.text(`Adresse: ${c.address || ''}, ${c.postalCode || ''} ${c.city}`, margin + 4, y + 20);
    doc.text(`Kunde seit: ${c.customerSince}   |   Präferenz: ${c.preferredContact.toUpperCase()}   |   Ersparnis p.a.: ${c.totalAnnualSavingsCalculated} EUR`, margin + 4, y + 26);

    y += 38;

    // Active Contracts & Durations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. AKTUELLE VERTRÄGE & VERTRAGSLAUFZEITEN', margin, y);
    y += 5;

    if (c.contracts.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Aktuell noch keine abgeschlossenen Bestandsverträge hinterlegt.', margin, y);
      y += 8;
    } else {
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Sparte', margin + 3, y + 4.2);
      doc.text('Anbieter / Tarif', margin + 25, y + 4.2);
      doc.text('Zählernummer', margin + 75, y + 4.2);
      doc.text('Laufzeit-Ende', margin + 115, y + 4.2);
      doc.text('Restlaufzeit', margin + 145, y + 4.2);
      doc.text('Abschlag (€/M.)', pageWidth - margin - 3, y + 4.2, { align: 'right' });

      y += 6;
      c.contracts.forEach((ct, idx) => {
        const days = calculateDaysRemaining(ct.endDate);
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(ct.service.toUpperCase(), margin + 3, y + 4.2);
        doc.text(`${ct.provider} - ${ct.tariffName}`.slice(0, 32), margin + 25, y + 4.2);
        doc.text(ct.meterNumber || '-', margin + 75, y + 4.2);
        doc.text(ct.endDate, margin + 115, y + 4.2);
        doc.text(days < 0 ? 'Abgelaufen' : `${days} Tage`, margin + 145, y + 4.2);
        doc.text(`${ct.currentMonthlyInstallment} EUR`, pageWidth - margin - 3, y + 4.2, { align: 'right' });
        y += 6;
      });
      y += 6;
    }

    // Ongoing Optimization Processes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. LAUFENDE OPTIMIERUNGSPROZESSE (PIPELINE-STATUS)', margin, y);
    y += 5;

    if (c.optimizationProcesses.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Aktuell keine offenen Optimierungsprozesse.', margin, y);
      y += 8;
    } else {
      c.optimizationProcesses.forEach((p) => {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 1.5, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(37, 99, 235);
        doc.text(`${p.service.toUpperCase()} · STATUS: ${STAGE_CONFIG[p.stage].label.toUpperCase()}`, margin + 3, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Bisher: ${p.currentProvider} (${p.currentMonthlyInstallment} EUR/M.)  ->  Ziel: ${p.targetProvider || 'In Prüfung'} (${p.targetTariff || 'Optimal'})`, margin + 3, y + 10);
        doc.text(`Kalkulierte Ersparnis: +${p.potentialAnnualSavings} EUR / Jahr   |   Letztes Update: ${p.lastUpdatedDate}`, margin + 3, y + 14);

        y += 19;
      });
    }

    // Section 3: Conversation Protocols & Internal Notes
    const noteEntries = c.noteEntries || [];
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`3. GESPRÄCHSPROTOKOLLE & NOTIZEN-CHRONIK (${noteEntries.length})`, margin, y);
    y += 5;

    if (noteEntries.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(c.notes || 'Keine Notizen erfasst.', pageWidth - margin * 2);
      doc.text(splitNotes, margin, y);
    } else {
      noteEntries.forEach((entry) => {
        if (y > 265) {
          doc.addPage();
          y = 16;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        
        const splitContent = doc.splitTextToSize(entry.content, pageWidth - margin * 2 - 8);
        const cardHeight = 12 + splitContent.length * 4.2;

        doc.roundedRect(margin, y, pageWidth - margin * 2, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(37, 99, 235);
        const typeStr = NOTE_TYPE_CONFIG[entry.type]?.label || entry.type;
        const pinnedMarker = entry.pinned ? '[ANGEPINNT] ' : '';
        doc.text(`${pinnedMarker}${entry.date} · ${typeStr.toUpperCase()} · ${entry.title}`, margin + 3, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Berater: ${entry.author}${entry.actionRequired ? ` · RÜCKRUF / FRIST: ${entry.followUpDate || 'Offen'} (${entry.actionDone ? 'Erledigt' : 'Ausstehend'})` : ''}`, margin + 3, y + 8.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(splitContent, margin + 3, y + 12.5);

        y += cardHeight + 3.5;
      });
    }

    doc.save(`Daryos_Kunden_Dossier_${c.customerNumber}_${c.fullName.replace(/\s+/g, '_')}.pdf`);
    onSendNotification(`Dossier-PDF mit Protokollen für ${c.fullName} generiert!`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 bg-slate-50">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Kunden-CRM & Notizen-Zentrale</span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-bold">
              Daryos® CRM 2.0
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Zentrale Verwaltung aller Kundenkontakte, ihrer aktuellen Vertragslaufzeiten, Optimierungsprozesse & lückenloser Gesprächsprotokollierung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCrmCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 cursor-pointer shadow-2xs"
            title="Kundenliste als CSV exportieren"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV-Export</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Neuer Kunde</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards - Einheitliche Helle Farbgebung */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Gesamte Kundenkartei</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{kpiTotalContacts}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Leipzig & Region</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Laufende Optimierungen</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{kpiActiveOptimizations} Prozesse</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Aktiv in Pipeline</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Fristen-Alarm (&lt; 90 T.)</span>
            <BellRing className={`w-4 h-4 ${kpiExpiringContracts > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-bold mt-1 ${kpiExpiringContracts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {kpiExpiringContracts} Verträge
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kündigungsfristen</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Offene Aufgaben</span>
            <CalendarClock className={`w-4 h-4 ${kpiOpenTasksCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-bold mt-1 ${kpiOpenTasksCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {kpiOpenTasksCount} Rückrufe
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Gesprächsprotokolle</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Erzielte Ersparnis p.a.</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            +{kpiTotalSavings.toLocaleString('de-DE')} €
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Kundenersparnis gesamt</div>
        </div>
      </div>

      {/* Such- & Filter-Konsole (Kundenname / Vertragstyp) - Ruhiges, helles Design */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Leiste 1: Kundennamen-Suche, Sortierung & Direktsprung */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Kundennamen-Eingabe */}
          <div className="relative flex-1 min-w-[280px]">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="👤 Nach Kundenname filtern (z.B. Klaus, Weber, Richter, Demir, Schmidt)..."
              value={customerNameQuery}
              onChange={(e) => setCustomerNameQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
            />
            {customerNameQuery && (
              <button
                onClick={() => setCustomerNameQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 text-xs px-1.5 py-0.5 rounded hover:bg-slate-200"
                title="Namensfilter leeren"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick-Jump & Sortierung */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direktsprung zu Kunde */}
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const match = contacts.find((c) => c.id === e.target.value);
                    if (match) {
                      setCustomerNameQuery(match.fullName);
                    }
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                title="Direktsprung zu einem Kundenstamm"
              >
                <option value="" disabled>
                  Direktsprung zu Kunde...
                </option>
                {[...contacts]
                  .sort((a, b) => a.fullName.localeCompare(b.fullName, 'de'))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerNumber})
                    </option>
                  ))}
              </select>
            </div>

            {/* Sortierung */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="urgency">Kündigungsfrist naht</option>
                <option value="savings_desc">Höchste Ersparnis</option>
                <option value="recent">Neueste zuerst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leiste 1b: Schnellauswahl beliebter Kunden (1-Klick Vorschläge) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            Schnellauswahl:
          </span>
          {contacts.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => setCustomerNameQuery(c.fullName === customerNameQuery ? '' : c.fullName)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                customerNameQuery.toLowerCase() === c.fullName.toLowerCase()
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
            >
              {c.fullName}
            </button>
          ))}
          {customerNameQuery && (
            <button
              onClick={() => setCustomerNameQuery('')}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
            >
              Filter leeren
            </button>
          )}
        </div>

        {/* Leiste 2: Vertragstyp-Filter (Sparte) mit einheitlichen Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Vertragstyp:</span>
            </span>

            {/* Alle Vertragstypen */}
            <button
              onClick={() => setContractTypeFilter('alle')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'alle'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <span>Alle</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'alle' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.alle}
              </span>
            </button>

            {/* ⚡ Strom */}
            <button
              onClick={() => setContractTypeFilter('strom')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'strom'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Strom</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'strom' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.strom}
              </span>
            </button>

            {/* 🔥 Gas */}
            <button
              onClick={() => setContractTypeFilter('gas')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'gas'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Gas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'gas' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.gas}
              </span>
            </button>

            {/* 🌐 Internet & DSL */}
            <button
              onClick={() => setContractTypeFilter('internet')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'internet'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Internet & DSL</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'internet' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.internet}
              </span>
            </button>

            {/* 🚗 KFZ & Flotte */}
            <button
              onClick={() => setContractTypeFilter('kfz')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'kfz'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>KFZ & Flotte</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'kfz' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.kfz}
              </span>
            </button>

            {/* ⚡🔥 Kombi (Strom & Gas) */}
            <button
              onClick={() => setContractTypeFilter('kombi')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                contractTypeFilter === 'kombi'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span>Kombi (Strom+Gas)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contractTypeFilter === 'kombi' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {contractTypeCounts.kombi}
              </span>
            </button>
          </div>

          {/* Filter-Kombination Toggle (ODER vs. UND) */}
          <div className="flex items-center gap-2 text-xs shrink-0 self-end md:self-center">
            <span className="text-slate-400 text-[11px] font-medium">Logik:</span>
            <div className="p-0.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center">
              <button
                onClick={() => setFilterLogic('or')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  filterLogic === 'or'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Zeigt Kontakte, die den Namen ODER den Vertragstyp erfüllen"
              >
                ODER-Modus
              </button>
              <button
                onClick={() => setFilterLogic('and')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  filterLogic === 'and'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Zeigt Kontakte, die sowohl den Namen ALS AUCH den Vertragstyp erfüllen"
              >
                UND-Modus
              </button>
            </div>
          </div>
        </div>

        {/* Leiste 3: Status-Filter & Freitext-Suchfeld */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status-Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Status:</span>
            <button
              onClick={() => setStatusFilter('alle')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                statusFilter === 'alle'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
            >
              Alle Status
            </button>
            <button
              onClick={() => setStatusFilter('in_optimierung')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                statusFilter === 'in_optimierung'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
            >
              In Optimierung ({kpiActiveOptimizations})
            </button>
            <button
              onClick={() => setStatusFilter('fristen_alarm')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                statusFilter === 'fristen_alarm'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
            >
              Fristen-Alarm ({kpiExpiringContracts})
            </button>
            <button
              onClick={() => setStatusFilter('mit_aufgaben')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                statusFilter === 'mit_aufgaben'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
            >
              Rückrufe ({kpiOpenTasksCount})
            </button>
            <button
              onClick={() => setStatusFilter('erfolgreich')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                statusFilter === 'erfolgreich'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
            >
              Aktiv
            </button>
          </div>

          {/* Globale Freitextsuche */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="KD-Nr., Telefon, Zähler, Notizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Leiste 4: Aktive Filter & Schnellauswertung */}
        {(customerNameQuery || contractTypeFilter !== 'alle' || searchQuery || statusFilter !== 'alle') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">
                Aktive Filter:
              </span>

              {customerNameQuery && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium flex items-center gap-1">
                  <span>Name: "{customerNameQuery}"</span>
                  <button
                    onClick={() => setCustomerNameQuery('')}
                    className="hover:text-blue-900 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}

              {contractTypeFilter !== 'alle' && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium flex items-center gap-1">
                  <span>Vertragstyp: {contractTypeFilter.toUpperCase()}</span>
                  <button
                    onClick={() => setContractTypeFilter('alle')}
                    className="hover:text-blue-900 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium flex items-center gap-1">
                  <span>Text: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-blue-900 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}

              {statusFilter !== 'alle' && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium flex items-center gap-1">
                  <span>Status: {statusFilter}</span>
                  <button
                    onClick={() => setStatusFilter('alle')}
                    className="hover:text-blue-900 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}

              <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">
                {filterLogic.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                {filteredContacts.length} von {contacts.length} Treffer
              </span>
              <button
                onClick={() => {
                  setCustomerNameQuery('');
                  setContractTypeFilter('alle');
                  setSearchQuery('');
                  setStatusFilter('alle');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                ✕ Filter zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Cards List */}
      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-900">Keine Kundenkontakte gefunden</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Für Ihre Filterkriterien (Name: {customerNameQuery || '-'}, Vertragstyp: {contractTypeFilter || '-'}) liegen aktuell keine Treffer vor. Sie können die Filter zurücksetzen oder direkt einen neuen Kundenkontakt anlegen.
            </p>
            <button
              onClick={() => {
                setCustomerNameQuery('');
                setContractTypeFilter('alle');
                setSearchQuery('');
                setStatusFilter('alle');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const noteList = contact.noteEntries || [];
            // Sort: pinned first, then by date descending
            const sortedNotes = [...noteList].sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return 0;
            });
            const isNotesExpanded = !!expandedNotesMap[contact.id];
            const openTasksForThisClient = noteList.filter(n => n.actionRequired && !n.actionDone);

            return (
              <div
                key={contact.id}
                className="bg-white hover:border-slate-300 rounded-xl border border-slate-200 shadow-2xs transition-all p-4 sm:p-5 space-y-4"
              >
                {/* Top Row: Customer Identity & Fast Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {contact.fullName.charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {renderHighlightedName(contact.fullName, customerNameQuery)}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          {contact.customerNumber}
                        </span>
                        {contact.city && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{contact.postalCode} {contact.city}</span>
                          </span>
                        )}
                        {openTasksForThisClient.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            {openTasksForThisClient.length} Rückruf offen
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${contact.phone}`} className="hover:text-blue-600 transition-colors">
                            {contact.phone}
                          </a>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors">
                            {contact.email}
                          </a>
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">
                          Kunde seit: {contact.customerSince}
                        </span>
                      </div>

                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {contact.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {/* Add Protocol / Note Button */}
                    <button
                      onClick={() => handleOpenAddNoteModal(contact)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Neues Gesprächsprotokoll oder Notiz erfassen"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-slate-500" />
                      <span>+ Protokoll</span>
                    </button>

                    {/* WhatsApp Quick Link */}
                    <button
                      onClick={() => handleOpenWhatsApp(contact)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="WhatsApp-Chat starten"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Mail Quick Link */}
                    <button
                      onClick={() => handleOpenMail(contact)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="E-Mail senden"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">E-Mail</span>
                    </button>

                    {/* Add Process button */}
                    <button
                      onClick={() => {
                        setTargetCustomerForProcess(contact);
                        setIsAddProcessOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Weiteren Optimierungsprozess für diesen Kunden starten"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>+ Sparte</span>
                    </button>

                    {/* Full Dossier Modal */}
                    <button
                      onClick={() => setSelectedCustomer(contact)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Kunden-Dossier</span>
                    </button>
                  </div>
                </div>

                {/* SECTION A: Aktuelle Vertragslaufzeiten (Contract Durations) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Aktuelle Verträge & Vertragslaufzeiten ({contact.contracts.length})</span>
                    </span>

                    {contact.contracts.length > 0 && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Fristen-Überwachung aktiv
                      </span>
                    )}
                  </div>

                  {contact.contracts.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                      <span>Noch keine Bestandsverträge hinterlegt (Neukunde in Optimierungsphase).</span>
                      <button
                        onClick={() => {
                          setTargetCustomerForProcess(contact);
                          setIsAddProcessOpen(true);
                        }}
                        className="text-blue-600 font-semibold hover:underline text-[11px]"
                      >
                        + Jetzt Vertrag erfassen
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {contact.contracts.map((ct) => {
                        const daysRemaining = calculateDaysRemaining(ct.endDate);
                        const progressPct = calculateContractProgress(ct.startDate, ct.endDate);
                        const isCritical = daysRemaining <= 45;
                        const isWarning = daysRemaining > 45 && daysRemaining <= 90;
                        const isTypeMatched =
                          contractTypeFilter !== 'alle' &&
                          (ct.service === contractTypeFilter ||
                            (contractTypeFilter === 'kombi' && (ct.service === 'strom' || ct.service === 'gas')));

                        return (
                          <div
                            key={ct.id}
                            className={`p-3 rounded-lg border text-xs space-y-2 transition-colors ${
                              isTypeMatched
                                ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                                    {ct.service === 'strom' && '⚡ Strom'}
                                    {ct.service === 'gas' && '🔥 Gas'}
                                    {ct.service === 'internet' && '🌐 Internet'}
                                    {ct.service === 'kfz' && '🚗 KFZ'}
                                  </span>
                                  {isTypeMatched && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                      Gefiltert
                                    </span>
                                  )}
                                  <span className="text-slate-600 font-medium">· {ct.provider}</span>
                                </div>
                                <div className="text-[11px] text-slate-700 font-medium truncate max-w-[200px]">
                                  {ct.tariffName}
                                </div>
                              </div>

                              {/* Status Ampel Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                                  isCritical
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isWarning
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isCritical && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                                {isWarning && <BellRing className="w-3 h-3 text-amber-600" />}
                                {!isCritical && !isWarning && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                <span>
                                  {isCritical
                                    ? `Noch ${daysRemaining} Tage!`
                                    : isWarning
                                    ? `Endet in ${daysRemaining} T.`
                                    : `${daysRemaining} Tage übrig`}
                                </span>
                              </span>
                            </div>

                            {/* Runtime Dates & Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Beginn: {ct.startDate}</span>
                                <span className="font-semibold text-slate-800">Ende: {ct.endDate} ({ct.durationMonths}M)</span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCritical
                                      ? 'bg-rose-500'
                                      : isWarning
                                      ? 'bg-amber-500'
                                      : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Monthly installment & quick action */}
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                              <div className="text-slate-600">
                                Abschlag:{' '}
                                <strong className="text-slate-900 font-mono">
                                  {ct.currentMonthlyInstallment} € / Monat
                                </strong>
                                {ct.meterNumber && (
                                  <span className="text-[10px] text-slate-500 block">
                                    Zähler: {ct.meterNumber}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() =>
                                  onOpenNachzahlungCheck(
                                    contact.fullName,
                                    contact.email,
                                    contact.phone,
                                    ct.service,
                                    ct.currentMonthlyInstallment,
                                    ct.annualKwh
                                  )
                                }
                                className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded text-[10px] font-semibold border border-blue-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Abschlags- und Nachzahlungs-Schutz prüfen"
                              >
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                <span>Abschlag prüfen</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION B: Status der laufenden Optimierungsprozesse (Pipeline Tracker) */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Laufende Optimierungsprozesse ({contact.optimizationProcesses.length})</span>
                    </span>

                    {contact.totalAnnualSavingsCalculated > 0 && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Ersparnis: +{contact.totalAnnualSavingsCalculated} € / Jahr
                      </span>
                    )}
                  </div>

                  {contact.optimizationProcesses.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                      Kein aktiver Optimierungsprozess in Bearbeitung.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contact.optimizationProcesses.map((proc) => {
                        const stageInfo = STAGE_CONFIG[proc.stage];
                        const currentIdx = STAGE_ORDER.indexOf(proc.stage);

                        return (
                          <div
                            key={proc.id}
                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                          >
                            {/* Process Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                                  {proc.service}
                                </span>
                                <span className="text-xs text-slate-700">
                                  <strong>{proc.currentProvider}</strong>
                                  {proc.targetProvider && ` ➔ ${proc.targetProvider} (${proc.targetTariff})`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  +{proc.potentialAnnualSavings} €/Jahr Ersparnis
                                </span>

                                {/* Stage Selector Dropdown */}
                                <select
                                  value={proc.stage}
                                  onChange={(e) => handleSetStage(contact, proc.id, e.target.value as OptimizationStage)}
                                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${stageInfo.color}`}
                                >
                                  {STAGE_ORDER.map((stKey) => (
                                    <option key={stKey} value={stKey}>
                                      {STAGE_CONFIG[stKey].label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Multi-Step Pipeline Stepper */}
                            <div className="overflow-x-auto scrollbar-none py-1">
                              <div className="flex items-center gap-1 min-w-[550px]">
                                {STAGE_ORDER.map((stageKey, sIdx) => {
                                  const isPassed = sIdx < currentIdx;
                                  const isCurrent = sIdx === currentIdx;
                                  const item = STAGE_CONFIG[stageKey];

                                  return (
                                    <React.Fragment key={stageKey}>
                                      <button
                                        type="button"
                                        onClick={() => handleSetStage(contact, proc.id, stageKey)}
                                        className={`flex-1 flex flex-col items-center p-1.5 rounded-lg text-center cursor-pointer transition-all border ${
                                          isCurrent
                                            ? `${item.color} shadow-2xs font-bold`
                                            : isPassed
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 text-[10px]">
                                          {isPassed ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                          ) : (
                                            <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] shrink-0 font-mono font-bold">
                                              {sIdx + 1}
                                            </span>
                                          )}
                                          <span className="truncate">{item.label.split('. ')[1]}</span>
                                        </div>
                                      </button>

                                      {sIdx < STAGE_ORDER.length - 1 && (
                                        <ChevronRight
                                          className={`w-3 h-3 shrink-0 ${
                                            isPassed ? 'text-emerald-500' : 'text-slate-300'
                                          }`}
                                        />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Process Footer: Notes and 1-Click Advance */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                              <div className="text-[11px] text-slate-500 italic truncate max-w-md">
                                "{proc.notes}"
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {currentIdx < STAGE_ORDER.length - 1 && (
                                  <button
                                    onClick={() => handleAdvanceStage(contact, proc.id)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                    title="Prozess auf nächsten Schritt vorrücken"
                                  >
                                    <span>Nächster Schritt</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION C: Gesprächsprotokolle & Interne Notizen */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gesprächsprotokolle & Notizen ({sortedNotes.length})</span>
                      </span>

                      {sortedNotes.some(n => n.pinned) && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-bold">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Angepinnt</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddNoteModal(contact)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Neuer Eintrag</span>
                      </button>

                      {sortedNotes.length > 0 && (
                        <button
                          onClick={() => setExpandedNotesMap(prev => ({ ...prev, [contact.id]: !prev[contact.id] }))}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isNotesExpanded ? 'Einklappen' : `Historie (${sortedNotes.length})`}</span>
                          {isNotesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Preview when collapsed */}
                  {!isNotesExpanded && sortedNotes.length > 0 && (
                    <div
                      onClick={() => setExpandedNotesMap(prev => ({ ...prev, [contact.id]: true }))}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {sortedNotes[0].pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${NOTE_TYPE_CONFIG[sortedNotes[0].type]?.color}`}>
                          {NOTE_TYPE_CONFIG[sortedNotes[0].type]?.label}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {sortedNotes[0].title}:
                        </span>
                        <span className="text-slate-500 truncate italic">
                          "{sortedNotes[0].content}"
                        </span>
                      </div>

                      <span className="text-[11px] text-blue-600 group-hover:underline shrink-0 whitespace-nowrap font-medium">
                        Alle {sortedNotes.length} anzeigen ➔
                      </span>
                    </div>
                  )}

                  {/* Empty state when no notes exist yet */}
                  {sortedNotes.length === 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 flex items-center justify-between">
                      <span>Noch kein Gesprächsprotokoll erfasst. Halten Sie Telefonate & Beratungsinhalte hier fest.</span>
                      <button
                        onClick={() => handleOpenAddNoteModal(contact)}
                        className="text-amber-700 hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Jetzt notieren</span>
                      </button>
                    </div>
                  )}

                  {/* Expanded Full Notes List */}
                  {isNotesExpanded && sortedNotes.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      {sortedNotes.map((entry) => {
                        const typeInfo = NOTE_TYPE_CONFIG[entry.type] || NOTE_TYPE_CONFIG.notiz;

                        return (
                          <div
                            key={entry.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                              entry.pinned
                                ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {/* Note Card Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                                  {typeInfo.badge}
                                </span>

                                <span className="font-bold text-slate-900 text-xs">
                                  {entry.title}
                                </span>

                                {entry.pinned && (
                                  <span className="text-[10px] text-amber-700 flex items-center gap-0.5 font-bold">
                                    <Pin className="w-3 h-3" />
                                    <span>Angepinnt</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {entry.date} · {entry.author}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePinNote(contact, entry.id)}
                                  className={`p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer ${
                                    entry.pinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                  title={entry.pinned ? 'Anpinnung lösen' : 'Notiz oben anpinnen'}
                                >
                                  {entry.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(contact, entry.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Eintrag löschen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Note Content Text */}
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs pl-0.5">
                              {entry.content}
                            </p>

                            {/* Action Item / Callback Follow-up */}
                            {entry.actionRequired && (
                              <div className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                                entry.actionDone
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <CalendarClock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                  <span>
                                    Wiedervorlage / Rückruf: <strong>{entry.followUpDate || 'Zeitnah'}</strong>
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleActionDone(contact, entry.id)}
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                                    entry.actionDone
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-amber-500 hover:bg-amber-600 text-white font-bold'
                                  }`}
                                >
                                  {entry.actionDone ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Erledigt ✓</span>
                                    </>
                                  ) : (
                                    <span>Als erledigt markieren</span>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Neues Gesprächsprotokoll / Notiz anlegen */}
      {isAddNoteModalOpen && targetCustomerForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Gesprächsprotokoll & Notiz erfassen
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Für: <strong>{targetCustomerForNote.fullName}</strong> ({targetCustomerForNote.customerNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddNoteModalOpen(false);
                  setTargetCustomerForNote(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
              {/* Note Type Selector */}
              <div>
                <label className="block text-slate-600 mb-1.5 font-medium">Kontakt- / Notiz-Typ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(NOTE_TYPE_CONFIG) as NoteType[]).map((tKey) => {
                    const item = NOTE_TYPE_CONFIG[tKey];
                    const isSelected = noteType === tKey;

                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => setNoteType(tKey)}
                        className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                          isSelected
                            ? `${item.color} shadow-xs ring-2 ring-blue-500/20`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {item.badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Thema / Betreff</label>
                  <input
                    type="text"
                    placeholder="z.B. Abschlagsanpassung Gas, Kündigungsberatung..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Berater / Bearbeiter</label>
                  <input
                    type="text"
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Protocol Content */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Gesprächsprotokoll / Notizinhalt *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Was wurde besprochen? Welche Wünsche hat der Kunde? Welche Angebote oder Zusagen wurden gemacht?"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Datum & Uhrzeit des Gesprächs</label>
                <input
                  type="text"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Action Required Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={noteActionRequired}
                    onChange={(e) => setNoteActionRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span className="font-semibold">Wiedervorlage oder Rückruf erforderlich?</span>
                </label>

                {noteActionRequired && (
                  <div className="pt-1">
                    <label className="block text-slate-600 mb-1 font-medium">Fällig am (Datum / Notiz):</label>
                    <input
                      type="date"
                      value={noteFollowUpDate}
                      onChange={(e) => setNoteFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Pin Note */}
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={notePinned}
                  onChange={(e) => setNotePinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                />
                <span>Wichtig: Diese Notiz oben in der Kundenakte anpinnen 📌</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddNoteModalOpen(false);
                    setTargetCustomerForNote(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Protokoll speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Neuen Kundenkontakt anlegen */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Neuen Kundenkontakt anlegen</h3>
                  <p className="text-[11px] text-slate-500">Erfassen Sie Kontaktdaten & die erste Optimierungsanfrage</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Vollständiger Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Thomas Schmidt"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Telefon / Mobilfunk *</label>
                  <input
                    type="tel"
                    required
                    placeholder="z.B. +49 176 12345678"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">E-Mail-Adresse</label>
                  <input
                    type="email"
                    placeholder="z.B. t.schmidt@leipzig-mail.de"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Bevorzugter Kontaktkanal</label>
                  <select
                    value={newCustContactPref}
                    onChange={(e) => setNewCustContactPref(e.target.value as ConsultationType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telefon">Telefon</option>
                    <option value="vor-ort">Vor-Ort in Leipzig</option>
                    <option value="video">Video-Beratung</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">Straße & Hausnummer</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">PLZ & Ort</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCustPostal}
                      onChange={(e) => setNewCustPostal(e.target.value)}
                      className="w-16 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <input
                      type="text"
                      value={newCustCity}
                      onChange={(e) => setNewCustCity(e.target.value)}
                      className="flex-1 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Service / Optimization */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-blue-700 block">
                  Erste Optimierungs-Sparte
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['gas', 'strom', 'internet', 'kfz'] as ServiceType[]).map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setNewCustService(srv)}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                        newCustService === srv
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {srv.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Bisheriger Versorger</label>
                    <input
                      type="text"
                      value={newCustProvider}
                      onChange={(e) => setNewCustProvider(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Monatlicher Abschlag (€)</label>
                    <input
                      type="number"
                      value={newCustMonthly}
                      onChange={(e) => setNewCustMonthly(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Jahresverbrauch (kWh)</label>
                    <input
                      type="number"
                      value={newCustKwh}
                      onChange={(e) => setNewCustKwh(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kunden-Schlagwörter (Tags, kommagetrennt)</label>
                <input
                  type="text"
                  value={newCustTags}
                  onChange={(e) => setNewCustTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Interne Notizen / Beratungsziel</label>
                <textarea
                  rows={2}
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Kunden speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Neuen Optimierungsprozess für bestehenden Kunden anlegen */}
      {isAddProcessOpen && targetCustomerForProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Neuen Optimierungsprozess starten
                </h3>
                <p className="text-[11px] text-slate-500">
                  Für Kunde: <strong>{targetCustomerForProcess.fullName}</strong> ({targetCustomerForProcess.customerNumber})
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddProcessOpen(false);
                  setTargetCustomerForProcess(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProcessSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Sparte auswählen</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['strom', 'gas', 'internet', 'kfz'] as ServiceType[]).map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setProcService(srv)}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                        procService === srv
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {srv.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Bisheriger Anbieter</label>
                  <input
                    type="text"
                    required
                    value={procCurrentProvider}
                    onChange={(e) => setProcCurrentProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Aktueller Abschlag (€/M.)</label>
                  <input
                    type="number"
                    required
                    value={procMonthly}
                    onChange={(e) => setProcMonthly(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Ziel-Anbieter (Vergleich)</label>
                  <input
                    type="text"
                    value={procTargetProvider}
                    onChange={(e) => setProcTargetProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Ziel-Tarif</label>
                  <input
                    type="text"
                    value={procTargetTariff}
                    onChange={(e) => setProcTargetTariff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Kalkulierte Ersparnis (€/Jahr)</label>
                  <input
                    type="number"
                    value={procSavings}
                    onChange={(e) => setProcSavings(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Start-Status</label>
                  <select
                    value={procStage}
                    onChange={(e) => setProcStage(e.target.value as OptimizationStage)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  >
                    {STAGE_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Notizen zum Prozess</label>
                <textarea
                  rows={2}
                  value={procNotes}
                  onChange={(e) => setProcNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProcessOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Prozess hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Ausführliches Kunden-Dossier */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {selectedCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedCustomer.fullName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-semibold border border-slate-200">
                      {selectedCustomer.customerNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kunde seit {selectedCustomer.customerSince} · Leipzig
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAddNoteModal(selectedCustomer)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Neues Protokoll anlegen"
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Protokoll</span>
                </button>

                <button
                  onClick={() => exportCustomerDossierPDF(selectedCustomer)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Kundenstammblatt inklusive Protokollen als PDF exportieren"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Dossier PDF</span>
                </button>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contact Specs */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Telefon / WhatsApp</span>
                <span className="font-bold text-slate-800">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">E-Mail</span>
                <span className="font-bold text-slate-800 truncate block">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Adresse</span>
                <span className="text-slate-700 block">{selectedCustomer.address || 'Rotfuchsstr. 1, Leipzig'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Präferenz</span>
                <span className="font-bold text-blue-700 uppercase">{selectedCustomer.preferredContact}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Realisierte Gesamtersparnis</span>
                <span className="font-bold text-emerald-600">+{selectedCustomer.totalAnnualSavingsCalculated} € / Jahr</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Status</span>
                <span className="font-bold text-slate-800 uppercase">{selectedCustomer.status}</span>
              </div>
            </div>

            {/* Verträge & Laufzeiten */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Verträge & Laufzeiten ({selectedCustomer.contracts.length})</span>
              </h4>

              {selectedCustomer.contracts.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                  Keine Bestandsverträge hinterlegt.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.contracts.map((ct) => {
                    const daysRemaining = calculateDaysRemaining(ct.endDate);
                    return (
                      <div key={ct.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-bold text-slate-900 uppercase">{ct.service} · {ct.provider} ({ct.tariffName})</div>
                          <div className="text-slate-500 text-[11px]">
                            Laufzeit: {ct.startDate} bis {ct.endDate} ({ct.durationMonths} Monate) · Abschlag: {ct.currentMonthlyInstallment} €/M.
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          daysRemaining <= 45 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {daysRemaining < 0 ? 'Beendet' : `Noch ${daysRemaining} Tage`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Laufende Optimierungen */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                <span>Optimierungs-Historie & Status ({selectedCustomer.optimizationProcesses.length})</span>
              </h4>

              <div className="space-y-2">
                {selectedCustomer.optimizationProcesses.map((p) => (
                  <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 uppercase">{p.service} · {STAGE_CONFIG[p.stage].label}</span>
                      <span className="text-emerald-600 font-bold">+{p.potentialAnnualSavings} € / Jahr</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{p.notes}</p>
                    <div className="text-[10px] text-slate-400">Zuletzt aktualisiert: {p.lastUpdatedDate}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronik: Gesprächsprotokolle & Interne Notizen */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gesprächsprotokolle & Chronik ({(selectedCustomer.noteEntries || []).length})</span>
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setDossierNoteFilter('alle')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                      dossierNoteFilter === 'alle'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Alle
                  </button>
                  {(Object.keys(NOTE_TYPE_CONFIG) as NoteType[]).map((tKey) => (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setDossierNoteFilter(tKey)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        dossierNoteFilter === tKey
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {NOTE_TYPE_CONFIG[tKey].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of note entries in Dossier */}
              {(() => {
                const allEntries = selectedCustomer.noteEntries || [];
                const filteredEntries = allEntries.filter(n => {
                  if (dossierNoteFilter === 'alle') return true;
                  return n.type === dossierNoteFilter;
                });

                if (filteredEntries.length === 0) {
                  return (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
                      <p>Keine Einträge für diese Filterkategorie vorhanden.</p>
                      <button
                        onClick={() => handleOpenAddNoteModal(selectedCustomer, dossierNoteFilter !== 'alle' ? dossierNoteFilter : 'telefonat')}
                        className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1 hover:bg-amber-200"
                      >
                        <Plus className="w-3 h-3 text-amber-700" />
                        <span>Neues Protokoll anlegen</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {filteredEntries.map((entry) => {
                      const typeInfo = NOTE_TYPE_CONFIG[entry.type] || NOTE_TYPE_CONFIG.notiz;

                      return (
                        <div
                          key={entry.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all shadow-xs ${
                            entry.pinned
                              ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                                {typeInfo.badge}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{entry.title}</span>
                              {entry.pinned && (
                                <span className="text-[10px] text-amber-700 flex items-center gap-0.5 font-semibold">
                                  <Pin className="w-3 h-3 text-amber-600" />
                                  <span>Angepinnt</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {entry.date} · {entry.author}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleTogglePinNote(selectedCustomer, entry.id)}
                                className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                                  entry.pinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={entry.pinned ? 'Anpinnung lösen' : 'Notiz oben anpinnen'}
                              >
                                {entry.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteNote(selectedCustomer, entry.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Eintrag löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs pl-0.5">
                            {entry.content}
                          </p>

                          {entry.actionRequired && (
                            <div className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                              entry.actionDone
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-amber-50 border-amber-300 text-amber-900'
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <CalendarClock className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                                <span>
                                  Wiedervorlage / Rückruf: <strong>{entry.followUpDate || 'Zeitnah'}</strong>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleActionDone(selectedCustomer, entry.id)}
                                className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                                  entry.actionDone
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs'
                                }`}
                              >
                                {entry.actionDone ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Erledigt ✓</span>
                                  </>
                                ) : (
                                  <span>Als erledigt markieren</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
