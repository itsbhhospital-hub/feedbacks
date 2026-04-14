import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import LasikSurvey from './LasikSurvey';
import {
    Search,
    Edit3,
    Loader2,
    RefreshCw,
    Filter,
    Plus,
    Users,
    Activity,
    Bed,
    CheckCircle2,
    AlertCircle,
    X,
    Save,
    LogOut,
    Hospital,
    ChevronRight,
    User,
    ClipboardList,
    Stethoscope,
    Scan,
    TrendingUp,
    BarChart3,
    Calendar,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---
const DOCTORS_OPD = [
    'DR.SNIGDHA', 'DR.MINAKSHI', 'DR.MADHURI', 'DR.RICHA',
    'DR.HEMALI', 'DR.SWATI MAHOBIA', 'DR. Neha Nupoor'
];

const DOCTORS_RAD = ['DR.MAYANK', 'DR.SWATI BHUSHAN'];

const CRM_CATEGORIES = [
    'USG', 'FOLLICULAR', 'ADMISSION', 'REPORT', 'RE-VISIT', 'FOLLOW UP', 'NEW VISIT'
];

const PATIENT_STATUSES = ['ARRIVED', 'VIP', 'CANCEL', 'Rescheduled'];

const SCAN_TYPES = [
    'AFI SCREENING', 'ECHO', 'PELVIS', 'ANAMOLY SCAN',
    'NT SCAN', 'COLOUR DOPPLER', 'OBS RUTINE'
];

// --- UTILS ---
const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return '';
    // If already in AM/PM format, return as is
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;

    try {
        const parts = timeStr.split(':');
        let h = parseInt(parts[0]);
        let m = parts.length > 1 ? parts[1].substring(0, 2) : '00';

        if (isNaN(h)) return timeStr;

        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        m = m.toString().padStart(2, '0');
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

const SheetDashboard = ({ user, onLogout, isPublic }) => {
    const [activeTab, setActiveTab] = useState(isPublic ? 'LASIK_FORM' : 'DASHBOARD');
    const [expandedMenus, setExpandedMenus] = useState(['IPD_OPD', 'LASIK']); // Track which accordion menus are open
    const [opdData, setOpdData] = useState([]);
    const [sonoData, setSonoData] = useState([]);
    const [lasikSubmissions, setLasikSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingRow, setEditingRow] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('OPD');
    const [targets, setTargets] = useState([]);
    const [selectedLasikPatient, setSelectedLasikPatient] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile control

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx9ZM4dSz8Yu3jmuVhWWgBdxCuUjeNRF7WXEio_hhs6JFfHvktAFraoy7Mtar6sL3c/exec';
    const lasikScriptUrl = 'https://script.google.com/macros/s/AKfycbxuFDz3LDBM88Wy-7naDgffvXQ0hH37-EMQhJuMcUId40PNG5yX_PFZLyXXiGYMB0zQ/exec';

    const toggleMenu = (menu) => {
        setExpandedMenus(prev => 
            prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const fetchSheetData = async (name) => {
                const response = await fetch(`${scriptUrl}?sheet=${name}&date=${selectedDate}`);
                return await response.json();
            };

            const fetchLasikData = async () => {
                const response = await fetch(lasikScriptUrl);
                return await response.json();
            };

            const [opd, sono, targetData, lasik] = await Promise.all([
                fetchSheetData('OPD_Records'),
                fetchSheetData('SONO_Records'),
                fetchSheetData('Targets'),
                fetchLasikData()
            ]);

            setOpdData(opd || []);
            setSonoData(sono || []);
            setTargets(targetData || []);
            // Defensive mapping for LASIK submissions to handle variations in keys and response structure
            const submissions = Array.isArray(lasik) ? lasik : (lasik && lasik.value ? lasik.value : []);
            const mappedLasik = submissions.map(entry => ({
                ...entry,
                name: entry.name || entry.patient_name || 'Empty',
                phone_no: entry.phone_no || entry.phone || entry.mobile || 'N/A',
                timestamp: entry.timestamp || entry.date || entry.date_time || new Date()
            }));
            setLasikSubmissions(mappedLasik);
        } catch (err) {
            console.error('Fetch error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    // ... handleFormSubmit, handleUpdate stay same but with SBH Green theme ...
    const handleFormSubmit = async (formData) => {
        setLoading(true);
        try {
            let rowArray = [];
            if (formType === 'OPD') {
                rowArray = [formData.name || '', formData.mrd || '', formData.num || '', formData.dr || '', formData.num || '', formData.crm || '', formData.time || '', formData.status || '', formData.remark || ''];
            } else {
                rowArray = [formData.name || '', formData.num || '', formData.dr || '', formData.scan || '', formData.time || '', formData.status || '', formData.remark || ''];
            }
            await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'register', sheet: formType === 'OPD' ? 'OPD_Records' : 'SONO_Records', data: rowArray }) });
            setTimeout(fetchData, 1500);
            setShowForm(false);
        } catch (err) { console.error('Save error:', err); }
        setLoading(false);
    };

    const handleUpdate = async (id, updatedData) => {
        setLoading(true);
        try {
            let rowArray = activeTab === 'OPD' 
                ? [updatedData.date || '', updatedData.name || '', updatedData.mrd_number || '', updatedData.number || '', updatedData.dr_name || '', updatedData.number || '', updatedData.crm || '', updatedData.time_alloted || '', updatedData.status || '', updatedData.remark || '']
                : [updatedData.date || '', updatedData.name || '', updatedData.number || '', updatedData.dr_name || '', updatedData.scan_name || '', updatedData.time || '', updatedData.status || '', updatedData.remark || ''];
            
            await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'update', sheet: activeTab === 'RADIOLOGY' ? 'SONO_Records' : 'OPD_Records', id: id, data: rowArray }) });
            setTimeout(fetchData, 1500);
            setEditingRow(null);
        } catch (err) { console.error('Update error:', err); }
        setLoading(false);
    };

    const handleArchive = async () => {
        if (!window.confirm("Are you sure you want to archive today's data and start a fresh dashboard?")) return;
        setLoading(true);
        try {
            await Promise.all([
                fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ action: 'archiveDayData', sheet: 'OPD_Records', date: selectedDate })
                }),
                fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ action: 'archiveDayData', sheet: 'SONO_Records', date: selectedDate })
                })
            ]);
            setTimeout(fetchData, 2000);
        } catch (err) {
            console.error('Archive error:', err);
        }
    };

    const TargetManager = () => {
        const [localTargets, setLocalTargets] = useState({});
        const [saving, setSaving] = useState(null);

        const handleSaveTarget = async (dr) => {
            const val = localTargets[dr];
            if (val === undefined) return;

            setSaving(dr);
            try {
                await fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ action: 'saveTarget', date: selectedDate, doctor: dr, targetCount: val })
                });
                setTimeout(() => {
                    fetchData();
                    setSaving(null);
                }, 800);
            } catch (e) {
                console.error(e);
                setSaving(null);
            }
        };

        return (
            <div className="medical-card p-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black tracking-tighter text-slate-800 uppercase flex items-center gap-3">
                        <TrendingUp className="text-[#2E7D32]" /> Set Daily <span className="text-[#2E7D32]">Targets</span>
                    </h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 italic">Targeting For: {formatDateReadable(selectedDate)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...DOCTORS_OPD, ...DOCTORS_RAD].map(dr => {
                        const existing = targets.find(t => t.doctor === dr && t.date === selectedDate);
                        const isSaving = saving === dr;

                        return (
                            <div key={dr} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">{dr}</p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={localTargets[dr] !== undefined ? localTargets[dr] : (existing ? existing.target_count : '')}
                                        placeholder="Goal"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#2E7D32]/10"
                                        onChange={(e) => setLocalTargets({ ...localTargets, [dr]: e.target.value })}
                                    />
                                    <button
                                        onClick={() => handleSaveTarget(dr)}
                                        disabled={isSaving}
                                        className={`p-4 rounded-xl transition-all shadow-sm flex items-center justify-center ${isSaving ? 'bg-green-50 text-[#2E7D32]' : 'bg-slate-900 text-white hover:bg-[#2E7D32]'
                                            }`}
                                    >
                                        {isSaving ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const LasikDashboard = () => {
        const stats = {
            total: lasikSubmissions.length,
            today: lasikSubmissions.filter(s => {
                const sDate = s.timestamp ? new Date(s.timestamp).toISOString().split('T')[0] : '';
                return sDate === selectedDate;
            }).length
        };

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="medical-card p-6 flex items-center gap-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32]">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Total Survey Submissions</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="medical-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-slate-800">Registration History</h3>
                            <button 
                                onClick={fetchData} 
                                className="p-1.5 hover:bg-slate-50 rounded-lg text-[#2E7D32] transition-all"
                                title="Refresh Data"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="text-[10px] font-black text-slate-400">Showing all records</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Patient</th>
                                    <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Phone</th>
                                    <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Age</th>
                                    <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Submitted At</th>
                                    <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lasikSubmissions.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{p.phone_no}</td>
                                        <td className="px-6 py-4 text-xs font-bold">{p.age || 'N/A'}</td>
                                        <td className="px-6 py-4 text-[10px] text-slate-400">{formatDateReadable(p.timestamp)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedLasikPatient(p)}
                                                className="px-3 py-1.5 bg-[#2E7D32] text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm hover:bg-slate-900 transition-all"
                                            >
                                                View Form
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const DashboardHome = () => {
        const calculateProgress = (drName, isRad) => {
            const actual = isRad ? sonoData.filter(d => d.dr_name === drName).length : opdData.filter(d => d.dr_name === drName).length;
            const targetRow = targets.find(t => t.doctor === drName && t.date === selectedDate);
            const target = targetRow ? parseInt(targetRow.target_count) : 0;
            return { actual, target, percent: target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0 };
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={<Users />} label="Today's OPD" value={opdData.length} color="bg-[#2E7D32]" />
                    <StatCard icon={<Scan />} label="Today's Radiology" value={sonoData.length} color="bg-slate-800" />
                    <StatCard icon={<TrendingUp />} label="Performance" value={targets.length > 0 ? `${Math.round((opdData.length + sonoData.length) / targets.reduce((acc, t) => acc + (t.date === selectedDate ? parseInt(t.target_count) : 0), 0) * 100 || 0)}%` : '0%'} color="bg-indigo-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="medical-card p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] mb-6 flex items-center gap-2">
                             OPD Targets
                        </h3>
                        <div className="space-y-5">
                            {DOCTORS_OPD.map(dr => {
                                const { actual, target, percent } = calculateProgress(dr, false);
                                if (actual === 0 && target === 0) return null;
                                return (
                                    <div key={dr} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-700">{dr}</span>
                                            <span className="text-[9px] font-black text-[#2E7D32]">{actual} / {target || '-'}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-[#2E7D32] rounded-full" />
                                        </div>
                                    </div>
                                );
                            }).filter(n => n !== null)}
                        </div>
                    </div>

                    <div className="medical-card p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                             Radiology Metrics
                        </h3>
                        <div className="space-y-5">
                            {DOCTORS_RAD.map(dr => {
                                const { actual, target, percent } = calculateProgress(dr, true);
                                if (actual === 0 && target === 0) return null;
                                return (
                                    <div key={dr} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-700">{dr}</span>
                                            <span className="text-[9px] font-black text-slate-800">{actual} / {target || '-'}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-slate-800 rounded-full" />
                                        </div>
                                    </div>
                                );
                            }).filter(n => n !== null)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {/* Redesigned Accordion Sidebar */}
            {!isPublic && (
                <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 transition-all duration-300 w-64 shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-8 border-b border-slate-50 flex flex-col items-center justify-center bg-white gap-2">
                        <img src="/logo.png" alt="SBH Logo" className="h-20 object-contain mb-2" />
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">SBH Hospital</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Registry</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Menu Section */}
                        <div className="space-y-1">
                            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Main Menu</p>
                            <NavItem icon={<BarChart3 size={18}/>} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
                        </div>

                        {/* Collapsible IPD & OPD */}
                        <div className="space-y-1">
                            <button 
                                onClick={() => toggleMenu('IPD_OPD')}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Stethoscope size={18} className="text-slate-400 group-hover:text-[#2E7D32]"/>
                                    <span className="text-[11px] font-black uppercase tracking-wider">IPD & OPD</span>
                                </div>
                                <ChevronRight size={14} className={`transition-transform opacity-50 ${expandedMenus.includes('IPD_OPD') ? 'rotate-90' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {expandedMenus.includes('IPD_OPD') && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-8 space-y-1">
                                        <NavItem label="OPD Records" active={activeTab === 'OPD'} onClick={() => setActiveTab('OPD')} dot />
                                        <NavItem label="Radiology" active={activeTab === 'RADIOLOGY'} onClick={() => setActiveTab('RADIOLOGY')} dot />
                                        {user === 'SBH' && <NavItem label="Daily Targets" active={activeTab === 'TARGETS'} onClick={() => setActiveTab('TARGETS')} dot />}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Collapsible LASIK */}
                        <div className="space-y-1">
                            <button 
                                onClick={() => toggleMenu('LASIK')}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Activity size={18} className="text-slate-400 group-hover:text-[#2E7D32]"/>
                                    <span className="text-[11px] font-black uppercase tracking-wider">Lasik Vision</span>
                                </div>
                                <ChevronRight size={14} className={`transition-transform opacity-50 ${expandedMenus.includes('LASIK') ? 'rotate-90' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {expandedMenus.includes('LASIK') && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-8 space-y-1">
                                        <NavItem label="New Registration" active={activeTab === 'LASIK_FORM'} onClick={() => setActiveTab('LASIK_FORM')} dot />
                                        <NavItem label="LASIK Dashboard" active={activeTab === 'LASIK_STATS'} onClick={() => setActiveTab('LASIK_STATS')} dot />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {user === 'SBH' && (
                            <div className="pt-2 border-t border-slate-50">
                                <NavItem icon={<Layers size={18}/>} label="Admin Archive" active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} />
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-50">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase transition-colors">
                            <LogOut size={16} /> Logout System
                        </button>
                    </div>
                </aside>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
                {!isPublic && (
                    <header className="h-16 bg-white border-b border-slate-50 px-8 flex items-center justify-between sticky top-0 z-40">
                        <div className="flex items-center gap-3 lg:hidden">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-50 rounded-lg text-slate-500">
                                <Hospital size={16} />
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center gap-6">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2E7D32]/5 rounded-lg border border-[#2E7D32]/10">
                               <User size={12} className="text-[#2E7D32]"/>
                               <span className="text-[9px] font-black uppercase tracking-widest text-[#2E7D32]">{user} Access</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                                <Calendar size={14} className="text-[#2E7D32]" />
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer" />
                            </div>

                            {user === 'SBH' && activeTab === 'DASHBOARD' && (
                                <button onClick={handleArchive} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-rose-600 transition-all shadow-md">
                                    <RefreshCw className="w-3.5 h-3.5" /> Archive Today
                                </button>
                            )}

                            {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && (
                                <button onClick={() => { setFormType(activeTab === 'RADIOLOGY' ? 'SONO' : 'OPD'); setShowForm(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-slate-900 transition-all shadow-green-100 shadow-lg">
                                    <Plus className="w-3.5 h-3.5" /> Book Registration
                                </button>
                            )}
                        </div>
                    </header>
                )}

                <main className={`flex-1 p-6 md:p-10 ${isPublic ? '' : 'lg:ml-64'} max-w-[1400px] mx-auto w-full`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && <DashboardHome key="dash" />}
                        {activeTab === 'TARGETS' && <TargetManager key="targets" />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey key="lasik-form" isPublic={false} />}
                        {activeTab === 'LASIK_STATS' && <LasikDashboard key="lasik-stats" />}
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY' || activeTab === 'ADMIN') && (
                            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <DataTable data={activeTab === 'RADIOLOGY' ? sonoData : (activeTab === 'ADMIN' ? [...opdData, ...sonoData] : opdData)} type={activeTab} onEdit={setEditingRow} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals & Detail Views */}
            <AnimatePresence>
                {showForm && <RegistrationModal type={formType} onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />}
                {editingRow && <EditModal row={editingRow} type={activeTab} onClose={() => setEditingRow(null)} onUpdate={handleUpdate} />}
                {selectedLasikPatient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLasikPatient(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 px-6 py-4 bg-[#2E7D32] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">Lasik Detail</div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">{selectedLasikPatient.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4 mb-6">Patient Feedback Record</p>
                            
                            <div className="space-y-4">
                                <FeedbackRow label="Age Group (18-40)" value={selectedLasikPatient._18_40_years_old_} />
                                <FeedbackRow label="Wears Glasses/Lens" value={selectedLasikPatient.wear_glasses_contact_lens_} />
                                <FeedbackRow label="Power is Stable" value={selectedLasikPatient.is_power_stable_} />
                                <FeedbackRow label="Affects Day Activity" value={selectedLasikPatient.affecting_day_to_day_activity_} />
                            </div>

                            <button onClick={() => setSelectedLasikPatient(null)} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2E7D32] transition-colors">Close Feedback</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="fixed bottom-6 right-6 z-[100] bg-white border border-[#2E7D32]/20 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-down">
                    <Loader2 size={16} className="text-[#2E7D32] animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-800">Processing Cloud Data</span>
                </div>
            )}
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick, dot }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${active ? 'bg-[#2E7D32]/5 text-[#2E7D32]' : 'hover:bg-slate-50 text-slate-600'}`}
    >
        {icon && <span className={`transition-colors ${active ? 'text-[#2E7D32]' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>}
        {dot && <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#2E7D32]' : 'bg-slate-200'}`} />}
        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-[#2E7D32]' : 'text-slate-500 group-hover:text-slate-800'}`}>{label}</span>
    </button>
);

const FeedbackRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${value === 'YES' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{value}</span>
    </div>
);

// --- SUB-COMPONENTS ---

const NavIcon = ({ icon, id, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`p-4 rounded-2xl transition-all relative group ${active === id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
    >
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        {active === id && <motion.div layoutId="nav-pill" className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full" />}
        <span className="absolute left-24 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            {id}
        </span>
    </button>
);

const StatCard = ({ icon, label, value, color }) => (
    <div className="medical-card p-8 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.05] transition-opacity`} />
        <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                {React.cloneElement(icon, { className: "w-7 h-7" })}
            </div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <p className="text-4xl font-black tracking-tighter text-slate-800">{value}</p>
            </div>
        </div>
    </div>
);

const DataTable = ({ data, type, onEdit }) => (
    <div className="medical-card overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Consultant</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map(row => (
                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <p className="font-bold text-slate-800 leading-tight">{row.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {row.mrd_number && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">MRD #{row.mrd_number}</span>}
                                    <span className="text-[9px] text-[#2E7D32] font-bold uppercase tracking-widest">{formatDateReadable(row.date)}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <p className="text-sm font-black text-slate-600">{row.number || row.patient_number}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {row.crm && <span className="text-[9px] bg-green-50 text-[#2E7D32] px-2 py-0.5 rounded font-black uppercase">{row.crm}</span>}
                                    {row.scan_name && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">{row.scan_name}</span>}
                                    {row.time_alloted && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">Time: {formatTimeToAMPM(row.time_alloted)}</span>}
                                    {row.time && !row.time_alloted && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">Time: {formatTimeToAMPM(row.time)}</span>}
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg w-fit text-slate-700 font-black text-[10px] uppercase">
                                    <User size={14} className="text-slate-400" /> {row.dr_name}
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${row.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : row.status === 'VIP' ? 'bg-amber-50 text-amber-600 border-amber-100' : row.status === 'CANCEL' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    {row.status}
                                </span>
                                {row.remark && <p className="text-[9px] text-slate-400 italic mt-1 max-w-[150px] truncate" title={row.remark}>{row.remark}</p>}
                            </td>
                            <td className="px-8 py-5 text-right">
                                <button onClick={() => onEdit(row)} className="p-2.5 text-slate-300 hover:text-[#2E7D32] hover:bg-green-50 rounded-xl transition-all">
                                    <Edit3 className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-8 py-20 text-center">
                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No records found for this clinical cycle</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const RegistrationModal = ({ type, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({});
    const list = type === 'OPD' ? DOCTORS_OPD : DOCTORS_RAD;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl overflow-hidden border border-slate-50">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">{type === 'SONO' ? 'RADIOLOGY' : type} <span className="text-[#2E7D32]">New Entry</span></h3>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-7 h-7" /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="grid grid-cols-2 gap-8">
                    <Input label="Patient Name" value={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} required />
                    <Input label="Patient Number" value={formData.num || ''} onChange={v => setFormData({ ...formData, num: v })} required />
                    {type === 'OPD' && <Input label="MRD Number" value={formData.mrd || ''} onChange={v => setFormData({ ...formData, mrd: v })} required />}

                    <Select label="Consulting Doctor" options={list} value={formData.dr || ''} onChange={v => setFormData({ ...formData, dr: v })} required />

                    {type === 'OPD' ? (
                        <>
                            <Select label="CRM Category" options={CRM_CATEGORIES} value={formData.crm || ''} onChange={v => setFormData({ ...formData, crm: v })} />
                            <Input label="Time Allotted By CRM" type="time" value={formData.time || ''} onChange={v => setFormData({ ...formData, time: v })} />
                        </>
                    ) : (
                        <>
                            <Select label="Scan Name" options={SCAN_TYPES} value={formData.scan || ''} onChange={v => setFormData({ ...formData, scan: v })} />
                            <Input label="Scan Time" type="time" value={formData.time || ''} onChange={v => setFormData({ ...formData, time: v })} />
                        </>
                    )}

                    <Select label="Patient Status" options={PATIENT_STATUSES} value={formData.status || ''} onChange={v => setFormData({ ...formData, status: v })} />
                    <div className="col-span-2">
                        <Input label="Remark" value={formData.remark || ''} onChange={v => setFormData({ ...formData, remark: v })} />
                    </div>

                    <div className="col-span-2 pt-6">
                        <button className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-[#2E7D32] transition-all">Submit Registration</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const EditModal = ({ row, type, onClose, onUpdate }) => {
    const [formData, setFormData] = useState(row);
    const list = type === 'SONOGRAPHY' || type === 'RADIOLOGY' ? DOCTORS_RAD : DOCTORS_OPD;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl overflow-hidden border border-slate-50">
                <h3 className="text-2xl font-black tracking-tighter text-slate-800 uppercase mb-10">Modify <span className="text-[#2E7D32]">Clinical Record</span></h3>
                <form onSubmit={(e) => { e.preventDefault(); onUpdate(row.id, formData); }} className="grid grid-cols-2 gap-8">
                    <div className="col-span-2 grid grid-cols-2 gap-8">
                        <Input label="Date" type="date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                        <Input label="Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                    </div>
                    {(type === 'OPD' || row.mrd_number) && <Input label="MRD Number" value={formData.mrd_number} onChange={v => setFormData({ ...formData, mrd_number: v })} />}
                    <Input label="Number" value={formData.number || formData.patient_number} onChange={v => setFormData({ ...formData, number: v })} />

                    {type === 'OPD' ? (
                        <Input label="Time Allotted By CRM" type="time" value={formData.time_alloted} onChange={v => setFormData({ ...formData, time_alloted: v })} />
                    ) : (
                        <Input label="Scan Time" type="time" value={formData.time} onChange={v => setFormData({ ...formData, time: v })} />
                    )}

                    <Select label="Doctor" options={list} value={formData.dr_name} onChange={v => setFormData({ ...formData, dr_name: v })} />
                    <Select label="Status" options={PATIENT_STATUSES} value={formData.status} onChange={v => setFormData({ ...formData, status: v })} />
                    {(type === 'RADIOLOGY' || row.scan_name) && <Select label="Scan Name" options={SCAN_TYPES} value={formData.scan_name} onChange={v => setFormData({ ...formData, scan_name: v })} />}

                    <div className="col-span-2">
                        <Input label="Remark" value={formData.remark} onChange={v => setFormData({ ...formData, remark: v })} />
                    </div>
                    <button className="col-span-2 py-6 bg-[#2E7D32] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                        <Save className="w-5 h-5" /> Save Changes
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const Input = ({ label, onChange, value, type = 'text', ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32]/50 transition-all outline-none font-bold text-slate-700 h-16"
            {...props}
        />
    </div>
);

const Select = ({ label, options, onChange, value, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32]/50 transition-all outline-none font-bold text-slate-700 h-16 appearance-none"
            {...props}
        >
            <option value="">Select Option</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default SheetDashboard;
