import React, { useState, useEffect, useMemo, useRef } from 'react';
import LasikSurvey from './LasikSurvey';
import {
    Search, Edit3, Loader2, RefreshCw, Filter, Plus, Users, Activity, Bed,
    CheckCircle2, AlertCircle, X, Save, LogOut, Hospital, ChevronRight,
    User, ClipboardList, Stethoscope, Scan, TrendingUp, BarChart3,
    Calendar, Layers, Download, Globe, Heart, Award, Trophy, Smile,
    TrendingDown, Menu
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

const NavItem = ({ icon, label, active, onClick, dot }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${active ? 'bg-[#2E7D32]/5 text-[#2E7D32]' : 'hover:bg-slate-50 text-slate-600'}`}>
        {icon && <span className={`transition-colors ${active ? 'text-[#2E7D32]' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>}
        {dot && <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#2E7D32]' : 'bg-slate-200'}`} />}
        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-[#2E7D32]' : 'text-slate-500 group-hover:text-slate-800'}`}>{label}</span>
    </button>
);

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex items-center gap-6 group hover:translate-y-[-2px] transition-all duration-300 shadow-sm shadow-slate-100">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>{React.cloneElement(icon, { size: 28 })}</div>
        <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{label}</p><p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p></div>
    </div>
);

const Input = ({ label, onChange, value, type = 'text', ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none font-bold text-slate-700 h-16" {...props} />
    </div>
);

const Select = ({ label, options, onChange, value, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none font-bold text-slate-700 h-16 appearance-none" {...props}>
            <option value="">Select Option</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const DataTable = ({ data, type, onEdit }) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
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
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{formatDateReadable(row.date)}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <p className="text-sm font-black text-slate-600">{row.number || row.patient_number}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {row.crm && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">{row.crm}</span>}
                                    {row.scan_name && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">{row.scan_name}</span>}
                                    {(row.time_alloted || row.time) && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">Time: {formatTimeToAMPM(row.time_alloted || row.time)}</span>}
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg w-fit text-slate-700 font-black text-[10px] uppercase"><User size={14} className="text-slate-400" /> {row.dr_name}</div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${row.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{row.status}</span>
                            </td>
                            <td className="px-8 py-5 text-right"><button onClick={() => onEdit(row)} className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 className="w-5 h-5" /></button></td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No matching clinical records found</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const SmileAwardStats = ({ stats, winners, selectedMonth, onMonthChange }) => {
    const filteredStats = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        return (stats.all || []).filter(s => {
            const m = (s.month || "").trim().toLowerCase();
            return m === target || m.includes(target);
        });
    }, [stats.all, selectedMonth]);

    const approvedWinners = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        return winners.filter(w => (w.month || "").trim().toLowerCase() === target);
    }, [winners, selectedMonth]);

    const months = useMemo(() => {
        const set = new Set((stats.all || []).map(s => (s.month || "").trim()));
        set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        return Array.from(set).filter(Boolean).sort((a,b) => new Date(b) - new Date(a));
    }, [stats.all]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Excellence <span className="text-emerald-600">Leaderboard</span></h2><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Celebrating our workplace stars</p></div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100"><Calendar size={18} className="text-slate-400 ml-2" /><select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs uppercase tracking-widest text-slate-600 cursor-pointer pr-8">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            {approvedWinners.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedWinners.map((winner, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-slate-200">
                            <Trophy className="absolute bottom-6 right-6 text-emerald-500/20 group-hover:scale-110 transition-transform" size={80} />
                            <div className="relative z-10"><span className="inline-block px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">Official Winner</span><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{winner.department}</p><h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{winner.employee_name}</h3><div className="flex items-center gap-4 text-slate-400"><div className="flex flex-col"><span className="text-2xl font-black text-emerald-400 leading-none">{winner.votes}</span><span className="text-[8px] font-black uppercase tracking-tighter">Total Votes</span></div><div className="w-px h-8 bg-slate-800" /><span className="text-[10px] font-bold italic">{winner.month}</span></div></div>
                        </motion.div>
                    ))}
                </div>
            )}
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white"><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Award className="text-emerald-600" /> Standings for {selectedMonth}</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-400"><th className="px-8 py-5">Rank</th><th className="px-8 py-5">Staff Member</th><th className="px-8 py-5">Department</th><th className="px-8 py-5 text-right">Votes</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStats.map((entry, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{i+1}</div></td>
                                    <td className="px-8 py-6 font-bold text-slate-700">{entry.name}</td>
                                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.dept}</td>
                                    <td className="px-8 py-6 text-right"><span className={`px-4 py-2 rounded-xl text-[10px] font-black ${i === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-600'}`}>{entry.votes}</span></td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && <tr><td colSpan="4" className="px-8 py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No data records found for {selectedMonth}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HRApprovalPanel = ({ stats, winners, onApprove }) => {
    const [submitting, setSubmitting] = useState(false);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const now = new Date();
    const currentMonthLabel = months[now.getMonth()].toLowerCase();
    const currentYearLabel = now.getFullYear().toString();
    
    // Exact filter: Check if row month contains current month and year
    const candidates = (stats.all || []).filter(c => {
        const m = (c.month || "").trim().toLowerCase();
        return m.includes(currentMonthLabel) && m.includes(currentYearLabel);
    });

    const isWinnerApproved = (name, month) => {
        return (winners || []).some(w => 
            (w.employee_name || "").toLowerCase() === (name || "").toLowerCase() && 
            (w.month || "").toLowerCase().includes(currentMonthLabel)
        );
    };
    return (
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-slate-100 animate-in fade-in slide-in-from-bottom-5">
            <div className="mb-10"><h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">HR <span className="text-rose-600">Approval Panel</span></h2><p className="text-[10px] font-black text-slate-400 uppercase mt-1">Approve winners to trigger automated recognition</p></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50"><th className="pb-5 px-2">Candidate</th><th className="pb-5 px-2">Dept</th><th className="pb-5 px-2">Votes</th><th className="pb-5 px-2 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {candidates.length === 0 && stats.all && stats.all.length > 0 && (
                            <tr>
                                <td colSpan="4" className="py-10 text-center bg-rose-50 rounded-xl">
                                    <p className="text-[10px] font-black text-rose-600 uppercase mb-2">Notice: {stats.all.length} entries found, but none match "{currentMonthLabel} {currentYearLabel}"</p>
                                    <p className="text-[9px] text-slate-400 font-bold">Latest in Sheet: {(stats.all[0]?.month || "None")}</p>
                                </td>
                            </tr>
                        )}
                        {candidates.map((c, i) => {
                            const isApproved = isWinnerApproved(c.name, c.month);
                            return (
                                <tr key={i} className="group">
                                    <td className="py-6 px-2 font-bold text-slate-700">{c.name}</td>
                                    <td className="py-6 px-2 text-[10px] font-black uppercase text-slate-400">{c.dept}</td>
                                    <td className="py-6 px-2 font-black text-slate-900">{c.votes}</td>
                                    <td className="py-6 px-2 text-right">
                                        {isApproved ? (<span className="inline-flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest"><CheckCircle2 size={16} /> Approved</span>) : (
                                            <button disabled={submitting === c.name} onClick={async () => { setSubmitting(c.name); try { await onApprove(c); } finally { setSubmitting(false); } }} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50">{submitting === c.name ? '...' : 'Approve Winner'}</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {(stats.all || []).length === 0 && <tr><td colSpan="4" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase">No data received from Cloud. Please check if you have run "setupSheets" in Apps Script.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PrintQRSection = () => {
    const nominationUrl = `${window.location.origin}${window.location.pathname}?mode=smile_award`;
    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[3rem] p-12 border-4 border-slate-50 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="mb-10"><h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Registration <span className="text-emerald-600">QR CODE</span></h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Print and place for instant feedback/voting</p></div>
                <div className="p-10 bg-slate-50 rounded-[2rem] inline-block mb-10 border-2 border-emerald-50 relative group">
                    <QRCodeSVG id="dashboard-qr" value={nominationUrl} size={280} level="H" includeMargin={true} />
                </div>
                <div className="space-y-6">
                    <div className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-mono break-all opacity-80 select-all underline decoration-emerald-500">{nominationUrl}</div>
                    <button onClick={() => downloadSvgAsPng(document.getElementById('dashboard-qr'))} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"><Download size={18} /> Download QR PNG</button>
                    <button onClick={() => window.print()} className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Print Page</button>
                </div>
            </div>
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {!isPublic && (
                <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 transition-all duration-300 w-64 shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-8 border-b border-slate-50 flex flex-col items-center"><img src="/logo.png" className="h-20 mb-2" /><h1 className="text-xl font-black text-slate-900 uppercase">SBH Hospital</h1></div>
                    <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                        <NavItem icon={<BarChart3 size={18}/>} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
                        
                        {user === 'SBH' && (
                            <>
                                <p className="px-4 pt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Management</p>
                                <NavItem label="OPD Records" active={activeTab === 'OPD'} onClick={() => setActiveTab('OPD')} dot />
                                <NavItem label="Radiology" active={activeTab === 'RADIOLOGY'} onClick={() => setActiveTab('RADIOLOGY')} dot />
                            </>
                        )}

                        <p className="px-4 pt-4 text-[9px] font-black text-[#BE123C] uppercase tracking-widest">Smile Award System</p>
                        <NavItem icon={<Heart size={18}/>} label="Nominate Staff" active={activeTab === 'SMILE_AWARD'} onClick={() => setActiveTab('SMILE_AWARD')} />
                        <NavItem icon={<Trophy size={18}/>} label="Leaderboard" active={activeTab === 'SMILE_STATS'} onClick={() => setActiveTab('SMILE_STATS')} />
                        {(user === 'SBH' || user === 'HR') && (
                            <NavItem icon={<CheckCircle2 size={18}/>} label="HR Approval Portal" active={activeTab === 'HR_PANEL'} onClick={() => setActiveTab('HR_PANEL')} />
                        )}
                        {user === 'SBH' && <NavItem icon={<Scan size={18}/>} label="QR Station" active={activeTab === 'PRINT_QR'} onClick={() => setActiveTab('PRINT_QR')} />}
                    </div>
                    <div className="p-6 border-t border-slate-50"><button onClick={onLogout} className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase transition-colors"><LogOut size={16} /> Logout</button></div>
                </aside>
            )}
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-40 lg:ml-64">
                    <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-slate-900 text-white rounded-lg"><Menu size={20} /></button><h1 className="text-sm font-black text-slate-900 uppercase">{activeTab.replace(/_/g, ' ')}</h1></div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"><Calendar size={14} className="text-emerald-600" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-[10px] font-black tracking-widest text-slate-600 outline-none" /></div>
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && <button onClick={() => { setFormType(activeTab === 'RADIOLOGY' ? 'SONO' : 'OPD'); setShowForm(true); }} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-emerald-100">+ New Registry</button>}
                    </div>
                </header>
                <main className={`flex-1 p-6 lg:p-10 ${isPublic ? '' : 'lg:ml-64'} max-w-[1200px] mx-auto w-full`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard icon={<Users />} label="OPD Patients" value={opdData.length} color="bg-emerald-600" />
                                    <StatCard icon={<Scan />} label="Radiology" value={sonoData.length} color="bg-slate-800" />
                                    <StatCard icon={<Heart />} label="Smile Votes" value={smileStats.all.length} color="bg-rose-500" />
                                </div>
                            </div>
                        )}
                        {activeTab === 'SMILE_AWARD' && <SmileAwardForm key="smile-award" onSubmissionSuccess={() => setTimeout(fetchData, 2000)} />}
                        {activeTab === 'SMILE_STATS' && <SmileAwardStats stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
                        {activeTab === 'HR_PANEL' && <HRApprovalPanel stats={smileStats} winners={smileWinnersList} onApprove={async(d)=> { await fetch(smileScriptUrl,{method:'POST',mode:'no-cors',body:JSON.stringify({action:'approve_winner',...d})}); fetchData(); }} />}
                        {activeTab === 'PRINT_QR' && <PrintQRSection />}
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && <DataTable data={activeTab === 'RADIOLOGY' ? sonoData : opdData} type={activeTab} onEdit={setEditingRow} />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey isPublic={true} />}
                    </AnimatePresence>
                </main>
            </div>
            {loading && <div className="fixed bottom-6 right-6 z-[100] bg-white border border-emerald-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in"><Loader2 size={16} className="text-emerald-500 animate-spin" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-800">Syncing Cloud...</span></div>}
        </div>
    );
};

export default SheetDashboard;
