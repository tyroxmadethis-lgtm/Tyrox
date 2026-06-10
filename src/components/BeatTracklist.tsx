/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Track } from '../types';
import AutomatedTracklistStore from './AutomatedTracklistStore';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Database, 
  Settings, 
  Terminal, 
  Share2, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface PayhipBeat {
  id: string | number;
  title: string;
  duration: string;
  bpm: string;
  tags: string[];
  price: string;
  artworkUrl: string;
  previewUrl: string;
  payhipUrl: string;
}

export default function BeatTracklist() {
  const { addTrack, tracks, playTrack, isPlaying, currentTrack } = useStore();

  // Load persistence credentials
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('vv_apify_token') || (import.meta as any).env.VITE_APIFY_TOKEN || 'YOUR_REAL_APIFY_TOKEN');
  const [payhipUsername, setPayhipUsername] = useState(() => localStorage.getItem('vv_payhip_username') || 'tyroxmadethis');

  // Control panel toggle
  const [showConfig, setShowConfig] = useState(false);

  // Scraped Beats State
  const [beats, setBeats] = useState<PayhipBeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [copiedBeatId, setCopiedBeatId] = useState<string | number | null>(null);

  // Share action with Web Share API and desktop fallback clipboard-copy
  const handleCustomShare = async (beatTitle: string, beatId: string | number) => {
    const formattedTitle = beatTitle.toLowerCase().replace(/\s+/g, '-');
    const customShareLink = `https://tyroxmadethis.com/${formattedTitle}`;
    
    addLog(`📢 Share action triggered for "${beatTitle}"...`);

    // 1. Check if the browser supports native mobile sharing (iOS/Android)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Listen to ${beatTitle} | TYROX MADE THIS`,
          text: `Check out this brand new beat by TYROX MADE THIS!`,
          url: customShareLink,
        });
        addLog(`✅ Native share successful.`);
      } catch (err) {
        addLog(`⚠️ Native share canceled or failed: ${String(err)}`);
        console.log("Native share canceled or failed", err);
      }
    } else {
      // 2. Fallback for desktop: Copy the link to clipboard automatically
      try {
        await navigator.clipboard.writeText(customShareLink);
        setCopiedBeatId(beatId);
        addLog(`📋 Link copied to clipboard dynamically: ${customShareLink}`);
        
        alert(`Link copied! Share it on Twitter, Facebook, or Tumblr: ${customShareLink}`);
        
        setTimeout(() => {
          setCopiedBeatId(null);
        }, 3000);
      } catch (err) {
        addLog(`⚠️ Failed to copy: ${String(err)}`);
      }
    }
  };

  // Diagnostic Log Ticker
  const [logs, setLogs] = useState<string[]>([
    "📂 Ready to connect Payhip live catalog scraper nodes...",
    "🔑 Set your Apify endpoint credentials using the panel above."
  ]);

  // Load live scraper feed automatically on mount (on autopilot)
  useEffect(() => {
    autoFetchPayhipProducts();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Synchronous scraper actor trigger query loop using Apify dataset endpoint on autopilot
  const autoFetchPayhipProducts = async () => {
    setLoading(true);
    addLog(`🔄 Initiating product inventory scraping cycle for creator: ${payhipUsername}...`);
    
    // Save credentials to local storage as requested
    localStorage.setItem('vv_apify_token', apiToken);
    localStorage.setItem('vv_payhip_username', payhipUsername);

    try {
      addLog("🚀 Dispatching payload to Apify endpoint router path...");
      
      const effectiveToken = apiToken && apiToken !== 'YOUR_REAL_APIFY_TOKEN'
        ? apiToken
        : ((import.meta as any).env.VITE_APIFY_TOKEN || 'YOUR_REAL_APIFY_TOKEN');

      const effectiveUsername = payhipUsername && payhipUsername !== 'YOUR_PAYHIP_USERNAME'
        ? payhipUsername
        : 'tyroxmadethis';

      if (effectiveToken === 'YOUR_REAL_APIFY_TOKEN' || effectiveUsername === 'YOUR_PAYHIP_USERNAME') {
        addLog("📋 [AUTOPILOT] Inactive credentials. Please configure real Apify token to scrape Payhip.");
        setBeats([]);
      } else {
        // Construct requested Apify synchronous actor dataset retrieval endpoint
        const urlToken = effectiveToken.startsWith("http")
          ? effectiveToken
          : `https://api.apify.com/v2/acts/vsekar91~payhip-creator-scraper/run-sync-get-dataset-items?token=${effectiveToken}`;
        
        addLog(`📡 Dispatched POST scraper trigger to synchronous endpoint: ${urlToken}`);
        const response = await fetch(urlToken, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creators: [effectiveUsername] })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP Error Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Format parsed properties
          const formatted: PayhipBeat[] = data.map((b: any, idx: number) => {
            const rawUrl = b.payhipUrl || b.url || "https://payhip.com";
            // Map standard landing '/b/' paths over to '/co/' format checkout URLs
            const formattedPayhipUrl = typeof rawUrl === 'string' ? rawUrl.replace('/b/', '/co/') : rawUrl;
            return {
              id: b.id || `scraped-${idx}`,
              title: b.title || b.name || "Scraped Beat",
              duration: b.duration || b.metadata?.duration || "03:15",
              bpm: b.bpm || b.metadata?.bpm || "140",
              tags: b.tags || (b.category ? [b.category] : ["Payhip", "Syndicated"]),
              price: b.price || b.amount || b.priceLabel || "29.99",
              artworkUrl: b.artworkUrl || b.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop",
              previewUrl: b.previewUrl || b.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              payhipUrl: formattedPayhipUrl
            };
          });
          setBeats(formatted);
          addLog(`🎉 Successfully acquired ${formatted.length} live Payhip products!`);
        } else {
          addLog("📥 Clean data sync completed, empty result returned.");
          setBeats([]);
        }
      }
    } catch (err: any) {
      addLog(`⚠️ Connection Refused: ${err.message || String(err)}`);
      setBeats([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync beats directly to standard marketplace storefront!
  const handleSyncToLiveCatalog = () => {
    if (beats.length === 0) {
      addLog("⚠️ Ingestion aborted: No parsed beats inside the catalog queue.");
      return;
    }

    addLog(`💿 Writing parsed inventory into live Storefront portal context database...`);
    let addedCount = 0;
    
    beats.forEach(beat => {
      // Check if beat already exists in local context to avoid infinite duplicates
      const exists = tracks.some(t => t.title.toLowerCase() === beat.title.toLowerCase());
      if (!exists) {
        const trackPrice = parseFloat(beat.price) || 29.99;
        addTrack({
          title: beat.title,
          producer: "Tyrox (Payhip)",
          bpm: parseInt(beat.bpm) || 140,
          key: "G#m",
          duration: beat.duration || "03:14",
          tags: beat.tags || ["Payhip", "Acoustic-Trap", "Syndicated"],
          imageUrl: beat.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
          audioUrl: beat.previewUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          price: trackPrice,
          prices: {
            mp3: trackPrice,
            wav: Math.round(trackPrice * 1.5 * 100) / 100,
            unlimited: Math.round(trackPrice * 3 * 100) / 100,
            exclusive: 499.00
          },
          payhipUrl: beat.payhipUrl || "https://payhip.com"
        });
        addedCount++;
      }
    });

    setSyncSuccess(`Success! Synced {addedCount} brand new Payhip beats onto your live Storefront catalog.`);
    addLog(`✨ Sync committed! ${addedCount} beats injected.`);
    
    setTimeout(() => {
      setSyncSuccess(null);
    }, 4500);
  };

  // Playback wrapper compatible with StoreContext structure 
  const handlePlayBeat = (beat: PayhipBeat) => {
    const dynamicTrack: Track = {
      id: `payhip-${beat.id}`,
      title: beat.title,
      producer: "Tyrox (Payhip)",
      bpm: parseInt(beat.bpm) || 140,
      key: "G#m",
      duration: beat.duration || "03:10",
      tags: beat.tags || ["Payhip", "Syndicated"],
      imageUrl: beat.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop",
      audioUrl: beat.previewUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      price: parseFloat(beat.price) || 29.99,
      prices: {
        mp3: parseFloat(beat.price) || 29.99,
        wav: (parseFloat(beat.price) || 29.99) * 1.5,
        unlimited: (parseFloat(beat.price) || 29.99) * 3,
        exclusive: 499.0
      },
      plays: 998,
      downloads: 142,
      sales: 4,
      createdAt: new Date().toISOString().split('T')[0],
      payhipUrl: beat.payhipUrl || "https://payhip.com"
    };

    playTrack(dynamicTrack);
  };

  const triggerBypassCheckout = (payhipUrl: string) => {
    // AUTOMATIC BYPASS: Mutates standard sales links to direct purchase popups
    // This transforms ://payhip.com into ://payhip.com automatically
    const bypassUrl = (payhipUrl || 'https://payhip.com').replace('/b/', '/co/');
    window.open(bypassUrl, '_blank', 'width=500,height=600');
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn font-sans text-white">
      {/* Sleek Horizontal Controller Strip replacing top banners */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-950 p-4 rounded-xl border border-zinc-900/40 gap-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
          <span className="font-sans font-bold text-xs uppercase tracking-widest text-zinc-400">
            Payhip Catalog Sync Center
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Settings Panel Toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 text-xs font-mono rounded border flex items-center gap-1.5 transition select-none cursor-pointer ${
              showConfig 
                ? 'bg-purple-900/25 border-purple-500/50 text-purple-300' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-805'
            }`}
          >
            <Settings size={12} />
            Configure Scraper
          </button>

          {/* Sync committed catalogs */}
          <button
            onClick={handleSyncToLiveCatalog}
            disabled={beats.length === 0}
            className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:text-zinc-600 border border-zinc-800 hover:border-purple-500 text-purple-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 select-none"
          >
            <Database size={11} />
            Sync to Storefront
          </button>
        </div>
      </div>

      {/* Collapsible Scraper Configuration Section */}
      {showConfig && (
        <div className="bg-[#0c0c0e] border border-zinc-900 rounded-xl p-5 space-y-5 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
                Apify API Token
              </label>
              <input
                type="text"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#121215] border border-zinc-900 rounded-lg text-xs text-zinc-200 font-mono outline-none focus:border-purple-500"
                placeholder="e.g. apf_Z8x..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
                Payhip Creator Username
              </label>
              <input
                type="text"
                value={payhipUsername}
                onChange={(e) => setPayhipUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#121215] border border-zinc-900 rounded-lg text-xs text-zinc-200 outline-none focus:border-purple-500"
                placeholder="e.g. tyroxmadethis"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-1 gap-4">
            <button
              onClick={autoFetchPayhipProducts}
              disabled={loading}
              className="px-4 py-2 bg-purple-650 hover:bg-purple-600 border border-purple-500/25 text-white font-sans font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-2 cursor-pointer select-none active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? "animate-spin text-purple-300" : "text-purple-300"} />
              {loading ? "Discovering Products..." : "Run Apify Scraper"}
            </button>

            <span className="text-[10px] text-zinc-500 font-mono">
              Synchronous ingestion router v2.5
            </span>
          </div>

          {/* Diagnostics Log Console */}
          <div className="space-y-2 pt-2">
            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Terminal size={10} />
              Diagnostics Log Feed
            </label>
            <div className="h-28 bg-black border border-zinc-900 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-purple-400/90 overflow-y-auto space-y-1 scrollbar-thin select-none">
              {logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {syncSuccess && (
        <div className="p-3.5 bg-emerald-950/25 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="text-emerald-400 shrink-0" size={15} />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Main Tracklist Viewport matching user-specified structure custom-styled table */}
      <div className="w-full bg-[#0a0a0c] text-white font-sans rounded-xl overflow-hidden shadow-2xl border border-zinc-900/50">
        
        {/* Table Headers */}
        <div className="grid grid-cols-[auto_1fr_110px_90px_200px_auto] gap-4 items-center px-6 py-3 border-b border-zinc-900 bg-[#0d0d11] text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <div className="w-12 text-center">#</div>
          <div>Title</div>
          <div className="text-center">Time</div>
          <div className="text-center">BPM</div>
          <div>Tags</div>
          <div className="w-[140px]"></div>
        </div>

        {/* Track Rows */}
        {beats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 space-y-2 bg-[#0a0a0c]">
            <AlertCircle size={32} className="text-zinc-800" />
            <p className="text-xs">No scraped beats loaded in queue.</p>
            <p className="text-[10px] font-mono">Use the scraper settings panel to crawl your database.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/40">
            {beats.map((beat, index) => {
              const isCurrentPlaying = currentTrack?.id === `payhip-${beat.id}` && isPlaying;
              
              const tagsList = beat.tags || ["Payhip", "Syndicated"];
              
              return (
                <div 
                  key={beat.id} 
                  className={`grid grid-cols-[auto_1fr_110px_90px_200px_auto] gap-4 items-center px-6 py-4 transition-all duration-200 group hover:bg-[#121217] ${
                    isCurrentPlaying ? 'bg-[#12121a]/80 border-l-2 border-purple-500' : ''
                  }`}
                >
                  {/* Image Thumbnail & Play Trigger */}
                  <div 
                    className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800 shadow-md flex-shrink-0 cursor-pointer" 
                    onClick={() => handlePlayBeat(beat)}
                  >
                    <img 
                      src={beat.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop"} 
                      alt={beat.title} 
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isCurrentPlaying ? (
                        /* Pause Icon */
                        <svg className="w-5 h-5 text-purple-400 fill-current" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      ) : (
                        /* Play Icon */
                        <svg className="w-5 h-5 text-white fill-current translate-x-[1px]" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Beat Title */}
                  <div className="truncate font-medium text-sm text-zinc-100 group-hover:text-white transition-colors">
                    {beat.title}
                  </div>

                  {/* Duration / Time */}
                  <div className="text-center text-sm text-zinc-400 font-mono">
                    {beat.duration || "03:15"}
                  </div>

                  {/* BPM */}
                  <div className="text-center text-sm text-zinc-400 font-mono">
                    {beat.bpm || "---"}
                  </div>

                  {/* Custom Genre/Artist Tags */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {tagsList.map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-400 border border-purple-800/20 shadow-sm hover:bg-purple-900/50 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons Group (Share + Buy) */}
                  <div className="flex items-center gap-3 w-[140px] justify-end">
                    {/* Custom Share Button */}
                    <button 
                      onClick={() => handleCustomShare(beat.title, beat.id)}
                      className={`p-2 rounded bg-zinc-900 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800/80 border border-zinc-800 transition-all active:scale-95 ${
                        copiedBeatId === beat.id ? 'text-emerald-400 border-emerald-500/35 bg-emerald-900/10' : ''
                      }`}
                      title={copiedBeatId === beat.id ? "Link Copied!" : "Share Beat"}
                    >
                      <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                      </svg>
                    </button>

                    {/* Secure Price Checkout Button */}
                    <button 
                      onClick={() => triggerBypassCheckout(beat.payhipUrl)}
                      className="flex items-center gap-1 px-4 py-2 rounded font-bold text-xs bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all shadow-md active:scale-95 cursor-pointer select-none"
                    >
                      <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      ${beat.price}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Real-time Autopilot Storefront */}
      <div className="pt-6 border-t border-zinc-900/60 mt-10">
        <AutomatedTracklistStore />
      </div>
    </div>
  );
}
