import React, { useState } from 'react';

interface FreeDownloadGateModalProps {
  track: {
    id?: string;
    _id?: string;
    title: string;
    imageUrl?: string;
    coverArtUrl?: string;
  };
  onClose: () => void;
  onActivationSuccess: (email: string) => void;
}

export default function FreeDownloadGateModal({ track, onClose, onActivationSuccess }: FreeDownloadGateModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleGateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setProcessing(true);
    setErrorText(null);

    const trackId = track.id || track._id || "unknown";

    try {
      const origin = window.location.origin;
      const targetUrl = (!origin || origin === 'null') 
        ? '/api/marketing/mailing-list-lock' 
        : `${origin}/api/marketing/mailing-list-lock`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, trackId })
      });

      if (response.ok) {
        // Trigger verification callback tracking to instantly dispatch file access downloads to frontend
        onActivationSuccess(emailInput);
        onClose();
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorText(errJson.error || "Failed to submit subscription.");
      }
    } catch (err: any) {
      console.error("Marketing subscription processing drop", err);
      setErrorText(err.message || "Network error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  const imageUrl = track.imageUrl || track.coverArtUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-scaleUp">
        
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-white bg-zinc-950/60 p-1.5 rounded-full hover:bg-zinc-950 transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-[16px] h-[16px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Dynamic Cover Art Display Box */}
        <div className="relative w-full h-48 bg-zinc-800">
          <img 
            src={imageUrl} 
            alt={track.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          <div className="absolute bottom-4 left-4 pr-12">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#00ff66] bg-[#00ff66]/10 px-2.5 py-1 rounded border border-[#00ff66]/25 font-mono">
              🔒 Free Download Gated Lock
            </span>
            <h2 className="text-xl font-black text-white mt-2 font-sans tracking-tight line-clamp-1">{track.title}</h2>
          </div>
        </div>

        {/* Form Container Element */}
        <form onSubmit={handleGateSubmission} className="p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Enter your email below to subscribe to <b className="text-white">Tyrox Made This</b> and unlock your high-quality untagged audio file instantly. Keep 100% royalty free.
          </p>

          {errorText && (
            <div className="p-2 bg-red-950/30 border border-red-550/20 text-red-400 text-[10px] rounded-lg">
              ⚠️ {errorText}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 text-left block">E-mail Subscription Address</label>
            <input 
              type="email" 
              required
              disabled={processing}
              placeholder="artist@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-650 focus:outline-none focus:border-purple-550 focus:border-purple-500 transition-colors text-xs font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={processing}
              className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={processing}
              className="w-2/3 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {processing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Lock...</span>
                </>
              ) : (
                'Download Free Audio'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
