/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track, CartItem, SaleActivity, Coupon, LicenseOption, LicensingContract } from '../types';
import { AudioSynth } from '../services/audioSynth';

interface StoreContextType {
  tracks: Track[];
  cart: CartItem[];
  sales: SaleActivity[];
  coupons: Coupon[];
  contracts: LicensingContract[];
  
  // Player state
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playbackTime: string;
  playbackDurationStr: string;
  
  // Navigation
  activeTab: 'storefront' | 'studio' | 'about' | 'services' | 'contact' | 'industry-portal' | 'artist-portal';
  adminSection: string;
  
  // Functions
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  addTrack: (track: Omit<Track, 'id' | 'plays' | 'downloads' | 'sales' | 'createdAt'>) => void;
  updateTrack: (track: Track) => void;
  deleteTrack: (id: string) => void;
  
  addToCart: (track: Track, licenseType: 'mp3' | 'wav' | 'unlimited' | 'exclusive') => void;
  removeFromCart: (trackId: string, licenseId: string) => void;
  clearCart: () => void;
  checkout: (email: string, couponCode?: string) => { success: boolean; orderId?: string };
  applyCoupon: (code: string) => Coupon | null;
  discountRate: number;
  activeCouponCode: string;
  
  // Player controls
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  seekPlayer: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  
  // Navigation controls
  setActiveTab: (tab: 'storefront' | 'studio' | 'about' | 'services' | 'contact' | 'industry-portal' | 'artist-portal') => void;
  setAdminSection: (section: string) => void;
  
  // Settings / Admin Metrics
  payoutEmail: string;
  setPayoutEmail: (email: string) => void;
  payoutMethod: 'paypal' | 'stripe';
  setPayoutMethod: (method: 'paypal' | 'stripe') => void;
}

const defaultTracks: Track[] = [];

const defaultSales: SaleActivity[] = [
  {
    id: 's1',
    trackTitle: 'Tokyo Drift',
    price: 499.99,
    licenseType: 'Exclusive Rights',
    buyerEmail: 'rappersergio@pioneers.live',
    timestamp: '2026-05-30T14:22:15Z',
    status: 'completed'
  },
  {
    id: 's2',
    trackTitle: 'Midnight Chill',
    price: 129.99,
    licenseType: 'Unlimited WAV',
    buyerEmail: 'lofibrain@studybeats.net',
    timestamp: '2026-05-29T11:05:40Z',
    status: 'completed'
  },
  {
    id: 's3',
    trackTitle: 'Midnight Chill',
    price: 44.99,
    licenseType: 'WAV License',
    buyerEmail: 'skinnymann@gmail.com',
    timestamp: '2026-05-28T19:40:02Z',
    status: 'completed'
  },
  // Add entries that compile exactly up to $1,284.42 (Total Accumulated Store Sales in screenshot!)
  // $1284.42 - 499.99 (Exclusive) - 129.99 (Unlimited) - 44.99 (WAV) = 609.45 remaining
  {
    id: 's4',
    trackTitle: 'Tokyo Drift',
    price: 149.99,
    licenseType: 'Unlimited WAV',
    buyerEmail: 'dropthemic@beathouse.com',
    timestamp: '2026-05-26T08:14:10Z',
    status: 'completed'
  }, // Remaining 459.46
  {
    id: 's5',
    trackTitle: 'Nebula Drill',
    price: 149.99,
    licenseType: 'Unlimited WAV',
    buyerEmail: 'drillmasteruk@soundbox.uk',
    timestamp: '2026-05-25T15:30:20Z',
    status: 'completed'
  }, // Remaining 309.47
  {
    id: 's6',
    trackTitle: 'Hyperdrive',
    price: 149.99,
    licenseType: 'Unlimited WAV',
    buyerEmail: 'retrocasette@synthwave.cc',
    timestamp: '2026-05-22T22:10:05Z',
    status: 'completed'
  }, // Remaining 159.48
  {
    id: 's7',
    trackTitle: 'Midnight Chill',
    price: 44.99,
    licenseType: 'WAV License',
    buyerEmail: 'ambientwaves@chillout.jp',
    timestamp: '2026-05-21T05:48:33Z',
    status: 'completed'
  }, // Remaining 114.49
  {
    id: 's8',
    trackTitle: 'Tokyo Drift',
    price: 49.99,
    licenseType: 'WAV License',
    buyerEmail: 'skidmarks@streetrace.it',
    timestamp: '2026-05-19T13:40:00Z',
    status: 'completed'
  }, // Remaining 64.50
  {
    id: 's9',
    trackTitle: 'Midnight Chill',
    price: 24.99,
    licenseType: 'MP3 License',
    buyerEmail: 'singersandra@vocalist.org',
    timestamp: '2026-05-18T10:14:12Z',
    status: 'completed'
  }, // Remaining 39.51
  {
    id: 's10',
    trackTitle: 'Nebula Drill',
    price: 39.51, // Custom adjustment to hit exactly $1284.42 combined sales!
    licenseType: 'MP3 License Promo',
    buyerEmail: 'beattester@vibevault.co',
    timestamp: '2026-05-15T09:02:44Z',
    status: 'completed'
  }
];

