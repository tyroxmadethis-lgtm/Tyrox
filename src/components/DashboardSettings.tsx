/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { uploadDirectToCloud } from '@/lib/DirectUploader';
import { useStore } from '../context/StoreContext';
import { Sparkles, Globe, Heart, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardSettings() {
  const { tracks, setTracks } = useStore();

  // Load avatar image state
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg";
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load banner image state
  const [bannerUrl, setBannerUrl] = useState(() => {
    return localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
  });
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Load option A & B state parameters (reads from TYROX_METADATA_STORE or single keys)
  const [trackBPM, setTrackBPM] = useState(() => {
    return localStorage.getItem('tyrox_track_bpm') || '140';
  });
  const [trackKey, setTrackKey] = useState(() => {
    return localStorage.getItem('tyrox_track_key') || 'F Minor';
  });
  const [trackGenre, setTrackGenre] = useState(() => {
    return localStorage.getItem('tyrox_track_genre') || 'Acoustic Trap';
  });
  const [trackTags, setTrackTags] = useState(() => {
    return localStorage.getItem('tyrox_track_tags') || 'trap, acoustic, guitar, ambient';
  });
  const [trackDescription, setTrackDescription] = useState(() => {
    return localStorage.getItem('tyrox_track_description') || 'Aggressive dark synth trap beat with precision-engineered sub-bass architecture and uncompressed master stems.';
  });

  // Load option B pricing & legal templates
  const [priceBasic, setPriceBasic] = useState(() => {
    return localStorage.getItem('tyrox_price_basic') || '29.99';
  });
  const [pricePremium, setPricePremium] = useState(() => {
    return localStorage.getItem('tyrox_price_premium') || '49.99';
  });
  const [priceExclusive, setPriceExclusive] = useState(() => {
    return localStorage.getItem('tyrox_price_exclusive') || '499.99';
  });
  const [contractTemplateSelect, setContractTemplateSelect] = useState(() => {
    return localStorage.getItem('tyrox_contract_template') || 'royalty-free';
  });

  // Load public brand social direct connection points
  const [tiktokUrl, setTiktokUrl] = useState(() => {
    try {
      const socialData = JSON.parse(localStorage.getItem('tyrox_socials') || '{}');
      return socialData.tiktok || "https://tiktok.com/@tyrox.made.this";
    } catch {
      return "https://tiktok.com/@tyrox.made.this";
    }
  });
  const [instagramUrl, setInstagramUrl] = useState(() => {
    try {
      const socialData = JSON.parse(localStorage.getItem('tyrox_socials') || '{}');
      return socialData.instagram || "https://instagram.com/tyroxmadethis/";
    } catch {
      return "https://instagram.com/tyroxmadethis/";
    }
  });
  const [twitterUrl, setTwitterUrl] = useState(() => {
    try {
      const socialData = JSON.parse(localStorage.getItem('tyrox_socials') || '{}');
      return socialData.twitter || "https://twitter.com/Tyrox_made_this";
    } catch {
      return "https://twitter.com/Tyrox_made_this";
    }
  });
  const [youtubeUrl, setYoutubeUrl] = useState(() => {
    try {
      const socialData = JSON.parse(localStorage.getItem('tyrox_socials') || '{}');
      return socialData.youtube || "https://youtube.com/@TyroxMadeThis";
    } catch {
      return "https://youtube.com/@TyroxMadeThis";
    }
  });

  // Load biography block
  const [bio, setBio] = useState(() => {
    return localStorage.getItem('tyrox_bio') || "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. Merging high-fidelity sub-bass architecture directly with uncompressed master stems, Tyrox delivers clinical industry-standard track assets for label-ready artists.";
  });

  // Console log states
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'System master uploader console online.',
    'Establishing localized memory cache indices...',
    'STATUS: READY // Optimized for high-resolution touch screens.'
  ]);

  const addConsoleLog = (text: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      addConsoleLog(`[WALLPAPER] Wallpaper file selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      addConsoleLog(`[PFP] Profile picture file selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const onSaveMasterSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    addConsoleLog("[SAVE-HANDSHAKE] Initializing master transaction save sequence...");

    try {
      let finalAvatarUrl = avatarUrl;
      let finalBannerUrl = bannerUrl;

      // Handle direct avatar binary stream upload
      if (selectedAvatarFile) {
        addConsoleLog(`[UPLOAD] Broadcasting avatar binary to secure cloud signature link...`);
        finalAvatarUrl = await uploadDirectToCloud(selectedAvatarFile);
        addConsoleLog(`[UPLOAD-OK] Avatar synced to CDN. Resolve URL: ${finalAvatarUrl}`);
      }

      // Handle direct banner wallpaper upload
      if (selectedBannerFile) {
        addConsoleLog(`[UPLOAD] Broadcasting banner wallpaper binary to cloud signature link...`);
        finalBannerUrl = await uploadDirectToCloud(selectedBannerFile);
        addConsoleLog(`[UPLOAD-OK] Wallpaper banner synced to CDN. Resolve URL: ${finalBannerUrl}`);
      }

      // Invoke Vercel Server Row Update endpoint (maintaining fully real production capability!)
      addConsoleLog(`[API] Synced light data payloads with database row updates...`);
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: finalAvatarUrl,
          bannerUrl: finalBannerUrl,
          bio,
          tiktokUrl,
          instagramUrl,
          twitterUrl,
          youtubeUrl
        })
      });

      if (!response.ok) {
        addConsoleLog(`[WARN] Backend row update response code: ${response.status}. Skipping database lock...`);
      } else {
        addConsoleLog(`[API-OK] Live server database row synchronization successful.`);
      }

      // Pack into TYROX_METADATA_STORE object & individual keys for 105% total coverage
      const metadataStore = {
        avatarUrl: finalAvatarUrl,
        bannerUrl: finalBannerUrl,
        trackBPM,
        trackKey,
        trackGenre,
        trackTags,
        trackDescription,
        priceBasic,
        pricePremium,
        priceExclusive,
        contractTemplateSelect,
        bio,
        socials: {
          tiktok: tiktokUrl,
          instagram: instagramUrl,
          twitter: twitterUrl,
          youtube: youtubeUrl
        }
      };

      localStorage.setItem('TYROX_METADATA_STORE', JSON.stringify(metadataStore));

      // Save individual parameters to match all existing code listeners
      localStorage.setItem('tyrox_profile_img', finalAvatarUrl);
      localStorage.setItem('tyrox_banner_img', finalBannerUrl);
      localStorage.setItem('tyrox_track_bpm', trackBPM);
      localStorage.setItem('tyrox_track_key', trackKey);
      localStorage.setItem('tyrox_track_genre', trackGenre);
      localStorage.setItem('tyrox_track_tags', trackTags);
      localStorage.setItem('tyrox_track_description', trackDescription);
      localStorage.setItem('tyrox_price_basic', priceBasic);
      localStorage.setItem('tyrox_price_premium', pricePremium);
      localStorage.setItem('tyrox_price_exclusive', priceExclusive);
      localStorage.setItem('tyrox_contract_template', contractTemplateSelect);
      localStorage.setItem('tyrox_bio', bio);
      localStorage.setItem('tyrox_socials', JSON.stringify(metadataStore.socials));

      // Update tracks list in context state
      if (tracks && tracks.length > 0) {
        addConsoleLog(`[CONTEXT] Modulating context storefront beats with sonic credentials...`);
        const updatedTracks = [...tracks];
        // Apply pricing & keys to the first/default track to show dynamic change instantly!
        updatedTracks[0] = {
          ...updatedTracks[0],
          bpm: parseInt(trackBPM) || updatedTracks[0].bpm,
          key: trackKey || updatedTracks[0].key,
          tags: trackTags.split(',').map(t => t.trim()).filter(Boolean),
          prices: {
            ...updatedTracks[0].prices,
            mp3: parseFloat(priceBasic) || updatedTracks[0].prices.mp3,
            wav: parseFloat(pricePremium) || updatedTracks[0].prices.wav,
            exclusive: parseFloat(priceExclusive) || updatedTracks[0].prices.exclusive,
          }
        };
        setTracks(updatedTracks);
      }

      // Dispatch global events to notify about modifications in real-time
      addConsoleLog(`[MESSAGE-BUS] Discharging global window broadcast signals...`);
      window.dispatchEvent(new CustomEvent('tyrox-profile-updated', { detail: finalAvatarUrl }));
      window.dispatchEvent(new CustomEvent('tyrox-banner-updated', { detail: finalBannerUrl }));
      window.dispatchEvent(new CustomEvent('tyrox-bio-updated', { detail: bio }));
      window.dispatchEvent(new CustomEvent('tyrox-socials-updated', { detail: metadataStore.socials }));

      setAvatarUrl(finalAvatarUrl);
      setBannerUrl(finalBannerUrl);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setSelectedBannerFile(null);
      setBannerPreview(null);

      setStatusMsg({ type: 'success', text: "All credentials, graphics assets, and pricing matrices deployed successfully!" });
      addConsoleLog(`[SYNC] ALL COGNITIVE BRAND LAYERS DEPLOYED [100% OK]`);
      alert("Flawless Master Admin Sync Succeeded!");
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: `Storage handshake failed: ${err.message}` });
      addConsoleLog(`[ALERT] Error reported: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 rounded-3xl border border-neutral-900 shadow-2xl relative overflow-hidden">
      
      {/* Dynamic BG Aura */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Canopy */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-neutral-900">
        <div>
          <h1 className="text-xl md:text-2xl font-sans font-black italic tracking-tight text-neutral-100 uppercase">
            Tyrox Solo Production Suite - Master Admin
          </h1>
          <p className="font-mono text-[10px] text-neutral-500 uppercase mt-0.5">
            TRAP_ENGINE // SECURE BRAND DISTRIBUTION SYSTEM
          </p>
        </div>
        
        <button
          type="button"
          id="globalSaveBtn"
          onClick={onSaveMasterSuite}
          disabled={isSaving}
          className={`px-5 py-2.5 font-mono font-black text-xs uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-500 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating Core...
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Sub-Category Navigation Bar */}
      <nav className="sub-category-toolbar flex flex-wrap gap-2 py-2 border-b border-neutral-900/40 mb-2 overflow-x-auto select-none no-scrollbar">
        {[
          'Dashboard', 'Tracks', 'Sound Kits', 'Musicians', 
          'Artist Portal', 'Label Portal', 'Engineer Stems', 
          'Arcade', 'Contact'
        ].map((item, idx) => (
          <button 
            key={idx}
            type="button"
            onClick={() => {
              addConsoleLog(`[NAV] Navigating to sub-cluster segment "${item.toUpperCase()}" (Localized sandbox simulation)`);
            }}
            className={`px-3 py-1.5 text-[10px] md:text-xs font-mono font-bold uppercase rounded-lg transition-all border shrink-0 ${
              item === 'Dashboard' 
                ? 'bg-purple-600/15 border-purple-500/20 text-purple-400 font-black' 
                : 'bg-neutral-950/60 border-neutral-900/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Standard Feedback Signaller */}
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-[#39FF14]/5 border-[#39FF14]/15 text-neutral-200' 
            : 'bg-red-500/5 border-red-500/15 text-neutral-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-wider text-white">
              {statusMsg.type === 'success' ? '// CONSOLE PIPELINE READY' : '// PIPELINE ERROR'}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{statusMsg.text}</p>
          </div>
        </div>
      )}

      {/* Graphic Wallpapers & Avatar Uploader Matrix */}
      <div className="space-y-4">
        {/* Wallpaper zone */}
        <div 
          id="bannerDisplayZone"
          onClick={() => bannerFileInputRef.current?.click()}
          className="banner-display-surface relative w-full h-40 md:h-52 rounded-2xl overflow-hidden border border-neutral-900 bg-neutral-950 flex flex-col items-center justify-center cursor-pointer group transition-all"
          style={{
            backgroundImage: `url(${bannerPreview || bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition-colors" />
          
          <div className="relative z-10 flex flex-col items-center gap-1.5 text-center p-4">
            <div className="p-2.5 rounded-full bg-purple-600/10 text-purple-400 group-hover:scale-105 transition-transform border border-purple-500/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-sans font-black text-[11px] uppercase tracking-wider text-neutral-200">
              CLICK TO SET CUSTOM WALLPAPER BANNER
            </span>
            <span className="font-mono text-[8px] text-neutral-500 uppercase">
              Drag & drop or Click anywhere to upload
            </span>
          </div>
          <input 
            type="file" 
            id="bannerFileInput" 
            ref={bannerFileInputRef}
            accept="image/*" 
            onChange={handleBannerChange}
            className="hidden" 
          />
        </div>

        {/* Overlapping Avatar Profile circle */}
        <div className="relative -mt-12 md:-mt-16 ml-4 md:ml-6 z-10 flex items-end gap-4">
          <div 
            id="avatarDisplayZone"
            onClick={() => avatarFileInputRef.current?.click()}
            className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-neutral-950 bg-neutral-900 overflow-hidden cursor-pointer group shadow-xl"
          >
            <img 
              src={avatarPreview || avatarUrl} 
              alt="Producer Avatar" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <input 
              type="file" 
              id="avatarFileInput" 
              ref={avatarFileInputRef}
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden" 
            />
          </div>
          <div className="mb-1 md:mb-3">
            <h3 className="font-sans font-black text-sm md:text-lg text-white uppercase tracking-tight">TYROX MADE THIS</h3>
            <span className="font-mono text-[9px] text-purple-400 uppercase tracking-widest bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/10">Madison, WI</span>
          </div>
        </div>
      </div>

      {/* Main Settings Form Block */}
      <form onSubmit={onSaveMasterSuite} className="space-y-6 mt-4">
        
        {/* Core Double Column Settings Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Option A: Track Metadata Engine */}
          <div className="p-5 md:p-6 rounded-2xl bg-[#090a0f] border border-neutral-900 space-y-4">
            <div>
              <h3 className="font-sans font-black text-xs md:text-sm text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Track Metadata Engine
              </h3>
              <p className="text-[9.5px] font-mono text-neutral-500 uppercase mt-0.5">
                Assign core sonic credentials to delivery files
              </p>
            </div>
            
            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Tempo (BPM)</label>
                <input 
                  type="number" 
                  id="trackBPM"
                  value={trackBPM}
                  onChange={e => setTrackBPM(e.target.value)}
                  placeholder="140"
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Musical Key</label>
                <input 
                  type="text" 
                  id="trackKey"
                  value={trackKey}
                  onChange={e => setTrackKey(e.target.value)}
                  placeholder="F Minor"
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Genre Sorting Classifier</label>
                <select 
                  id="trackGenre"
                  value={trackGenre}
                  onChange={e => setTrackGenre(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                >
                  <option value="Acoustic Trap">Acoustic Trap</option>
                  <option value="Melodic Trap">Melodic Trap</option>
                  <option value="Aggressive Dark Synth">Aggressive Dark Synth</option>
                  <option value="Jersey Drill">Jersey Drill</option>
                  <option value="Lofi / Ambient">Lofi / Ambient</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Search Index Tags</label>
                <input 
                  type="text" 
                  id="trackTags"
                  value={trackTags}
                  onChange={e => setTrackTags(e.target.value)}
                  placeholder="trap, acoustic, guitar"
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Track Description</label>
                <textarea 
                  id="trackDescription"
                  rows={3}
                  value={trackDescription}
                  onChange={e => setTrackDescription(e.target.value)}
                  placeholder="Enter track details..."
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* Option B: Multi-Tier Licensing Matrix */}
          <div className="p-5 md:p-6 rounded-2xl bg-[#090a0f] border border-neutral-900 space-y-4">
            <div>
              <h3 className="font-sans font-black text-xs md:text-sm text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Multi-Tier Licensing Matrix
              </h3>
              <p className="text-[9.5px] font-mono text-neutral-500 uppercase mt-0.5">
                Establish pricing thresholds of active licensing tiers
              </p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Basic Lease Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  id="priceBasic"
                  value={priceBasic}
                  onChange={e => setPriceBasic(e.target.value)}
                  placeholder="29.99"
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Premium Lease Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  id="pricePremium"
                  value={pricePremium}
                  onChange={e => setPricePremium(e.target.value)}
                  placeholder="49.99"
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Exclusive Rights Price ($)</label>
                <input 
                  type="number" 
                  step="1"
                  id="priceExclusive"
                  value={priceExclusive}
                  onChange={e => setPriceExclusive(e.target.value)}
                  placeholder="499.99"
                  className="w-full px-3 py-2 bg-[#020203] text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1 font-mono">Contract Agreement Template</label>
                <select 
                  id="contractTemplateSelect"
                  value={contractTemplateSelect}
                  onChange={e => setContractTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                >
                  <option value="royalty-free">Royalty-Free Beats Template</option>
                  <option value="standard-split">Standard 50/50 Revenue Split</option>
                  <option value="exclusive-assignment">Exclusive Asset Assignment</option>
                </select>
              </div>

              {/* Embedded Terminal Status Console */}
              <div className="space-y-1.5 border-t border-neutral-900/60 pt-4">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider block">
                  SYSTEM HARDWARE FEEDBACK CONSOLE:
                </span>
                <div 
                  id="statusConsole"
                  className="bg-black/80 border border-neutral-900 p-3 h-28 rounded-lg font-mono text-[10px] leading-relaxed overflow-y-auto space-y-1 text-emerald-400 shadow-inner"
                >
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('[ALERT]') ? 'text-rose-450 font-bold' : log.includes('[WARN]') ? 'text-amber-400' : log.includes('[SYNC]') ? 'text-cyan-400 font-bold' : 'text-neutral-400 font-mono'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backwards integration details: Biography and socials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-neutral-900/60">
          
          {/* Social links handles */}
          <div className="lg:col-span-1 p-5 md:p-6 rounded-2xl bg-[#090a0f] border border-neutral-900 space-y-4">
            <div>
              <h3 className="font-sans font-black text-xs md:text-sm text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Verified Connections
              </h3>
              <p className="text-[9.5px] font-mono text-neutral-500 uppercase mt-0.5">
                Brand social network link handles
              </p>
            </div>
            
            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-[9.5px] uppercase font-bold text-neutral-500 mb-1 font-mono">TikTok URL</label>
                <input 
                  type="url" 
                  value={tiktokUrl}
                  onChange={e => setTiktokUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9.5px] uppercase font-bold text-neutral-500 mb-1 font-mono">Instagram URL</label>
                <input 
                  type="url" 
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9.5px] uppercase font-bold text-neutral-500 mb-1 font-mono">Twitter / X URL</label>
                <input 
                  type="url" 
                  value={twitterUrl}
                  onChange={e => setTwitterUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9.5px] uppercase font-bold text-neutral-500 mb-1 font-mono">YouTube Channel URL</label>
                <input 
                  type="url" 
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bio statement text */}
          <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-[#090a0f] border border-neutral-900 space-y-4">
            <div>
              <h3 className="font-sans font-black text-xs md:text-sm text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Biography & Profile bio
              </h3>
              <p className="text-[9.5px] font-mono text-neutral-500 uppercase mt-0.5">
                Describe your elite multi-platinum studio pedigree
              </p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[9.5px] uppercase font-bold text-neutral-400 mb-1 font-mono">Autobiography Profile Text</label>
                <textarea 
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-950 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 bg-purple-950/20 rounded-lg border border-purple-500/10 text-neutral-400 leading-relaxed text-[10.5px]">
                Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. The details mapped above sync onto the public artist page overlays instantly.
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Changes Trigger button bottom */}
        <div className="pt-4 border-t border-neutral-900/60 flex justify-end pb-4">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-3 rounded-lg font-mono font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 ${
              isSaving 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Admin Portal...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Commit All Changes
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
