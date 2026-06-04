/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AudioProvider } from './context/AudioContext';
import { Storefront } from './components/Storefront';
import { VibeVaultStudio } from './components/VibeVaultStudio';
import { AudioPlayer } from './components/AudioPlayer';
import { LicenseModal } from './components/LicenseModal';
import { AboutView } from './components/AboutView';
import { ServicesView } from './components/ServicesView';
import { ContactView } from './components/ContactView';
import { IndustryPortalView } from './components/IndustryPortalView';
import { MilestonePlaqueModal } from './components/MilestonePlaqueModal';
import UnifiedArtistPortal from './components/UnifiedArtistPortal';
import { Track } from './types';
import { ShoppingCart, LayoutGrid, Radio, ShieldCheck, User } from 'lucide-react';

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    cart,
    tracks,
  } = useStore();

  const [selectedTrackForLicense, setSelectedTrackForLicense] = useState<Track | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileImg, setProfileImg] = useState(() => {
    return localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg";
  });

  const [bannerImg, setBannerImg] = useState(() => {
    return localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
  });

  const [activePlaqueData, setActivePlaqueData] = useState<{
    beat_id: string;
    track_title: string;
    certified_streams: number;
    award_type: string;
    presentee: string;
    print_template_url: string;
  } | null>(null);

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setProfileImg(customEvent.detail);
      }
    };
    const handleBannerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setBannerImg(customEvent.detail);
      }
    };
    const handleMilestone = (e: Event) => {
      const customEvent = e as CustomEvent<{
        beat_id: string;
        track_title: string;
        certified_streams: number;
        award_type: string;
        presentee: string;
        print_template_url: string;
      }>;
      if (customEvent.detail) {
        setActivePlaqueData(customEvent.detail);
      }
    };

    window.addEventListener('tyrox-profile-updated', handleUpdate);
    window.addEventListener('tyrox-banner-updated', handleBannerUpdate);
    window.addEventListener('vv-milestone-achieved', handleMilestone);

    return () => {
      window.removeEventListener('tyrox-profile-updated', handleUpdate);
      window.removeEventListener('tyrox-banner-updated', handleBannerUpdate);
      window.removeEventListener('vv-milestone-achieved', handleMilestone);
    };
  }, []);

  // Initialize custom profile info in localStorage on mount ONLY if not set yet!
  React.useEffect(() => {
    if (!localStorage.getItem('tyrox_bio')) {
      localStorage.setItem('tyrox_bio', "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. Merging high-fidelity sub-bass architecture directly with uncompressed master stems, Tyrox delivers clinical industry-standard track assets for label-ready artists.");
    }
    if (!localStorage.getItem('tyrox_socials')) {
      localStorage.setItem('tyrox_socials', JSON.stringify({
        tiktok: 'https://tiktok.com/@tyrox.made.this',
        instagram: 'https://instagram.com/tyroxmadethis/',
        twitter: 'https://twitter.com/Tyrox_made_this',
        youtube: 'https://youtube.com/@TyroxMadeThis'
      }));
    }
    
    // Read whatever values are currently in localStorage or fallback to initial defaults
    const currentProfile = localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg";
    const currentBanner = localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
    
    // Always sync image references with cache busting so any updated images render instantly
    const cleanProfilePath = currentProfile.split('?')[0];
    const cleanBannerPath = currentBanner.split('?')[0];
    
    const profilePath = `${cleanProfilePath}?t=${Date.now()}`;
    const bannerPath = `${cleanBannerPath}?t=${Date.now()}`;
    
    localStorage.setItem('tyrox_profile_img', profilePath);
    localStorage.setItem('tyrox_banner_img', bannerPath);
    
    // Set active states on boot
    setProfileImg(profilePath);
    setBannerImg(bannerPath);
    
    // Dispatch update events to synchronize any active storefront banner/profile views instantly
    window.dispatchEvent(new CustomEvent('tyrox-profile-updated', { detail: profilePath }));
    window.dispatchEvent(new CustomEvent('tyrox-banner-updated', { detail: bannerPath }));
  }, []);

  // Calculate cart count and value
  const cartCount = cart.length;
  const cartSubtotal = cart.reduce((acc, item) => acc + item.license.price, 0);

  // Simple automated handler to find track object
  const handleOpenLicenseModal = (track: Track) => {
    setSelectedTrackForLicense(track);
  };

  return (
    <div id="vibe-vault-root" className="min-h-screen bg-bg-dark text-neutral-100 flex flex-col font-sans select-none antialiased selection:bg-accent-green/20 selection:text-white">
      
      {/* Absolute Top Premium Header Background Banner */}
      <div 
        id="top-website-banner-box"
        className="w-full h-32 sm:h-40 md:h-48 relative overflow-hidden flex items-center justify-center bg-neutral-950 border-b border-neutral-900/60"
        style={{
          backgroundImage: `url('${bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay with elegant gradient/vignette for premium layout feel and strict readability */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-dark via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[#050608]/40 pointer-events-none" />
        
        {/* Ambient Overlay Content to emphasize branding and layout authority */}
        <div className="relative z-10 text-center select-none pointer-events-none px-4">
          <p className="text-purple-400 font-mono text-[9px] md:text-xs tracking-[0.35em] uppercase mb-1 drop-shadow font-bold animate-pulse">
            OFFICIAL ARTIST PORTAL
          </p>
          <h2 className="text-2xl md:text-4xl font-sans font-black uppercase tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            TYROX MADE THIS
          </h2>
          <p className="text-neutral-300 text-[10px] md:text-sm tracking-wide mt-1.5 font-light max-w-lg mx-auto drop-shadow-md">
            Premium Rap Licensing • High-Contrast Audio Waveforms • Zero Middlemen
          </p>
        </div>
      </div>

      {/* Premium Top Navigation header - themed to background */}
      <header className="sticky top-0 bg-[#050608]/95 border-b border-neutral-900/40 px-4 md:px-8 py-4 flex items-center justify-between z-30 backdrop-blur-md">
        
        {/* Left Side Brand info */}
        <div className="flex items-center gap-2">
          <h1 
            onClick={() => setActiveTab('storefront')}
            className="font-logo text-2xl md:text-3xl font-medium tracking-tight text-white select-none cursor-pointer hover:text-purple-400 transition"
          >
            tyrox made this
          </h1>
        </div>

        {/* Central Nav links matching the user's custom HTML copy-paste block */}
        <nav style={{ display: 'flex', gap: '20px', backgroundColor: '#111', padding: '15px' }} className="rounded-xl flex-wrap items-center">
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); setActiveTab('storefront'); }} 
            style={{ color: activeTab === 'storefront' ? '#c084fc' : 'white', textDecoration: 'none', fontWeight: 'bold' }}
            className="hover:opacity-80 transition"
          >
            Home
          </a>
          <a 
            href="/store" 
            onClick={(e) => { e.preventDefault(); setActiveTab('storefront'); }} 
            style={{ color: 'white', textDecoration: 'none' }}
            className="hover:opacity-80 transition"
          >
            Store
          </a>
          <a 
            href="/artist-portal" 
            onClick={(e) => { e.preventDefault(); setActiveTab('artist-portal'); }} 
            style={{ color: activeTab === 'artist-portal' ? '#c084fc' : 'white', textDecoration: 'none', fontWeight: activeTab === 'artist-portal' ? 'bold' : 'normal' }}
            className="hover:opacity-80 transition"
          >
            Artist Portal
          </a>
          <a 
            href="/industry-portal" 
            onClick={(e) => { e.preventDefault(); setActiveTab('industry-portal'); }} 
            style={{ color: activeTab === 'industry-portal' ? '#c084fc' : 'white', textDecoration: 'none' }}
            className="hover:opacity-80 transition"
          >
            RAP Label & ANR Portal
          </a>
          <a 
            href="/pro-services" 
            onClick={(e) => { e.preventDefault(); setActiveTab('services'); }} 
            style={{ color: activeTab === 'services' ? '#c084fc' : 'white', textDecoration: 'none' }}
            className="hover:opacity-80 transition"
          >
            RAP Engineer Stems
          </a>
          <a 
            href="/about" 
            onClick={(e) => { e.preventDefault(); setActiveTab('about'); }} 
            style={{ color: activeTab === 'about' ? '#c084fc' : 'white', textDecoration: 'none' }}
            className="hover:opacity-80 transition"
          >
            About
          </a>
          <a 
            href="/contact" 
            onClick={(e) => { e.preventDefault(); setActiveTab('contact'); }} 
            style={{ color: activeTab === 'contact' ? '#c084fc' : 'white', textDecoration: 'none' }}
            className="hover:opacity-80 transition"
          >
            Contact Us
          </a>
          
          <button 
            onClick={() => setActiveTab('studio')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10111a] border border-neutral-800 text-[11px] font-mono transition cursor-pointer ml-auto ${
              activeTab === 'studio' ? 'text-purple-400 border-purple-500/30' : 'hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Studio Dashboard
          </button>
        </nav>

        {/* Right side cart state and account info */}
        <div className="flex items-center gap-5">
          {/* Mock magnifier search toggle */}
          <button 
            onClick={() => setActiveTab('storefront')}
            className="text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
            </svg>
          </button>
          
          {/* Quick inline cart info widget styled exactly as [$0.00] in screenshot */}
          <button
            onClick={() => setActiveTab('storefront')}
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition cursor-pointer active:scale-95 text-xs font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[18px] h-[18px] text-neutral-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="font-sans font-bold">${cartSubtotal > 0 ? cartSubtotal.toFixed(2) : '0.00'}</span>
            {cartCount > 0 && (
              <span className="bg-purple-600 rounded text-[9px] font-bold font-mono text-white px-1.5 py-0.2">{cartCount}</span>
            )}
          </button>

          {/* User badge with Instagram style Follow button */}
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 bg-neutral-900 flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.4)]" title="tyroxmadethis@gmail.com">
               <img 
                src={profileImg} 
                alt="User profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-2 py-0.5 text-[8px] font-sans font-bold uppercase rounded tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                isFollowing 
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750 border border-neutral-700/50' 
                  : 'bg-[#0095f6] hover:bg-[#18a0fb] text-white font-extrabold shadow-[0_1px_5px_rgba(0,149,246,0.3)]'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

        </div>

      </header>

      {/* Main View Port router */}
      <main className="flex-1 w-full bg-bg-dark">
        {activeTab === 'storefront' && (
          <Storefront onOpenLicenseModal={handleOpenLicenseModal} />
        )}
        {activeTab === 'artist-portal' && (
          <UnifiedArtistPortal />
        )}
        {activeTab === 'studio' && (
          <VibeVaultStudio />
        )}
        {activeTab === 'about' && (
          <AboutView />
        )}
        {activeTab === 'services' && (
          <ServicesView />
        )}
        {activeTab === 'contact' && (
          <ContactView />
        )}
        {activeTab === 'industry-portal' && (
          <IndustryPortalView />
        )}
      </main>

      {/* Constant Bottom player control */}
      <AudioPlayer onOpenLicenseModal={handleOpenLicenseModal} />

      {/* Upgrades selecting overlay modal */}
      {selectedTrackForLicense && (
        <LicenseModal 
          track={selectedTrackForLicense} 
          onClose={() => setSelectedTrackForLicense(null)} 
        />
      )}

      {/* Interactive Platinum Record Plaque Achievement Award Overlay */}
      {activePlaqueData && (
        <MilestonePlaqueModal 
          plaqueData={activePlaqueData} 
          onClose={() => setActivePlaqueData(null)} 
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </StoreProvider>
  );
}
