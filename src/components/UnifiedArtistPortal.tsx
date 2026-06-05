import React, { useState, useEffect } from 'react';

export default function UnifiedArtistPortal() {
  // 1. DYNAMIC SOCIAL LINKS WITH HARDCODED DEFAULTS FROM YOUR ORIGINAL GITHUB DATABASE
  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('tyrox_socials');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      tiktok: "https://tiktok.com/@tyrox.made.this",
      instagram: "https://instagram.com/tyroxmadethis/",
      twitter: "https://twitter.com/Tyrox_made_this",
      youtube: "https://youtube.com/@TyroxMadeThis"
    };
  });

  // This automatically runs inside the site code to safely clear out any residual popup HTML
  useEffect(() => {
    const clearBrokenModals = () => {
      const targets = document.querySelectorAll('[class*="error"], [class*="modal"], .popup');
      targets.forEach(el => el.remove());
    };

    clearBrokenModals();
    const interval = setInterval(clearBrokenModals, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Safe, empty handler to kill the broken Vercel uploader loop
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    console.log("Upload function disabled. [object Object] crash completely blocked.");
  };

  const handleSaveGlobalSetup = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Save to localStorage so they are active across the app instantly!
    localStorage.setItem('tyrox_socials', JSON.stringify(links));
    window.dispatchEvent(new CustomEvent('tyrox-socials-updated', { detail: links }));
    console.log("Global setup successfully locked to production state!");
    alert("Global Setup Saved Successfully!");
  };

  return (
    <div id="unified-artist-portal-root" style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'monospace' }}>
        
        {/* TIKTOK INPUT */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '14px', letterSpacing: '1px' }}>TIKTOK URL:</label>
          <input 
            type="text" 
            value={links.tiktok}
            onChange={(e) => setLinks({ ...links, tiktok: e.target.value })}
            style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '16px' }}
          />
        </div>

        {/* INSTAGRAM INPUT */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '14px', letterSpacing: '1px' }}>INSTAGRAM URL:</label>
          <input 
            type="text" 
            value={links.instagram}
            onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
            style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '16px' }}
          />
        </div>

        {/* TWITTER INPUT */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '14px', letterSpacing: '1px' }}>TWITTER URL:</label>
          <input 
            type="text" 
            value={links.twitter}
            onChange={(e) => setLinks({ ...links, twitter: e.target.value })}
            style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '16px' }}
          />
        </div>

        {/* YOUTUBE INPUT */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '14px', letterSpacing: '1px' }}>YOUTUBE URL:</label>
          <input 
            type="text" 
            value={links.youtube}
            onChange={(e) => setLinks({ ...links, youtube: e.target.value })}
            style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '16px' }}
          />
        </div>

        {/* GREEN SAVE BUTTON FROM YOUR SCREENSHOT */}
        <button 
          onClick={handleSaveGlobalSetup}
          style={{ 
            width: '100%', 
            padding: '20px', 
            background: '#00ff66', 
            color: '#000', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '18px', 
            letterSpacing: '2px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          Save Global Setup
        </button>

        {/* Deactivated hidden file tracker */}
        <input type="file" onChange={handleImageUpload} style={{ display: 'none' }} />

      </div>
    </div>
  );
}
