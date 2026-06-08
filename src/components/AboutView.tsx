import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Sparkles, Award, Play, Instagram, Twitter, Youtube, FolderEdit, Upload, Image, RotateCcw, Music } from 'lucide-react';
import { z } from "zod";
import { uploadDirectToCloud } from '@/lib/DirectUploader';
import { supabase } from '../services/supabaseClient';
import { Track } from '../types';

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
  const { setActiveTab, playTrack, togglePlay, currentTrack, isPlaying, tracks: storeTracks } = useStore();
  const [dbTracks, setDbTracks] = React.useState<any[]>([]);
  const [loadingDb, setLoadingDb] = React.useState(true);

  React.useEffect(() => {
    async function fetchDbTracks() {
      if (!supabase) {
        setLoadingDb(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('marketplace_tracks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setDbTracks(data);
        } else {
          console.error("Supabase fail inline profile direct sync:", error);
        }
      } catch (e) {
        console.error("Error direct syncing profile catalog:", e);
      } finally {
        setLoadingDb(false);
      }
    }
    fetchDbTracks();
  }, []);

  const mapToTrack = (dbTrack: any, index: number): Track => {
    return {
      id: dbTrack.id || `db-track-${index}`,
      title: dbTrack.title || "Untitled Beat",
      producer: dbTrack.producer || "Tyrox",
      bpm: parseInt(dbTrack.bpm) || 140,
      key: dbTrack.key || "C Minor",
      duration: dbTrack.duration || "3:00",
      tags: dbTrack.tags || ["Trap", "Dark", "Aggressive"],
      imageUrl: dbTrack.image_url || dbTrack.imageUrl || "/static/images/tyrox_profile.jpg",
      audioUrl: dbTrack.stream_url || dbTrack.audioUrl || "/static/converted/god_mode_tagged_preview.mp3",
      price: dbTrack.price || 44.99,
      prices: {
        mp3: dbTrack.price_mp3 || dbTrack.price || 44.99,
        wav: dbTrack.price_wav || 129.99,
        unlimited: dbTrack.price_unlimited || 299.99,
        exclusive: dbTrack.price_exclusive || 499.99
      },
      plays: dbTrack.plays || 0,
      downloads: dbTrack.downloads || 0,
      sales: dbTrack.sales || 0,
      createdAt: dbTrack.created_at || dbTrack.createdAt || new Date().toISOString()
    };
  };

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

  // Secure client-side Vercel Blob uploaded string URLs mapping
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = React.useState<string | null>(null);
  const [uploadedBannerUrl, setUploadedBannerUrl] = React.useState<string | null>(null);

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
      // Cancel changes: remove any temporary previews and uploaded links
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
      setUploadedAvatarUrl(null);
      setUploadedBannerUrl(null);
    }
  };

  const handleProfileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setUploading(true);
      try {
        console.log("Local avatar file preview generated:", file.name);
        const previewUrl = URL.createObjectURL(file);
        setProfilePreview(previewUrl);
        setProfileFile(file);
        setUploadedAvatarUrl(null);
      } catch (error: any) {
        console.error("Local profile preview error:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setUploading(true);
      try {
        console.log("Local banner file preview generated:", file.name);
        const previewUrl = URL.createObjectURL(file);
        setBannerPreview(previewUrl);
        setBannerFile(file);
        setUploadedBannerUrl(null);
      } catch (error: any) {
        console.error("Local banner preview error:", error);
      } finally {
        setUploading(false);
      }
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File must be an image.");
        return;
      }
      setUploading(true);
      try {
        console.log("Local dropped banner file preview generated:", file.name);
        const previewUrl = URL.createObjectURL(file);
        setBannerPreview(previewUrl);
        setBannerFile(file);
        setUploadedBannerUrl(null);
      } catch (error: any) {
        console.error("Local dropped banner preview error:", error);
      } finally {
        setUploading(false);
      }
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

  const uploadDashboardAssets = async (file: File) => {
    try {
      const secureUrl = await uploadDirectToCloud(file);
      return secureUrl;
    } catch (error: any) {
      console.error("Direct Upload Fault:", error.message);
      alert(`Enterprise Upload Error: Keep image under 4MB and verify cloud API environment keys.`);
      return null;
    }
  };

  const uploadMediaAssets = async (avatarFile: File | null, bannerFile: File | null) => {
    try {
      const uploadResults: { avatarUrl: string | null; bannerUrl: string | null } = { avatarUrl: null, bannerUrl: null };
      
      if (avatarFile) {
        console.log("Direct-uploading avatar to Cloudinary...");
        const avatarUrl = await uploadDashboardAssets(avatarFile);
        if (avatarUrl) {
          uploadResults.avatarUrl = avatarUrl;
        }
      }
      if (bannerFile) {
        console.log("Direct-uploading banner to Cloudinary...");
        const bannerUrl = await uploadDashboardAssets(bannerFile);
        if (bannerUrl) {
          uploadResults.bannerUrl = bannerUrl;
        }
      }

      return uploadResults;

    } catch (error: any) {
      console.error("Asset upload failed root cause:", error);
      // This intercepts the crash and prevents the whole app from freezing
      throw new Error(`Failed to upload assets: ${error.message}`);
    }
  };

  // Safe helper to return pristine FormData
  function formDataByBrowser(fd: FormData): FormData {
    return fd;
  }

  const handleSaveChanges = async (formData: any) => {
    // --- STEP 1: INITIALIZE IMAGE STRINGS ---
    // Start with whatever images are already successfully saved or recently uploaded client-side
    let finalizedAvatarUrl = uploadedAvatarUrl || formData.existingAvatarUrl || "";
    let finalizedBannerUrl = uploadedBannerUrl || formData.existingBannerUrl || "";

    // --- STEP 2: RUN PENDING MULTIPART UPLOADS ---
    if (formData.newAvatarFile || formData.newBannerFile) {
      console.log("Uploading pending image files via multipart to secure local and cloud file pipeline...");
      try {
        const uploadResults = await uploadMediaAssets(formData.newAvatarFile, formData.newBannerFile);
        if (uploadResults.avatarUrl) {
          finalizedAvatarUrl = uploadResults.avatarUrl;
        }
        if (uploadResults.bannerUrl) {
          finalizedBannerUrl = uploadResults.bannerUrl;
        }
      } catch (err: any) {
        console.error("Asset upload step failed:", err);
        throw new Error(`Failed to upload newly selected images: ${err.message}`);
      }
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "Database rejected the data format.");
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
    setUploadedAvatarUrl(null);
    setUploadedBannerUrl(null);

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
    <div id="about-page-view" className="py-12 px-4 md:px-8 max-w-7xl mx-auto pt-6 flex flex-col gap-8 min-h-screen text-neutral-100">
      
      {/* 1. Epic Producer Canopy Banner */}
      <div 
        className="relative rounded-2xl overflow-hidden h-40 sm:h-56 md:h-64 w-full shadow-2xl border border-neutral-900/85 flex items-end"
        style={{
          backgroundImage: `url('${bannerPreview || bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-black/30 pointer-events-none" />
        <div className="absolute bottom-4 right-4 flex items-center gap-3.5 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
          {socials.tiktok && (
            <a href={socials.tiktok} target="_blank" rel="noreferrer" title="TikTok" className="text-neutral-300 hover:text-red-500 transition-colors pb-0.5">
              <Music className="w-4 h-4" />
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noreferrer" title="Instagram" className="text-neutral-300 hover:text-pink-500 transition-colors pb-0.5">
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {socials.youtube && (
            <a href={socials.youtube} target="_blank" rel="noreferrer" title="YouTube" className="text-neutral-300 hover:text-red-600 transition-colors pb-0.5">
              <Youtube className="w-4 h-4" />
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noreferrer" title="Twitter" className="text-neutral-300 hover:text-sky-400 transition-colors pb-0.5">
              <Twitter className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT BRANCH */}
      {editMode ? (
        /* --- HIGH FIDELITY SETTINGS UPLOADER COMPONENT --- */
        <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
              🔧 Global Producer Customization
            </h2>
            <button 
              onClick={toggleEditMode}
              className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-mono uppercase rounded text-neutral-400 font-bold transition"
            >
              Cancel Edit
            </button>
          </div>

          <div id="edit-header-folder" className="w-full bg-[#0a0b10] border border-neutral-900 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center">
              <div className="bg-[#121319] border-t border-x border-neutral-900 px-5 py-2.5 text-[10px] font-mono text-pink-500 uppercase tracking-widest rounded-t-lg font-bold ml-6 -mb-[1px] relative z-10 flex items-center gap-2">
                <FolderEdit size={12} className="text-pink-500" />
                Folder: Edit Header & Profile Pic
              </div>
              <div className="flex-1 border-b border-neutral-900 h-[1.5px]"></div>
            </div>

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-t border-neutral-900 bg-[#111216]/50 transition-all duration-200 ${
                isDragActive ? "border-pink-500/40 bg-pink-950/10" : "border-transparent"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-neutral-900/60">
                <div className="space-y-4 pr-0 md:pr-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">SECTION A: PORTAL BANNER</span>
                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">Customize Website Banner</h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm">
                      Drag and drop your custom photo here or click choose to update. Updates storefront and profile banners.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] tracking-widest uppercase rounded font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={11} /> Choose Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleResetBanner}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-mono text-[9px] tracking-widest uppercase rounded font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={11} /> Reset Default
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500">Live Preview:</span>
                    <div 
                      className="relative h-16 rounded-lg overflow-hidden border border-neutral-800/80 shadow bg-neutral-950"
                      style={{
                        backgroundImage: `url('${bannerPreview || bannerImg}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-neutral-950/20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 md:pt-0 pl-0 md:pl-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-pink-500 uppercase tracking-wider font-bold">SECTION B: PROFILE IMAGE</span>
                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">Customize Profile Avatar</h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans max-w-sm">
                      Choose a face, logo, or icon from your device. Updates across all artist portal and header badges permanently.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-mono text-[9px] tracking-widest uppercase rounded font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={11} /> Choose Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleResetProfile}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-mono text-[9px] tracking-widest uppercase rounded font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={11} /> Reset Default
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="shrink-0 animate-pulse">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#a855f7] bg-neutral-1000 shadow-lg">
                        <img 
                          src={profilePreview || profileImg} 
                          alt="Artist avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500 block mb-0.5">Avatar Status Indicator</span>
                      <p className="text-[10px] text-neutral-400 font-sans italic">linked to backend filesystem.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-neutral-900 rounded-xl p-6 text-left space-y-4">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-pink-500">Edit Settings Matrix</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-neutral-400 uppercase">Bio Description</label>
                <textarea 
                  value={tempBioText}
                  onChange={(e) => setTempBioText(e.target.value)}
                  className="w-full min-h-[100px] bg-neutral-950 border border-neutral-850 text-xs rounded p-3 text-neutral-200 font-sans focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase">TikTok URL</label>
                  <input 
                    type="text" 
                    id="tiktok-url" 
                    value={tempSocials.tiktok}
                    onChange={(e) => setTempSocials({ ...tempSocials, tiktok: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase">Instagram URL</label>
                  <input 
                    type="text" 
                    id="instagram-url" 
                    value={tempSocials.instagram}
                    onChange={(e) => setTempSocials({ ...tempSocials, instagram: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase">Twitter / X URL</label>
                <input 
                  type="text" 
                  id="twitter-url" 
                  value={tempSocials.twitter}
                  onChange={(e) => setTempSocials({ ...tempSocials, twitter: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase">YouTube Channel URL</label>
                <input 
                  type="text" 
                  id="youtube-url" 
                  value={tempSocials.youtube}
                  onChange={(e) => setTempSocials({ ...tempSocials, youtube: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button 
              onClick={saveAllChanges}
              disabled={uploading}
              className="w-full py-3 bg-[#a855f7] hover:bg-purple-600 disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-widest rounded-lg transition"
            >
              {uploading ? 'Processing Direct File Upload...' : 'Save Global Profile Setup'}
            </button>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleProfileChange} className="hidden" accept="image/*" />
          <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/*" />
        </div>
      ) : (
        /* --- TYROX NATIVE PROFILE DASHBOARD (TWO-COLUMN HUB) --- */
        <div id="profile-shell-container" className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-1">
          
          {/* LEFT SIDEBAR PROFILE CARD */}
          <aside className="profile-left-sidebar w-full lg:w-[280px] bg-[#0c0d12] border border-neutral-900 rounded-2xl p-6 flex flex-col items-center h-fit shrink-0 shadow-xl">
            <div className="user-avatar-placeholder w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 bg-[#1b1b26] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative">
              <img 
                src={profileImg} 
                alt="Tyrox Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/static/images/tyrox_profile.jpg";
                }}
              />
            </div>
            <h2 className="profile-username-lbl font-sans font-black text-white text-lg mb-4 uppercase tracking-widest text-center select-none">
              tyroxmadethis
            </h2>
            
            <button 
              className="edit-profile-btn-action w-full bg-[#161622] hover:bg-neutral-900 border border-neutral-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition active:scale-95 text-center"
              onClick={toggleEditMode}
            >
              📝 Edit Profile
            </button>
            
            <div className="stats-counter-block w-full border-t border-neutral-900 pt-5 mt-5 space-y-4 text-left">
              <div className="stat-row-lbl flex justify-between font-sans text-xs text-neutral-400">
                <span className="uppercase tracking-widest">Followers</span> 
                <strong className="text-white font-black text-sm">0</strong>
              </div>
              <div className="stat-row-lbl flex justify-between font-sans text-xs text-neutral-400">
                <span className="uppercase tracking-widest">Plays</span> 
                <strong className="text-white font-black text-sm">0</strong>
              </div>
              <div className="stat-row-lbl flex justify-between font-sans text-xs text-neutral-400">
                <span className="uppercase tracking-widest font-bold text-purple-400">Tracks</span> 
                <strong id="uiTrackCount" className="text-[#a855f7] font-black text-sm">
                  {dbTracks.length}
                </strong>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL: VAULT LISTING CATALOG */}
          <main className="profile-main-catalog-panel flex-1 space-y-6">
            
            {/* Elegant Header Bio Summary */}
            <div className="bg-[#0c0d12] border border-neutral-900 rounded-2xl p-6 text-left shadow-lg">
              <h2 className="text-sm font-black uppercase text-[#a855f7] tracking-widest mb-2 select-none">
                Producer Bio
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                {bioText}
              </p>
            </div>

            {/* REAL-TIME BLAZE BEAT STOREFRONT GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase text-white tracking-widest select-none">
                  THE VAULT PRO-BLAZE CATALOG
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Live Postgres Sync
                </span>
              </div>

              <div className="blaze-tracks-grid space-y-2.5" id="profileBlazeGrid">
                
                {/* Real Data Render */}
                {dbTracks.length > 0 ? (
                  dbTracks.map((track, index) => {
                    const isCurrentPlaying = currentTrack && currentTrack.title === track.title && isPlaying;
                    const mappedTrack = mapToTrack(track, index);
                    return (
                      <div 
                        key={track.id || index} 
                        id={`profile-track-${index}`}
                        className={`blaze-track-row flex flex-col sm:flex-row items-center justify-between p-4 bg-neutral-950/80 border border-neutral-900 rounded-xl hover:border-purple-500/25 hover:bg-neutral-950/95 transition-all gap-4 text-left ${
                          isCurrentPlaying ? 'active-playing-row border-purple-500/40 bg-purple-950/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5 w-full sm:w-auto">
                          <button 
                            className="row-play-circle w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center font-bold text-sm transition-all active:scale-90 shadow-md select-none shrink-0"
                            onClick={() => {
                              if (isCurrentPlaying) {
                                togglePlay();
                              } else {
                                playTrack(mappedTrack);
                              }
                            }}
                          >
                            {isCurrentPlaying ? '⏸' : '▶'}
                          </button>
                          <div className="meta-cell min-w-0">
                            <span className="beat-name block font-sans font-extrabold text-neutral-100 text-[13.5px] uppercase tracking-wide truncate">
                              {track.title}
                            </span>
                            <span className="file-spec-tag block font-mono text-[9.5px] text-neutral-500 uppercase tracking-widest mt-0.5 select-none font-bold">
                              Trap Core Instrumental
                            </span>
                          </div>
                        </div>

                        <span className="stat-cell font-mono text-xs text-neutral-400 whitespace-nowrap px-4 py-1.5 bg-neutral-900/40 rounded border border-neutral-900/60 select-none">
                          {track.bpm || '140'} BPM
                        </span>

                        <div className="action-cell w-full sm:w-auto text-right shrink-0">
                          <button 
                            className="blaze-buy-btn w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-[#a855f7] hover:text-white text-[10px] font-extrabold uppercase rounded shadow-md tracking-wider transition active:scale-95 cursor-pointer text-center"
                            onClick={() => {
                              if ((window as any).initializeLicensePurchase) {
                                (window as any).initializeLicensePurchase(
                                  track.title, 
                                  String(track.price || 44.99), 
                                  track.stream_url || track.audioUrl || '/static/converted/god_mode_tagged_preview.mp3'
                                );
                              }
                            }}
                          >
                            ACQUIRE RIGHTS
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Live Empty Fallback Row */
                  <div className="no-content-fallback-state flex flex-col items-center justify-center p-20 text-center border border-neutral-900 rounded-2xl bg-[#08090d]/30" id="fallbackStateZone">
                    <div className="fallback-vinyl-icon text-5xl mb-4 text-neutral-700 select-none">💿</div>
                    <h3 className="font-sans font-black uppercase text-sm text-neutral-300 tracking-wider">No Content Available</h3>
                    <p className="font-sans text-xs text-neutral-500 mt-2 max-w-sm">
                      Open your upload panel to push your trap beats live to this catalog.
                    </p>
                    <button 
                      onClick={() => setActiveTab('studio')}
                      className="px-5 py-2 mt-5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[10px] font-mono tracking-widest uppercase rounded font-bold text-neutral-400 transition"
                    >
                      Open Upload Panel
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Technical Gear Specs Segment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#0c0d12] border border-neutral-900 rounded-xl p-5 hover:border-purple-500/10 transition-all duration-300">
                <Award className="text-purple-500 mb-3" size={22} />
                <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">Underground Architect</h3>
                <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
                  Pioneered elite Wisconsin acoustic trap rhythms and master analog sidechain matrices that drive massive speaker dynamics.
                </p>
              </div>

              <div className="bg-[#0c0d12] border border-neutral-900 rounded-xl p-5 hover:border-purple-500/10 transition-all duration-300">
                <ShieldCheck className="text-purple-500 mb-3" size={22} />
                <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">Fully Cleared License stems</h3>
                <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
                  All track materials are pre-cleared for direct monetization on Spotify, YouTube, and Apple music without content ID claims.
                </p>
              </div>
            </div>

            <div className="bg-[#07080c] border border-neutral-900 rounded-xl p-5 text-left space-y-3.5">
              <h4 className="font-mono text-[9px] uppercase text-purple-400 tracking-widest font-black">HARDWARE & PRODUCTION SPECS</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 font-mono text-[10px] text-neutral-400">
                <div className="flex justify-between border-b border-neutral-900/60 pb-1.5 font-sans">
                  <span>DAW</span>
                  <span className="text-white font-bold font-mono">Ableton Live Pitch Engine</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900/60 pb-1.5 font-sans">
                  <span>Guitar Arsenal</span>
                  <span className="text-white font-bold font-mono">Ibanez 8-String Multiscale</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900/60 pb-1.5 font-sans">
                  <span>Hardware Synth</span>
                  <span className="text-white font-bold font-mono">Custom Tube Analog Preamps</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900/60 pb-1.5 font-sans">
                  <span>Accumulated dynamic range</span>
                  <span className="text-[#a855f7] font-bold font-mono">-4.2 LUFS</span>
                </div>
              </div>
            </div>

          </main>

        </div>
      )}

      {/* Embedded Style Shields */}
      <style>{`
        .blaze-track-row {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .blaze-track-row:hover {
          border-color: rgba(168, 85, 247, 0.15) !important;
          background-color: rgba(168, 85, 247, 0.01) !important;
        }
        .active-playing-row {
          background-color: rgba(168, 85, 247, 0.04) !important;
          border-color: rgba(168, 85, 247, 0.35) !important;
        }
        .fallback-vinyl-icon {
          animation: spinVinyl 8s linear infinite;
        }
        @keyframes spinVinyl {
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};
