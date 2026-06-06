import React, { useState } from 'react';
import { uploadDirectToCloud } from '@/lib/DirectUploader';
import { Sparkles, Globe, Heart, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface TextFieldState {
  currentImageUrl: string;
  bio: string;
  tiktokUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
}

export default function DashboardSettings() {
  const [textFields, setTextFields] = useState<TextFieldState>(() => {
    try {
      const socialData = JSON.parse(localStorage.getItem('tyrox_socials') || '{}');
      return {
        currentImageUrl: localStorage.getItem('tyrox_profile_img') || "/static/images/tyrox_profile.jpg",
        bio: localStorage.getItem('tyrox_bio') || "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault.",
        tiktokUrl: socialData.tiktok || "https://tiktok.com/@tyrox.made.this",
        instagramUrl: socialData.instagram || "https://instagram.com/tyroxmadethis/",
        twitterUrl: socialData.twitter || "https://twitter.com/Tyrox_made_this",
        youtubeUrl: socialData.youtube || "https://youtube.com/@TyroxMadeThis",
      };
    } catch {
      return {
        currentImageUrl: "/static/images/tyrox_profile.jpg",
        bio: "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer.",
        tiktokUrl: "https://tiktok.com/@tyrox.made.this",
        instagramUrl: "https://instagram.com/tyroxmadethis/",
        twitterUrl: "https://twitter.com/Tyrox_made_this",
        youtubeUrl: "https://youtube.com/@TyroxMadeThis",
      };
    }
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSaveProfileLayout = async (fields: TextFieldState, fileObj: File | null) => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      let finalCloudUrl = fields.currentImageUrl;

      if (fileObj) {
        // Shoot the image directly to the cloud, completely bypassing Vercel limits
        console.log("Initiating high-speed direct-to-cloud upload sequence...");
        finalCloudUrl = await uploadDirectToCloud(fileObj);
      }

      // Send only light data text strings back to Vercel to update your profile row
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          imageUrl: finalCloudUrl // Your crisp, full-resolution cloud asset path
        })
      });

      if (!response.ok) throw new Error("Failed to save final profile configuration records.");

      // Sync settings instantly with localStorage and emit event to update website-wide storefront PFP
      localStorage.setItem('tyrox_profile_img', finalCloudUrl);
      localStorage.setItem('tyrox_bio', fields.bio);
      localStorage.setItem('tyrox_socials', JSON.stringify({
        tiktok: fields.tiktokUrl,
        instagram: fields.instagramUrl,
        twitter: fields.twitterUrl,
        youtube: fields.youtubeUrl
      }));

      window.dispatchEvent(new CustomEvent('tyrox-profile-updated', { detail: finalCloudUrl }));
      window.dispatchEvent(new CustomEvent('tyrox-bio-updated', { detail: fields.bio }));
      window.dispatchEvent(new CustomEvent('tyrox-socials-updated', {
        detail: {
          tiktok: fields.tiktokUrl,
          instagram: fields.instagramUrl,
          twitter: fields.twitterUrl,
          youtube: fields.youtubeUrl
        }
      }));

      // Update textFields state with latest resolved image url
      setTextFields(prev => ({ ...prev, currentImageUrl: finalCloudUrl }));
      setSelectedImageFile(null);
      setImagePreview(null);
      
      setStatusMsg({ type: 'success', text: "Profile updated with flawless image clarity!" });
      alert("Profile updated with flawless image clarity!");
    } catch (err: any) {
      console.warn("Muted interface exception block:", err.message);
      setStatusMsg({ type: 'error', text: `Failed to save configuration: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileLayout(textFields, selectedImageFile);
  };

  return (
    <div id="dashboard-settings-main" className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="border border-neutral-900 rounded-2xl bg-neutral-950/40 p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-900 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Direct-to-Cloud Profile Settings
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Bypasses standard multi-part payload size constraints dynamically
            </p>
          </div>
          <span className="px-3 py-1 text-[10px] font-mono font-bold bg-[#39FF14]/10 text-[#39FF14] rounded-full border border-[#39FF14]/20 animate-pulse">
            HIGH-SPEED CDN ACTIVE
          </span>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            statusMsg.type === 'success' 
              ? 'bg-[#39FF14]/5 border-[#39FF14]/20 text-neutral-200' 
              : 'bg-red-500/5 border-red-500/20 text-neutral-300'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#39FF14] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-mono font-black uppercase text-white">
                {statusMsg.type === 'success' ? 'Pipeline Clear' : 'Pipeline Alert'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">{statusMsg.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          
          {/* Avatar Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-black/40 border border-neutral-900/60 p-5 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500 bg-neutral-900">
                <img 
                  src={imagePreview || textFields.currentImageUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">Avatar resolution</span>
            </div>
            
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs uppercase font-black text-neutral-400 tracking-wider">
                Select Profile Picture File
              </label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 text-xs bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-lg cursor-pointer focus:outline-none focus:border-purple-500/50 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition"
                />
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Images are compressed and securely piped to global cloud CDN endpoints directly. Bypasses intermediate limits seamlessly.
              </p>
            </div>
          </div>

          {/* Social Links Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-500" />
              Verified Public Direct Connections
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1.5">TikTok URL</label>
                <input 
                  type="url" 
                  value={textFields.tiktokUrl}
                  onChange={e => setTextFields(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                  placeholder="https://tiktok.com/@yourusername"
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-900/60 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1.5">Instagram URL</label>
                <input 
                  type="url" 
                  value={textFields.instagramUrl}
                  onChange={e => setTextFields(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/yourusername/"
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-900/60 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1.5">Twitter / X URL</label>
                <input 
                  type="url" 
                  value={textFields.twitterUrl}
                  onChange={e => setTextFields(prev => ({ ...prev, twitterUrl: e.target.value }))}
                  placeholder="https://twitter.com/yourusername"
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-900/60 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1.5">YouTube Channel URL</label>
                <input 
                  type="url" 
                  value={textFields.youtubeUrl}
                  onChange={e => setTextFields(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-900/60 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Biographical Details */}
          <div className="space-y-2">
            <label className="block text-xs uppercase font-black text-neutral-400 tracking-wider">
              Profile Biography Block
            </label>
            <textarea 
              rows={4}
              value={textFields.bio}
              onChange={e => setTextFields(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Detail your pedigree and studio instrumentation credentials..."
              className="w-full px-4 py-3 text-xs bg-neutral-900/60 text-white border border-neutral-800 rounded-lg focus:outline-none focus:border-purple-500/40 leading-relaxed font-sans"
            />
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-neutral-900 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-3 rounded-lg font-mono font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 ${
                isSaving 
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading & Syncing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Save Portal Settings
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
