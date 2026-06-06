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
        ? '/api/subscribe' 
        : `${origin}/api/subscribe`;

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
      {/* Container Box using the requested beatstars-modal class */}
      <div className="beatstars-modal overflow-hidden shadow-2xl relative animate-scaleUp">
        
        {/* The structural artwork background layer that blurs and bleeds */}
        <div 
          className="modal-art-background" 
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        {/* The golden frosted layout mask */}
        <div className="modal-glass-overlay" />

        {/* Real content positioned safely over background layers */}
        <div className="modal-content-vault w-full relative">
          
          {/* Close button inside content box */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 z-20 text-neutral-450 hover:text-white bg-black/40 hover:bg-black/80 p-2 rounded-full transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-[16px] h-[16px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Top Label & Details Info */}
          <div className="mb-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#39FF14] bg-[#39FF14]/10 px-2.5 py-1 rounded border border-[#39FF14]/25 font-mono inline-block">
              🔒 Free Download Gated Lock
            </span>
            <h2 className="text-2xl font-black text-white mt-3 font-sans tracking-tight line-clamp-1">
              {track.title}
            </h2>
            <p className="text-xs text-neutral-300 mt-2 leading-relaxed font-sans">
              Enter your email below to subscribe to <b className="text-[#39FF14]">Tyrox Made This</b> and unlock your high-quality untagged audio file instantly. Keep 100% royalty free.
            </p>
          </div>

          {/* Form Container Element */}
          <form onSubmit={handleGateSubmission} className="space-y-4">
            {errorText && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono">
                ⚠️ {errorText}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 text-left block">
                E-mail Subscription Address
              </label>
              <input 
                type="email" 
                required
                disabled={processing}
                placeholder="producer@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] transition-colors text-xs font-mono"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button 
                type="button" 
                onClick={onClose}
                disabled={processing}
                className="w-1/3 py-3 bg-neutral-900/80 hover:bg-neutral-850/95 text-neutral-400 hover:text-white font-mono uppercase text-[10px] tracking-wider rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={processing}
                className="w-2/3 py-3 bg-[#39FF14] hover:bg-[#34e512] disabled:opacity-50 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition shadow-lg shadow-[#39FF14]/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {processing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
}

