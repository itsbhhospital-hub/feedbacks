import React, { useState, useEffect, useMemo, useRef } from 'react';
import LasikSurvey from './LasikSurvey';
import {
    Search, Edit3, Loader2, RefreshCw, Filter, Plus, Users, Activity, Bed,
    CheckCircle2, AlertCircle, X, Save, LogOut, Hospital, ChevronRight,
    User, ClipboardList, Stethoscope, Scan, TrendingUp, BarChart3,
    Calendar, Layers, Download, Globe, Heart, Award, Trophy, Smile,
    TrendingDown, Menu, MapPin, Sparkles, Briefcase
} from 'lucide-react';
import SmileAwardForm from './SmileAwardForm';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILS ---
const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return '';
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
    } catch (e) { return timeStr; }
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
};

const downloadSvgAsPng = (svg, filename = "SBH_QR_Code.png") => {
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        canvas.width = 500; canvas.height = 500; ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 50, 50, 400, 400);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a"); 
        downloadLink.download = filename; 
        downloadLink.href = pngFile; 
        downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, dot, variant = 'primary' }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all group relative overflow-hidden ${active ? (variant === 'primary' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20') : 'hover:bg-slate-50 text-slate-500'}`}>
        {icon && <span className={`transition-all ${active ? 'scale-110' : 'group-hover:text-slate-800'}`}>{icon}</span>}
        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-500/80 group-hover:text-slate-900 font-bold'}`}>{label}</span>
        {active && <motion.div layoutId="nav-pill" className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />}
    </button>
);

const SectionLoader = ({ message = "Syncing with cloud..." }) => (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="relative">
            <Loader2 className="animate-spin text-emerald-500" size={40} strokeWidth={1.5} />
            <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">{message}</p>
    </div>
);

const Footer = () => (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white py-3.5 px-6 flex items-center justify-center gap-3 z-[100] border-t-2 border-[#F57C00] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F57C00] group">Naman Mishra</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-700" />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">© 2026 Hospital Management System</p>
    </footer>
);

const StatCard = ({ icon, label, value, color, gradient }) => (
    <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500 shadow-sm relative overflow-hidden">
        <div className={`absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-125 transition-all duration-700`}>{React.cloneElement(icon, { size: 120 })}</div>
        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl ${gradient || color}`}>{React.cloneElement(icon, { size: 30 })}</div>
        <div className="relative z-10"><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">{label}</p><p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p></div>
    </div>
);

const SmileAwardStats = ({ stats, winners, selectedMonth, onMonthChange, loading }) => {
    const filteredStats = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        return (stats.all || []).filter(s => {
            const m = (s.month || "").trim().toLowerCase();
            return m === target || m.includes(target);
        });
    }, [stats.all, selectedMonth]);

    const approvedWinners = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        return (winners || []).filter(w => (w.month || "").trim().toLowerCase().includes(target));
    }, [winners, selectedMonth]);

    const months = useMemo(() => {
        const set = new Set((stats.all || []).map(s => (s.month || "").trim()));
        set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        return Array.from(set).filter(Boolean).sort((a,b) => new Date(b) - new Date(a));
    }, [stats.all]);

    if (loading) return <SectionLoader message="Syncing leaderboard..." />;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">Excellence <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Stars</span></h2>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Honoring our department champions</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 min-w-[200px]">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><Calendar size={20} /></div>
                    <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer">{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {approvedWinners.map((winner, idx) => (
                    <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="bg-slate-900 rounded-[3rem] p-9 relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full group-hover:scale-125 transition-transform duration-700" />
                        <Sparkles className="absolute -left-4 -top-4 text-orange-400/20 group-hover:rotate-12 transition-transform" size={100} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/30">Department Champion</span>
                            </div>
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">{winner.department}</p>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 leading-tight">{winner.employee_name}</h3>
                            <div className="flex items-center justify-between items-end border-t border-slate-800 pt-6">
                                <div><p className="text-3xl font-black text-white leading-none mb-1">{winner.votes}</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total Votes</p></div>
                                <div className="text-right text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{winner.month}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {approvedWinners.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                        <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Winners for this month have not been announced yet.</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50"><h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4"><Activity className="text-emerald-600" size={18} /> Detailed Standings</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white"><th className="px-10 py-6">Rank</th><th className="px-10 py-6 font-bold">Staff Member</th><th className="px-10 py-6">Department</th><th className="px-10 py-6 text-right">Votes</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStats.map((entry, i) => (
                                <tr key={i} className="hover:bg-emerald-50/30 transition-all group">
                                    <td className="px-10 py-7"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${i === 0 ? 'bg-orange-100 text-orange-700 shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>{i+1}</div></td>
                                    <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-[11px] leading-tight mb-1">{entry.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Nominated Professional</p></div></td>
                                    <td className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{entry.dept}</td>
                                    <td className="px-10 py-7 text-right"><span className={`inline-block px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all ${i === 0 ? 'bg-orange-600 text-white shadow-xl shadow-orange-200' : 'bg-slate-100 text-slate-600'}`}>{entry.votes} <span className="text-[8px] opacity-60 ml-0.5">VOTES</span></span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HRApprovalPanel = ({ stats, winners, onApprove, loading }) => {
    const [submitting, setSubmitting] = useState(false);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    const currentMonthLabel = months[now.getMonth()].toLowerCase();
    const currentYearLabel = now.getFullYear().toString();
    
    if (loading) return <SectionLoader message="Loading nominations for review..." />;

    const groupedData = (stats.all || []).filter(c => {
        let m = (c.month || "").trim();
        if (m.includes('T') && m.endsWith('Z')) {
            try { const d = new Date(m); m = months[d.getUTCMonth()] + " " + d.getUTCFullYear(); } catch(e) {}
        }
        return m.toLowerCase().includes(currentMonthLabel) && m.toLowerCase().includes(currentYearLabel);
    }).reduce((acc, curr) => {
        const dept = curr.dept || 'General';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(curr);
        return acc;
    }, {});

    const isWinnerApproved = (name, dept) => {
        return (winners || []).some(w => 
            (w.employee_name || "").toLowerCase() === (name || "").toLowerCase() && 
            (w.department || "").toLowerCase() === (dept || "").toLowerCase() &&
            (w.month || "").toLowerCase().includes(currentMonthLabel)
        );
    };

    const handleApproved = async (candidate) => {
        setSubmitting(candidate.name);
        try {
            await onApprove(candidate);
            alert(`Approved ${candidate.name} as Star of the Month for ${candidate.dept}!`);
        } catch(e) { alert("Approval failed. Please try again."); }
        setSubmitting(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1">
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Approval <span className="text-orange-600">Portal</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Select and approve one champion per department</p>
            </div>

            {Object.keys(groupedData).length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No pending nominations found in cloud</p>
                </div>
            ) : Object.entries(groupedData).map(([dept, candidates]) => (
                <div key={dept} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
                    <div className="px-10 py-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20"><Briefcase size={20} /></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Department</p><p className="text-xl font-black text-slate-800 uppercase tracking-tight">{dept}</p></div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest">{candidates.length} Nominees</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {candidates.map((c, i) => {
                                    const approved = isWinnerApproved(c.name, c.dept);
                                    return (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-xs leading-none mb-1">{c.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{c.votes} Overall Votes</p></div></td>
                                            <td className="px-10 py-7 text-right">
                                                {approved ? (
                                                    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest"><CheckCircle2 size={16} /> Already Approved</div>
                                                ) : (
                                                    <button disabled={submitting === c.name} onClick={() => handleApproved(c)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-200 transition-all disabled:opacity-50">
                                                        {submitting === c.name ? "Processing..." : "Approve as Star"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---

const SheetDashboard = ({ user, onLogout, isPublic, publicType }) => {
    const [activeTab, setActiveTab] = useState(() => (isPublic ? (publicType === 'smile_award' ? 'SMILE_AWARD' : 'LASIK_FORM') : 'DASHBOARD'));
    const [opdData, setOpdData] = useState([]);
    const [sonoData, setSonoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingRow, setEditingRow] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('OPD');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [smileStats, setSmileStats] = useState({ all: [] });
    const [smileWinnersList, setSmileWinnersList] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx9ZM4dSz8Yu3jmuVhWWgBdxCuUjeNRF7WXEio_hhs6JFfHvktAFraoy7Mtar6sL3c/exec';
    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbwEKRvMvdVa8xNHs4SYG0i4wtRn1FYqsH9NoKBzA-gKFY1W3uspV_sqdShW075OIa-q4A/exec';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [opd, sono, leaderboard, winners] = await Promise.all([
                fetch(`${scriptUrl}?sheet=OPD_Records&date=${selectedDate}`).then(r => r.json()),
                fetch(`${scriptUrl}?sheet=SONO_Records&date=${selectedDate}`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_leaderboard`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_winners`).then(r => r.json())
            ]);
            setOpdData(opd || []);
            setSonoData(sono || []);
            setSmileStats({ all: Array.isArray(leaderboard) ? leaderboard : [] });
            setSmileWinnersList(Array.isArray(winners) ? winners : []);
        } catch (err) { console.error('Fetch error:', err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden">
            {!isPublic && (
                <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 transition-all duration-500 w-72 shadow-[20px_0_50px_rgba(0,0,0,0.02)] flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-10 border-b border-slate-50 flex flex-col items-center group relative cursor-pointer overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <img src="/logo.png" className="h-20 mb-3 relative z-10 drop-shadow-lg" />
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter relative z-10">SBH <span className="text-emerald-600">Hospital</span></h1>
                    </div>
                    <div className="p-6 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                        <NavItem icon={<BarChart3 size={18}/>} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => handleNavClick('DASHBOARD')} />
                        
                        {user === 'SBH' && (
                            <>
                                <p className="px-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Management</p>
                                <div className="space-y-2">
                                    <NavItem label="OPD Records" active={activeTab === 'OPD'} onClick={() => handleNavClick('OPD')} dot />
                                    <NavItem label="Radiology" active={activeTab === 'RADIOLOGY'} onClick={() => handleNavClick('RADIOLOGY')} dot />
                                </div>
                            </>
                        )}

                        <p className="px-5 text-[9px] font-black text-orange-400 uppercase tracking-[0.3em]">Smile Award System</p>
                        <div className="space-y-2">
                            <NavItem icon={<Award size={18}/>} label="Nominate Staff" active={activeTab === 'SMILE_AWARD'} onClick={() => handleNavClick('SMILE_AWARD')} variant="orange" />
                            <NavItem icon={<Trophy size={18}/>} label="Leaderboard" active={activeTab === 'SMILE_STATS'} onClick={() => handleNavClick('SMILE_STATS')} variant="orange" />
                            {(user === 'SBH' || user === 'HR') && (
                                <NavItem icon={<CheckCircle2 size={18}/>} label="Approval Portal" active={activeTab === 'HR_PANEL'} onClick={() => handleNavClick('HR_PANEL')} variant="orange" />
                            )}
                            {user === 'SBH' && <NavItem icon={<Scan size={18}/>} label="QR Station" active={activeTab === 'PRINT_QR'} onClick={() => handleNavClick('PRINT_QR')} variant="orange" />}
                        </div>
                    </div>
                    <div className="p-8 border-t border-slate-50 bg-slate-50/50"><button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase transition-all hover:bg-rose-500 hover:text-white shadow-sm active:scale-95"><LogOut size={16} /> Logout Securely</button></div>
                </aside>
            )}
            <div className="flex-1 flex flex-col pb-20">
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40 lg:ml-72 shadow-sm">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-3 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl shadow-lg shadow-orange-500/30 active:scale-90 transition-all"><Menu size={24} /></button>
                        <div><h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab.replace(/_/g, ' ')}</h1><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hospital Management System</p></div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-3 bg-slate-100 hover:bg-slate-200 transition-colors rounded-2xl px-6 py-3 cursor-pointer group">
                            <Calendar size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-[10px] font-black tracking-widest text-slate-600 outline-none uppercase cursor-pointer" />
                        </div>
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && (
                            <button onClick={() => { setFormType(activeTab === 'RADIOLOGY' ? 'SONO' : 'OPD'); setShowForm(true); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all">+ Add New Entry</button>
                        )}
                    </div>
                </header>
                <main className={`flex-1 p-8 lg:p-14 ${isPublic ? '' : 'lg:ml-72'} max-w-[1400px] mx-auto w-full`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-12 animate-in fade-in duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <StatCard icon={<Users />} label="OPD Patients" value={opdData.length} color="bg-emerald-600" gradient="bg-gradient-to-br from-emerald-600 to-teal-500" />
                                    <StatCard icon={<Scan />} label="Radiology" value={sonoData.length} color="bg-slate-800" gradient="bg-gradient-to-br from-slate-900 to-slate-800" />
                                    <StatCard icon={<Heart />} label="Smile Votes" value={smileStats.all.length} color="bg-orange-500" gradient="bg-gradient-to-br from-orange-600 to-amber-500" />
                                </div>
                            </div>
                        )}
                        {activeTab === 'SMILE_AWARD' && <SmileAwardForm key="smile-award" onSubmissionSuccess={() => setTimeout(fetchData, 2000)} />}
                        {activeTab === 'SMILE_STATS' && <SmileAwardStats stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} />}
                        {activeTab === 'HR_PANEL' && <HRApprovalPanel stats={smileStats} winners={smileWinnersList} onApprove={async(d)=> { await fetch(smileScriptUrl,{method:'POST',mode:'no-cors',body:JSON.stringify({action:'approve_winner',...d})}); fetchData(); }} loading={loading} />}
                        {activeTab === 'PRINT_QR' && <PrintQRSection />}
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && <DataTable data={activeTab === 'RADIOLOGY' ? sonoData : opdData} type={activeTab} onEdit={setEditingRow} />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey isPublic={true} />}
                    </AnimatePresence>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default SheetDashboard;
