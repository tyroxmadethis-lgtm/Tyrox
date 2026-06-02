import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Sparkles, Award, Play, Instagram, Twitter, Youtube } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { setActiveTab } = useStore();

  const [editMode, setEditMode] = React.useState(false);
  const [bioText, setBioText] = React.useState(() => {
    return localStorage.getItem('tyrox_bio') || 
      "Providing industry-standard production tools directly to RAP Labels, ANR Scouts, and RAP Engineers. Bypassing third-party marketplace restrictions to deliver uncompressed, pre-cleared masters and premium stems at lightning speed.";
  });
  const [tempBioText, setTempBioText] = React.useState(bioText);
  
  const [profileImg, setProfileImg] = React.useState(() => {
    return localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg";
  });

  const [socials, setSocials] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tyrox_socials');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      instagram: "https://instagram.com/tyrox",
      twitter: "https://twitter.com/tyrox",
      youtube: "https://youtube.com/c/tyrox"
    };
  });
  const [tempSocials, setTempSocials] = React.useState(socials);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleEditMode = () => {
    if (!editMode) {
      setTempBioText(bioText);
      setTempSocials(socials);
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File must be an image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      
      // Save locally
      localStorage.setItem('tyrox_profile_img', dataUrl);
      setProfileImg(dataUrl);

      // Sync across any other active components via custom event
      const syncEvent = new CustomEvent('tyrox-profile-updated', { detail: dataUrl });
      window.dispatchEvent(syncEvent);

      // Simulate a POST form upload backend call
      try {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("/admin/about/upload-photo", { method: "POST", body: formData }).catch(() => {});
      } catch (err) {
        console.log("Mock API dispatch performed.", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveAllChanges = async () => {
    setBioText(tempBioText);
    setSocials(tempSocials);
    localStorage.setItem('tyrox_bio', tempBioText);
    localStorage.setItem('tyrox_socials', JSON.stringify(tempSocials));
    setEditMode(false);

    // Simulate templates POST
    try {
      const formData = new FormData();
      formData.append("description", tempBioText);
      await fetch("/admin/about/edit-text", { method: "POST", body: formData }).catch(() => {});
    } catch (err) {
      console.log("Mock API text save performed.", err);
    }

    // Simulate edit-socials POST
    try {
      const formData = new FormData();
      formData.append("instagram", tempSocials.instagram);
      formData.append("twitter", tempSocials.twitter);
      formData.append("youtube", tempSocials.youtube);
      await fetch("/admin/about/edit-socials", { method: "POST", body: formData }).catch(() => {});
    } catch (err) {
      console.log("Mock API socials save performed.", err);
    }
  };

  return (
    <div id="about-page-view" className="py-12 px-4 md:px-8 max-w-5xl mx-auto pt-6 flex flex-col gap-10 min-h-screen text-neutral-100">
      
      {/* 1. PROFILE BANNER SECTION */}
      <div style={{ backgroundColor: '#111', color: 'white', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', position: 'relative' }} className="w-full border border-neutral-800 shadow-2xl">
        
        <div style={{ background: 'linear-gradient(135deg, #1f1f1f, #000)', padding: '40px 20px', textAlign: 'center', borderBottom: '2px solid #ff0055', position: 'relative' }}>
          
          {/* Admin Controller Toggle */}
          <button 
            id="editBtn" 
            onClick={toggleEditMode} 
            style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: editMode ? '#555' : '#ff0055', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}
            className="hover:scale-[1.03] transition-all text-xs"
          >
            {editMode ? "Cancel" : "Edit Page"}
          </button>

          {/* Profile Photo */}
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 15px' }} className="group">
            <img 
              id="profileImg" 
              src={profileImg} 
              alt="Tyrox" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #ff0055', objectFit: 'cover' }}
              className="shadow-[0_0_20px_rgba(255,0,85,0.4)]"
            />
            
            <input 
              type="file" 
              id="photoInput" 
              ref={fileInputRef}
              onChange={uploadPhoto} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            {editMode && (
              <label 
                id="photoLabel" 
                htmlFor="photoInput" 
                style={{ background: 'rgba(0,0,0,0.85)', padding: '5px 10px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer', position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}
                className="hover:text-red-400 hover:scale-105 active:scale-95 transition-all border border-neutral-800 whitespace-nowrap"
              >
                Upload Real Photo
              </label>
            )}
          </div>

          <h2 style={{ fontSize: '2.2rem', margin: '0 0 5px 0', letterSpacing: '1px' }} className="font-logo font-black uppercase text-white">
            TYROX <span className="text-red-500">MADE THIS</span>
          </h2>
          
          {/* DYNAMIC BANNER FOOTER: Social Media Links Appear Here */}
          <div id="socialsBannerBottom" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '25px' }}>
            {socials.instagram ? (
              <a 
                id="linkInsta" 
                href={socials.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                className="hover:text-red-500 flex items-center gap-1.5"
              >
                <Instagram size={14} className="text-red-500" />
                Instagram
              </a>
            ) : null}
            {socials.twitter ? (
              <a 
                id="linkTwitter" 
                href={socials.twitter} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                className="hover:text-purple-400 flex items-center gap-1.5"
              >
                <Twitter size={14} className="text-purple-400" />
                Twitter
              </a>
            ) : null}
            {socials.youtube ? (
              <a 
                id="linkYoutube" 
                href={socials.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                className="hover:text-red-600 flex items-center gap-1.5"
              >
                <Youtube size={14} className="text-red-600" />
                YouTube
              </a>
            ) : null}
          </div>
        </div>

        {/* 2. CONTENT & ADMIN INNER PANEL */}
        <div style={{ padding: '30px', textAlign: 'center' }}>
          {!editMode ? (
            <div 
              id="bioDisplay" 
              style={{ color: '#ccc', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}
              className="text-sm font-sans"
            >
              {bioText}
            </div>
          ) : (
            /* Hidden Admin Form Matrix (made visible when editing) */
            <div 
              id="adminFormPanel" 
              style={{ display: 'block', maxWidth: '500px', margin: '20px auto 0', textAlign: 'left', background: '#1a1a1a', padding: '20px', borderRadius: '6px' }}
              className="border border-neutral-800"
            >
              <label style={{ display: 'block', marginBottom: '5px', color: '#ff0055' }} className="text-xs font-mono uppercase tracking-wide">
                Bio Description:
              </label>
              <textarea 
                id="bioEdit" 
                value={tempBioText}
                onChange={(e) => setTempBioText(e.target.value)}
                style={{ width: '100%', height: '80px', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '15px', borderRadius: '4px' }}
                className="text-xs font-sans focus:outline-none focus:border-red-500/50"
              />
              
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }} className="text-xs font-mono uppercase tracking-wide">
                Instagram URL:
              </label>
              <input 
                type="text" 
                id="inputInsta" 
                value={tempSocials.instagram}
                onChange={(e) => setTempSocials({ ...tempSocials, instagram: e.target.value })}
                placeholder="https://instagram.com..." 
                style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '12px', borderRadius: '4px' }}
                className="text-xs font-mono focus:outline-none focus:border-red-500/50"
              />
              
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }} className="text-xs font-mono uppercase tracking-wide">
                Twitter URL:
              </label>
              <input 
                type="text" 
                id="inputTwitter" 
                value={tempSocials.twitter}
                onChange={(e) => setTempSocials({ ...tempSocials, twitter: e.target.value })}
                placeholder="https://twitter.com..." 
                style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '12px', borderRadius: '4px' }}
                className="text-xs font-mono focus:outline-none focus:border-red-500/50"
              />
              
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }} className="text-xs font-mono uppercase tracking-wide">
                YouTube URL:
              </label>
              <input 
                type="text" 
                id="inputYoutube" 
                value={tempSocials.youtube}
                onChange={(e) => setTempSocials({ ...tempSocials, youtube: e.target.value })}
                placeholder="https://youtube.com..." 
                style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '20px', borderRadius: '4px' }}
                className="text-xs font-mono focus:outline-none focus:border-red-500/50"
              />
              
              <button 
                onClick={saveAllChanges}
                style={{ backgroundColor: '#00ff66', color: 'black', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}
                className="hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-wide font-mono"
              >
                Save Global Setup
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Grid detailing stats or credits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0b0c10] border border-neutral-900 rounded-xl p-6 hover:border-red-500/20 transition duration-300">
          <Award className="text-red-500 mb-3" size={24} />
          <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">Underground Pioneer</h3>
          <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
            Pioneered the gritty sub-genre crossing distorted trap sidechain compression directly with low-tuned metallic rhythm patterns.
          </p>
        </div>

        <div className="bg-[#0b0c10] border border-neutral-900 rounded-xl p-6 hover:border-purple-500/20 transition duration-300">
          <ShieldCheck className="text-purple-500 mb-3" size={24} />
          <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">100% Cleared Catalog</h3>
          <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
            Every sample, guitar run, and synth component has been cleared or forged in-house. Protect your earnings on Spotify, YouTube & Apple Music.
          </p>
        </div>

        <div className="bg-[#0b0c10] border border-neutral-900 rounded-xl p-6 hover:border-red-500/20 transition duration-300">
          <Sparkles className="text-red-500 mb-3" size={24} />
          <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">VIP Industry Sync</h3>
          <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
            Supplying direct audio deliverables with pre-cleared master matrices for fast-track indie, label managers, and A&R scouters.
          </p>
        </div>
      </div>

      {/* Main Narrative and Gear Specs Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7 space-y-4">
          <h2 className="text-xl font-bold font-sans tracking-tight text-white uppercase border-b border-neutral-900 pb-2">
            The Philosophy
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            In a landscape saturated by repetitive loops, original composition is king. I track real guitar axes, program heavy industrial drum modules, and write customized synthesizers designed to shatter subwoofers. 
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            Whether you are recording raw rap vocals over heavy bass lines, metal growls, or need watermarked instrumentals for gaming and background sync, the audio files generated here will place you miles ahead of the competition. 
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('storefront')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono tracking-widest uppercase rounded font-bold transition flex items-center gap-2"
            >
              <Play size={12} fill="currentColor" />
              Listen to Tracks
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 text-[10px] font-mono tracking-widest uppercase rounded font-semibold transition"
            >
              Secure Booking Pitch
            </button>
          </div>
        </div>

        {/* Compact Gear Specs Sidebar Info */}
        <div className="md:col-span-5 bg-[#08090d] border border-neutral-900 rounded-xl p-5 space-y-4">
          <h4 className="font-mono text-[10px] uppercase text-red-400 tracking-wider">HARDWARE & PRODUCTION SPECS</h4>
          <div className="space-y-3 font-mono text-[9px] text-neutral-400">
            <div className="flex justify-between border-b border-neutral-900 pb-1.5">
              <span>DAW</span>
              <span className="text-white">Ableton Live Pitch Engine</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900 pb-1.5">
              <span>Guitar Arsenal</span>
              <span className="text-white">Ibanez 8-String (Multiscale)</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900 pb-1.5">
              <span>Hardware Synth</span>
              <span className="text-white">Custom Analog Tube Preamps</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900 pb-1.5">
              <span>Dynamic Range Limit</span>
              <span className="text-white">-4 LUF (Aggressive Underground)</span>
            </div>
            <div className="flex justify-between">
              <span>A&R Clearance System</span>
              <span className="text-white">FastAPI Role Protection Gateway</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