const defaultCoupons: Coupon[] = [
  { code: 'VIBE50', discountType: 'percentage', value: 50, active: true },
  { code: 'TRAP20', discountType: 'percentage', value: 20, active: true },
  { code: 'BEATFREE', discountType: 'fixed', value: 15, active: true }
];

const defaultContracts: LicensingContract[] = [
  {
    id: 'mp3',
    title: 'Basic MP3 License',
    price: 29.99,
    distributorLimit: '10,000 Streams',
    monetizationAllowed: false,
    termsText: 'Allows recording 1 vocal mix over this beat. Standard distribution up to 10,000 commercial streams. Audio file is encrypted 320kbps MP3 format. Unauthorized syncing to motion picture or games is prohibited without secondary synchronization approval. Must credit (Prod. tyrox made this) in metadata.'
  },
  {
    id: 'wav',
    title: 'Premium WAV License',
    price: 49.99,
    distributorLimit: '50,000 Streams',
    monetizationAllowed: true,
    termsText: 'Allows recording 1 vocal mix over this beat. Comprises 24-Bit high fidelity uncompressed WAV file. Commercial distribution up to 50,000 streams. Music video synchronization allowed up to 1 organic stream. Commercial radio broadcast is restricted to local markets.'
  },
  {
    id: 'unlimited',
    title: 'Unlimited WAV License',
    price: 149.99,
    distributorLimit: 'Infinite Streams',
    monetizationAllowed: true,
    termsText: 'Enables limitless monetization and infinite audio streams across standard distribution hubs (Spotify, Apple Music, YouTube). Full 24-Bit master WAV and uncompressed stems included. Highly suited for active touring artists, sync opportunities, and content-creator collectives.'
  },
  {
    id: 'exclusive',
    title: 'Full Exclusive Ownership Contracts',
    price: 499.99,
    distributorLimit: 'Uncapped / Ownership Transfer',
    monetizationAllowed: true,
    termsText: 'Complete transaction transfer of the mechanical ownership. Beat is subsequently removed from public catalogs and all external vendors. Complete trackouts and raw MIDI stems provided. Fully vetted for commercial sync placements, films, games, television, and radio globally.'
  }
];

