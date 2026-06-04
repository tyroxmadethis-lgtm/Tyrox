import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Sparkles, Award, Play, Instagram, Twitter, Youtube, FolderEdit, Upload, Image, RotateCcw, Music } from 'lucide-react';
import { z } from "zod";

export const globalSetupSchema = z.object({
  bio: z.string().max(1000),
  
  // Using .catch() or general strings ensures a strict pattern never crashes your save button
  tiktokUrl: z.string().url().or(z.string().length(0)),
  instagramUrl: z.string().url().or(z.string().length(0)),
  
  // Specifically allowing underscores and hyphens in the path
  twitterUrl: z.string().regex(/^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/, {
    message: "Invalid Twitter URL profile format"
  }).or(z.string().length(0)),
  
  youtubeUrl: z.string().regex(/^(https?:\/\/)?(www\.)?youtube\.com\/@[a-zA-Z0-9_.-]+\/?$/, {
    message: "Invalid YouTube URL format"
  }).or(z.string().length(0)),
});

export const AboutView: React.FC = () => {
  const { setActiveTab } = useStore();

  const [editMode, setEditMode] = React.useState(false);
  const [bioText, setBioText] = React.useState(() => {
    const saved = localStorage.getItem('tyrox_bio');
    if (saved && saved.includes("Operating straight out of Madison, Wisconsin")) {
      return saved;
    }
    return "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. Merging high-fidelity sub-bass architecture directly with uncompressed master stems, Tyrox delivers clinical industry-standard track assets for label-ready artists.";
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
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          tiktok: parsed.tiktok || "https://tiktok.com/@tyrox.made.this",
          instagram: parsed.instagram || "https://instagram.com/tyroxmadethis/",
          twitter: parsed.twitter || "https://twitter.com/Tyrox_made_this",
          youtube: parsed.youtube || "https://youtube.com/@TyroxMadeThis"
        };
      }
    } catch (e) {}
    return {
      tiktok: "https://tiktok.com/@tyrox.made.this",
      instagram: "https://instagram.com/tyroxmadethis/",
      twitter: "https://twitter.com/Tyrox_made_this",
      youtube: "https://youtube.com/@TyroxMadeThis"
    };
  });
  const [tempSocials, setTempSocials] = React.useState(socials);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const [profileFile, setProfileFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);

  // Preview URLs so the user sees their selection instantly on screen
  const [profilePreview, setProfilePreview] = React.useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const toggleEditMode = () => {
    if (!editMode) {
      setTempBioText(bioText);
      setTempSocials(socials);
      setEditMode(true);
    } else {
      setEditMode(false);
      // Cancel changes: remove any temporary previews
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
        setProfilePreview(null);
      }
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
      }
      setProfileFile(null);
      setBannerFile(null);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file)); // Show preview instantly
    }
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  const handleResetBanner = () => {
    const defaultBanner = "/banner.jpg";
    localStorage.setItem('tyrox_banner_img', defaultBanner);
    setBannerImg(defaultBanner);
    setBannerFile(null);
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
    
    const syncEvent = new CustomEvent('tyrox-banner-updated', { detail: defaultBanner });
    window.dispatchEvent(syncEvent);
  };

  const handleResetProfile = () => {
    const defaultProfile = "/static/images/tyrox_profile.jpg";
    localStorage.setItem('tyrox_profile_img', defaultProfile);
    setProfileImg(defaultProfile);
    setProfileFile(null);
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
      setProfilePreview(null);
    }
    
    const syncEvent = new CustomEvent('tyrox-profile-updated', { detail: defaultProfile });
    window.dispatchEvent(syncEvent);
  };

  const yourImageUploadFunction = async (params: { avatar?: File | null; banner?: File | null }) => {
    const formData = new FormData();
    if (params.avatar) {
      formData.append('profilePic', params.avatar);
    }
    if (params.banner) {
      formData.append('topBanner', params.banner);
    }

    const origin = window.location.origin;
    const absoluteUrl = (!origin || origin === 'null') 
      ? '/api/user/upload-assets' 
      : `${origin}/api/user/upload-assets`;

    const response = await fetch(absoluteUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload assets.");
    }

    const data = await response.json();
    return {
      avatarUrl: data.profilePicPath,
      bannerUrl: data.topBannerPath,
    };
  };

  const handleSaveChanges = async (formData: any) => {
    // --- STEP 1: INITIALIZE IMAGE STRINGS ---
    // Start with whatever images are already successfully saved
    let finalizedAvatarUrl = formData.existingAvatarUrl || "";
    let finalizedBannerUrl = formData.existingBannerUrl || "";

    // --- STEP 2: WAIT FOR UPLOADS TO FINISH ---
    // This stops the text from saving while the green "Uploading Simultaneously" is running
    if (formData.newAvatarFile || formData.newBannerFile) {
      console.log("Images detected. Pausing form save until upload completes...");
      
      // Execute your upload function and completely wait for it to return actual string URLs
      const uploadResponse = await yourImageUploadFunction({
        avatar: formData.newAvatarFile,
        banner: formData.newBannerFile
      });

      // Assign the freshly generated web string links
      if (uploadResponse?.avatarUrl) finalizedAvatarUrl = uploadResponse.avatarUrl;
      if (uploadResponse?.bannerUrl) finalizedBannerUrl = uploadResponse.bannerUrl;
    }

    // --- STEP 3: CONSTRUCT A CLEAN PAYLOAD ---
    // Ensure every single field is passed as a verified, clean string pattern
    const cleanPayload = {
      bio: (formData.bio || "").trim(),
      tiktokUrl: (formData.tiktokUrl || "").trim(),
      instagramUrl: (formData.instagramUrl || "").trim(),
      twitterUrl: (formData.twitterUrl || "").trim(),
      youtubeUrl: (formData.youtubeUrl || "").trim(),
      avatar: String(finalizedAvatarUrl), // Forces it into a text string pattern
      banner: String(finalizedBannerUrl)  // Forces it into a text string pattern
    };

    console.log("Payload verified as clean strings. Sending to database:", cleanPayload);

    // --- STEP 4: SAVE TO YOUR DATABASE ---
    const origin = window.location.origin;
    const saveUrl = (!origin || origin === 'null') 
      ? '/api/settings/save' 
      : `${origin}/api/settings/save`;

    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });

    if (!response.ok) {
      throw new Error("Database rejected the data format.");
    }

    // Reflect successful saving in states and localStorage
    const nextSocials = {
      twitter: cleanPayload.twitterUrl,
      youtube: cleanPayload.youtubeUrl,
      tiktok: cleanPayload.tiktokUrl,
      instagram: cleanPayload.instagramUrl
    };

    setBioText(cleanPayload.bio);
    setSocials(nextSocials);
    localStorage.setItem('tyrox_bio', cleanPayload.bio);
    localStorage.setItem('tyrox_socials', JSON.stringify(nextSocials));

    // Dispatch synchronized update events across panels instantly
    window.dispatchEvent(new CustomEvent('tyrox-bio-updated', { detail: cleanPayload.bio }));
    window.dispatchEvent(new CustomEvent('tyrox-socials-updated', { detail: nextSocials }));

    if (finalizedAvatarUrl) {
      const finalProfile = finalizedAvatarUrl.includes('?') ? finalizedAvatarUrl : `${finalizedAvatarUrl}?t=${Date.now()}`;
      localStorage.setItem('tyrox_profile_img', finalProfile);
      setProfileImg(finalProfile);
      window.dispatchEvent(new CustomEvent('tyrox-profile-updated', { detail: finalProfile }));
    }
    if (finalizedBannerUrl) {
      const finalBanner = finalizedBannerUrl.includes('?') ? finalizedBannerUrl : `${finalizedBannerUrl}?t=${Date.now()}`;
      localStorage.setItem('tyrox_banner_img', finalBanner);
      setBannerImg(finalBanner);
      window.dispatchEvent(new CustomEvent('tyrox-banner-updated', { detail: finalBanner }));
    }

    // Revoke Object URLs to prevent memory leak
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
      setProfilePreview(null);
    }
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
    setProfileFile(null);
    setBannerFile(null);

    setEditMode(false);

    alert("Changes saved successfully without pattern errors!");
  };

  const saveAllChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUploading(true);

    try {
      // 1. Get input values
      const twitterInput = (document.getElementById('twitter-url') as HTMLInputElement)?.value ?? tempSocials.twitter ?? "";
      const youtubeInput = (document.getElementById('youtube-url') as HTMLInputElement)?.value ?? tempSocials.youtube ?? "";
      const tiktokInput = (document.getElementById('tiktok-url') as HTMLInputElement)?.value ?? tempSocials.tiktok ?? "";
      const instagramInput = (document.getElementById('instagram-url') as HTMLInputElement)?.value ?? tempSocials.instagram ?? "";

      // 2. Validate Social Media URLs using robust Zod schema
      globalSetupSchema.parse({
        bio: tempBioText,
        tiktokUrl: tiktokInput,
        instagramUrl: instagramInput,
        twitterUrl: twitterInput,
        youtubeUrl: youtubeInput,
      });

      // 3. Assemble parameters resembling the signature expected
      const formPayload = {
        existingAvatarUrl: profileImg,
        existingBannerUrl: bannerImg,
        newAvatarFile: profileFile,
        newBannerFile: bannerFile,
        bio: tempBioText,
        tiktokUrl: tiktokInput,
        instagramUrl: instagramInput,
        twitterUrl: twitterInput,
        youtubeUrl: youtubeInput,
      };

      // 4. Run multi-stage save
      await handleSaveChanges(formPayload);

    } catch (error: any) {
      console.error('Submission processing caught an error:', error);
      let errorMessage = error.message;
      if (error instanceof z.ZodError) {
        // Formulate a clean aggregate message from Zod validation issues
        errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(' | ');
      }
      alert(`Client-side processing error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="about-page-view" className="py-12 px-4 md:px-8 max-w-5xl mx-auto pt-6 flex flex-col gap-10 min-h-screen text-neutral-100">
      
      {/* Premium Epic Visual About Banner */}
      <div 
        className="relative rounded-2xl overflow-hidden h-44 sm:h-60 md:h-72 w-full shadow-2xl border border-neutral-900/80 flex items-end"
        style={{
          backgroundImage: `url('${bannerPreview || bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#050608]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#050608]/15 to-transparent pointer-events-none" />
        
        {/* Pinned Social Links Dock */}
        <div className="absolute bottom-4 right-4 flex items-center gap-3.5 z-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {socials.tiktok && (
            <a href={socials.tiktok} target="_blank" rel="noreferrer" title="TikTok" className="text-neutral-300 hover:text-red-500 transition-colors duration-200 pb-0.5">
              <Music className="w-4 h-4" />
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noreferrer" title="Instagram" className="text-neutral-300 hover:text-pink-500 transition-colors duration-200 pb-0.5">
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {socials.youtube && (
            <a href={socials.youtube} target="_blank" rel="noreferrer" title="YouTube" className="text-neutral-300 hover:text-red-600 transition-colors duration-200 pb-0.5">
              <Youtube className="w-4 h-4" />
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noreferrer" title="Twitter" className="text-neutral-300 hover:text-sky-400 transition-colors duration-200 pb-0.5">
              <Twitter className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* 📁 Folder: Edit Banner & Profile Pic Block */}
      <div 
        id="edit-header-folder" 
        className="w-full max-w-[800px] mx-auto bg-[#0a0b10] border border-neutral-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Folder tab layout styling */}
        <div className="flex items-center">
          <div className="bg-[#121319] border-t border-x border-neutral-900 px-5 py-2.5 text-[10px] font-mono text-red-500 uppercase tracking-widest rounded-t-lg font-bold ml-6 -mb-[1px] relative z-10 flex items-center gap-2">
            <FolderEdit size={12} className="text-red-500" />
            Folder: Edit Header & Profile Pic
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-neutral-900/60">
            
            {/* PANEL 1: BANNER EDIT CONTROL */}
            <div className="space-y-4 pr-0 md:pr-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">SECTION A: PORTAL BANNER</span>
                <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">
                  Customize Website & Store Banner
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm">
                  Drag and drop your custom photo here or click choose to update. Changes website-wide storefront and profile banners.
                </p>
                
                <div className="pt-2 flex items-center gap-3">
                  <button
                    id="btn-folder-choose-banner"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      bannerInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] tracking-widest uppercase rounded font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={11} />
                    Choose Photo
                  </button>
                  
                  <button
                    id="btn-folder-reset-banner"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleResetBanner();
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-mono text-[9px] tracking-widest uppercase rounded font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    Reset Default
                  </button>
                </div>
              </div>

              {/* Live Banner Miniature Preview */}
              <div className="space-y-1.5 pt-1">
                <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500">
                  Store Banner Preview:
                </span>
                <div 
                  id="folder-preview-thumbnail"
                  className="relative h-16 rounded-lg overflow-hidden border border-neutral-800/80 shadow bg-neutral-950"
                  style={{
                    backgroundImage: `url('${bannerPreview || bannerImg}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-neutral-950/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image size={14} className="text-white/40 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: PROFILE PHOTO EDIT CONTROL */}
            <div className="space-y-4 pt-6 md:pt-0 pl-0 md:pl-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-pink-500 uppercase tracking-wider font-bold">SECTION B: PROFILE IMAGE</span>
                <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">
                  Customize Profile Avatar
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm">
                  Choose a face, logo, or icon from your device. Updates across all artist portal and header badges permanently.
                </p>
                
                <div className="pt-2 flex items-center gap-3">
                  <button
                    id="btn-folder-choose-profile"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-mono text-[9px] tracking-widest uppercase rounded font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={11} />
                    Choose Photo
                  </button>
                  
                  <button
                    id="btn-folder-reset-profile"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleResetProfile();
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-mono text-[9px] tracking-widest uppercase rounded font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    Reset Default
                  </button>
                </div>
              </div>

              {/* Circular Avatar Preview */}
              <div className="flex items-center gap-4 pt-1">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff0055] bg-neutral-950 shadow-[0_0_12px_rgba(255,0,85,0.3)]">
                    <img 
                      src={profilePreview || profileImg} 
                      alt="Artist avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500 block mb-0.5">
                    Avatar Status Indicator
                  </span>
                  <p className="text-[10px] text-neutral-400 font-sans italic">
                    Successfully linked to `/static/images/tyrox_profile.jpg` file pipeline.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 1. PROFILE BANNER SECTION */}
      <div style={{ backgroundColor: '#111', color: 'white', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', position: 'relative' }} className="w-full border border-neutral-800 shadow-2xl">
        
        <div style={{ backgroundImage: `linear-gradient(135deg, rgba(17, 18, 22, 0.75), rgba(0, 0, 0, 0.9)), url('${bannerPreview || bannerImg}')`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '40px 20px', textAlign: 'center', borderBottom: '2px solid #ff0055', position: 'relative' }}>
          
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
              src={profilePreview || profileImg} 
              alt="Tyrox" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #ff0055', objectFit: 'cover' }}
              className="shadow-[0_0_20px_rgba(255,0,85,0.4)] relative"
            />
            
            <input 
              type="file" 
              id="photoInput" 
              ref={fileInputRef}
              onChange={handleProfileChange} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            <input 
              type="file" 
              id="bannerInput" 
              ref={bannerInputRef}
              onChange={handleBannerChange} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            {editMode && (
              <div 
                style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)' }}
                className="flex flex-col gap-1 z-20 whitespace-nowrap items-center"
              >
                <button 
                  id="photoLabel" 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                  style={{ background: 'rgba(0,0,0,0.95)', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                  className="hover:text-red-400 hover:scale-105 active:scale-95 transition-all border border-neutral-800/80 font-mono text-[9px] uppercase tracking-wider text-neutral-300 font-bold"
                >
                  Upload Profile Pic
                </button>
                <button 
                  id="bannerLabel" 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    bannerInputRef.current?.click();
                  }}
                  style={{ background: 'rgba(0,0,0,0.95)', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                  className="hover:text-purple-400 hover:scale-105 active:scale-95 transition-all border border-neutral-800/80 font-mono text-[9px] uppercase tracking-wider text-neutral-300 font-bold"
                >
                  Upload Top Banner
                </button>
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '2.2rem', margin: '0 0 5px 0', letterSpacing: '1px' }} className="font-logo font-black uppercase text-white">
            TYROX <span className="text-red-500">MADE THIS</span>
          </h2>
          
          {/* DYNAMIC BANNER FOOTER: Social Media Links Appear Here */}
          <div id="socialsBannerBottom" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '25px' }}>
            {socials.tiktok ? (
              <a 
                id="linkTiktok" 
                href={socials.tiktok} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                className="hover:text-red-500 flex items-center gap-1.5"
              >
                <Music size={14} className="text-red-500" />
                TikTok
              </a>
            ) : null}
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
                TikTok URL:
              </label>
              <input 
                type="text" 
                id="tiktok-url" 
                value={tempSocials.tiktok}
                onChange={(e) => setTempSocials({ ...tempSocials, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@..." 
                style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '12px', borderRadius: '4px' }}
                className="text-xs font-mono focus:outline-none focus:border-red-500/50"
              />
              
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }} className="text-xs font-mono uppercase tracking-wide">
                Instagram URL:
              </label>
              <input 
                type="text" 
                id="instagram-url" 
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
                id="twitter-url" 
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
                id="youtube-url" 
                value={tempSocials.youtube}
                onChange={(e) => setTempSocials({ ...tempSocials, youtube: e.target.value })}
                placeholder="https://youtube.com..." 
                style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #333', padding: '8px', marginBottom: '20px', borderRadius: '4px' }}
                className="text-xs font-mono focus:outline-none focus:border-red-500/50"
              />
              
              <button 
                onClick={saveAllChanges}
                disabled={uploading}
                style={{ backgroundColor: uploading ? '#2c3e2f' : '#00ff66', color: uploading ? '#666' : 'black', border: 'none', padding: '10px 20px', cursor: uploading ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold', width: '100%' }}
                className="hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-wide font-mono disabled:opacity-50"
              >
                {uploading ? 'Uploading Simultaneously...' : 'Save Global Setup'}
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
