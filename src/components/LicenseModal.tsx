/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Track } from '../types';
import { useStore } from '../context/StoreContext';
import { X, Check, ShoppingCart, HelpCircle, FileText, Sparkles } from 'lucide-react';

interface LicenseModalProps {
  track: Track;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ track, onClose }) => {
  const { addToCart } = useStore();
  const [selectedTier, setSelectedTier] = useState<'mp3' | 'wav' | 'unlimited' | 'exclusive'>('mp3');
  const [showAddedToast, setShowAddedToast] = useState(false);

  const tiers = [
    {
      id: 'mp3' as const,
      name: 'Standard Leased License',
      price: track.prices?.mp3 || 29.99,
      format: '320kbps MP3 Master Included',
      popular: false,
      benefits: [
        'Commercial vocal recording allowed',
        'Distribute up to 5,000 streams / copies',
        'Non-exclusive rights (track remains in catalog)',
        'Delivered instantly on checkout'
      ],
      tagline: 'Standard mp3 licensing lease, perfect for mixtape tracks or indie demos.'
    },
    {
      id: 'wav' as const,
      name: 'High-Quality WAV Lease',
      price: track.prices?.wav || 49.99,
      format: '24-bit Lossless WAV Included',
      popular: true,
      benefits: [
        'Used for commercial streaming releases',
        'Distribute up to 50,000 streams / copies',
        'Non-exclusive rights (track remains in catalog)',
        'Highest quality uncompressed audio mixdown'
      ],
      tagline: 'The ideal mix-ready lease preferred by audio engineers and recording artists.'
    },
    {
      id: 'unlimited' as const,
      name: 'Unlimited Rights Lease',
      price: track.prices?.unlimited || 149.99,
      format: 'Uncompressed WAV + Trackout Stems',
      popular: false,
      benefits: [
        'Unlimited audio streams and physical copies',
        'Radio broadcasting & live show performance rights',
        'Includes full tracked-out stem files for deep remixing',
        '100% royalty-free under the license terms'
      ],
      tagline: 'Unleash full potential with unlimited streams, radio play, and multi-stem files.'
    },
    {
      id: 'exclusive' as const,
      name: 'Exclusive Buyout Right',
      price: track.prices?.exclusive || 499.99,
      format: 'Exclusive Ownership Contract',
      popular: false,
      benefits: [
        'Full ownership (beat removed from public catalog)',
        'Uncapped streaming, monetization & resale rights',
        'All raw high-fidelity multitracks & master stems',
        'Direct signed PDF acquisition contract'
      ],
      tagline: 'Definitive exclusive transfer of ownership, removing the beat forever from our store.'
    }
  ];

  const handleAddToCart = () => {
    addToCart(track, selectedTier);
    setShowAddedToast(true);
    setTimeout(() => {
      setShowAddedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="license-modal-overlay" className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      
      {/* Modal Main container */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-[0_30px_60px_rgba(168,85,247,0.1)]">
        
        {/* Neon Gradient Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />
        
        {/* Top bar info */}
        <div className="p-5 border-b border-neutral-900 flex justify-between items-center bg-neutral-950">
          <div className="flex items-center gap-3">
            <img src={track.imageUrl} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-contain rounded-sm border border-neutral-800 bg-black flex-shrink-0" />
            <div>
              <h2 className="font-sans font-bold text-neutral-100 text-sm tracking-wide uppercase">Select License Class</h2>
              <p className="font-mono text-[10px] text-cyan-400 mt-0.5">TRACK: "{track.title}" • BPM: {track.bpm} • KEY: {track.key}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition overflow-hidden cursor-pointer"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Tiers selection Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tiers.map((tier) => {
              const isActive = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition relative h-full select-none ${
                    isActive
                      ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-neutral-900/20 border-neutral-900 hover:border-neutral-850 hover:bg-neutral-905/30'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 text-[8px] font-mono uppercase tracking-widest text-white rounded-full font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]">Most Popular</span>
                  )}

                  <div className="space-y-1 text-center md:text-left">
                    <p className={`font-sans font-bold text-xs uppercase tracking-wide transition ${isActive ? 'text-purple-300' : 'text-neutral-400'}`}>{tier.name}</p>
                    <p className="font-mono text-lg font-black text-white mt-1">${tier.price.toFixed(2)}</p>
                    <p className="font-mono text-[8.5px] text-neutral-550 leading-relaxed uppercase">{tier.format}</p>
                  </div>
                  
                  {/* Radio Indicator */}
                  <div className="flex justify-center md:justify-start mt-3">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-purple-500 bg-purple-600/20' : 'border-neutral-700 bg-neutral-900'}`}>
                      {isActive && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Tier Specifications Section */}
          {(() => {
            const currentTierDef = tiers.find(t => t.id === selectedTier)!;
            return (
              <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-900/60 flex flex-col md:flex-row gap-5 items-start justify-between animate-fadeIn">
                <main className="space-y-3 flex-1">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                    <span className="p-1 bg-purple-500/15 text-purple-400 rounded">
                      <FileText size={12} />
                    </span>
                    <h3 className="font-sans font-bold text-xs text-neutral-200 uppercase tracking-widest">Leasing Clearance Allowance</h3>
                  </div>

                  <p className="text-[10.5px] font-sans text-neutral-400 leading-relaxed">
                    {currentTierDef.tagline}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentTierDef.benefits.map((ben, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-neutral-350">
                        <span className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded-full flex-shrink-0">
                          <Check size={10} />
                        </span>
                        <span className="text-[10px] leading-tight font-sans text-neutral-300">{ben}</span>
                      </div>
                    ))}
                  </div>
                </main>

                <div className="w-full md:w-56 p-4 rounded-xl bg-neutral-950 border border-neutral-900 text-center space-y-3 self-center">
                  <span className="font-mono text-[9px] text-neutral-500 uppercase">TIER PRICE</span>
                  <div className="text-3xl font-mono text-white font-black">${currentTierDef.price.toFixed(2)}</div>
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold uppercase rounded-lg tracking-wide transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/40"
                  >
                    <ShoppingCart size={12} />
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Floating Adding Success Screen overlay */}
        {showAddedToast && (
          <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center gap-2 z-50 animate-fadeIn">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 animate-scaleUp">
              <Sparkles size={24} fill="currentColor" className="animate-spin-slow" />
            </div>
            <p className="font-sans font-bold text-sm text-neutral-100 uppercase tracking-wider animate-pulse mt-2">Added to cart successfully!</p>
            <p className="font-mono text-[10px] text-neutral-500 uppercase">DELIVERIES BEING ENQUEUED</p>
          </div>
        )}

        {/* Modal Legal Warning Footer */}
        <div className="p-4 bg-neutral-900/10 border-t border-neutral-900 text-[9.5px] font-mono text-neutral-550 leading-normal text-center">
          Purchasing forms a legally-binding licensing lease between buyer and producer "tyrox made this". PDF contracts are auto-linked and whitelisted on checkout.
        </div>
      </div>
    </div>
  );
};
