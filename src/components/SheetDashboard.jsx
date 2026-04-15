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

// --- CONSTANTS ---
const DOCTORS_OPD = [
    'DR.SNIGDHA', 'DR.MINAKSHI', 'DR.MADHURI', 'DR.RICHA',
    'DR.HEMALI', 'DR.SWATI MAHOBIA', 'DR. Neha Nupoor'
];
const DOCTORS_RAD = ['DR.MAYANK', 'DR.SWATI BHUSHAN'];
const CRM_CATEGORIES = ['USG', 'FOLLICULAR', 'ADMISSION', 'REPORT', 'RE-VISIT', 'FOLLOW UP', 'NEW VISIT'];
const PATIENT_STATUSES = ['ARRIVED', 'VIP', 'CANCEL', 'Rescheduled'];
const SCAN_TYPES = ['AFI SCREENING', 'ECHO', 'PELVIS', 'ANAMOLY SCAN', 'NT SCAN', 'COLOUR DOPPLER', 'OBS RUTINE'];

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

// --- HELPER COMPONENTS ---

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

const StatCard = ({ icon, label, value, color }) => (
    <div className="medical-card p-6 flex items-center gap-6 group hover:translate-y-[-2px] transition-all duration-300">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{label}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
        </div>
    </div>
);

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

