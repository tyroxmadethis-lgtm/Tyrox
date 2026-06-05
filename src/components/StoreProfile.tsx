import React from 'react';

export default function StoreProfile() {
  // Hardcoded fallback URLs to ensure something always displays
  const BANNER_LINK = "https://unsplash.com";
  const PFP_LINK = "https://dicebear.com";

  return (
    <div id="store-profile-container" style={{ width: '100%', position: 'relative', background: '#0a0a0a', zIndex: 999 }}>
      
      {/* 1. Force Banner to load via standard Img tag instead of CSS background */}
      <div id="store-profile-banner-container" style={{ width: '100%', height: '260px', overflow: 'hidden', position: 'relative' }}>
        <img 
          id="store-profile-banner"
          src={BANNER_LINK} 
          alt="Banner" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
        />
      </div>

      {/* 2. Profile Avatar Header */}
      <div id="store-profile-details" style={{ padding: '0 24px', marginTop: '-70px', display: 'flex', alignItems: 'flex-end', gap: '20px', position: 'relative', zIndex: 1000 }}>
        <img 
          id="store-profile-avatar"
          src={PFP_LINK} 
          alt="PFP" 
          style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '50%', 
            border: '4px solid #0a0a0a', 
            backgroundColor: '#1a1a1a',
            objectFit: 'cover',
            display: 'block'
          }} 
          referrerPolicy="no-referrer"
        />
        <div id="store-profile-identity" style={{ marginBottom: '15px' }}>
          <h1 id="store-profile-name" style={{ fontSize: '26px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>TYROX MADE THIS</h1>
          <p id="store-profile-sub" style={{ color: '#aaa', margin: '4px 0 0 0' }}>Premium Rap Producer Portal</p>
        </div>
      </div>

    </div>
  );
}