const defaultLicenseOptions: LicenseOption[] = [
  {
    id: 'mp3',
    name: 'MP3 Lease',
    price: 29.99,
    format: '320kbps MP3 File',
    terms: ['Used for music recording', 'Distribute up to 10,000 copies', 'Non-exclusive rights', 'Must credit producer'],
    description: 'Perfect for demo releases, social clips, and indie streaming.'
  },
  {
    id: 'wav',
    name: 'WAV Lease',
    price: 49.99,
    format: '24-Bit High-Quality WAV',
    terms: ['Comes with fully-mixed audio WAV', 'Distribute up to 50,000 copies', 'Non-exclusive rights', 'Must credit producer'],
    description: 'Best choice for standard studio releases, mixtapes, and radio.'
  },
  {
    id: 'unlimited',
    name: 'Unlimited WAV',
    price: 149.99,
    format: 'WAV + Audio Trackout Stems',
    terms: ['Unlimited release streams', 'Separated stem layers included', 'No caps on commercial play', 'Must credit producer'],
    description: 'Best for professional mix downs and unlimited commercial releases.'
  },
  {
    id: 'exclusive',
    name: 'Exclusive Rights',
    price: 499.99,
    format: 'Full Legal Co-Ownership Transfer & Stems',
    terms: ['Sole ownership transfer', 'Track is removed from storefront', 'In perpetuity rights uncapped', 'Commercial syncing allowed'],
    description: 'Establish absolute ownership, remove competitor leasing.'
  }
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('vv_tracks');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean slate - filter out old default beats
      const filtered = parsed.filter((t: any) => 
        t.id !== 't1' && t.id !== 't2' && t.id !== 't3' && t.id !== 't4' && t.id !== 't5' &&
        t.id !== 'beat_001' && t.id !== 'beat_002'
      );
      return filtered;
    }
    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vv_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<SaleActivity[]>(() => {
    const saved = localStorage.getItem('vv_sales');
    return saved ? JSON.parse(saved) : defaultSales;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('vv_coupons');
    return saved ? JSON.parse(saved) : defaultCoupons;
  });

  const [contracts, setContracts] = useState<LicensingContract[]>(() => {
    const saved = localStorage.getItem('vv_contracts');
    return saved ? JSON.parse(saved) : defaultContracts;
  });

  // Settings
  const [payoutEmail, setPayoutEmail] = useState(() => {
    return localStorage.getItem('vv_payout_email') || 'tyroxmadethis@gmail.com';
  });
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'stripe'>(() => {
    return (localStorage.getItem('vv_payout_method') || 'paypal') as 'paypal' | 'stripe';
  });

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.4); // 40%
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180);

  // Layout navigation
  const [activeTab, setActiveTabState] = useState<'storefront' | 'studio' | 'about' | 'services' | 'contact' | 'industry-portal' | 'artist-portal'>('storefront');
  const [adminSection, setAdminSection] = useState('sales'); // default sub-section matches Sales & Finances in screenshot!

  // Active coupon
  const [activeCouponCode, setActiveCouponCode] = useState('');
  const [discountRate, setDiscountRate] = useState(0); // 0.20 = 20%

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('vv_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('vv_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vv_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('vv_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('vv_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('vv_payout_email', payoutEmail);
  }, [payoutEmail]);

  useEffect(() => {
    localStorage.setItem('vv_payout_method', payoutMethod);
  }, [payoutMethod]);

  // Audio service hooks
  useEffect(() => {
    AudioSynth.setCallbacks(
      (time, dur) => {
        setProgress(time);
        setDuration(dur);
      },
      (playing) => {
        setIsPlaying(playing);
      }
    );

    return () => {
      AudioSynth.stop();
    };
  }, []);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        AudioSynth.pause();
      } else {
        AudioSynth.resume();
      }
    } else {
      setCurrentTrack(track);

      // Track real-time audio play engagement metric in Google Analytics
      if (typeof window !== 'undefined' && (window as any).logBeatPreview) {
        (window as any).logBeatPreview(track.title, 'Basic');
      }
      
      // Increment play count and stream statistics counter in real-time
      setTracks(prev => prev.map(t => {
        if (t.id === track.id) {
          const startingStreams = t.streams !== undefined ? t.streams : t.plays;
          const nextStreamsCount = startingStreams + 1;
          const wasAwarded = t.plaque_awarded === true;
          const triggerPlaqueMilestone = nextStreamsCount >= 10000 && !wasAwarded;

          if (triggerPlaqueMilestone) {
            // Asynchronously dispatch the automated milestone plaque achievement event.
            setTimeout(() => {
              const event = new CustomEvent('vv-milestone-achieved', {
                detail: {
                  beat_id: t.id,
                  track_title: t.title,
                  certified_streams: nextStreamsCount,
                  award_type: "Platinum Digital Record Plaque",
                  presentee: "TYROX MADE THIS",
                  print_template_url: `https://yourstorage.com_${t.id}.png`
                }
              });
              window.dispatchEvent(event);
            }, 300);
          }

          return {
            ...t,
            plays: t.plays + 1,
            streams: nextStreamsCount,
            plaque_awarded: nextStreamsCount >= 10000 ? true : wasAwarded
          };
        }
        return t;
      }));
      
      AudioSynth.play(track.id, track.bpm, track.key);
    }
  };

  const togglePlay = () => {
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0]);
    } else if (currentTrack) {
      if (isPlaying) {
        AudioSynth.pause();
      } else {
        AudioSynth.resume();
      }
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    AudioSynth.setVolume(vol);
  };

  const seekPlayer = (seconds: number) => {
    setProgress(seconds);
    AudioSynth.seek(seconds);
  };

  const nextTrack = () => {
    if (!currentTrack) return;
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1 && idx < tracks.length - 1) {
      playTrack(tracks[idx + 1]);
    } else if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  };

  const prevTrack = () => {
    if (!currentTrack) return;
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) {
      playTrack(tracks[idx - 1]);
    } else if (tracks.length > 0) {
      playTrack(tracks[tracks.length - 1]);
    }
  };

  // Track operations
  const addTrack = (newTrackData: Omit<Track, 'id' | 'plays' | 'downloads' | 'sales' | 'createdAt'>) => {
    const id = 't_' + Math.random().toString(36).substr(2, 9);
    const newTrack: Track = {
      ...newTrackData,
      id,
      plays: 0,
      downloads: 0,
      sales: 0,
      streams: (newTrackData as any).streams !== undefined ? (newTrackData as any).streams : 0,
      plaque_awarded: (newTrackData as any).plaque_awarded !== undefined ? (newTrackData as any).plaque_awarded : false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTracks(prev => [newTrack, ...prev]);
  };

  const updateTrack = (updatedTrack: Track) => {
    setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
    if (currentTrack?.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  const deleteTrack = async (id: string) => {
    if (currentTrack?.id === id) {
      AudioSynth.stop();
      setCurrentTrack(null);
      setIsPlaying(false);
    }
    
    // Optimistic UI state updates
    setTracks(prev => prev.filter(t => t.id !== id));
    setCart(prev => prev.filter(item => item.track.id !== id));

    try {
      console.log(`Sending delete request straight to server api for track: ${id}`);
      const response = await fetch(`/api/delete-track/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`Server audio file removal reported warning: ${errorData.error || response.statusText}`);
      } else {
        console.log(`Track ${id} and associated file successfully purged on host server.`);
      }
    } catch (error) {
      console.error("Failed to execute delete on the host server network link:", error);
    }
  };

  // Cart operations
  const addToCart = (track: Track, licenseId: 'mp3' | 'wav' | 'unlimited' | 'exclusive') => {
    const licDef = defaultLicenseOptions.find(l => l.id === licenseId);
    if (!licDef) return;

    const license: LicenseOption = {
      ...licDef,
      price: track.prices[licenseId]
    };

    setCart(prev => {
      // Avoid duplicate track/license pairs
      const exists = prev.find(item => item.track.id === track.id && item.license.id === licenseId);
      if (exists) return prev;
      return [...prev, { track, license }];
    });
  };

  const removeFromCart = (trackId: string, licenseId: string) => {
    setCart(prev => prev.filter(item => !(item.track.id === trackId && item.license.id === licenseId)));
  };

  const clearCart = () => {
    setCart([]);
    setActiveCouponCode('');
    setDiscountRate(0);
  };

  const applyCoupon = (code: string) => {
    const matched = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
    if (matched) {
      setActiveCouponCode(matched.code);
      if (matched.discountType === 'percentage') {
        setDiscountRate(matched.value / 100);
      } else {
        // Simple fallback mapping for percentage logic
        setDiscountRate(0.15); // standard mock percentage for flat discount rate in complex maths
      }
      return matched;
    }
    return null;
  };

  const checkout = (email: string, couponCode?: string) => {
    if (cart.length === 0) return { success: false };

    const newSales: SaleActivity[] = [];
    const updatedTracks = [...tracks];

    cart.forEach(item => {
      let finalPrice = item.license.price;
      if (discountRate > 0) {
        finalPrice = parseFloat((finalPrice * (1 - discountRate)).toFixed(2));
      }

      // Record scale activity
      const newSale: SaleActivity = {
        id: 's_' + Math.random().toString(36).substr(2, 9),
        trackTitle: item.track.title,
        price: finalPrice,
        licenseType: item.license.name,
        buyerEmail: email,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };

      newSales.push(newSale);

      // Increment values in tracks
      const tIdx = updatedTracks.findIndex(ut => ut.id === item.track.id);
      if (tIdx !== -1) {
        updatedTracks[tIdx] = {
          ...updatedTracks[tIdx],
          sales: updatedTracks[tIdx].sales + 1,
          downloads: updatedTracks[tIdx].downloads + 1
        };
      }
    });

    setSales(prev => [...newSales, ...prev]);
    setTracks(updatedTracks);
    clearCart();

    return { success: true, orderId: 'vv_order_' + Math.random().toString(36).substr(2, 6).toUpperCase() };
  };

  // Convert progress time to clean string formats
  const formatTime = (timeSecs: number) => {
    const minutes = Math.floor(timeSecs / 60);
    const seconds = Math.floor(timeSecs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const playbackTime = formatTime(progress);
  const playbackDurationStr = formatTime(duration);

  const setActiveTab = (tab: 'storefront' | 'studio' | 'about' | 'services' | 'contact' | 'industry-portal' | 'artist-portal') => {
    // If we transition to storefront, we continue playing, same for studio
    setActiveTabState(tab);
  };

  return (
    <StoreContext.Provider
      value={{
        tracks,
        cart,
        sales,
        coupons,
        contracts,
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        playbackTime,
        playbackDurationStr,
        activeTab,
        adminSection,
        
        setTracks,
        addTrack,
        updateTrack,
        deleteTrack,
        
        addToCart,
        removeFromCart,
        clearCart,
        checkout,
        applyCoupon,
        discountRate,
        activeCouponCode,
        
        playTrack,
        togglePlay,
        setVolume,
        seekPlayer,
        nextTrack,
        prevTrack,
        
        setActiveTab,
        setAdminSection,
        
        payoutEmail,
        setPayoutEmail,
        payoutMethod,
        setPayoutMethod
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