const SmileAwardStats = ({ stats, winners, selectedMonth, onMonthChange }) => {
    const filteredStats = useMemo(() => (stats.all || []).filter(s => s.month === selectedMonth), [stats.all, selectedMonth]);
    const approvedWinners = useMemo(() => winners.filter(w => w.month === selectedMonth), [winners, selectedMonth]);
    const months = useMemo(() => {
        const set = new Set((stats.all || []).map(s => s.month));
        set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        return Array.from(set).sort((a,b) => new Date(b) - new Date(a));
    }, [stats.all]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Excellence <span className="text-emerald-600">Leaderboard</span></h2>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Celebrating our workplace stars</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Calendar size={18} className="text-slate-400 ml-2" />
                    <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs uppercase tracking-widest text-slate-600 cursor-pointer pr-8">
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            {approvedWinners.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedWinners.map((winner, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-slate-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10" />
                            <Trophy className="absolute bottom-6 right-6 text-emerald-500/20 group-hover:scale-110 transition-transform" size={80} />
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">Official Winner</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{winner.department}</p>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{winner.employee_name}</h3>
                                <div className="flex items-center gap-4 text-slate-400">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-emerald-400 leading-none">{winner.votes}</span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Total Votes</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-800" />
                                    <span className="text-[10px] font-bold italic">{winner.month}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            <div className="medical-card overflow-hidden border border-slate-100">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Award className="text-emerald-600" /> Standings for {selectedMonth}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-8 py-5">Rank</th>
                                <th className="px-8 py-5">Staff Member</th>
                                <th className="px-8 py-5">Department</th>
                                <th className="px-8 py-5 text-right">Votes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStats.map((entry, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{i+1}</div></td>
                                    <td className="px-8 py-6 font-bold text-slate-700">{entry.name}</td>
                                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.dept}</td>
                                    <td className="px-8 py-6 text-right"><span className={`px-4 py-2 rounded-xl text-[10px] font-black ${i === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-600'}`}>{entry.votes}</span></td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && (
                                <tr><td colSpan="4" className="px-8 py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No data records found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HRApprovalPanel = ({ stats, winners, staffList, onApprove }) => {
    const [submitting, setSubmitting] = useState(false);
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const candidates = (stats.all || []).filter(c => c.month === currentMonth);
    const handleApprove = async (candidate) => {
        setSubmitting(candidate.name);
        const staff = staffList.find(s => s.Name === candidate.name);
        try {
            await onApprove({ ...candidate, email: staff?.Email, mobile: staff?.Mobile });
            alert('Winner Approved Successfully! Automation Triggered.');
        } catch (e) { alert('Error approving winner.'); }
        finally { setSubmitting(false); }
    };
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">HR <span className="text-[#c2410c]">Approval Panel</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Approve current month winners to trigger notifications</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <th className="pb-4 px-2">Candidate</th><th className="pb-4 px-2">Dept</th><th className="pb-4 px-2">Votes</th><th className="pb-4 px-2 text-right">Action</th>
                        </tr>
                        {candidates.map((c, i) => {
                            const isApproved = winners.some(w => w.employee_name === c.name && w.month === c.month);
                            return (
                                <tr key={i} className="border-b border-slate-50">
                                    <td className="py-5 px-2 font-bold text-slate-700">{c.name}</td>
                                    <td className="py-5 px-2 text-[10px] font-black uppercase text-slate-400">{c.dept}</td>
                                    <td className="py-5 px-2 font-black text-slate-900">{c.votes}</td>
                                    <td className="py-5 px-2 text-right">
                                        {isApproved ? (<span className="inline-flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest"><CheckCircle2 size={14} /> Approved</span>) : (
                                            <button disabled={submitting === c.name} onClick={() => handleApprove(c)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50">{submitting === c.name ? '...' : 'Approve ✅'}</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </table>
                </div>
            </div>
        </div>
    );
};

const PrintQRSection = () => {
    const nominationUrl = `${window.location.origin}${window.location.pathname}?mode=smile_award`;
    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[3rem] p-12 border-4 border-slate-50 text-center shadow-2xl shadow-slate-200 overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Smile Form <span className="text-emerald-600">QR CODE</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Print this QR and place it at Reception / OPD <br /> to allow staff to vote instantly</p>
                </div>
                <div className="p-10 bg-slate-50 rounded-[2rem] inline-block mb-10 border-2 border-emerald-50 relative group">
                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-transparent transition-all pointer-events-none" />
                    <QRCodeSVG value={nominationUrl} size={280} level="H" includeMargin={true} />
                </div>
                <div className="space-y-6">
                    <div className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-mono break-all opacity-80 select-all">{nominationUrl}</div>
                    <button onClick={() => window.print()} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"><Download size={18} /> Download / Print QR</button>
                </div>
            </div>
            <div className="text-center p-8 bg-amber-50 rounded-[2rem] border border-amber-100 border-dashed"><p className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] leading-relaxed">Instructions: Users will be directly taken to the <br /> Smile Award Nomination Form when scanned.</p></div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const SheetDashboard = ({ user, onLogout, isPublic, publicType }) => {
    const [activeTab, setActiveTab] = useState(() => {
        if (!isPublic) return 'DASHBOARD';
        return publicType === 'smile_award' ? 'SMILE_AWARD' : 'LASIK_FORM';
    });
    const [expandedMenus, setExpandedMenus] = useState(['IPD_OPD', 'LASIK']);
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [smileStats, setSmileStats] = useState({ winners: [], all: [] });
    const [smileWinnersList, setSmileWinnersList] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    const [staffList, setStaffList] = useState([]);

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx9ZM4dSz8Yu3jmuVhWWgBdxCuUjeNRF7WXEio_hhs6JFfHvktAFraoy7Mtar6sL3c/exec';
    const lasikScriptUrl = 'https://script.google.com/macros/s/AKfycbxuFDz3LDBM88Wy-7naDgffvXQ0hH37-EMQhJuMcUId40PNG5yX_PFZLyXXiGYMB0zQ/exec';
    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbwEKRvMvdVa8xNHs4SYG0i4wtRn1FYqsH9NoKBzA-gKFY1W3uspV_sqdShW075OIa-q4A/exec';

    const handleDownloadQR = () => {
        const svg = document.getElementById('lasik-qr');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = 500; canvas.height = 500; ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 50, 50, 400, 400);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a"); downloadLink.download = "SBH_Lasik_Registration_QR.png"; downloadLink.href = pngFile; downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const toggleMenu = (menu) => setExpandedMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fetchSheetData = async (name) => {
                const response = await fetch(`${scriptUrl}?sheet=${name}&date=${selectedDate}`);
                return await response.json();
            };

            const [opd, sono, targetData, lasikRes] = await Promise.all([
                fetchSheetData('OPD_Records'), fetchSheetData('SONO_Records'), fetchSheetData('Targets'), fetch(lasikScriptUrl).then(r => r.json())
            ]);

            setOpdData(opd || []);
            setSonoData(sono || []);
            setTargets(targetData || []);
            
            const submissions = Array.isArray(lasikRes) ? lasikRes : (lasikRes && lasikRes.value ? lasikRes.value : []);
            setLasikSubmissions(submissions.map(e => ({
                ...e, name: e.name || e.patient_name || 'Empty', phone_no: e.phone_no || e.phone || e.mobile || 'N/A', timestamp: e.timestamp || e.date || new Date()
            })));

            const [leaderboard, winners, staff] = await Promise.all([
                fetch(`${smileScriptUrl}?action=get_leaderboard`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_winners`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_staff`).then(r => r.json())
            ]);
            setSmileStats({ all: Array.isArray(leaderboard) ? leaderboard : [] });
            setSmileWinnersList(Array.isArray(winners) ? winners : []);
            setStaffList(Array.isArray(staff) ? staff : []);
        } catch (err) { console.error('Fetch error:', err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const handleFormSubmit = async (formData) => {
        setLoading(true);
        try {
            const rowArray = formType === 'OPD' ? [formData.name, formData.mrd, formData.num, formData.dr, formData.num, formData.crm, formData.time, formData.status, formData.remark] : [formData.name, formData.num, formData.dr, formData.scan, formData.time, formData.status, formData.remark];
            await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'register', sheet: formType === 'OPD' ? 'OPD_Records' : 'SONO_Records', data: rowArray }) });
            setTimeout(fetchData, 1500);
            setShowForm(false);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleUpdate = async (id, updatedData) => {
        setLoading(true);
        try {
            const rowArray = activeTab === 'OPD' ? [updatedData.date, updatedData.name, updatedData.mrd_number, updatedData.number, updatedData.dr_name, updatedData.number, updatedData.crm, updatedData.time_alloted, updatedData.status, updatedData.remark] : [updatedData.date, updatedData.name, updatedData.number, updatedData.dr_name, updatedData.scan_name, updatedData.time, updatedData.status, updatedData.remark];
            await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'update', sheet: activeTab === 'RADIOLOGY' ? 'SONO_Records' : 'OPD_Records', id, data: rowArray }) });
            setTimeout(fetchData, 1500);
            setEditingRow(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {!isPublic && (
                <>
                    <AnimatePresence>{isSidebarOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden" />)}</AnimatePresence>
                    <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 transition-all duration-300 w-64 shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        <div className="p-8 border-b border-slate-50 flex flex-col items-center justify-center bg-white gap-2">
                            <img src="/logo.png" alt="SBH Logo" className="h-20 object-contain mb-2" />
                            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">SBH Hospital</h1>
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Registry</span></div>
                        </div>
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                            <div className="space-y-1"><p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Main Menu</p><NavItem icon={<BarChart3 size={18}/>} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} /></div>
                            <div className="space-y-1">
                                <button onClick={() => toggleMenu('IPD_OPD')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"><div className="flex items-center gap-3"><Stethoscope size={18} className="text-slate-400 group-hover:text-[#2E7D32]"/><span className="text-[11px] font-black uppercase tracking-wider">IPD & OPD</span></div><ChevronRight size={14} className={`transition-transform opacity-50 ${expandedMenus.includes('IPD_OPD') ? 'rotate-90' : ''}`} /></button>
                                <AnimatePresence>{expandedMenus.includes('IPD_OPD') && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-8 space-y-1"><NavItem label="OPD Records" active={activeTab === 'OPD'} onClick={() => setActiveTab('OPD')} dot /><NavItem label="Radiology" active={activeTab === 'RADIOLOGY'} onClick={() => setActiveTab('RADIOLOGY')} dot />{user === 'SBH' && <NavItem label="Daily Targets" active={activeTab === 'TARGETS'} onClick={() => setActiveTab('TARGETS')} dot />}</motion.div>)}</AnimatePresence>
                            </div>
                            <div className="space-y-1">
                                <button onClick={() => toggleMenu('LASIK')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"><div className="flex items-center gap-3"><Activity size={18} className="text-slate-400 group-hover:text-[#2E7D32]"/><span className="text-[11px] font-black uppercase tracking-wider">Lasik Vision</span></div><ChevronRight size={14} className={`transition-transform opacity-50 ${expandedMenus.includes('LASIK') ? 'rotate-90' : ''}`} /></button>
                                <AnimatePresence>{expandedMenus.includes('LASIK') && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-8 space-y-1"><NavItem label="New Registration" active={activeTab === 'LASIK_FORM'} onClick={() => setActiveTab('LASIK_FORM')} dot /><NavItem label="LASIK Dashboard" active={activeTab === 'LASIK_STATS'} onClick={() => setActiveTab('LASIK_STATS')} dot /></motion.div>)}</AnimatePresence>
                            </div>
                            <div className="space-y-1">
                                <button onClick={() => toggleMenu('SMILE')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"><div className="flex items-center gap-3"><Heart size={18} className="text-slate-400 group-hover:text-rose-500"/><span className="text-[11px] font-black uppercase tracking-wider">Smile Award</span></div><ChevronRight size={14} className={`transition-transform opacity-50 ${expandedMenus.includes('SMILE') ? 'rotate-90' : ''}`} /></button>
                                <AnimatePresence>{expandedMenus.includes('SMILE') && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-8 space-y-1"><NavItem label="Nominate Staff" active={activeTab === 'SMILE_AWARD'} onClick={() => setActiveTab('SMILE_AWARD')} dot /><NavItem label="Leaderboard" active={activeTab === 'SMILE_STATS'} onClick={() => setActiveTab('SMILE_STATS')} dot />{(user === 'SBH' || user === 'HR') && <NavItem label="HR Approval" active={activeTab === 'HR_PANEL'} onClick={() => setActiveTab('HR_PANEL')} dot />}{user === 'SBH' && <NavItem label="Print QR Code" active={activeTab === 'PRINT_QR'} onClick={() => setActiveTab('PRINT_QR')} dot />}</motion.div>)}</AnimatePresence>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-50"><button onClick={onLogout} className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase transition-colors"><LogOut size={16} /> Logout System</button></div>
                    </aside>
                </>
            )}
            <div className="flex-1 flex flex-col">
                {!isPublic && (
                    <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
                        <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-900 text-white rounded-xl shadow-lg"><Menu size={20} /></button><div><h1 className="text-lg font-black text-slate-900 uppercase leading-none hidden md:block">{activeTab.replace(/_/g, ' ')}</h1><p className="text-[9px] font-black text-[#2E7D32] uppercase md:hidden">SBH Hospital</p></div></div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"><Calendar size={14} className="text-[#2E7D32]" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-[10px] font-black tracking-widest text-slate-600 outline-none" /></div>
                            {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && (<button onClick={() => { setFormType(activeTab === 'RADIOLOGY' ? 'SONO' : 'OPD'); setShowForm(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#2E7D32] text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-green-100"><Plus size={14} /> Book Registration</button>)}
                        </div>
                    </header>
                )}
                <main className={`flex-1 p-6 md:p-10 ${isPublic ? '' : 'lg:ml-64'} max-w-[1400px] mx-auto w-full`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard icon={<Users />} label="Today's OPD" value={opdData.length} color="bg-[#2E7D32]" />
                                    <StatCard icon={<Scan />} label="Today's Radiology" value={sonoData.length} color="bg-slate-800" />
                                    <StatCard icon={<Smile />} label="Smile Award Votes" value={smileStats.all?.filter(s => s.month === selectedMonth).reduce((acc, s) => acc + s.votes, 0) || 0} color="bg-rose-500" />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="medical-card p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] mb-6 flex items-center gap-2">OPD Metrics</h3>
                                        <div className="px-4 py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Live Activity Tracking enabled</div>
                                    </div>
                                    {smileWinnersList.length > 0 && (
                                        <div className="medical-card p-6 bg-emerald-600 text-white relative overflow-hidden">
                                            <Trophy className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10" size={100} />
                                            <div className="relative z-10"><p className="text-[10px] font-black text-emerald-100 mb-2 uppercase">🎉 Latest Winner</p><h3 className="text-3xl font-black uppercase mb-1">{smileWinnersList[smileWinnersList.length-1].employee_name}</h3><p className="text-sm font-bold text-emerald-100">{smileWinnersList[smileWinnersList.length-1].department}</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey key="lasik-form" isPublic={false} />}
                        {activeTab === 'SMILE_AWARD' && <SmileAwardForm key="smile-award" onSubmissionSuccess={fetchData} />}
                        {activeTab === 'SMILE_STATS' && (<SmileAwardStats stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />)}
                        {activeTab === 'HR_PANEL' && (<HRApprovalPanel stats={smileStats} winners={smileWinnersList} staffList={staffList} onApprove={async(d)=>{await fetch(smileScriptUrl,{method:'POST',mode:'no-cors',body:JSON.stringify({action:'approve_winner',...d})});fetchData();}} />)}
                        {activeTab === 'PRINT_QR' && <PrintQRSection />}
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && (<motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}><DataTable data={activeTab === 'RADIOLOGY' ? sonoData : opdData} type={activeTab} onEdit={setEditingRow} /></motion.div>)}
                    </AnimatePresence>
                </main>
            </div>
            <AnimatePresence>
                {showForm && <RegistrationModal type={formType} onClose={()=>setShowForm(false)} onSubmit={handleFormSubmit} />}
                {editingRow && <EditModal row={editingRow} type={activeTab} onClose={()=>setEditingRow(null)} onUpdate={handleUpdate} />}
            </AnimatePresence>
            {loading && (<div className="fixed bottom-6 right-6 z-[100] bg-white border border-emerald-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"><Loader2 size={16} className="text-emerald-500 animate-spin" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-800">Processing Cloud Data</span></div>)}
        </div>
    );
};

export default SheetDashboard;
