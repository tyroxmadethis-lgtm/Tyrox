import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Send, ShieldAlert, Cpu, Check, ArrowRight, CornerDownRight } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { setActiveTab } = useStore();
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Artist');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Submission outcome states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: string;
    message: string;
    payload: any;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert("Please populate required fields.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate FastAPI processing under high performance
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionResult({
        status: "Message Sent",
        message: "Tyrox Made This team will contact you shortly.",
        payload: {
          name,
          email,
          role,
          subject: subject || "No Subject Prompted",
          priority: ["RAP label", "ANR"].includes(role) ? "URGENT_A_R" : "STANDARD",
          received_utc: new Date().toISOString()
        }
      });
    }, 1500);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setRole('Artist');
    setSubject('');
    setMessage('');
    setSubmissionResult(null);
  };

  return (
    <div id="contact-page-view" className="py-12 px-4 md:px-8 max-w-4xl mx-auto pt-6 flex flex-col gap-10 min-h-screen text-neutral-100">
      
      {/* Visual Header */}
      <div className="border-b border-neutral-900/60 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#9d4edd] font-black block mb-1">
            SECURE ROUTING PORTAL
          </span>
          <h1 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-white uppercase select-none">
            GET IN TOUCH
          </h1>
          <p className="text-neutral-500 font-sans text-xs mt-1">
            Standard bookings matching direct serverless backend triggers for immediate response pipeline.
          </p>
        </div>
        
        {/* Industry Portal shortcut link */}
        <button
          onClick={() => setActiveTab('industry-portal')}
          className="px-3.5 py-1.5 bg-[#12101e] hover:bg-[#1a172c] border border-purple-500/10 hover:border-purple-500/35 text-purple-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
        >
          <Cpu size={12} className="text-purple-400 rotate-12" />
          <span>Go to Industry Portal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Pitch Contact Form (7 columns) */}
        <div className="md:col-span-7 bg-[#07080c] border border-neutral-900 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
          
          {!submissionResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Form title */}
              <div className="border-b border-neutral-900/80 pb-3">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide text-white">
                  Direct Pitch Message & Requirements
                </h3>
              </div>

              {/* Grid block for Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="artist@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Dropdown containing the specific user roles */}
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block">
                  Industry Role / Classifier
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-red-500 font-mono cursor-pointer"
                >
                  <option value="Artist">Artist / Independent Creator</option>
                  <option value="ANR">A&R / Talent Scout Representative</option>
                  <option value="RAP label">RAP label representative</option>
                  <option value="RAP engineer">RAP engineer / Mixing Professional</option>
                </select>
              </div>

              {/* Urgent A&R notification warning */}
              {["RAP label", "ANR"].includes(role) && (
                <div className="p-3 bg-red-950/25 border border-red-500/20 rounded-lg flex items-start gap-2.5 animate-fadeIn">
                  <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={14} />
                  <div>
                    <h5 className="font-sans font-bold text-[10px] text-red-400 uppercase tracking-wide">
                      HIGH-PRIORITY VERIFICATION ACTIVATED
                    </h5>
                    <p className="text-neutral-400 text-[9.5px] mt-0.5 leading-relaxed">
                      Lifting priority queues. Incoming brief variables earmarked for urgent SMTP forwarder / Discord dispatchment under FastAPI 3.11 rules.
                    </p>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block">Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Mixing inquiry, licensing, exclusive beat stems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-red-500 font-sans"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block">Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Keep your pitch concise and professional. Let us know what license tier or custom arrangement you are targeting."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-red-500 font-sans resize-none"
                />
              </div>

              {/* Submit Trigger Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-sans text-xs font-black text-white hover:shadow-lg hover:shadow-red-600/10 uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Processing backend matrix...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Dispatch Pitch Message</span>
                  </>
                )}
              </button>

            </form>
          ) : (
            /* BREATHTAKING SIMULATOR RESPONSE PAGE */
            <div className="space-y-6 py-4 animate-scaleUp text-left">
              
              <div className="flex items-center gap-2.5 text-emerald-400">
                <div className="w-8 h-8 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center">
                  <Check size={16} />
                </div>
                <div>
                  <h3 className="font-sans font-black text-xs uppercase tracking-wide">
                    FastAPI Endpoint Return status: 200 OK
                  </h3>
                  <p className="text-neutral-500 font-mono text-[9px] tracking-wider uppercase">
                    templates.TemplateResponse rendered contact submission success
                  </p>
                </div>
              </div>

              {/* JSON simulated API package return block */}
              <div className="bg-[#050608] border border-neutral-900 rounded-xl p-4 font-mono text-[10px] text-zinc-300 space-y-2 relative">
                <div className="absolute top-2 right-3 text-[8.5px] text-neutral-500 font-bold uppercase tracking-widest font-sans">
                  FastAPI JSON Output
                </div>
                <p className="text-neutral-500 border-b border-neutral-950 pb-1.5 block">Response payload:</p>
                <div className="overflow-x-auto whitespace-pre no-scrollbar">
{`{
  "status": "${submissionResult.status}",
  "message": "${submissionResult.message}",
  "audited_payload": {
    "sender_name": "${submissionResult.payload.name}",
    "sender_email": "${submissionResult.payload.email}",
    "sender_role": "${submissionResult.payload.role}",
    "priority_class": "${submissionResult.payload.priority}",
    "received_at": "${submissionResult.payload.received_utc}"
  }
}`}
                </div>
              </div>

              {/* Direct pipeline testing redirection button */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/10 rounded-xl space-y-2">
                <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                  Want to trace the pipeline logic? Navigate to the <strong>Studio Dashboard → Pipeliners Section</strong> to monitor live terminal logs and execute python-docker variables natively!
                </p>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-sans font-bold text-[10px] uppercase rounded transition tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Studio Dashboard</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 text-xs font-mono rounded uppercase tracking-wider transition"
              >
                Clear Response & Write New Pitch
              </button>

            </div>
          )}

        </div>

        {/* Right Side: Professional Booking Info & Direct Links (5 columns) */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Direct connection coordinates */}
          <div className="bg-[#07080c] border border-neutral-900 rounded-2xl p-5 space-y-4">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-red-500">
              Direct Contact
            </h4>
            <p className="text-neutral-400 font-sans text-xs leading-relaxed">
              Ready to work on massive Phonk, Trap-Metal, or custom gaming streams? Feel free to drop an inquiry directly via email:
            </p>
            <a
              href="mailto:tyroxmadethis@gmail.com"
              className="inline-block w-full text-center py-2.5 bg-neutral-950 border border-neutral-800 hover:border-red-500/40 text-neutral-200 hover:text-white font-sans text-xs font-bold rounded-lg transition"
            >
              tyroxmadethis@gmail.com
            </a>
          </div>

          {/* Guidelines info block */}
          <div className="bg-[#07080c] border border-neutral-900 rounded-2xl p-5 space-y-4 font-sans text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white">
              Submission Guidelines
            </h4>
            <div className="space-y-3 font-sans text-neutral-400">
              <div className="flex items-start gap-2">
                <CornerDownRight size={12} className="text-red-500 shrink-0 mt-0.5" />
                <p><strong>Label Execs & A&R reps:</strong> Be sure to select corresponding values in the role dropdown to bypass priority checkpoints.</p>
              </div>
              <div className="flex items-start gap-2">
                <CornerDownRight size={12} className="text-red-500 shrink-0 mt-0.5" />
                <p><strong>Stems & Multi-tracks requests:</strong> Contact us with the precise beat ID from the main Tracks Catalog.</p>
              </div>
              <div className="flex items-start gap-2">
                <CornerDownRight size={12} className="text-red-500 shrink-0 mt-0.5" />
                <p><strong>Turnaround timeline:</strong> General custom production requests resolved in 48-72 business hours.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
