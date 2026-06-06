import React from 'react';

interface ProfileHeaderProps {
  bannerImageUrl?: string;
}

export default function ProfileHeader({ bannerImageUrl }: ProfileHeaderProps) {
  // Fallback brand color mask if no image is present in the database row
  const defaultBanner = '/assets/default_dark_bg.jpg'; 

  return (
    <div 
      className="tyrox-enterprise-banner"
      id="tyrox-enterprise-header-banner"
      style={{
        width: '100%',
        height: '280px', // Premium cinematic widescreen scale
        backgroundImage: `url(${bannerImageUrl || defaultBanner})`,
        
        // --- SECURING PERFECT BANNER SHAPE ---
        backgroundSize: 'cover',     // Scales graphic proportionally across all iPad views
        backgroundPosition: 'center', // Locks the center of your design in place
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000000',
        
        borderBottom: '1px solid #111115',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '24px 40px'
      }}
    >
      {/* Dark gradient overlay to make your branding readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 1
      }} />

      {/* Title Text Layout overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h1 style={{ 
          fontFamily: 'sans-serif', 
          fontWeight: '900', 
          fontSize: '2.5rem', 
          color: '#fff', 
          textTransform: 'uppercase',
          letterSpacing: '-1px'
        }}>
          Tyrox Made This
        </h1>
      </div>
    </div>
  );
}
