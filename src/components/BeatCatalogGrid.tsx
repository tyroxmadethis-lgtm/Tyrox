import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Track } from '../types';

export default function BeatCatalogGrid() {
  const [beatsCatalog, setBeatsCatalog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useStore();

  useEffect(() => {
    // Pull the active beat list directly from your live server database node
    fetch('/api/beats/public-list')
      .then((res) => res.json())
      .then((data) => {
        setBeatsCatalog(data.beats || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Catalog link offline:", err);
        setIsLoading(false);
      });
  }, []);

  const handleAddToCart = (beat: any) => {
    // Construct compliant Track object for global cart context compatibility
    const safeTrack: Track = {
      id: beat.id,
      title: beat.title,
      producer: "Tyrox",
      bpm: beat.bpm || 140,
      key: beat.key || "Am",
      duration: "3:10",
      tags: beat.tags || ["Hard Drill"],
      imageUrl: beat.imageUrl || beat.image_url,
      audioUrl: beat.audioUrl || beat.audio_url,
      price: beat.price || 29.99,
      prices: {
        mp3: beat.price || 29.99,
        wav: (beat.price || 29.99) * 1.5,
        unlimited: (beat.price || 29.99) * 3,
        exclusive: 499.99
      },
      plays: 0,
      downloads: 0,
      sales: 0,
      createdAt: new Date().toISOString()
    };
    
    // Add to cart with default lease license ('mp3')
    addToCart(safeTrack, 'mp3');
  };

  if (isLoading) {
    return (
      <div 
        id="catalog-loading"
        style={{ color: '#39FF14', textAlign: 'center', padding: '40px' }}
        className="font-mono text-sm tracking-wider uppercase font-black animate-pulse"
      >
        LOADING CATALOG...
      </div>
    );
  }

  return (
    <div 
      id="catalog-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '24px',
        padding: '40px',
        background: '#050505'
      }}
    >
      {beatsCatalog.map((beat) => (
        <div 
          key={beat.id}
          id={`catalog-card-${beat.id}`}
          style={{
            background: '#0d0d0f',
            border: '1px solid #1a1a1f',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'transform 0.2s ease'
          }}
          className="hover:border-neutral-800 hover:shadow-[0_0_15px_rgba(57,255,20,0.1)] group"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
          {/* --- THE BEATSTARS IMAGE DISPLAY HOOK --- */}
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '4px',
            background: '#000000',
            overflow: 'hidden',
            marginBottom: '16px',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
            className="relative"
          >
            <img 
              id={`beat-cover-${beat.id}`}
              src={beat.image_url} 
              alt={beat.title}
              loading="lazy" // Optimizes memory limits on iPad browsers
              className="beat-cover-image"
              onError={(e) => {
                // Self-healing fallback display rule if image path fails to load
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop';
              }}
              referrerPolicy="no-referrer"
            />
          </div>

          <h4 style={{ color: '#fff', fontWeight: '900', fontSize: '1.1rem', marginBottom: '4px', textAlign: 'center' }}>
            {beat.title}
          </h4>
          <span style={{ color: '#39FF14', fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px' }}>
            ${parseFloat(beat.price).toFixed(2)}
          </span>

          <button 
            id={`add-to-cart-btn-${beat.id}`}
            onClick={() => handleAddToCart(beat)}
            style={{
              background: '#39FF14',
              color: '#000',
              border: 'none',
              width: '100%',
              padding: '10px 0',
              fontWeight: '900',
              textTransform: 'uppercase',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
            className="hover:scale-[1.02] transform transition-all active:scale-[0.98]"
          >
            Add To Cart
          </button>
        </div>
      ))}
    </div>
  );
}
