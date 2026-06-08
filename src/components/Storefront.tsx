/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Track, LicenseOption } from '../types';
import { 
  Search, Play, Pause, ShoppingBag, Trash2, Tag, Gift, 
  SlidersHorizontal, ArrowRight, Sparkles, Check, ChevronDown,
  Volume2, HelpCircle, Heart, Share2, Download, Music, ShieldCheck
} from 'lucide-react';
import { PayPalCheckout } from './PayPalCheckout';
import { apiFetch } from '../services/apiMock';
import FreeDownloadGateModal from './FreeDownloadGateModal';
import BeatStreamPlayer from './BeatStreamPlayer';
import BeatCatalogGrid from './BeatCatalogGrid';
import { supabase } from '../services/supabaseClient';

interface StorefrontProps {
  onOpenLicenseModal: (track: Track) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ 
  onOpenLicenseModal,
  searchQuery: externalSearchQuery,
  setSearchQuery: setExternalSearchQuery
}) => {
  const {
    tracks,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    applyCoupon,
    discountRate,
    activeCouponCode,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    setActiveTab,
    updateTrack,
    payoutEmail,
    payoutMethod,
  } = useStore();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = setExternalSearchQuery !== undefined ? setExternalSearchQuery : setLocalSearchQuery;
  const [selectedTag, setSelectedTag] = useState('All');
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [checkoutReceipt, setCheckoutReceipt] = useState<{ orderId: string; totalPaid: number; tracks: Array<{title: string, license: string}>; downloadSecureUrl?: string; legalContract?: any } | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showPayPalPayBlock, setShowPayPalPayBlock] = useState(false);

  // Stripe Custom Checkout States
  const [buyerName, setBuyerName] = useState('');
  const [stripeCard, setStripeCard] = useState({ number: '', expiry: '', cvc: '' });
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [showStripePayBlock, setShowStripePayBlock] = useState(false);
  
  // Free Download Modal State
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);
  const [downloadEmail, setDownloadEmail] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [activePlatform, setActivePlatform] = useState<'native' | 'airbit'>('native');
  const [airbitUrl, setAirbitUrl] = useState(() => {
    return localStorage.getItem('tyrox_airbit_url') || 'https://airbit.com/widgets/html5?uid=12354&config=301389';
  });

  const [bannerImg, setBannerImg] = useState(() => {
    return localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
  });

  const [profileImg, setProfileImg] = useState(() => {
    return localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg";
  });

  const [supabaseTracks, setSupabaseTracks] = useState<Track[]>([]);
  const [loadingSupabase, setLoadingSupabase] = useState(true);

  useEffect(() => {
    async function syncStorefrontWithLiveVault() {
      if (!supabase) {
        setLoadingSupabase(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('marketplace_tracks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Track[] = data.map((t: any, idx: number) => {
            const title = t.title || "Untitled Beat";
            const bpm = parseInt(t.bpm) || 140;
            const price = parseFloat(t.price) || 29.99;
            const streamUrl = t.stream_url || t.audioUrl || "/static/converted/god_mode_tagged_preview.mp3";
            const coverArt = t.cover_art_url || t.image_url || t.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop";

            return {
              id: t.id || `sb-track-${idx}`,
              title,
              producer: t.producer || "Tyrox",
              bpm,
              key: t.key || "Am",
              duration: t.duration || "3:10",
              tags: t.tags || ["Trap", "Dark"],
              imageUrl: coverArt,
              audioUrl: streamUrl,
              price,
              prices: {
                mp3: t.price_mp3 || price,
                wav: t.price_wav || 129.99,
                unlimited: t.price_unlimited || 299.99,
                exclusive: t.price_exclusive || 499.99
              },
              plays: t.plays || 0,
              downloads: t.downloads || 0,
              sales: t.sales || 0,
              streams: t.streams || t.plays || 0,
              createdAt: t.created_at || t.createdAt || new Date().toISOString()
            };
          });
          setSupabaseTracks(mapped);
          console.log("⚡ Success! Storefront layout completely synced with your direct cloud vault.");
        }
      } catch (err) {
        console.warn("Could not load cloud assets, using local fallback state loops:", err);
      } finally {
        setLoadingSupabase(false);
      }
    }

    // Expose dynamic synchronizer globally for live uploads integration
    (window as any).syncStorefrontWithLiveVault = syncStorefrontWithLiveVault;

    // Direct stream deck integration support as requested
    (window as any).loadTrackIntoBlazeDeck = (audioStreamUrl: string, trackTitle: string) => {
      const audioEngine = document.getElementById('nativeAudioEngine') as HTMLAudioElement;
      const playerTitleDisplay = document.getElementById('deckTrackTitle');

      if (audioEngine && playerTitleDisplay) {
        audioEngine.src = audioStreamUrl;
        playerTitleDisplay.textContent = trackTitle;
        audioEngine.play().catch(e => console.log("Stream init delayed until interaction:", e));
      }
    };

    syncStorefrontWithLiveVault();

    return () => {
      delete (window as any).syncStorefrontWithLiveVault;
      delete (window as any).loadTrackIntoBlazeDeck;
    };
  }, [tracks]);

  useEffect(() => {
    const handleBannerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setBannerImg(customEvent.detail);
      }
    };
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setProfileImg(customEvent.detail);
      }
    };
    window.addEventListener('tyrox-banner-updated', handleBannerUpdate);
    window.addEventListener('tyrox-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('tyrox-banner-updated', handleBannerUpdate);
      window.removeEventListener('tyrox-profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem('tyrox_banner_img', dataUrl);
        setBannerImg(dataUrl);
        window.dispatchEvent(new CustomEvent('tyrox-banner-updated', { detail: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem('tyrox_profile_img', dataUrl);
        setProfileImg(dataUrl);
        window.dispatchEvent(new CustomEvent('tyrox-profile-updated', { detail: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trendiest Beats Mouse/Touch Drag Slider Coordinates
  const trendiestSliderRef = useRef<HTMLDivElement | null>(null);
  const [isSliderDown, setIsSliderDown] = useState(false);
  const [sliderStartX, setSliderStartX] = useState(0);
  const [sliderScrollLeft, setSliderScrollLeft] = useState(0);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    const slider = trendiestSliderRef.current;
    if (!slider) return;
    setIsSliderDown(true);
    setSliderStartX(e.pageX - slider.offsetLeft);
    setSliderScrollLeft(slider.scrollLeft);
  };

  const handleSliderMouseLeave = () => {
    setIsSliderDown(false);
  };

  const handleSliderMouseUp = () => {
    setIsSliderDown(false);
  };

  const handleSliderMouseMove = (e: React.MouseEvent) => {
    const slider = trendiestSliderRef.current;
    if (!slider || !isSliderDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - sliderStartX) * 2; // scroll speed multiplier
    slider.scrollLeft = sliderScrollLeft - walk;
  };

  // Dynamically derive trendiest beats from the user's actual uploaded/streamed tracks
  const trendiestBeatsList = supabaseTracks.length > 0
    ? supabaseTracks
    : tracks
      .filter(t => (t.streams ?? t.plays ?? 0) > 0)
      .sort((a, b) => ((b.streams ?? b.plays ?? 0) - (a.streams ?? a.plays ?? 0)));

  // Dynamically derive mixes from any of the user's real beats that have hit at least 1 stream
  const streamEligibleMixes = supabaseTracks.length > 0
    ? supabaseTracks
    : tracks
      .filter(t => (t.streams ?? t.plays ?? 0) >= 1)
      .sort((a, b) => ((b.streams ?? b.plays ?? 0) - (a.streams ?? a.plays ?? 0)));

  const handleFreeDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadTrack || !downloadEmail.trim() || !downloadEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }

    // Add their email to the mailing list
    const existing = JSON.parse(localStorage.getItem('vv_newsletter_subscribers') || '[]');
    if (!existing.includes(downloadEmail)) {
      existing.push(downloadEmail);
      localStorage.setItem('vv_newsletter_subscribers', JSON.stringify(existing));
    }

    // Increment downloads count
    const updated = {
      ...downloadTrack,
      downloads: (downloadTrack.downloads || 0) + 1
    };
    updateTrack(updated);

    // Track instant free downloading activation in Google Analytics
    if (typeof window !== 'undefined' && (window as any).logFreeDownload) {
      (window as any).logFreeDownload(downloadTrack.title);
    }

    // Real-time backend tracking: auto-trigger free acquisition ledger logging
    apiFetch(`/api/v1/store/track-free-download?track_name=${encodeURIComponent(downloadTrack.title)}&buyer_email=${encodeURIComponent(downloadEmail)}`, {
      method: "POST"
    }).catch(err => console.error("Error logging free download tracking:", err));

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadTrack(null);
      setDownloadEmail('');
      setDownloadSuccess(false);
    }, 3000);
  };

  // Track-specific quick pricing dropdown toggle states
  const [activeQuickPriceTrackId, setActiveQuickPriceTrackId] = useState<string | null>(null);

  // Simple like states in local memory
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const toggleLike = (trackId: string) => {
    setLikedTrackIds(prev => 
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  };

  // View mode switcher: 'list' for high-density rows, 'grid' for new BeatCatalogGrid
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Extract unique tags
  const allTags = ['All', ...Array.from(new Set(tracks.flatMap(t => t.tags)))];

  // Filter tracks
  const filteredTracks = tracks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.producer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bpm.toString().includes(searchQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'All' || t.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  // Calculate cart sums
  const cartSubtotal = cart.reduce((acc, item) => acc + item.license.price, 0);
  const cartDiscount = cartSubtotal * discountRate;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const coupon = applyCoupon(couponCode);
    if (coupon) {
      setCouponMessage({ 
        text: `Coupon '${coupon.code}' applied! ${coupon.discountType === 'percentage' ? `${coupon.value}% off` : `$15 flat discount`}.`, 
        error: false 
      });
    } else {
      setCouponMessage({ text: 'Invalid or expired discount code.', error: true });
    }
  };

  const handlePayPalSuccess = (paypalOrderId: string) => {
    const itemsSummary = cart.map(item => ({
      title: item.track.title,
      license: item.license.name
    }));
    const totalPaid = cartTotal;

    // Track paid purchases: call live telemetry logger for every item in cart before clearing
    cart.forEach(item => {
      let finalPrice = item.license.price;
      if (discountRate > 0) {
        finalPrice = parseFloat((finalPrice * (1 - discountRate)).toFixed(2));
      }
      apiFetch(`/api/v1/store/track-paid-purchase?track_name=${encodeURIComponent(item.track.title)}&license_type=${encodeURIComponent(item.license.name)}&buyer_email=${encodeURIComponent(email || 'label_client@universal.com')}&payout_amount=${finalPrice}`, {
        method: "POST"
      }).catch(err => console.error("Error logging paid purchase tracking:", err));
    });

    const res = checkout(email || 'label_client@universal.com', activeCouponCode);
    if (res.success) {
      setCheckoutReceipt({
        orderId: paypalOrderId,
        totalPaid,
        tracks: itemsSummary
      });
      setEmail('');
      setCouponCode('');
      setCouponMessage(null);
      setShowCheckoutForm(false);
      setShowPayPalPayBlock(false);
    }
  };

  const handleStripePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      setStripeError("Please enter the cardholder's legal name.");
      return;
    }
    if (!stripeCard.number || !stripeCard.expiry || !stripeCard.cvc) {
      setStripeError("Please complete all credit card safety fields.");
      return;
    }

    setIsStripeProcessing(true);
    setStripeError(null);

    try {
      // Loop over items and perform concurrent payments via backend
      const checkoutPromises = cart.map(async (item) => {
        const origin = window.location.origin;
        const stripeUrl = (!origin || origin === 'null') ? '/api/checkout/stripe' : `${origin}/api/checkout/stripe`;
        const response = await fetch(stripeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: item.track.id,
            buyerEmail: email,
            buyerName: buyerName,
            paymentMethodId: 'pm_card_visa'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Checkout failed for track: ${item.track.title}`);
        }

        return await response.json();
      });

      const results = await Promise.all(checkoutPromises);
      const lastResult = results[results.length - 1];

      // Track paid purchases: call live telemetry logger for every item in cart before clearing
      cart.forEach(item => {
        let finalPrice = item.license.price;
        if (discountRate > 0) {
          finalPrice = parseFloat((finalPrice * (1 - discountRate)).toFixed(2));
        }
        apiFetch(`/api/v1/store/track-paid-purchase?track_name=${encodeURIComponent(item.track.title)}&license_type=${encodeURIComponent(item.license.name)}&buyer_email=${encodeURIComponent(email)}&payout_amount=${finalPrice}`, {
          method: "POST"
        }).catch(err => console.error("Error logging paid purchase tracking:", err));
      });

      const itemsSummary = cart.map(item => ({
        title: item.track.title,
        license: item.license.name
      }));
      const totalPaid = cartTotal;

      const res = checkout(email, activeCouponCode);
      if (res.success) {
        setCheckoutReceipt({
          orderId: lastResult?.legalContract?.digitalSignatureHash || res.orderId || "pi_stripe_tx",
          totalPaid,
          tracks: itemsSummary,
          downloadSecureUrl: lastResult?.downloadSecureUrl,
          legalContract: lastResult?.legalContract
        });
        setEmail('');
        setBuyerName('');
        setStripeCard({ number: '', expiry: '', cvc: '' });
        setCouponCode('');
        setCouponMessage(null);
        setShowCheckoutForm(false);
        setShowStripePayBlock(false);
      }
    } catch (err: any) {
      console.error("Stripe payment handler failure:", err);
      setStripeError(err.message || "Stripe Connect routing error occurred.");
    } finally {
      setIsStripeProcessing(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address to deliver your files.');
      return;
    }

    if (payoutMethod === 'paypal') {
      setShowPayPalPayBlock(true);
      return;
    }

    if (payoutMethod === 'stripe') {
      setShowStripePayBlock(true);
      return;
    }

    const itemsSummary = cart.map(item => ({
      title: item.track.title,
      license: item.license.name
    }));
    const totalPaid = cartTotal;

    // Track paid purchases: call live telemetry logger for every item in cart before clearing
    cart.forEach(item => {
      let finalPrice = item.license.price;
      if (discountRate > 0) {
        finalPrice = parseFloat((finalPrice * (1 - discountRate)).toFixed(2));
      }
      apiFetch(`/api/v1/store/track-paid-purchase?track_name=${encodeURIComponent(item.track.title)}&license_type=${encodeURIComponent(item.license.name)}&buyer_email=${encodeURIComponent(email)}&payout_amount=${finalPrice}`, {
        method: "POST"
      }).catch(err => console.error("Error logging paid purchase tracking:", err));
    });

    const res = checkout(email, activeCouponCode);
    if (res.success && res.orderId) {
      setCheckoutReceipt({
        orderId: res.orderId,
        totalPaid,
        tracks: itemsSummary
      });
      setEmail('');
      setCouponCode('');
      setCouponMessage(null);
      setShowCheckoutForm(false);
    }
  };

  const handleQuickAdd = (track: Track, tierId: 'mp3' | 'wav' | 'unlimited' | 'exclusive') => {
    addToCart(track, tierId);
    setActiveQuickPriceTrackId(null);
  };

  return (
    <div id="store-main-viewport" className="pb-32 px-4 md:px-8 max-w-7xl mx-auto pt-6 flex flex-col gap-6 md:gap-8 min-h-screen bg-bg-dark text-neutral-100">
      
      {/* Profile Header Section with Banner & Avatar Interactive Uploads */}
      <header className="profile-container relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-950 bg-neutral-950">
        
        {/* Banner Upload Zone */}
        <div 
          className="banner-upload relative h-36 sm:h-52 md:h-64 lg:h-80 w-full cursor-pointer group flex items-center justify-center overflow-hidden transition-all duration-300"
          onClick={() => document.getElementById('bannerInput')?.click()}
          style={{
            backgroundImage: `url('${bannerImg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Deep ambient vignette borders to integrate with page styling seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35 group-hover:bg-black/55 transition-all duration-300 pointer-events-none" />
          <span className="upload-text absolute text-[11px] sm:text-xs font-mono tracking-widest text-[#a855f7] bg-black/80 px-3 py-1.5 rounded border border-[#a855f7]/30 uppercase font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 select-none">
            Click to Upload Banner
          </span>
          <input 
            type="file" 
            id="bannerInput" 
            accept="image/*" 
            onChange={handleBannerUpload}
            onClick={(e) => e.stopPropagation()}
            hidden 
          />
        </div>

        {/* Profile Picture Upload Zone + Overlay Title */}
        <div className="relative px-6 md:px-10 pb-6 pt-12 sm:pt-14 md:pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 md:-mt-24 z-10">
          <div className="avatar-container relative">
            <div 
              className="avatar-upload w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-[4px] border-bg-dark bg-neutral-950 flex items-center justify-center cursor-pointer group shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 hover:border-[#a855f7] transition duration-300 relative"
              onClick={() => document.getElementById('avatarInput')?.click()}
            >
              <img 
                src={profileImg} 
                alt="PFP" 
                className="w-full h-full object-cover transition duration-300 group-hover:brightness-50"
                referrerPolicy="no-referrer"
              />
              <span className="upload-text absolute inset-0 flex items-center justify-center text-[10px] font-mono tracking-wider text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition duration-300 select-none">
                PFP
              </span>
              <input 
                type="file" 
                id="avatarInput" 
                accept="image/*" 
                onChange={handleProfileUpload}
                onClick={(e) => e.stopPropagation()}
                hidden 
              />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase font-sans">
              Tyrox Made This
            </h1>
            <p className="text-[11px] sm:text-xs font-mono text-purple-400 uppercase tracking-widest mt-1 font-bold">
              Madison, Wisconsin • Elite Multi-Platinum Record Producer
            </p>
          </div>
        </div>
      </header>

      {/* STORE SELECTION SWITCHES (Toggle between platforms easily) */}
      <section className="platform-navigation">
        <button 
          onClick={() => setActivePlatform('native')}
          className={`nav-toggle-btn ${activePlatform === 'native' ? 'active-toggle animate-pulse' : ''}`}
        >
          ☄️ TYROX Native Store
        </button>
        <button 
          onClick={() => setActivePlatform('airbit')}
          className={`nav-toggle-btn ${activePlatform === 'airbit' ? 'active-toggle animate-pulse' : ''}`}
        >
          💼 Airbit Player
        </button>
      </section>

      {activePlatform === 'airbit' && (
        <div id="airbit-frame-wrapper" className="storefront-viewport mb-12 animate-fadeIn text-left">
          <div className="flex items-center justify-between mb-4 bg-neutral-950/60 border border-neutral-900 rounded-xl p-4">
            <div>
              <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-emerald-550 font-bold">💼</span> Airbit Infinity Integration
              </h3>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-0.5">
                Official responsive Airbit widgets layout
              </p>
            </div>
            <button 
              onClick={() => {
                const newUrl = prompt("Enter your custom Airbit Widgets HTML5 URL:", airbitUrl);
                if (newUrl) {
                  localStorage.setItem('tyrox_airbit_url', newUrl);
                  setAirbitUrl(newUrl);
                }
              }}
              className="px-3 py-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[9.5px] font-mono text-neutral-400 rounded uppercase cursor-pointer"
            >
              ⚙️ Config URL
            </button>
          </div>
          <iframe 
            src={airbitUrl} 
            className="embedded-marketplace-audio-core w-full rounded-2xl"
            style={{ border: 0, height: '780px' }}
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {activePlatform === 'native' && (
        <>
        {/* 3. IMMERSIVE BRAND WALLPAPER BANNER */}
        <section 
          className="cinematic-hero-section shadow-2xl relative border border-neutral-900/40 my-1 select-none" 
          style={{ 
            backgroundImage: `url('${bannerImg}')`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
          <div className="hero-tint-overlay" />
          <div className="hero-content-alignment-box text-center">
            <h1 className="hero-headline font-black tracking-tight text-white uppercase text-2xl sm:text-3xl md:text-5xl font-sans drop-shadow-lg leading-tight">
              YOUR FIRST HIT STARTS HERE
            </h1>
            
            <div className="hero-search-hub max-w-lg mx-auto shadow-2xl transition duration-300 hover:scale-[1.01] hover:shadow-purple-500/10 border border-neutral-200/10 mb-6 bg-white/95">
              <span className="text-neutral-500 font-bold select-none text-base">🔍</span>
              <input 
                type="text" 
                placeholder="Search beats by genre, instrument, mood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="font-sans font-medium text-neutral-900 placeholder-neutral-500 bg-transparent outline-none w-full ml-2 text-sm"
              />
              <button 
                type="button" 
                onClick={() => {
                  const sect = document.getElementById('catalogList');
                  if (sect) sect.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hero-search-execution-btn font-sans hover:bg-neutral-900 select-none transition"
              >
                Search
              </button>
            </div>

            {/* DYNAMIC TICKER PROMOTIONS */}
            {tracks.length > 0 && (
              <div 
                className="trending-ticker-anchor hover:scale-[1.03] transition relative" 
                onClick={() => playTrack(tracks[0])}
                title={`Click to preview: ${tracks[0].title}`}
              >
                <span className="ticker-badge text-[#a855f7] uppercase font-mono tracking-widest font-extrabold select-none">🔥 TRENDING:</span>
                <span id="tickerTrackTitle" className="ticker-track-text text-neutral-100 font-bold uppercase truncate">{tracks[0].title}</span>
                <span className="ticker-play-indicator text-[11px] font-mono text-purple-400 font-bold uppercase tracking-widest pl-2">▶ Click to Preview</span>
              </div>
            )}
          </div>
        </section>

        {/* 4. CURATED MIXES DASHBOARD */}
        <section className="curated-mixes-dashboard my-4 border-b border-neutral-900/40 pb-6">
          <h2 className="section-title-label font-extrabold font-sans text-neutral-100 uppercase select-none tracking-tight flex items-center gap-2">
            <span>💿</span> Your Mixes
          </h2>
          <div className="mixes-grid-canvas" id="liveMixesCanvas">
            {streamEligibleMixes.length === 0 ? (
              <div className="col-span-full border border-dashed border-neutral-800/80 bg-neutral-950/30 rounded-2xl p-8 text-center my-2 max-w-full">
                <div className="w-12 h-12 bg-purple-950/20 text-purple-400 border border-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SlidersHorizontal size={18} className="animate-pulse" />
                </div>
                <h3 className="font-sans font-extrabold text-neutral-200 uppercase tracking-wider text-xs">No Mixes Accumulated Yet</h3>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest max-w-md mx-auto mt-2 leading-relaxed">
                  As soon as any of your beats get streamed or previewed, they will automatically be compiled right here as high-fidelity mixes in real-time.
                </p>
                <button
                  onClick={() => {
                    const catalogSect = document.getElementById('catalogList');
                    if (catalogSect) catalogSect.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-[9px] font-mono text-purple-400 border border-neutral-800 rounded uppercase cursor-pointer tracking-wider"
                >
                  ▶ Play any Beat below to trigger
                </button>
              </div>
            ) : (
              streamEligibleMixes.map((track) => {
                const isSelPlay = currentTrack?.id === track.id && isPlaying;
                return (
                  <div 
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className="mix-card-item bg-neutral-950/45 p-3.5 rounded-xl border border-neutral-900/60 transition duration-300 hover:scale-[1.01] hover:border-purple-500/30 shadow-md group cursor-pointer"
                  >
                    <div className="composite-artwork-frame single-image-cover aspect-square w-full select-none relative overflow-hidden">
                      <img 
                        src={track.imageUrl} 
                        alt={track.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                        <button className="p-3 bg-purple-600 rounded-full text-white transform scale-90 group-hover:scale-100 transition duration-300">
                          {isSelPlay ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="mix-card-title group-hover:text-purple-400 transition truncate text-xs font-bold text-neutral-100">{track.title} Mix</span>
                        <span className="bg-[#39FF14]/10 text-[#39FF14] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#39FF14]/20 shrink-0 select-none">
                          📈 {track.streams ?? track.plays ?? 0} STREAMS
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full mt-1">
                        <p className="font-mono text-[9.5px] text-neutral-500 uppercase tracking-wider">{track.bpm} BPM • {track.key} • PROD. TYROX</p>
                        <span className="stream-badge-ui font-mono text-[9px] text-purple-400 bg-purple-950/10 px-1.5 py-0.5 rounded border border-purple-500/10 select-none">📊 {track.bpm} BPM</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Trendiest Beats Sliding Panel Component */}
      <section id="trendiest-section" className="collection-wrapper border-b border-neutral-900/60 pb-6 my-2">
        <div className="collection-header flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-extrabold font-sans tracking-tight text-white uppercase select-none flex items-center gap-2">
              <span className="text-[#a855f7]">🔥</span> Trendiest Beats
            </h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-0.5">
              Swipe or drag to explore the hottest tracks right now
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-900">
            <span>🖱️ drag to scroll</span>
          </div>
        </div>

        <div 
          id="liveTrendiestCanvas" 
          ref={trendiestSliderRef}
          onMouseDown={handleSliderMouseDown}
          onMouseLeave={handleSliderMouseLeave}
          onMouseUp={handleSliderMouseUp}
          onMouseMove={handleSliderMouseMove}
          className="slider-container no-scrollbar flex overflow-x-auto gap-5"
        >
          {trendiestBeatsList.length === 0 ? (
            <div className="w-full text-center py-6 px-4 rounded-xl border border-dashed border-neutral-900 bg-neutral-950/20 my-1 select-none">
              <span className="text-purple-500 text-lg block mb-1">⚡</span>
              <p className="text-[10px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest">No plays accumulated yet</p>
              <p className="text-[9.5px] font-mono text-neutral-600 uppercase tracking-wider mt-1">Play or stream your uploaded beats to send them directly to the trending carousel</p>
            </div>
          ) : (
            trendiestBeatsList.map((beat) => {
              const isSelPlay = currentTrack?.id === beat.id && isPlaying;
              return (
                <div 
                  key={beat.id}
                  onClick={() => playTrack(beat as any)}
                  className="drag-beat-card group cursor-pointer"
                >
                  <div className="artwork-wrapper">
                    <img 
                      src={beat.imageUrl} 
                      alt={beat.title} 
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                    <div className="play-overlay bg-black/60">
                      <button className="p-3 bg-purple-600 rounded-full text-white transform scale-90 group-hover:scale-100 transition duration-300">
                        {isSelPlay ? (
                          <Pause size={18} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-sans font-bold text-xs text-neutral-100 truncate mt-1">{beat.title}</h3>
                  <p className="font-mono text-[9.5px] text-neutral-500 truncate mt-0.5">{beat.producer}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-900">
                    <span className="font-mono text-[10.5px] font-bold text-purple-400">${beat.price}</span>
                    <span className="font-mono text-[9px] text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-900/60">{beat.bpm} BPM</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Sleek Minimalist Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900/40 pb-5">
        <div>
          <h2 className="text-xl font-extrabold font-sans tracking-tight text-white uppercase select-none">
            Tracks Catalog
          </h2>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-0.5">
            Licensing • Exclusives • Multitrack Stems
          </p>
        </div>

        {/* Compact Search Box */}
        <form 
          onSubmit={(e) => { e.preventDefault(); }}
          className="w-full md:max-w-md bg-panel-bg rounded-xl p-1 flex items-center justify-between border border-neutral-900 shadow-lg"
        >
          <input
            type="text"
            id="storefrontSearch"
            placeholder="Search beats by name, genre, BPM, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 bg-transparent text-neutral-100 placeholder-neutral-500 font-sans text-xs focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="px-2 text-neutral-500 hover:text-neutral-300 text-xs font-sans mr-1"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-1.5 bg-neutral-800 text-neutral-300 hover:bg-neutral-750 hover:text-white text-[10px] font-sans font-bold uppercase rounded-lg tracking-wider transition cursor-pointer"
          >
            SEARCH
          </button>
        </form>
      </div>

      {/* Main Beatstore Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column (col-span-8): Multi-column high-density BeatStars grid */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Spotlight Beat Stream Player Card */}
          {tracks.length > 0 && (
            <div className="bg-[#0b0c10] border border-neutral-900/60 rounded-2xl p-5 mb-2 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#39FF14]" />
                <span className="text-[10px] font-mono text-[#39FF14] uppercase tracking-wider font-extrabold">Spotlight Preview Stream</span>
              </div>
              <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
                Stream our current prime acoustic trap master straight from the Madison Wisconsin vault using our premium native stream player.
              </p>
              <BeatStreamPlayer 
                trackTitle={tracks[0].title}
                previewUrl={tracks[0].audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
                trackPrice={`$${(tracks[0].price !== undefined ? tracks[0].price : 29.99).toFixed(2)}`}
              />
            </div>
          )}
          
          {/* Subheader and tags filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`chip yt-style-tag uppercase whitespace-nowrap ${
                    selectedTag === tag
                      ? 'active-yt-tag'
                      : ''
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
              {/* Responsive Layout Switcher */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-900 rounded-lg">
                <button
                  type="button"
                  id="view-mode-grid"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-[10px] font-mono rounded uppercase tracking-widest transition cursor-pointer font-bold ${
                    viewMode === 'grid'
                      ? 'bg-[#39FF14] text-black font-extrabold shadow-[0_0_8px_rgba(57,255,20,0.4)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Cover Grid
                </button>
                <button
                  type="button"
                  id="view-mode-list"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-[10px] font-mono rounded uppercase tracking-widest transition cursor-pointer font-bold ${
                    viewMode === 'list'
                      ? 'bg-[#39FF14] text-black font-extrabold shadow-[0_0_8px_rgba(57,255,20,0.4)]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Row List
                </button>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 uppercase shrink-0">
                <SlidersHorizontal size={11} className="text-[#39FF14]" />
                <span>{filteredTracks.length} beats matched</span>
              </div>
            </div>
          </div>

          {/* High-density dark track list table/grid */}
          <div className="space-y-2">
            {viewMode === 'grid' ? (
              <div id="beats-grid-wrapper" className="pt-2">
                <BeatCatalogGrid />
              </div>
            ) : filteredTracks.length === 0 ? (
              <div id="empty-store-grid" className="p-16 text-center rounded-2xl bg-panel-bg border border-neutral-900">
                <Music size={28} className="mx-auto text-neutral-600 mb-2 animate-bounce" />
                <p className="text-neutral-400 font-sans text-xs uppercase tracking-wider font-bold">No active beats found</p>
                <p className="text-neutral-500 font-sans text-[11px] mt-1">Please add custom tracks from the Studio Dashboard or sync local data.</p>
                {tracks.length === 0 ? (
                  <button 
                    onClick={() => setActiveTab('studio')} 
                    className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-sans font-bold border border-purple-500/30 rounded uppercase tracking-wider transition cursor-pointer"
                  >
                    Go to Studio Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedTag('All'); }} 
                    className="mt-4 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-purple-400 hover:text-white text-[10px] font-mono border border-neutral-850 rounded uppercase tracking-widest transition cursor-pointer"
                  >
                    Reset catalog filter
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {/* Grid Layout simulating professional BeatStars multi-column table */}
                
                 {/* Column Table Headers */}
                 <div className="catalog-header-row hidden md:grid">
                   <div className="col-lbl"></div>
                   <div className="col-lbl">TITLE</div>
                   <div className="col-lbl">TIME</div>
                   <div className="col-lbl">BPM</div>
                   <div className="col-lbl">TAGS</div>
                   <div className="col-lbl text-right">BUY LICENSING</div>
                 </div>
 
                 <div className="catalog-grid" id="catalogList">
                   {filteredTracks.map((track, trackIdx) => {
                     const isSelectedAndPlaying = currentTrack?.id === track.id && isPlaying;
 
                     return (
                       <div
                         key={track.id}
                         id={`track-card-${track.id}`}
                         data-audio-stream={track.audioUrl}
                         data-track-name={track.title}
                         data-track-id={track.id}
                         className={`track-row-item ${
                           currentTrack?.id === track.id ? 'active-preview active-highlight' : ''
                         }`}
                       >
                         {/* Play trigger button */}
                         <button 
                           className="row-play-trigger text-white hover:text-[#a855f7]"
                           onClick={() => playTrack(track)}
                           title="Stream beat preview"
                         >
                           {isSelectedAndPlaying ? (
                             <Pause size={15} fill="currentColor" />
                           ) : (
                             <Play size={15} fill="currentColor" className="ml-0.5" />
                           )}
                         </button>
 
                         {/* Title block with metadata */}
                         <div className="track-meta-block">
                           <span className="t-name flex items-center gap-1.5 flex-wrap">
                             <span>{track.title}</span>
                             {track.plaque_awarded && (
                               <span className="inline-flex items-center gap-0.5 bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 text-[7.5px] font-sans font-black px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse ml-1">
                                 🏆 PLATINUM
                               </span>
                             )}
                           </span>
                           <span className="t-prod">by {track.producer}</span>
                         </div>
 
                         {/* Duration */}
                         <span className="t-dur">{track.duration}</span>
 
                         {/* BPM */}
                         <span className="t-bpm">{track.bpm} BPM</span>
 
                         {/* Tags */}
                         <span className="t-tags truncate">{track.tags.join(', ')}</span>
 
                         {/* Buy Licensing Button - clicking on this opens our beautiful licensing choices modal */}
                         <div className="text-right">
                           <button 
                             className="purchase-action-btn animate-scaleUp"
                             onClick={() => onOpenLicenseModal(track)}
                           >
                             + ${(track.price !== undefined ? track.price : 29.99).toFixed(2)}
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column (col-span-4): Modern compact sidebar checkout & cart */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Shopping Cart Drawer Block */}
          <div className="p-5 rounded-2xl bg-panel-bg border border-neutral-900 flex flex-col gap-4 relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-green to-cyan-400 rounded-t-2xl opacity-10" />
            
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent-green/10 text-accent-green rounded-md">
                  <ShoppingBag size={14} />
                </div>
                <h2 className="font-sans font-bold text-xs text-neutral-200 tracking-wide uppercase">BeatStore Cart</h2>
              </div>
              <span className="font-mono text-[9.5px] bg-neutral-950 px-2 py-0.5 rounded text-neutral-400">{cart.length} ITEMS</span>
            </div>

            {/* Receipt Popup Container */}
            {checkoutReceipt && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 space-y-3 animate-scaleUp">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-cyan-400" />
                  <span className="font-sans font-bold text-xs uppercase tracking-wider">Purchase Successful!</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                  Receipt for order <b className="text-cyan-300 font-mono">{checkoutReceipt.orderId}</b>. Contracts and stems are compiled and delivered.
                </p>

                {/* Direct High Speed Download URL */}
                {checkoutReceipt.downloadSecureUrl && (
                  <div className="p-2.5 bg-neutral-950 border border-cyan-500/15 rounded-lg flex flex-col gap-1.5">
                    <span className="font-mono text-[8.5px] uppercase text-neutral-400">Direct Delivery Token</span>
                    <a 
                      href={checkoutReceipt.downloadSecureUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] font-sans font-bold text-accent-green hover:underline flex items-center gap-1 truncate"
                    >
                      <span>📥 Download Master Beats + Stems</span>
                    </a>
                  </div>
                )}

                {/* Legal Smart Contract Details */}
                {checkoutReceipt.legalContract && (
                  <div className="p-2.5 bg-neutral-950 border border-purple-500/15 rounded-lg space-y-1.5 font-mono text-[9px] text-neutral-400">
                    <span className="text-[8px] uppercase font-black text-purple-400">🛡️ Legal Smart Contract signed</span>
                    <div className="space-y-0.5">
                      <p>License: <b className="text-neutral-200">{checkoutReceipt.legalContract.licenseType}</b></p>
                      <p>Issued To: <b className="text-neutral-200">{checkoutReceipt.legalContract.issuedTo}</b></p>
                      <p>Signature Hash: <b className="text-neutral-300">{checkoutReceipt.legalContract.digitalSignatureHash}</b></p>
                      {checkoutReceipt.legalContract.trackId && (
                        <div className="mt-2 border-t border-purple-500/10 pt-1.5">
                          <a 
                            href={`/api/contracts/download-pdf?orderId=${checkoutReceipt.legalContract.digitalSignatureHash}&trackId=${checkoutReceipt.legalContract.trackId}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] uppercase font-black text-[#39FF14] hover:underline flex items-center gap-1.5 mt-1"
                          >
                            <span>📄 Download Signed PDF Contract</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-cyan-500/10 pt-2 space-y-1">
                  {checkoutReceipt.tracks.map((ct, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-300 truncate max-w-[140px] font-sans font-medium">{ct.title}</span>
                      <span className="text-neutral-500 font-mono text-[9px] uppercase">{ct.license}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-cyan-500/10 pt-1 text-cyan-300 mt-1">
                    <span>Total Paid</span>
                    <span>${checkoutReceipt.totalPaid.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCheckoutReceipt(null)} 
                  className="w-full mt-2 py-1 bg-cyan-950/50 hover:bg-cyan-900 text-[10px] font-mono border border-cyan-500/20 text-cyan-300 rounded uppercase tracking-wider transition cursor-pointer"
                >
                  Dismiss Receipt
                </button>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 font-sans text-xs">
                Your cart is empty. <br/>Use the ADD buttons to check beats out.
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-950/60 border border-neutral-900 hover:border-neutral-850 rounded-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
                      <div className="min-w-0">
                        <p className="font-sans font-bold text-neutral-200 truncate">{item.track.title}</p>
                        <p className="font-mono text-[9px] text-accent-green mt-0.5 uppercase tracking-wide">{item.license.name}</p>
                        <p className="font-mono text-[8.5px] text-[#555] mt-0.5 uppercase">{item.license.format}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-bold text-neutral-300">${item.license.price.toFixed(2)}</span>
                        <button
                          onClick={() => removeFromCart(item.track.id, item.license.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Apply Coupon */}
                <div className="border-t border-neutral-900 pt-3 space-y-2 text-xs text-neutral-400">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  {discountRate > 0 && (
                    <div className="flex justify-between items-center text-accent-green font-sans">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Gift size={11} />
                        Coupon Applied ({activeCouponCode})
                      </span>
                      <span className="font-mono font-bold">-${cartDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-neutral-900 pt-2 text-sm font-bold text-white">
                    <span>Grand Total</span>
                    <span className="font-mono text-accent-green text-base">${cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Coupon Form Input */}
                  {!activeCouponCode ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="DISCOUNT CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-855 text-[10px] font-mono rounded-lg outline-none text-neutral-200 focus:border-accent-green uppercase"
                      />
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 bg-neutral-900 hover:border-neutral-800 text-[10px] text-neutral-300 hover:text-white border border-neutral-900 rounded-lg transition font-medium cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-[#121a1f] border border-cyan-500/10 rounded-lg text-cyan-400 font-mono text-[9px]">
                      <span>Code '{activeCouponCode}' Activated</span>
                      <button 
                        onClick={() => clearCart()} 
                        className="text-neutral-500 hover:text-neutral-300 font-sans text-[8.5px] underline uppercase"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponMessage && (
                    <p className={`text-[10px] font-sans ${couponMessage.error ? 'text-red-400' : 'text-accent-green'}`}>
                      {couponMessage.text}
                    </p>
                  )}
                </div>

                {/* Checkout Trigger */}
                {!showCheckoutForm ? (
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full py-2.5 mt-2 bg-accent-green hover:bg-accent-green-hover hover:text-black font-black text-neutral-950 text-xs uppercase rounded-xl tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-accent-green/10"
                  >
                    Proceed to Payout
                    <ArrowRight size={13} />
                  </button>
                ) : showPayPalPayBlock ? (
                  <div className="space-y-3 pt-3 border-t border-neutral-900">
                    <PayPalCheckout
                      amount={cartTotal}
                      email={email}
                      payoutEmail={payoutEmail}
                      onSuccess={handlePayPalSuccess}
                      onCancel={() => setShowPayPalPayBlock(false)}
                    />
                  </div>
                ) : showStripePayBlock ? (
                  <form onSubmit={handleStripePaymentSubmit} className="space-y-4 pt-4 border-t border-neutral-900 animate-slideIn">
                    <div className="flex items-[#10111a] justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">💳</span>
                        <h4 className="font-sans font-bold text-xs uppercase text-neutral-200">Stripe Live Checkout</h4>
                      </div>
                      <span className="font-mono text-[11px] text-accent-green font-bold">${cartTotal.toFixed(2)}</span>
                    </div>

                    <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                      Powered by Stripe Connect destination charges. Funds are split and instantly transferred to <b>{payoutEmail || "tyroxmadethis@gmail.com"}</b>.
                    </p>

                    {stripeError && (
                      <div className="p-2 border border-red-500/20 bg-red-950/20 rounded-lg text-red-400 text-[9.5px] font-sans leading-normal">
                        ⚠️ {stripeError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Legal Cardholder Name */}
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] uppercase text-neutral-500 block text-left">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Your legal name"
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-accent-green"
                        />
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] uppercase text-neutral-500 block text-left">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={stripeCard.number}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              const matches = v.match(/\d{4,16}/g);
                              const match = (matches && matches[0]) || '';
                              const parts = [];
                              for (let i = 0, len = match.length; i < len; i += 4) {
                                parts.push(match.substring(i, i + 4));
                              }
                              const formatted = parts.length > 0 ? parts.join(' ') : v;
                              setStripeCard({ ...stripeCard, number: formatted });
                            }}
                            placeholder="4242 4242 4242 4242"
                            className="w-full pl-3 pr-10 py-1.5 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-accent-green font-mono"
                          />
                          <span className="absolute right-3 top-2 text-neutral-500 text-xs">🔒</span>
                        </div>
                      </div>

                      {/* Expiry & CVC Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-mono text-[9px] uppercase text-neutral-500 block text-left">Expiration Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={stripeCard.expiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/[^0-9]/g, '');
                              if (v.length > 2) {
                                v = v.substring(0, 2) + '/' + v.substring(2, 4);
                              }
                              setStripeCard({ ...stripeCard, expiry: v });
                            }}
                            placeholder="MM/YY"
                            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-accent-green font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-mono text-[9px] uppercase text-neutral-500 block text-left">CVC Security Code</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={stripeCard.cvc}
                            onChange={(e) => setStripeCard({ ...stripeCard, cvc: e.target.value.replace(/[^0-9]/g, '') })}
                            placeholder="•••"
                            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-accent-green font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowStripePayBlock(false);
                          setStripeError(null);
                        }}
                        disabled={isStripeProcessing}
                        className="flex-1 py-1.5 bg-neutral-900 border border-neutral-855 hover:bg-neutral-850 text-neutral-400 text-[10px] font-sans font-bold uppercase rounded-lg transition cursor-pointer disabled:opacity-55"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isStripeProcessing}
                        className="flex-1 py-1.5 bg-accent-green text-neutral-950 hover:bg-accent-green-hover text-[10px] font-sans font-extrabold uppercase rounded-lg transition cursor-pointer disabled:opacity-55 flex items-center justify-center gap-1.5"
                      >
                        {isStripeProcessing ? (
                          <>
                            <span className="w-3 h-3 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                            <span>Clearing...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay Securely</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-3 border-t border-neutral-900 animate-slideIn">
                    <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                      Enter email for contract/download issuance. All processing runs fully isolated.
                    </p>
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase text-neutral-500 block">Payout Delivery Email</label>
                      <input
                        type="email"
                        required
                        placeholder="artist@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs rounded-lg outline-none focus:border-accent-green"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutForm(false);
                          setShowPayPalPayBlock(false);
                          setShowStripePayBlock(false);
                        }}
                        className="flex-1 py-1.5 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 text-[10px] font-sans rounded-lg uppercase transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-accent-green text-neutral-950 hover:bg-accent-green-hover text-[10px] font-sans font-bold uppercase rounded-lg transition cursor-pointer"
                      >
                        {payoutMethod === 'paypal' ? 'Proceed to PayPal' : payoutMethod === 'stripe' ? 'Proceed to Stripe' : 'Finalize'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

      {/* FREE DOWNLOAD EMAIL CAPTURE MODAL */}
      {downloadTrack && (
        <FreeDownloadGateModal
          track={{
            id: downloadTrack.id,
            title: downloadTrack.title,
            imageUrl: downloadTrack.imageUrl
          }}
          onClose={() => setDownloadTrack(null)}
          onActivationSuccess={(email) => {
            // Add their email to the mailing list
            const existing = JSON.parse(localStorage.getItem('vv_newsletter_subscribers') || '[]');
            if (!existing.includes(email)) {
              existing.push(email);
              localStorage.setItem('vv_newsletter_subscribers', JSON.stringify(existing));
            }

            // Increment downloads count
            const updated = {
              ...downloadTrack,
              downloads: (downloadTrack.downloads || 0) + 1
            };
            updateTrack(updated);

            // Track instant free downloading activation in Google Analytics
            if (typeof window !== 'undefined' && (window as any).logFreeDownload) {
              (window as any).logFreeDownload(downloadTrack.title);
            }

            // Real-time backend tracking: auto-trigger free acquisition ledger logging
            apiFetch(`/api/v1/store/track-free-download?track_name=${encodeURIComponent(downloadTrack.title)}&buyer_email=${encodeURIComponent(email)}`, {
              method: "POST"
            }).catch(err => console.error("Error logging free download tracking:", err));

            // Instant physical browser download anchor triggering
            try {
              const downloadUrl = downloadTrack.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.setAttribute('download', `${downloadTrack.title}_demo.mp3`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (dlErr) {
              console.error("Direct browser download trigger failed:", dlErr);
            }
          }}
        />
      )}

          {/* Custom Solo Operator Contract Visual Banner */}
          <div className="p-6 rounded-xl bg-[#15161e] border border-[#222533] mb-5 space-y-4 shadow-lg text-left">
            <h3 className="font-sans font-bold text-xs text-[#9d4edd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-sm">🛡️</span>
              TYROX MADE THIS CONTRACTS
            </h3>
            <ul className="text-white text-[11px] list-none p-0 m-0 space-y-3 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-[#9d4edd] font-black text-sm leading-none flex-shrink-0">•</span>
                <p className="font-sans m-0 text-neutral-200">
                  <strong className="text-white font-bold">100% Royalty Free:</strong> Keep 100% of your earnings on Spotify, Apple Music, and streaming services.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#9d4edd] font-black text-sm leading-none flex-shrink-0">•</span>
                <p className="font-sans m-0 text-neutral-200">
                  <strong className="text-white font-bold">No content claim blocks:</strong> Direct whitelist protection on platforms prevents copyright problems instantly.
                </p>
              </li>
            </ul>
          </div>

          {/* Pristine Master Audio Engine Playback controller card */}
          <div className="audio-card text-left">
            <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider mb-1 animate-pulse">Beat Player Engine</h3>
            <p className="text-[10px] sm:text-[10.5px] font-mono text-neutral-400 m-0 leading-normal">
              High-Fidelity lossy/lossless streaming stream-deck router. Experience Wisconsin studio audio directly.
            </p>
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-900 mt-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-sans font-bold text-[11px] text-[#39FF14] truncate uppercase tracking-tight">
                  Status: {currentTrack && isPlaying ? "Streaming Vault Audio" : "Engine Online"}
                </p>
                <p className="font-mono text-[9px] text-neutral-500 m-0 truncate">
                  {currentTrack ? `Track: ${currentTrack.title}` : "Select any track from below catalog"}
                </p>
              </div>
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#39FF14] animate-ping' : 'bg-[#39FF14]/40'}`} />
            </div>
            <button 
              id="playTrigger"
              className="control-btn font-sans font-bold py-3 px-6"
              onClick={() => {
                if (currentTrack) {
                  togglePlay();
                } else {
                  // Fallback: active first track or seed track
                  const fallbackTrack = tracks[0] || trendiestBeatsList[0] || null;
                  if (fallbackTrack) {
                    playTrack(fallbackTrack);
                  }
                }
              }}
            >
              {currentTrack && isPlaying ? "Pause Audio Stream" : "Load & Play Beat"}
            </button>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
};
