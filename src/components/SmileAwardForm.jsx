import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Star, Send, User, Briefcase, MessageCircle,
    CheckCircle2, Loader2, Award, ChevronRight, Search, Plus
} from 'lucide-react';

const SMILE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEKRvMvdVa8xNHs4SYG0i4wtRn1FYqsH9NoKBzA-gKFY1W3uspV_sqdShW075OIa-q4A/exec';

const SmileAwardForm = ({ onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        department: '',
        remarks: '',
        voterId: '',
        voterName: '',
        isNewNominee: false,
        isNewVoter: false
    });
    
    const [staffList, setStaffList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await fetch(`${SMILE_SCRIPT_URL}?action=get_staff`);
                const data = await response.json();
                setStaffList(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Staff fetch error:', err);
            } finally {
                setLoadingStaff(false);
            }
        };
        fetchStaff();
    }, []);

    const handleNomineeChange = (name) => {
        const exists = staffList.find(s => s.Name === name);
        if (exists) {
            setFormData(prev => ({
                ...prev,
                employeeId: exists.Staff_ID,
                employeeName: exists.Name,
                department: exists.Department,
                isNewNominee: false
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                employeeId: 'NEW',
                employeeName: name,
                department: name ? prev.department : '',
                isNewNominee: true
            }));
        }
    };

    const handleVoterChange = (name) => {
        const exists = staffList.find(s => s.Name === name);
        if (exists) {
            setFormData(prev => ({
                ...prev,
                voterId: exists.Staff_ID,
                voterName: exists.Name,
                isNewVoter: false
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                voterId: 'NEW',
                voterName: name,
                isNewVoter: true
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeName || !formData.voterName || !formData.remarks) {
            alert('Please fill all mandatory fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            await fetch(SMILE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'save_vote',
                    ...formData
                })
            });
            setSubmitted(true);
            if (onSubmissionSuccess) onSubmissionSuccess();
        } catch (error) {
            console.error('Submission error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                    <Award size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase mb-4">Nomination Received!</h2>
                <p className="text-slate-500 font-bold mb-8 uppercase text-xs tracking-widest leading-relaxed">Thank you for recognizing excellence.</p>
                <button onClick={() => { setSubmitted(false); setFormData({ employeeId: '', employeeName: '', department: '', remarks: '', voterId: '', voterName: '', isNewNominee: false, isNewVoter: false }); }} className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all">Nominate Another</button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-12 border border-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/50 rounded-bl-full -mr-16 -mt-16 z-0" />
                
                <div className="relative z-10 mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                        <Award size={14} /> Official Nomination
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">
                        Smile <span className="text-emerald-600">Award</span>
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Voter Selection */}
                        <SearchInput 
                            label="Your Name (Voter)" 
                            placeholder="Type or select name"
                            icon={<Heart size={16} className="text-rose-400" />} 
                            options={staffList.map(s => s.Name)} 
                            value={formData.voterName}
                            onChange={handleVoterChange}
                        />

                        {/* Nominee Selection */}
                        <SearchInput 
                            label="Nominee Name" 
                            placeholder="Who inspires you?"
                            icon={<User size={16} className="text-emerald-500" />} 
                            options={staffList.map(s => s.Name)} 
                            value={formData.employeeName}
                            onChange={handleNomineeChange}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <SmileInput 
                            label="Department" 
                            icon={<Briefcase size={16} />} 
                            value={formData.department}
                            onChange={v => setFormData({ ...formData, department: v })}
                            placeholder={formData.isNewNominee ? "Enter department for new staff" : "Automatically detected"}
                            disabled={!formData.isNewNominee && formData.employeeName !== ''}
                            required
                        />

                        <SmileInput 
                            label="Reason for Nomination" 
                            placeholder="Briefly describe their excellence..." 
                            icon={<MessageCircle size={16} />} 
                            isTextArea
                            value={formData.remarks}
                            onChange={v => setFormData({...formData, remarks: v})}
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting || loadingStaff}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : <><Send size={18} /> Submit Vote</>}
                        </motion.button>
                        
                        {(formData.isNewNominee || formData.isNewVoter) && (
                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-4 text-center">
                                * New names will be added to the hospital staff list
                            </p>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const SearchInput = ({ label, icon, options, value, onChange, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const filteredOptions = useMemo(() => {
        return options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase())).slice(0, 10);
    }, [options, filter]);

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                {icon} {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 pr-10 text-slate-700 font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                    placeholder={placeholder}
                    value={value || filter}
                    onChange={e => {
                        setFilter(e.target.value);
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    required={required}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <Search size={14} />
                </div>
            </div>
            
            <AnimatePresence>
                {isOpen && filter && filteredOptions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {filteredOptions.map(opt => (
                            <button key={opt} type="button" onClick={() => { onChange(opt); setFilter(''); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                {opt}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SmileInput = ({ label, icon, isTextArea, value, onChange, placeholder, required, disabled }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
            {icon} {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isTextArea ? (
            <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 font-bold text-sm outline-none transition-all h-28 resize-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required} />
        ) : (
            <input className={`w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 font-bold text-sm outline-none transition-all h-14 ${disabled ? 'opacity-50' : 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30'}`} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled} />
        )}
    </div>
);

export default SmileAwardForm;
