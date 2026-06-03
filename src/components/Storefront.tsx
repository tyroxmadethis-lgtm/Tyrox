/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

interface StorefrontProps {
  onOpenLicenseModal: (track: Track) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ onOpenLicenseModal }) => {
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
    setActiveTab,
    updateTrack,
    payoutEmail,
    payoutMethod,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
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

  const [bannerImg, setBannerImg] = useState(() => {
    return localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
  });

  useEffect(() => {
    const handleBannerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setBannerImg(customEvent.detail);
      }
    };
    window.addEventListener('tyrox-banner-updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('tyrox-banner-updated', handleBannerUpdate);
    };
  }, []);

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
        const response = await fetch('/api/checkout/stripe', {
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
      
      {/* Premium Epic Visual Storefront Banner with No Infrastructure Clutter */}
      <div 
        className="relative rounded-2xl overflow-hidden h-44 sm:h-60 md:h-72 lg:h-96 w-full shadow-2xl border border-neutral-900/80 flex items-end"
        style={{
          backgroundImage: `url('${bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Deep ambient vignette borders to integrate with page styling seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-bg-dark/15 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-bg-dark/15 to-transparent pointer-events-none" />
      </div>

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
          
          {/* Subheader and tags filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition cursor-pointer whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-accent-green text-black shadow-md shadow-accent-green/10'
                      : 'bg-panel-bg text-neutral-400 border border-neutral-850 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase shrink-0">
              <SlidersHorizontal size={11} className="text-accent-green" />
              <span>{filteredTracks.length} beats matched</span>
            </div>
          </div>

          {/* High-density dark track list table/grid */}
          <div className="space-y-2">
            {filteredTracks.length === 0 ? (
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
              /* Grid Layout simulating professional BeatStars multi-column table */
              <div className="flex flex-col gap-1.5">
                
                 {/* Column Table Headers */}
                 <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest border-b border-neutral-900">
                   <div className="col-span-6">TITLE</div>
                   <div className="col-span-2 text-center">TIME</div>
                   <div className="col-span-1 text-center">BPM</div>
                   <div className="col-span-1">TAGS</div>
                   <div className="col-span-2 text-right"></div>
                 </div>
 
                 {filteredTracks.map((track, trackIdx) => {
                   const isSelectedAndPlaying = currentTrack?.id === track.id && isPlaying;
                   const isLiked = likedTrackIds.includes(track.id);
                   const isQuickMenuOpen = activeQuickPriceTrackId === track.id;
 
                   return (
                     <div
                       key={track.id}
                       id={`track-card-${track.id}`}
                       className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all duration-200 ${
                         currentTrack?.id === track.id
                           ? 'bg-[#10111a] border-purple-500/35'
                           : 'bg-transparent border-transparent hover:bg-[#10111a]/40'
                       }`}
                     >
                       {/* Art & Title Column – col-span-6 */}
                       <div className="col-span-6 flex items-center gap-3.5 min-w-0">
                         {/* Play Action button overlay over Artwork */}
                         <div 
                           onClick={() => playTrack(track)}
                           className="relative group w-11 h-11 rounded overflow-hidden flex-shrink-0 border border-neutral-850 shadow-md cursor-pointer"
                         >
                           <img 
                             src={track.imageUrl} 
                             alt={track.title} 
                             referrerPolicy="no-referrer"
                             className="w-full h-full object-cover group-hover:scale-105 duration-300"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150">
                             {isSelectedAndPlaying ? (
                               <Pause size={12} className="text-white" fill="currentColor" />
                             ) : (
                               <Play size={12} className="text-white ml-0.5" fill="currentColor" />
                             )}
                           </div>
                           {isSelectedAndPlaying && (
                             <div className="absolute inset-x-0 bottom-0 bg-neutral-950/60 flex items-center justify-center gap-0.5 py-0.5">
                               <span className="w-0.5 h-2 bg-purple-400 rounded animate-bounce-1" />
                               <span className="w-0.5 h-1.5 bg-purple-400 rounded animate-bounce-2" />
                               <span className="w-0.5 h-2.5 bg-purple-400 rounded animate-bounce-3" />
                             </div>
                           )}
                         </div>
 
                         {/* Title block with producer */}
                          <div className="min-w-0 space-y-1">
                            <h3 
                              onClick={() => playTrack(track)}
                              className="font-sans font-bold text-xs text-neutral-100 hover:text-purple-400 transition truncate cursor-pointer uppercase tracking-tight flex items-center gap-1.5 flex-wrap"
                            >
                              <span>{track.title}</span>
                              {track.plaque_awarded && (
                                <span className="inline-flex items-center gap-0.5 bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 text-[7.5px] font-sans font-black px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse ml-1" title="Officially Certified Platinum">
                                  🏆 PLATINUM
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                              <span>by {track.producer}</span>
                              <span className="text-neutral-700">•</span>
                              <span className="text-purple-400 font-bold">
                                {(track.streams !== undefined ? track.streams : track.plays).toLocaleString()} streams
                              </span>
                            </div>
                          </div>
                        </div>
                        
{/* Duration Time – col-span-2 */}
                       <div className="hidden md:block col-span-2 text-center font-mono text-[11px] text-neutral-400">
                         {track.duration}
                       </div>
 
                       {/* Tempo BPM – col-span-1 */}
                       <div className="hidden md:block col-span-1 text-center font-mono text-[11px] text-neutral-400">
                         {track.bpm}
                       </div>
 
                       {/* Tags List – col-span-1 */}
                       <div className="hidden md:flex col-span-1 items-center gap-1.5 flex-wrap">
                         {track.tags.map(tag => (
                           <span 
                             key={tag} 
                             onClick={() => setSelectedTag(tag)}
                             className="font-sans text-[10px] bg-purple-900/30 text-purple-400 border border-purple-500/10 hover:bg-purple-950 font-semibold px-2.5 py-0.5 rounded-full cursor-pointer transition uppercase whitespace-nowrap"
                           >
                             {tag}
                           </span>
                         ))}
                       </div>
 
                       {/* Actions (Share, Price Button) – col-span-2 */}
                       <div className="col-span-2 flex items-center justify-end gap-2 relative">
                         
                         {track.allowFreeDownload && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDownloadTrack(track);
                              }}
                              className="h-8 px-2.5 bg-[#0e0f15] hover:bg-neutral-900 text-purple-450 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer uppercase transition shrink-0"
                              title="Free tag download"
                            >
                              <Download size={11} />
                              <span>Free</span>
                            </button>
                          )}

                          {/* Share square button styled exactly like screenshot */}
                         <button
                           onClick={() => {
                             navigator.clipboard.writeText(window.location.href);
                             alert('Copied link to clipboard!');
                           }}
                           className="w-8 h-8 rounded bg-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-800 transition flex items-center justify-center cursor-pointer"
                           title="Share track"
                         >
                           <Share2 size={13} fill="none" />
                         </button>
 
                         {/* White Cart Price Button */}
                         <div className="relative">
                           <button
                             onClick={() => setActiveQuickPriceTrackId(isQuickMenuOpen ? null : track.id)}
                             className="h-8 px-3 md:px-4 bg-white text-black hover:bg-neutral-150 font-sans font-extrabold text-[11px] rounded transition active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-tight"
                           >
                             <ShoppingBag size={11.5} />
                             <span>+ ${track.prices.mp3.toFixed(2)}</span>
                           </button>
 
                           {/* Quick Add Menu Dropdown Popover */}
                           {isQuickMenuOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-[#161720] border border-neutral-800/80 rounded-xl shadow-2xl z-30 p-2 space-y-1 animate-slideIn">
                               <div className="text-[8.5px] font-mono text-neutral-500 uppercase px-2 py-1 tracking-wider border-b border-neutral-900">Choose license tier</div>
                               
                               <button
                                 onClick={() => handleQuickAdd(track, 'mp3')}
                                 className="w-full text-left px-2 py-1.5 hover:bg-neutral-900/80 rounded-md transition text-xs flex justify-between items-center cursor-pointer"
                               >
                                 <div className="min-w-0">
                                   <p className="font-sans font-bold text-neutral-200">MP3 Lease</p>
                                   <p className="font-mono text-[8.5px] text-neutral-500">320kbps Standard</p>
                                 </div>
                                 <span className="font-mono text-purple-400 font-bold">${track.prices.mp3.toFixed(2)}</span>
                               </button>
 
                               <button
                                 onClick={() => handleQuickAdd(track, 'wav')}
                                 className="w-full text-left px-2 py-1.5 hover:bg-neutral-900/80 rounded-md transition text-xs flex justify-between items-center cursor-pointer"
                               >
                                 <div className="min-w-0">
                                   <p className="font-sans font-bold text-neutral-200">WAV Lease</p>
                                   <p className="font-mono text-[8.5px] text-neutral-500">24-Bit Uncompressed</p>
                                 </div>
                                 <span className="font-mono text-purple-400 font-bold">${track.prices.wav.toFixed(2)}</span>
                               </button>
 
                               <div className="border-t border-neutral-900 my-1"></div>
 
                               <button
                                 onClick={() => {
                                   setActiveQuickPriceTrackId(null);
                                   onOpenLicenseModal(track);
                                 }}
                                 className="w-full text-center py-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white transition rounded text-[9.5px] font-mono uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1"
                               >
                                 <Tag size={10} className="text-purple-400" />
                                 View All Tiers
                               </button>
                             </div>
                           )}
                         </div>
 
                       </div>
                     </div>
                   );
                 })}
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
        </div>

      </div>
    </div>
  );
};
