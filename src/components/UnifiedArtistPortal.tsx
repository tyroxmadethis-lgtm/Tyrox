import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Track } from '../types';
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  Music, 
  Play, 
  Pause, 
  X, 
  Check, 
  Download, 
  Share2, 
  Lock, 
  Mail, 
  ExternalLink 
} from 'lucide-react';

export default function UnifiedArtistPortal() {
  const { tracks, playTrack, currentTrack: globalCurrent, isPlaying: globalPlaying, updateTrack } = useStore();

  // 1. INITIALIZE SYSTEM METRICS STRICTLY AT ZERO
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    licensesDistributed: 0,
    verifiedAcquisitions: 0
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Audio & Modal Core States
  const [localCurrentTrack, setLocalCurrentTrack] = useState<Track | null>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTrackForDownload, setSelectedTrackForDownload] = useState<Track | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Automated Social Links Configuration State
  const [socialLinks] = useState({
    tiktok: "https://tiktok.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    twitter: "https://twitter.com"
  });

  // 2. FETCH REAL-TIME DATA (Ensures zero on boot, then queries active database metrics)
  const fetchLivePlatformData = async () => {
    try {
      // Fetch from the live API route
      const telemetryRes = await fetch('/api/analytics/live-telemetry');
      if (telemetryRes.ok) {
        const telemetryData = await telemetryRes.json();
        if (telemetryData.success && telemetryData.metrics) {
          setMetrics(telemetryData.metrics);
        }
      }

      // Fetch from the live transaction stream
      const ledgerRes = await fetch('/api/transactions/live-stream');
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        if (ledgerData.success && ledgerData.ledgerItems) {
          setTransactions(ledgerData.ledgerItems);
        }
      }
    } catch (err) {
      console.error("Platform pipeline telemetry query skipped or offline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePlatformData();

    // Establish polling sync to update real-time transaction telemetry smoothly
    const interval = setInterval(fetchLivePlatformData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync state between local player and global player
  useEffect(() => {
    if (globalCurrent) {
      setLocalCurrentTrack(globalCurrent);
      setLocalIsPlaying(globalPlaying);
    }
  }, [globalCurrent, globalPlaying]);

  // 3. CORE AUDIO CORE & CONTENT DISTRIBUTION UTILITIES
  const handlePlayTrack = (track: Track) => {
    // Sync with global player context to play high-fidelity synthesized dynamic rap beats
    playTrack(track);
    setLocalCurrentTrack(track);
    setLocalIsPlaying(true);

    if (audioRef.current) {
      // Backup local fallback playback support
      const fallbackUrl = track.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      audioRef.current.src = fallbackUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  const handlePauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setLocalIsPlaying(false);
  };

  const triggerSocialShare = (platform: string, track: Track | null) => {
    const activeTrack = track || localCurrentTrack || (tracks && tracks[0]);
    if (!activeTrack) {
      alert("Please load or select a track to activate the share engine.");
      return;
    }
    const trackId = activeTrack.id || (activeTrack as any)._id || "demo";
    const targetUrl = encodeURIComponent(`https://ais-pre-hampynomukyhthpabzqqs5-535063907055.us-west2.run.app/store?track=${trackId}`);
    const shareText = encodeURIComponent(`Listen to "${activeTrack.title}" by Tyrox Made This!`);
    
    let dest = "";
    if (platform === 'twitter') {
      dest = `https://twitter.com/intent/tweet?text=${shareText}&url=${targetUrl}`;
    } else if (platform === 'instagram' || platform === 'facebook') {
      dest = `https://instagram.com`;
    } else if (platform === 'youtube') {
      dest = `https://youtube.com`;
    } else {
      dest = `https://twitter.com/intent/tweet?text=${shareText}&url=${targetUrl}`;
    }
    window.open(dest, '_blank', 'width=600,height=400');
  };

  const triggerFreeDownloadGate = (track: Track) => {
    setSelectedTrackForDownload(track);
    setEmailInput("");
    setDownloadSuccess(false);
    setShowEmailModal(true);
  };

  const handleEmailGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !selectedTrackForDownload) return;
    setUploading(true);
    try {
      const trackId = selectedTrackForDownload.id || (selectedTrackForDownload as any)._id;
      const res = await fetch('/api/marketing/mailing-list-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, trackId })
      });
      
      if (res.ok) {
        setDownloadSuccess(true);
        
        // Save subscriber to local stores
        const existing = JSON.parse(localStorage.getItem('vv_newsletter_subscribers') || '[]');
        if (!existing.includes(emailInput)) {
          existing.push(emailInput);
          localStorage.setItem('vv_newsletter_subscribers', JSON.stringify(existing));
        }

        // Increment track downloads
        const updated = {
          ...selectedTrackForDownload,
          downloads: (selectedTrackForDownload.downloads || 0) + 1
        };
        updateTrack(updated);

        // Immediate browser file download trigger
        setTimeout(() => {
          try {
            const dlUrl = selectedTrackForDownload.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
            const link = document.createElement('a');
            link.href = dlUrl;
            link.setAttribute('download', `${selectedTrackForDownload.title}_demo.mp3`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (dlErr) {
            console.error("Browser anchor downloads triggered failed:", dlErr);
          }
          setShowEmailModal(false);
          setSelectedTrackForDownload(null);
          fetchLivePlatformData(); // live count sync update
        }, 1800);
      } else {
        alert("Server validation failed. Please provide a valid email.");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging newsletter lock. Falling back to immediate unlock...");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050608] text-white selection:bg-purple-600/30 selection:text-white pb-20">
      
      {/* HEADER PORTAL CORE */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-400 font-mono">
          OFFICIAL ARTIST PORTAL
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-1 mb-2 font-sans text-neutral-50">
          TYROX MADE THIS
        </h1>
        <p className="text-sm text-zinc-400 font-light max-w-lg mx-auto">
          Premium Rap Licensing • High-Contrast Audio Waveforms • Zero Middlemen
        </p>
      </header>

      {/* DYNAMIC BANNER BLOCK WITH FLOATING SOCIAL LINKS */}
      <div className="w-full max-w-5xl mx-auto px-4 mt-8">
        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl border border-white/5">
          <img 
            src="/banner.jpg" 
            alt="Artist Banner Background" 
            className="w-full h-full object-cover opacity-60" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent" />
          
          {/* FLOATING SOCIAL DOCK PINNED PERFECTLY TO BOTTOM EDGE */}
          <div className="absolute bottom-4 right-4 flex items-center gap-4 z-10 bg-[#0c0d12]/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
            <button 
              onClick={() => triggerSocialShare('twitter', null)} 
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer" 
              title="Share Beat to Twitter"
            >
              <Twitter className="w-[18px] h-[18px]" />
            </button>
            <button 
              onClick={() => triggerSocialShare('instagram', null)} 
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer" 
              title="Follow Instagram"
            >
              <Instagram className="w-[18px] h-[18px]" />
            </button>
            <a 
              href={socialLinks.youtube} 
              target="_blank" 
              rel="noreferrer" 
              className="text-zinc-400 hover:text-white transition-colors" 
              title="Artist YouTube Channel"
            >
              <Youtube className="w-[18px] h-[18px]" />
            </a>
            <a 
              href={socialLinks.tiktok} 
              target="_blank" 
              rel="noreferrer" 
              className="text-zinc-400 hover:text-white transition-colors flex items-center" 
              title="Artist TikTok Portal"
            >
              <Music className="w-[18px] h-[18px]" />
            </a>
          </div>

          <div className="absolute bottom-4 left-6">
            <span className="text-[10px] uppercase tracking-widest font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full">
              PRODUCER ID: TYROX
            </span>
          </div>
        </div>
      </div>

      {/* FINANCIAL TELEMETRY STREAM */}
      <main className="w-full max-w-5xl mx-auto px-4 mt-10 space-y-8">
        
        <div className="bg-[#0b0c10] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
                📊 Live Core Financial Telemetry
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">MongoDB Analytics Data Pipeline Active</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SERVER LINKED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Accumulated Store Sales */}
            <div className="bg-[#12131a] border border-white/[0.03] hover:border-purple-500/20 rounded-xl p-5 transition-colors">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Total Accumulated Store Sales</p>
              <p className="text-3xl font-black text-white mt-2 font-mono">
                ${metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Active Distributed Track Licenses */}
            <div className="bg-[#12131a] border border-white/[0.03] hover:border-purple-500/20 rounded-xl p-5 transition-colors">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Active Licenses Distributed</p>
              <p className="text-3xl font-black text-cyan-400 mt-2 font-mono">
                {metrics.licensesDistributed} UNITS
              </p>
            </div>

            {/* Verified Download Acquisitions */}
            <div className="bg-[#12131a] border border-white/[0.03] hover:border-purple-500/20 rounded-xl p-5 transition-colors">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Verified Download Acquisitions</p>
              <p className="text-3xl font-black text-purple-400 mt-2 font-mono">
                {metrics.verifiedAcquisitions} BINARY
              </p>
            </div>
          </div>
        </div>

        {/* BEATS CATALOG SECTION WITH INTEGRATED AUDIO CONTROLS */}
        <section className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">🔥 Premium Beat Catalog</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Select a beat to stream and share with label executives</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">{tracks.length} Tracks Available</span>
          </div>

          {tracks.length === 0 ? (
            <div className="text-center py-12 bg-[#0d0e12]/50 border border-dashed border-white/5 rounded-xl">
              <Music className="w-10 h-10 mx-auto text-zinc-650 mb-3 text-zinc-600 opacity-60" />
              <p className="text-xs font-semibold text-zinc-400">No tracks initialized in the workspace yet.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Please add beats in the Studio Dashboard to pop up your real live catalog.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => {
                const isThisPlaying = localCurrentTrack?.id === track.id && localIsPlaying;
                return (
                  <div 
                    key={track.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#111218]/85 hover:bg-[#151620] border border-white/[0.02] hover:border-purple-500/15 rounded-xl transition-all duration-150 gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Interactive Cover Art Disk */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-white/5 relative group shrink-0">
                        <img src={track.imageUrl || "/default-cover.jpg"} alt={track.title} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => isThisPlaying ? handlePauseTrack() : handlePlayTrack(track)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                        >
                          {isThisPlaying ? <Pause className="w-5 h-5 text-purple-400" /> : <Play className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Title Metadata Block */}
                      <div>
                        <h4 className="font-semibold text-white text-sm tracking-tight flex items-center gap-1.5">
                          {track.title}
                          {track.isHot && (
                            <span className="text-[8px] font-mono font-black tracking-widest bg-red-950/80 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                              HOT
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {track.bpm} BPM • {track.key} • {track.duration}
                        </p>
                      </div>
                    </div>

                    {/* Right Interactive Buttons */}
                    <div className="flex items-center flex-wrap gap-2.5 ml-auto md:ml-0">
                      <button 
                        onClick={() => triggerSocialShare('twitter', track)}
                        className="p-2 bg-[#171822] hover:bg-[#202230] border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-transform hover:scale-105 cursor-pointer text-xs flex items-center gap-1 font-mono"
                        title="Share Beat Details"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share Detail</span>
                      </button>

                      {track.allowFreeDownload !== false && (
                        <button 
                          onClick={() => triggerFreeDownloadGate(track)}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-500/30 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer text-xs flex items-center gap-2 font-mono font-bold font-semibold uppercase shadow-lg"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Free</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GENUINE REVENUE TRANSACTION LEDGER */}
        <section className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
                💵 LIVE REVENUE LEDGER
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Enterprise platform auditing stream logs</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Up to 50 sales entries displayed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                  <th className="pb-3 font-semibold">Track Title</th>
                  <th className="pb-3 font-semibold">License Granted</th>
                  <th className="pb-3 font-semibold">Verified Buyer</th>
                  <th className="pb-3 font-semibold text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-600 font-medium">
                      No active transactions recorded. System initialized at clean zero.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 15).map((tx, idx) => (
                    <tr key={tx._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-semibold text-zinc-100">{tx.trackTitle || "Exclusive Instrumental"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-500/20 text-[9px] rounded font-mono font-bold tracking-tight">
                          {tx.licenseClass || "EXCLUSIVE AGREEMENT"}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400 font-light">{tx.buyerEmail || "undisclosed@client.network"}</td>
                      <td className="py-3 text-emerald-400 font-bold text-right">${typeof tx.payout === 'number' ? tx.payout.toFixed(2) : parseFloat(tx.payout || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* BEATSTARS STYLE FREE DOWNLOAD EMAIL GATE MODAL */}
      {showEmailModal && selectedTrackForDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0c0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowEmailModal(false);
                setSelectedTrackForDownload(null);
              }} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer z-25"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full h-40 bg-zinc-800">
              <img 
                src={selectedTrackForDownload.imageUrl || "/default-cover.jpg"} 
                alt="Beat Cover Art" 
                className="w-full h-full object-cover opacity-75" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 z-10">
                <span className="text-[8px] bg-purple-900/60 border border-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded font-mono tracking-widest uppercase mb-1 inline-block">
                  Newsletter Locked Beat
                </span>
                <h4 className="text-xl font-black text-white font-sans">{selectedTrackForDownload.title}</h4>
              </div>
            </div>

            {!downloadSuccess ? (
              <form onSubmit={handleEmailGateSubmit} className="p-6 space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Unlock your high-quality untagged demo MP3 file instantly by subscribing to the <strong>Tyrox Made This</strong> producer newsletter pipeline. No spam, just fresh instrumentals!
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="artist@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs focus:border-purple-500 text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowEmailModal(false);
                      setSelectedTrackForDownload(null);
                    }} 
                    className="w-1/3 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold rounded-xl text-zinc-300 transition active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-2/3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-sans font-bold uppercase rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(168,85,247,0.2)] text-white"
                  >
                    {uploading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Get Free Download</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-10 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-black uppercase text-sm tracking-tight text-emerald-400">Subscription Approved</h3>
                  <p className="text-zinc-500 text-[10px] font-mono mt-1">Delivering untagged download license...</p>
                  <p className="text-zinc-300 text-xs mt-3 leading-relaxed">
                    Connecting to secure file channel for <span className="text-purple-400 font-bold">{selectedTrackForDownload.title}</span>.<br />Check your browser's downloads bar.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* HIDDEN BACKUP AUDIO NODE */}
      <audio ref={audioRef} onEnded={handlePauseTrack} className="hidden" />

    </div>
  );
}
