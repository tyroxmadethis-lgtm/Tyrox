import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Sparkles, Award, Play, Instagram, Twitter, Youtube, FolderEdit, Upload, Image, RotateCcw } from 'lucide-react';

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

  const [bannerImg, setBannerImg] = React.useState(() => {
    return localStorage.getItem('tyrox_banner_img') || "/banner.jpg";
  });

  React.useEffect(() => {
    const handleBannerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setBannerImg(customEvent.detail);
      }
    };
    window.addEventListener('tyrox-banner-updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('tyrox-banner-updated', handleBannerUpdate);
    };
  }, []);

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
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

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

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      localStorage.setItem('tyrox_banner_img', dataUrl);
      setBannerImg(dataUrl);

      // Sync across standard top visual container immediately
      const syncEvent = new CustomEvent('tyrox-banner-updated', { detail: dataUrl });
      window.dispatchEvent(syncEvent);

      // Simulate a POST form upload backend call
      try {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("/admin/about/upload-banner", { method: "POST", body: formData }).catch(() => {});
      } catch (err) {
        console.log("Mock API banner dispatch performed.", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File must be an image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      
      // Save locally
      localStorage.setItem('tyrox_banner_img', dataUrl);
      setBannerImg(dataUrl);

      // Sync across standard top visual container immediately
      const syncEvent = new CustomEvent('tyrox-banner-updated', { detail: dataUrl });
      window.dispatchEvent(syncEvent);

      // Simulate a POST form upload backend call
      try {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("/admin/about/upload-banner", { method: "POST", body: formData }).catch(() => {});
      } catch (err) {
        console.log("Mock API banner dispatch performed.", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBanner = () => {
    const defaultBanner = "/banner.jpg";
    localStorage.setItem('tyrox_banner_img', defaultBanner);
    setBannerImg(defaultBanner);
    
    const syncEvent = new CustomEvent('tyrox-banner-updated', { detail: defaultBanner });
    window.dispatchEvent(syncEvent);
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
      
      {/* Premium Epic Visual About Banner */}
      <div 
        className="relative rounded-2xl overflow-hidden h-44 sm:h-60 md:h-72 w-full shadow-2xl border border-neutral-900/80 flex items-end"
        style={{
          backgroundImage: `url('${bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#050608]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#050608]/15 to-transparent pointer-events-none" />
      </div>

      {/* 📁 Folder: Edit Header Block */}
      <div 
        id="edit-header-folder" 
        className="w-full max-w-[800px] mx-auto bg-[#0a0b10] border border-neutral-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Folder tab layout styling */}
        <div className="flex items-center">
          <div className="bg-[#121319] border-t border-x border-neutral-900 px-5 py-2.5 text-[10px] font-mono text-red-500 uppercase tracking-widest rounded-t-lg font-bold ml-6 -mb-[1px] relative z-10 flex items-center gap-2">
            <FolderEdit size={12} className="text-red-500" />
            Folder: Edit Header
          </div>
          <div className="flex-1 border-b border-neutral-900 h-[1.5px]"></div>
        </div>

        {/* Folder Content Inner body with Drag & Drop & Click state */}
        <div 
          id="about-header-dragzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`p-6 border-t border-neutral-900 bg-[#111216]/50 transition-all duration-200 ${
            isDragActive 
              ? "border-red-500/40 bg-red-950/10" 
              : "border-transparent"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Explanatory detail */}
            <div className="space-y-2 flex-1">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-white">
                Customize Store & Portal Banner
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans max-w-md">
                Drag and drop your custom photo here or tap Choose File to update. This changes the top background header across your entire portal and storefront banners.
              </p>
              
              <div className="pt-2 flex items-center gap-3">
                <button
                  id="btn-folder-choose-banner"
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] tracking-widest uppercase rounded font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={12} />
                  Choose Photo
                </button>
                
                <button
                  id="btn-folder-reset-banner"
                  type="button"
                  onClick={handleResetBanner}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-mono text-[10px] tracking-widest uppercase rounded font-semibold transition flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reset Default
                </button>
              </div>
            </div>

            {/* Live Banner Miniature Preview */}
            <div className="w-full md:w-56 shrink-0 space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400">
                Live Active Preview:
              </span>
              <div 
                id="folder-preview-thumbnail"
                className="relative h-20 rounded-lg overflow-hidden border border-neutral-800 shadow bg-neutral-950"
                style={{
                  backgroundImage: `url('${bannerImg}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-neutral-950/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image size={18} className="text-white/60 drop-shadow" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 1. PROFILE BANNER SECTION */}
      <div style={{ backgroundColor: '#111', color: 'white', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', position: 'relative' }} className="w-full border border-neutral-800 shadow-2xl">
        
        <div style={{ backgroundImage: `linear-gradient(135deg, rgba(17, 18, 22, 0.75), rgba(0, 0, 0, 0.9)), url('${bannerImg}')`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '40px 20px', textAlign: 'center', borderBottom: '2px solid #ff0055', position: 'relative' }}>
          
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
              className="shadow-[0_0_20px_rgba(255,0,85,0.4)] relative"
            />
            
            <input 
              type="file" 
              id="photoInput" 
              ref={fileInputRef}
              onChange={uploadPhoto} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            <input 
              type="file" 
              id="bannerInput" 
              ref={bannerInputRef}
              onChange={uploadBanner} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            {editMode && (
              <div 
                style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)' }}
                className="flex flex-col gap-1 z-20 whitespace-nowrap items-center"
              >
                <label 
                  id="photoLabel" 
                  htmlFor="photoInput" 
                  style={{ background: 'rgba(0,0,0,0.95)', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                  className="hover:text-red-400 hover:scale-105 active:scale-95 transition-all border border-neutral-800/80 font-mono text-[9px] uppercase tracking-wider text-neutral-300 font-bold"
                >
                  Upload Profile Pic
                </label>
                <label 
                  id="bannerLabel" 
                  htmlFor="bannerInput" 
                  style={{ background: 'rgba(0,0,0,0.95)', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                  className="hover:text-purple-400 hover:scale-105 active:scale-95 transition-all border border-neutral-800/80 font-mono text-[9px] uppercase tracking-wider text-neutral-300 font-bold"
                >
                  Upload Top Banner
                </label>
              </div>
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
