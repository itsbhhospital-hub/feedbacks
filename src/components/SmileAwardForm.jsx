import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, 
    Star, 
    Send, 
    User, 
    Briefcase, 
    MessageCircle,
    CheckCircle2,
    Loader2,
    Award,
    ChevronRight,
    Search
} from 'lucide-react';

const SmileAwardForm = ({ onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        nominee: '',
        department: '',
        remarks: '',
        voterId: '',
        voterName: ''
    });
    const [staffList, setStaffList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(true);

    const SMILE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEKRvMvdVa8xNHs4SYG0i4wtRn1FYqsH9NoKBzA-gKFY1W3uspV_sqdShW075OIa-q4A/exec';

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

    const handleNomineeChange = (staffId) => {
        const staff = staffList.find(s => s.Staff_ID === staffId);
        if (staff) {
            setFormData(prev => ({
                ...prev,
                employeeId: staff.Staff_ID,
                nominee: staff.Name,
                department: staff.Department
            }));
        }
    };

    const handleVoterChange = (staffId) => {
        const staff = staffList.find(s => s.Staff_ID === staffId);
        if (staff) {
            setFormData(prev => ({
                ...prev,
                voterId: staff.Staff_ID,
                voterName: staff.Name
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nominee || !formData.remarks) {
            alert('Please select a nominee and provide a reason.');
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
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] shadow-2xl max-w-xl mx-auto text-center border-4 border-emerald-50"
            >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-8 relative">
                    <Award size={48} />
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full"
                    >
                        <Heart size={16} fill="white" />
                    </motion.div>
                </div>
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-3">Nomination Sent!</h2>
                <p className="text-slate-500 font-bold mb-10 uppercase text-xs tracking-[0.2em] leading-relaxed text-center">
                    Thank you spreading smiles and recognizing <br /> excellence in our teammates.
                </p>
                <button 
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({
                            employeeId: '',
                            nominee: '',
                            department: '',
                            remarks: '',
                            voterId: '',
                            voterName: ''
                        });
                    }} 
                    className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-emerald-100"
                >
                    Nominate Another
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-slate-50 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-bl-full -mr-20 -mt-20 z-0" />
                
                <div className="relative z-10 mb-12 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        <Award size={14} /> Employee Excellence
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-4">
                        Smile <span className="text-emerald-600">Award</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Recognition & Appreciation</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Voter Selection */}
                        <SmileSelect 
                            label="Your Name (Voter)" 
                            placeholder={loadingStaff ? "Loading..." : "Select your name"}
                            icon={<Heart size={18} className="text-rose-400" />} 
                            options={staffList.map(s => ({ value: s.Staff_ID, label: s.Name }))} 
                            value={formData.voterId}
                            onChange={handleVoterChange}
                        />

                        {/* Nominee Selection */}
                        <SmileSelect 
                            label="Nominee Name" 
                            placeholder={loadingStaff ? "Loading..." : "Who deserves recognition?"}
                            icon={<User size={18} className="text-emerald-500" />} 
                            options={staffList.map(s => ({ value: s.Staff_ID, label: s.Name }))} 
                            value={formData.employeeId}
                            onChange={handleNomineeChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <SmileInput 
                            label="Department" 
                            disabled
                            icon={<Briefcase size={18} />} 
                            value={formData.department}
                            placeholder="Select a nominee first"
                        />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-6 italic">
                            * Automatically fetched from staff master
                        </div>
                    </div>

                    <SmileInput 
                        label="Reason / Remarks" 
                        placeholder="Why are you nominating them? Give details of their excellence..." 
                        icon={<MessageCircle size={18} />} 
                        isTextArea
                        value={formData.remarks}
                        onChange={v => setFormData({...formData, remarks: v})}
                        required
                    />

                    <div className="pt-6">
                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting || loadingStaff}
                            className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Submitting Recognition...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Cast Your Vote
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const SmileSelect = ({ label, icon, options, value, onChange, placeholder, required }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
            <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 pr-12 text-slate-700 font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all h-16 appearance-none shadow-sm"
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
            >
                <option value="">{placeholder || "Select Option"}</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronRight className="rotate-90" size={18} />
            </div>
        </div>
    </div>
);

const SmileInput = ({ label, icon, isTextArea, value, onChange, placeholder, required, disabled }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isTextArea ? (
            <textarea 
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-700 font-bold outline-none transition-all h-32 resize-none ${disabled ? 'opacity-50' : 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30'}`}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                disabled={disabled}
            />
        ) : (
            <input 
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-700 font-bold outline-none transition-all h-16 ${disabled ? 'opacity-50 pointer-events-none' : 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30'}`}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange ? onChange(e.target.value) : null}
                required={required}
                disabled={disabled}
            />
        )}
    </div>
);

export default SmileAwardForm;
