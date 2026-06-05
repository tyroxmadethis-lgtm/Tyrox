import React from 'react';

export default function StoreProfile() {
  // 1. PASTE YOUR DIRECT IMAGES HERE 
  // You can replace these with any direct web link (e.g. from Discord, Imgur, or Socials)
  const PERMANENT_PFP_URL = "https://dicebear.com"; 
  const PERMANENT_BANNER_URL = "https://unsplash.com"; 

  return (
    <div id="store-profile-container" className="rounded-2xl overflow-hidden mt-6 border border-neutral-900" style={{ background: '#0a0a0a', color: '#fff', width: '100%' }}>
      
      {/* Absolute Banner Force-Load */}
      <div 
        id="store-profile-banner"
        style={{ 
          width: '100%', 
          height: '260px', 
          backgroundImage: `url(${PERMANENT_BANNER_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#111'
        }} 
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 pointer-events-none" />
      </div>

      {/* Absolute Profile Image Force-Load */}
      <div id="store-profile-details" className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-5" style={{ padding: '0 24px 24px 24px', marginTop: '-70px' }}>
        <img 
          id="store-profile-avatar"
          src={PERMANENT_PFP_URL} 
          alt="Profile Avatar"
          style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '50%', 
            border: '4px solid #0a0a0a',
            backgroundColor: '#1a1a1a',
            objectFit: 'cover',
            zIndex: 10
          }} 
          referrerPolicy="no-referrer"
        />
        
        <div id="store-profile-identity" style={{ marginBottom: '15px' }} className="space-y-1 z-10">
          <h1 id="store-profile-name" style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }} className="font-sans uppercase tracking-tight text-white">TYROX MADE THIS</h1>
          <p id="store-profile-sub" style={{ color: '#a855f7', margin: '4px 0 0 0' }} className="font-mono text-xs uppercase tracking-widest font-bold">Premium Rap Producer Portal</p>
        </div>
      </div>

    </div>
  );
}

