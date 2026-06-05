import React from 'react';

// Dynamic import with runtime safety for environment matching
let ASSET_CONFIG = {
  profilePath: '/profile.jpg',
  bannerPath: '/banner.jpg',
  defaultPrice: '29.99',
  maxTags: 58
};

try {
  // Safe CommonJS dynamic resolution check to prevent Vite/webpack compile crashes
  const dynamicRequire = typeof require !== 'undefined' ? require : null;
  if (dynamicRequire) {
    const sync = dynamicRequire('../../vercel-asset-sync');
    if (sync && sync.ASSET_CONFIG) {
      ASSET_CONFIG = sync.ASSET_CONFIG;
    }
  }
} catch (err) {
  // Fallback seamlessly to default declared asset config
}

export default function StoreProfile() {
  return (
    <div id="store-profile-container" className="store-container p-6 rounded-2xl border border-neutral-900 bg-neutral-950 mt-6 select-none" style={{ background: '#111', color: '#fff' }}>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-purple-400 text-xs font-bold uppercase tracking-widest">
          PRODUCTION VERIFIED SYSTEM ASSETS
        </h3>
        <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold uppercase">
          Locked State
        </span>
      </div>

      {/* Banner Area - Permanently locked to your GitHub image asset */}
      <div 
        id="store-profile-banner"
        className="store-banner rounded-xl overflow-hidden relative shadow-inner border border-neutral-850" 
        style={{ 
          backgroundImage: `url(${ASSET_CONFIG.bannerPath})`, 
          height: '220px', 
          backgroundSize: 'cover',
          backgroundPosition: 'center' 
        }} 
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#111] to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 bg-neutral-950/80 border border-neutral-850 backdrop-blur px-2.5 py-1 rounded text-[9px] font-mono text-purple-400 font-bold tracking-wider uppercase">
          Vercel Build Banner Space
        </div>
      </div>

      {/* Profile Picture Area */}
      <div className="flex flex-col sm:flex-row items-center gap-5 mt-6 border-t border-neutral-900 pt-6">
        <div className="relative">
          <img 
            id="store-profile-pic"
            src={ASSET_CONFIG.profilePath} 
            alt="Profile" 
            className="border-3 border-purple-500/10 shadow-lg object-cover"
            style={{ width: '130px', height: '130px', borderRadius: '50%' }} 
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 left-1/2 -to-x -translate-x-1/2 bg-purple-600 text-white font-mono text-[8px] font-black px-2 py-0.5 rounded shadow uppercase tracking-wide">
            Verified
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h4 className="font-sans font-extrabold text-lg text-white">Tyrox Made This</h4>
          <p className="text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
            Madison, WI • Elite Multi-Platinum Record Producer
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1">
            <div className="font-mono text-[10px] bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg text-neutral-300">
              MP3 Core Tier: <strong className="text-purple-400 font-extrabold">${ASSET_CONFIG.defaultPrice}</strong>
            </div>
            <div className="font-mono text-[10px] bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg text-neutral-300">
              WAV Core Tier: <strong className="text-purple-400 font-extrabold">${ASSET_CONFIG.defaultPrice}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Form configuration fields pre-populated with your single price */}
      <input type="hidden" name="mp3_price" value={ASSET_CONFIG.defaultPrice} />
      <input type="hidden" name="wav_price" value={ASSET_CONFIG.defaultPrice} />
    </div>
  );
}
