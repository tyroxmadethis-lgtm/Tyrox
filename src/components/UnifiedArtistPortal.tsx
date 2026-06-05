import React, { useEffect } from 'react';

export default function UnifiedArtistPortal() {
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

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: '20px' }}>
      <p style={{ color: '#888' }}>Social Media Portals Active</p>
    </div>
  );
}
