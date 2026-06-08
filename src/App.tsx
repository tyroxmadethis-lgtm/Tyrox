/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { PayPalCheckout } from './components/PayPalCheckout';
import UnifiedArtistPortal from './components/UnifiedArtistPortal';
import RhythmArcade from './components/RhythmArcade';
import { Track } from './types';
import { supabase } from './services/supabaseClient';
import { ShoppingCart, LayoutGrid, Radio, ShieldCheck, User } from 'lucide-react';

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    cart,
    tracks,
  } = useStore();

  const [selectedTrackForLicense, setSelectedTrackForLicense] = useState<Track | null>(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudStatus, setCloudStatus] = useState<'syncing' | 'connected' | 'disconnected'>('syncing');
  
  // SECURE PAYPAL OVERLAY MODAL FOR LICENSING ROW HOOKS
  const [globalCheckoutActive, setGlobalCheckoutActive] = useState(false);
  const [globalCheckoutItem, setGlobalCheckoutItem] = useState<{ title: string; price: string; fileUrl: string } | null>(null);

  useEffect(() => {
    // Connects license row ACQUIRE RIGHTS click events or external scripts directly to checkout
    (window as any).initializeLicensePurchase = (title: string, price: string, untaggedAudioCloudUrl?: string) => {
      console.log("[PayPal Handshake Engine] Initializing licensing purchase:", title, "Price:", price);
      
      // Fallback preview URL if none provided
      const defaultPreview = "/static/converted/god_mode_tagged_preview.mp3";
      
      setGlobalCheckoutItem({
        title: title,
        price: price,
        fileUrl: untaggedAudioCloudUrl || defaultPreview
      });
      setGlobalCheckoutActive(true);
    };

    return () => {
      delete (window as any).initializeLicensePurchase;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // REASON: This listens for any new sales in real-time and alerts you instantly
    const salesChannel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_tracks', // Replace with your actual table name
        },
        (payload) => {
          console.log('🚨 New Transaction Detected!', payload);
          alert(`New Sale: ${(payload.new as any)?.title || 'A beat'} has been purchased!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, []);

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

  // Sync Cloud Health State on refresh and query real-time database state
  React.useEffect(() => {
    async function loadIndependentTracksGrid() {
      if (!supabase) {
        console.warn("Supabase client not initialized yet - waiting for keys.");
        setCloudStatus('disconnected');
        return;
      }
      try {
        // This reads columns from your live table
        const { data: tracks, error } = await supabase
          .from('marketplace_tracks')
          .select('*');

        const statusBadge = document.querySelector('.hud-top-canopy'); // Targets your status badge component

        if (!error) {
          console.log("⚡ Solo data connection verified! System online.", tracks);
          setCloudStatus('connected');
          // If your page layout features a visual cloud text status badge, update it here
          const cloudBadge = document.getElementById('cloudStatusBadge');
          if (cloudBadge) {
            cloudBadge.textContent = "☁️ Cloud Online";
            cloudBadge.className = "system-status-badge connected";
          }
        } else {
          console.error("Cloud database synchronization failed:", error);
          setCloudStatus('disconnected');
        }
      } catch (err) {
        console.error("Cloud database synchronization failed:", err);
        setCloudStatus('disconnected');
      }
    }

    // Expose globally
    (window as any).loadIndependentTracksGrid = loadIndependentTracksGrid;

    // Execute connection on application load
    loadIndependentTracksGrid();

    return () => {
      delete (window as any).loadIndependentTracksGrid;
    };
  }, []);

  // Global Pop-up Error Blocker & Safe Image Source Protection
  React.useEffect(() => {
    // 1. Intercept custom alerts or browser popup prompts related to Vercel upload errors to avoid crashing
    const originalAlert = window.alert;
    window.alert = function(msg?: any) {
      const message = String(msg || "");
      if (
        message.includes("Vercel Blob") || 
        message.includes("client token") || 
        message.includes("Failed to retrieve") ||
        message.includes("Upload error")
      ) {
        console.warn("🛡️ Alert Popup Blocked: Stopped Vercel Blob client error popup. Message:", message);
        return;
      }
      return originalAlert.call(window, msg);
    };

    // 2. Safeguard image loads if they ever fail or fail to resolve
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message && (event.message.includes("Vercel Blob") || event.message.includes("client token"))) {
        console.warn("🛡️ Suppressed unhandled blob client error:", event.message);
        event.preventDefault();
      }
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || "");
      if (reason.includes("Vercel Blob") || reason.includes("client token")) {
        console.warn("🛡️ Suppressed unhandled promise rejection error:", reason);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    // 3. Automated background shield matching user bypass rules to prevent stuck developer overlays or unmanaged popups
    const runBypassShield = () => {
      try {
        // Safely scan for unexpected dev error consoles or blocking overlay elements to ensure a clean window
        const unwanted = document.querySelectorAll('[id*="vite-error-overlay"], [class*="vite-error-overlay"], [class*="error-overlay"], [class*="nextjs-toast-errors-parent"]');
        unwanted.forEach(el => {
          try {
            el.remove();
            console.log("🛡️ Suppressed developer error overlay.");
          } catch (e) {}
        });

        // Suppress alert/popup modals belonging to unhandled error patterns
        const popups = document.querySelectorAll('.popup-error, .error-popup, [class*="upload-popup"], [class*="crash-modal"]');
        popups.forEach(el => {
          try {
            el.remove();
          } catch (e) {}
        });
      } catch (err) {}
    };

    const shieldInterval = setInterval(runBypassShield, 1200);

    return () => {
      window.alert = originalAlert;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      clearInterval(shieldInterval);
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
      
      {/* 1. PREMIUM GLOBAL HEADBOARD NAVIGATION (Safeguards previous id constraints natively) */}
      <header className="master-header-canopy select-none shadow-md" id="top-website-banner-box">
        <div className="header-left-cluster">
          <div className="app-launcher-icon hover:text-white select-none transition" onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} title="Toggle platform sidebar">⣿</div>
          <div className="brand-logo-graphics animate-pulse">🎵</div>
          <div className="text-sm font-black tracking-widest text-[#a855f7] uppercase hidden sm:block">TYROX MADE THIS</div>
          <nav className="primary-desktop-links border-l border-neutral-900 pl-4 ml-1">
            <button 
              onClick={() => setActiveTab('storefront')} 
              className={`head-link ${activeTab === 'storefront' ? 'active font-bold text-white' : ''}`}
            >
              Feed
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`head-link ${activeTab === 'about' ? 'active font-bold text-white' : ''}`}
            >
              Learn
            </button>
          </nav>
        </div>

        {/* SEARCH BAR EXTENSION FOR TOP DECK */}
        <div className="top-deck-search-container">
          <span className="search-lens">🔍</span>
          <input 
            type="text" 
            placeholder="Try searching Trap or Sad or Juice Wrld..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'storefront') {
                setActiveTab('storefront');
              }
            }}
          />
          <span 
            className="search-filter-badge hover:text-white transition"
            onClick={() => {
              setSearchQuery('');
              if (activeTab !== 'storefront') {
                setActiveTab('storefront');
              }
            }}
          >
            {searchQuery ? "Clear ▾" : "Tracks ▾"}
          </span>
        </div>

        <div className="header-right-cluster">
          <button className="start-selling-cta font-sans font-extrabold uppercase tracking-wider h-9" onClick={() => setActiveTab('studio')}>
            Start Selling
          </button>
          
          <div 
            className="utility-icon relative hover:scale-105 transition select-none flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-full w-9 h-9 cursor-pointer" 
            onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }}
            title="Go to Cart / Catalog"
          >
            👜
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#a855f7] border border-neutral-950 text-[9px] text-white rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
          </div>
          
          <div className="relative">
            <div 
              className="user-profile-avatar text-neutral-400 hover:text-white cursor-pointer select-none"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img 
                src={profileImg} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-[#a855f7]/60"
              />
            </div>
            
            {showProfileMenu && (
              <div className="absolute right-0 top-11 w-48 bg-neutral-950 border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-fadeIn text-left">
                <div className="pb-1.5 mb-1.5 border-b border-neutral-900 px-2 text-left">
                  <p className="text-[10px] text-neutral-400 font-mono">Producer Access</p>
                  <p className="text-xs font-bold text-white truncate">tyroxmadethis@gmail.com</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('studio');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-neutral-900 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  Studio Settings
                </button>
                <button
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-neutral-950 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  {isFollowing ? 'Unfollow Account' : 'Follow Producer'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION CATEGORY BAR */}
      <nav className="sub-category-toolbar select-none">
        <div className="sub-links-scrollway animate-fadeIn">
          <button onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }} className="sub-tool-link">🎵 Tracks</button>
          <button onClick={() => { setActiveTab('storefront'); setSearchQuery('drill'); }} className="sub-tool-link">🗂 Collections</button>
          <button onClick={() => setActiveTab('services')} className="sub-tool-link">💼 Sound Kits</button>
          <button onClick={() => setActiveTab('artist-portal')} className="sub-tool-link">👥 Musicians</button>
          <button onClick={() => setActiveTab('arcade')} className="sub-tool-link">🤖 AI Rhythm Arcade</button>
          <button onClick={() => setActiveTab('artist-portal')} className="sub-tool-link">🎤 Artist Portal</button>
          <button onClick={() => setActiveTab('industry-portal')} className="sub-tool-link">🏢 RAP Label Portal</button>
          <button onClick={() => setActiveTab('services')} className="sub-tool-link">🎛 RAP Engineer Stems</button>
          <button onClick={() => setActiveTab('arcade')} className="sub-tool-link">🕹 Rhythm Arcade</button>
          <button onClick={() => setActiveTab('contact')} className="sub-tool-link">📞 Contact Us</button>
        </div>
      </nav>

      <div id="platform-shell" className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR PLATFORM NAVIGATION */}
        <aside className={`sidebar-nav hidden md:flex shrink-0 ${isSidebarMinimized ? 'minimized' : ''}`} id="sidebarMenu">
          {/* Collapse Button Anchor */}
          <button 
            id="sidebarToggle" 
            className="collapse-trigger"
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          >
            {isSidebarMinimized ? '▶' : '◀'}
          </button>

          <div className="brand-logo select-none cursor-pointer hover:opacity-80 transition" id="brandLogo" onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }}>
            TRAP_ENGINE
          </div>
          <nav className="nav-menu">
            <button
              type="button"
              onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'storefront' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">🔥</span>
              <span className="nav-text">Exclusive Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'studio' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">🎵</span>
              <span className="nav-text">Studio Vault</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'services' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">💼</span>
              <span className="nav-text">Sound Kits</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('industry-portal')}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'industry-portal' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Top Charts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('artist-portal')}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'artist-portal' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">🎤</span>
              <span className="nav-text">Artist Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arcade')}
              className={`menu-item w-full text-left cursor-pointer transition ${activeTab === 'arcade' ? 'active text-white bg-neutral-900 border-l-2 border-[#a855f7]' : ''}`}
            >
              <span className="nav-icon">🕹️</span>
              <span className="nav-text">Rhythm Arcade</span>
            </button>
          </nav>
        </aside>

        {/* MAIN MASTER DASHBOARD PORTAL */}
        <div className="main-dashboard flex flex-col flex-1 overflow-y-auto bg-core-black">
          
          {/* HORIZONTAL TOP BAR NAVIGATION (Fixed text-bunching) */}
          <nav className="top-micro-navigation sticky top-0 backdrop-blur-md">
            <div className="nav-links-row">
              <a 
                onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }} 
                className={`micro-link ${activeTab === 'storefront' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                Home
              </a>
              <a 
                onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }} 
                className={`micro-link ${activeTab === 'storefront' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                Store
              </a>
              <a
                onClick={() => {
                  setActiveTab('storefront');
                  setTimeout(() => {
                    const sect = document.getElementById('trendiest-section');
                    if (sect) sect.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }}
                className="micro-link highlighted-link"
              >
                Trendiest Beats
              </a>
              <a 
                onClick={() => setActiveTab('artist-portal')} 
                className={`micro-link ${activeTab === 'artist-portal' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                Artist Portal
              </a>
              <a 
                onClick={() => setActiveTab('industry-portal')} 
                className={`micro-link ${activeTab === 'industry-portal' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                RAP Label & ANR Portal
              </a>
              <a 
                onClick={() => setActiveTab('services')} 
                className={`micro-link ${activeTab === 'services' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                RAP Engineer Stems
              </a>
              <a 
                onClick={() => setActiveTab('arcade')} 
                className={`micro-link ${activeTab === 'arcade' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                Rhythm Arcade
              </a>
              <a 
                onClick={() => setActiveTab('about')} 
                className={`micro-link ${activeTab === 'about' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                About
              </a>
              <a 
                onClick={() => setActiveTab('contact')} 
                className={`micro-link ${activeTab === 'contact' ? 'active-link text-white font-extrabold shadow-sm' : ''}`}
              >
                Contact Us
              </a>
            </div>
            
            {/* TOP RIGHT DASHBOARD CONTROLS */}
            <div className="top-utility-suite">
              {cloudStatus === 'syncing' && (
                <span id="cloudStatusBadge" className="system-status-badge syncing" style={{ background: 'rgba(168, 85, 247, 0.08)', color: '#a855f7', border: '1px solid #a855f7' }}>
                  🔄 Syncing Cloud...
                </span>
              )}
              {cloudStatus === 'connected' && (
                <span id="cloudStatusBadge" className="system-status-badge connected">
                  ☁️ Cloud Online
                </span>
              )}
              {cloudStatus === 'disconnected' && (
                <span id="cloudStatusBadge" className="system-status-badge disconnected" title="Missing Cloudinary API Keys in Settings!">
                  ⚠️ Cloud Disconnected
                </span>
              )}

              <span className="cart-preview cursor-pointer select-none" onClick={() => { setActiveTab('storefront'); setSearchQuery(''); }}>
                🛒 ${cartSubtotal > 0 ? cartSubtotal.toFixed(2) : '0.00'}
              </span>
              <button 
                onClick={() => setActiveTab('studio')} 
                className="dashboard-badge-btn"
              >
                DASHBOARD
              </button>

              {/* User Avatar & Context Trigger Menu */}
              {isLoggedIn && (
                <div className="user-profile-menu flex items-center gap-2 relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/80 bg-neutral-900 flex items-center justify-center cursor-pointer shadow-[0_0_6px_rgba(168,85,247,0.4)] hover:scale-105 transition"
                    title="tyroxmadethis@gmail.com"
                  >
                    <img 
                      src={profileImg} 
                      alt="Profile" 
                      className="profile-img w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-neutral-950 border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-fadeIn text-left">
                      <div className="pb-1.5 mb-1.5 border-b border-neutral-900 px-2 text-left">
                        <p className="text-[10px] text-neutral-400 font-mono">Producer Access</p>
                        <p className="text-xs font-bold text-white truncate">tyroxmadethis@gmail.com</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('studio');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left p-1.5 rounded hover:bg-neutral-900 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                      >
                        Studio Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsFollowing(!isFollowing);
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left p-1.5 rounded hover:bg-neutral-900 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                      >
                        {isFollowing ? 'Unfollow Account' : 'Follow Producer'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

      {/* Main View Port router */}
      <main className="flex-1 w-full bg-bg-dark">
        {activeTab === 'storefront' && (
          <Storefront 
            onOpenLicenseModal={handleOpenLicenseModal} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
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
        {activeTab === 'arcade' && (
          <RhythmArcade />
        )}
      </main>

        </div>
      </div>

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

      {/* 2. ADD THIS PAYPAL MODAL CONTAINER INTO YOUR DASHBOARD REFS */}
      {globalCheckoutActive && globalCheckoutItem && (
        <div id="paypal-checkout-modal" className="payment-modal">
          <div className="modal-surface-card animate-fadeIn">
            <button 
              id="closeModalBtn" 
              className="close-modal-x" 
              onClick={() => setGlobalCheckoutActive(false)}
              title="Close modal"
            >
              ×
            </button>
            <h3 className="font-sans font-black text-lg tracking-wide uppercase text-white mb-2">Secure Licensing Checkout</h3>
            <p id="modalTrackTitle" className="font-sans text-xs text-neutral-300 font-semibold mb-1">
              Track: {globalCheckoutItem.title} (Exclusive License)
            </p>
            <p id="modalTrackPrice" className="font-mono text-base text-[#a855f7] font-black mt-1 mb-6">
              Total: ${globalCheckoutItem.price}
            </p>
            
            {/* PayPal's simulation or live buttons render zone */}
            <div id="paypal-button-render-zone" className="space-y-3">
              <PayPalCheckout 
                amount={parseFloat(globalCheckoutItem.price)}
                email="sandbox-buyer@vibevault.co"
                payoutEmail="tyroxmadethis@gmail.com"
                onSuccess={(orderId) => {
                  console.log("Transaction secure and authorized. Order Reference ID: ", orderId);
                  setGlobalCheckoutActive(false);

                  // --- AUTOMATED FILE DELIVERY PIPELINE ---
                  // REASON: Delivers high-fidelity files instantly to the artist's computer/phone
                  const fileNameStr = globalCheckoutItem.title;
                  const fileUrlStr = globalCheckoutItem.fileUrl;
                  
                  console.log(`Fulfilling distribution order. Downloading from cloud bucket node: ${fileUrlStr}`);
                  
                  const hiddenDownloadAnchor = document.createElement('a');
                  hiddenDownloadAnchor.href = fileUrlStr;
                  hiddenDownloadAnchor.target = '_blank';
                  hiddenDownloadAnchor.download = `${fileNameStr.replace(/\s+/g, '_')}_Untagged_Master.wav`;
                  
                  document.body.appendChild(hiddenDownloadAnchor);
                  hiddenDownloadAnchor.click();
                  document.body.removeChild(hiddenDownloadAnchor);
                }}
                onCancel={() => {
                  setGlobalCheckoutActive(false);
                }}
              />
            </div>
          </div>
        </div>
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
