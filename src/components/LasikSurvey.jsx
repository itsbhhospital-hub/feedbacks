import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Phone, 
    CheckCircle2, 
    Loader2,
    Share2,
    Check,
    Hospital,
    Globe
} from 'lucide-react';

const LasikSurvey = ({ isPublic }) => {
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        phone: '',
        age: '',
        q1: '',
        q2: '',
        q3: '',
        q4: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    React.useEffect(() => {
        if (!formData.date) {
            setFormData(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0]
            }));
        }
    }, [formData.date]);

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuFDz3LDBM88Wy-7naDgffvXQ0hH37-EMQhJuMcUId40PNG5yX_PFZLyXXiGYMB0zQ/exec';

    const handleToggle = (question, value) => {
        setFormData(prev => ({ ...prev, [question]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.age || !formData.q1 || !formData.q2 || !formData.q3 || !formData.q4) {
            alert('Please fill all fields and answer all questions.');
            return;
        }
        setIsSubmitting(true);
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(formData)
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Submission error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-2xl max-w-xl mx-auto my-10 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[#2E7D32] mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Registration Done!</h2>
                <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-widest">Thank you for Choosing SBH Eye Hospital</p>
                <button onClick={() => setSubmitted(false)} className="px-10 py-4 bg-[#2E7D32] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl">Back to Form</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-2 py-4 font-sans selection:bg-green-100">
            <div className="bg-white shadow-2xl rounded-3xl overflow-hidden relative border-[3px] border-[#14a298] min-h-[1000px] flex flex-col">
                
                {/* Background Vertical Stripes */}
                <div className="absolute inset-0 pointer-events-none z-0 flex">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50'}`} />
                    ))}
                </div>

                {/* Header Branding */}
                <div className="relative z-10 p-4 md:p-6 flex flex-col items-center border-b-[3px] border-[#2E7D32]/10 bg-white">
                    <img src="/logo.png" alt="SBH Logo" className="h-16 md:h-24 object-contain mb-2" />
                    <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tight mb-1">साईं बाबा अस्पताल</h1>
                    <p className="text-[10px] md:text-[14px] font-black text-[#689F38] uppercase tracking-[0.4em]">CG's Most Trusted Eye Hospital</p>
                </div>

                <div className="relative z-10 bg-[#388E3C] py-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Are you ready for LASIK ?</h2>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="relative z-10 flex-1 px-4 md:px-12 py-10 space-y-12">
                    
                    {/* Identification Section (Centered 2-Column Grid) */}
                    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                        <HandwrittenInput label="Name:" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                        <HandwrittenInput label="Date:" type="date" value={formData.date} onChange={v => setFormData({...formData, date: v})} />
                        <HandwrittenInput label="Phone No:" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                        <HandwrittenInput label="Age:" type="number" value={formData.age} onChange={v => setFormData({...formData, age: v})} />
                    </div>

                    {/* Centered Questions Area */}
                    <div className="max-w-2xl mx-auto space-y-12 w-full">
                        <DotQuestion 
                            text="Are you between the age of 18-40?" 
                            hindi="(क्या आप 18-40 वर्ष की उम्र के बीच हैं?)" 
                            value={formData.q1} 
                            onToggle={v => handleToggle('q1', v)} 
                        />
                        <DotQuestion 
                            text="Do you wear Glasses or Contact Lens?" 
                            hindi="(क्या आप चश्मा या कॉन्टैक्ट लेंस पहनते/पहनती हैं?)" 
                            value={formData.q2} 
                            onToggle={v => handleToggle('q2', v)} 
                        />
                        <DotQuestion 
                            text="Is the power of your glasses stable?" 
                            hindi="(क्या आपके चश्मे की पावर स्थिर है?)" 
                            value={formData.q3} 
                            onToggle={v => handleToggle('q3', v)} 
                        />
                        <DotQuestion 
                            text="Are glasses affecting your day to day activity?" 
                            hindi="(क्या चश्मा आपकी रोज़ की गतिविधियों को प्रभावित करता है?)" 
                            value={formData.q4} 
                            onToggle={v => handleToggle('q4', v)} 
                        />

                        {/* Centered Submit Button */}
                        <div className="pt-8 flex justify-center">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isSubmitting}
                                className="w-full md:w-[400px] p-0 rounded-2xl overflow-hidden shadow-2xl relative group border-4 border-white"
                            >
                                <div className="bg-gradient-to-r from-[#009688] to-[#4CAF50] px-8 py-6 flex flex-col items-center justify-center gap-1 group-hover:opacity-90 transition-all">
                                    <span className="text-4xl font-black italic text-white leading-none">Avail!</span>
                                    <span className="text-xl font-black text-white uppercase tracking-[0.1em] mt-1">FREE COUNSELING</span>
                                </div>
                                {isSubmitting && <div className="absolute inset-0 bg-white/20 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-white" /></div>}
                            </motion.button>
                        </div>
                    </div>
                </form>
                {/* Classic Styled Sticky Footer */}
                <footer className="sticky bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md pb-0 pt-4 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <p className="text-[11px] font-black text-slate-800 ml-4">T&C APPLY</p>
                        
                        {/* Primary Footer Bar (Restored Navy Style) */}
                        <div className="bg-[#1a365d] rounded-full p-2 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
                            <div className="bg-white rounded-full flex items-center gap-4 px-6 md:px-8 py-3 w-full md:w-auto shadow-sm">
                                <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
                                    <Phone size={20} fill="white" />
                                </div>
                                <span className="text-2xl md:text-3xl font-[1000] text-slate-900 tracking-tight">7440777771</span>
                            </div>
                            <div className="flex-1 flex items-center gap-4 px-6 md:px-8 pb-3 md:pb-0 text-white">
                                <Hospital size={22} className="text-green-400 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[12px] md:text-[14px] font-black uppercase tracking-wide leading-tight">Sai Baba Eye Hospital</span>
                                    <span className="text-[10px] md:text-[11px] font-bold opacity-80 uppercase tracking-wider">New Rajendra Nagar, Raipur(C.G)</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Footer Bar (Website) */}
                        <div className="flex flex-col items-center justify-center gap-4 pb-4">
                            <a href="https://www.sbhhospital.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-700 hover:text-slate-900 transition-all">
                                <div className="w-4 h-4 bg-[#1a365d] rounded-full" />
                                <span className="text-lg font-black tracking-widest lowercase">www.sbhhospital.com</span>
                            </a>
                        </div>
                    </div>

                    {/* Final Branded Footer (Green Background - Rounded to match Border) */}
                    <div className="bg-[#2E7D32] py-4 text-center mt-2 rounded-b-[2.8rem]">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">
                            Developed By <span className="text-green-100">SBH Group Of Hospitals</span>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const HandwrittenInput = ({ label, value, onChange, type = "text" }) => (
    <div className="flex items-end gap-2 md:gap-6 min-h-[50px] md:min-h-[60px]">
        <label className="text-lg md:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap mb-1 shrink-0">{label}</label>
        <div className="flex-1 relative">
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="w-full bg-transparent border-0 outline-none p-0 text-base md:text-2xl font-bold text-[#388E3C] tracking-tight h-10 md:h-12 italic focus:ring-0"
            />
            <div className="absolute bottom-0 left-0 right-0 border-b-[1.5px] border-dotted border-slate-400 pointer-events-none" />
        </div>
    </div>
);

const DotQuestion = ({ text, hindi, value, onToggle }) => (
    <div className="space-y-4 md:space-y-6">
        <div className="flex gap-4 md:gap-5">
            <div className="w-3 h-3 bg-slate-900 rounded-full mt-2.5 shrink-0 shadow-sm" />
            <div>
                <p className="text-lg md:text-2xl font-black text-slate-900 leading-tight tracking-tight">{text}</p>
                <p className="text-[14px] md:text-[18px] font-bold text-slate-500 italic mt-1 md:mt-2 leading-tight">{hindi}</p>
            </div>
        </div>
        <div className="flex gap-8 md:gap-12 ml-8 md:ml-10">
            <CheckboxLabel label="YES / हाँ" active={value === 'YES'} onClick={() => onToggle('YES')} />
            <CheckboxLabel label="NO / नहीं" active={value === 'NO'} onClick={() => onToggle('NO')} />
        </div>
    </div>
);

const CheckboxLabel = ({ label, active, onClick }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-4 md:gap-5 group">
        <span className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tighter group-hover:text-[#388E3C] transition-colors">{label}</span>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded border-2 flex items-center justify-center transition-all shadow-sm ${active ? 'bg-[#388E3C] border-[#388E3C] text-white' : 'bg-white border-slate-400'}`}>
            {active && <Check size={20} strokeWidth={4} />}
        </div>
    </button>
);

export default LasikSurvey;
