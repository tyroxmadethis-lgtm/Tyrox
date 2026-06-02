import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Shield, Sparkles, FolderLock, Download, Sliders, CheckCircle, Terminal, Eye, FileText, AlertCircle, ArrowRight } from 'lucide-react';

export const IndustryPortalView: React.FC = () => {
  const { tracks, setActiveTab } = useStore();
  const [activeRole, setActiveRole] = useState<'RAP label' | 'RAP engineer' | 'ANR' | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [adminToken, setAdminToken] = useState('TyroxMasterPass2026!');

  const handleRoleSelect = (role: 'RAP label' | 'RAP engineer' | 'ANR') => {
    setActiveRole(role);
    setIsAuthorizing(true);
    setAuthSuccess(false);

    const tokenHeaderHtml = adminToken ? `X-Admin-Token: "${adminToken.replace(/./g, '*')}"` : `X-Admin-Token: NULL`;

    setTerminalLogs([
      `⚡ FASTAPI ACCESS INITIATED: GET /services/portal/${encodeURIComponent(role)}`,
      `🔒 HEADER: ${tokenHeaderHtml}`,
      `🌐 Initiating handshakes with security validation matrices...`,
      `🔑 Testing against allowed professional roster: ['RAP label', 'RAP engineer', 'ANR']`
    ]);

    // Simulate FastAPI check
    setTimeout(() => {
      // Simulate verify_admin_key check
      const isAuthorizedToken = adminToken === 'TyroxMasterPass2026!';

      if (!isAuthorizedToken) {
        setTerminalLogs(prev => [
          ...prev,
          `⛔ 401 UNAUTHORIZED: Industry Access Denied.`,
          `⚠️ verify_admin_key failed matching on Header "x-admin-token"`,
          `🔒 Expected: ADMIN_SECRET_PASSWORD from environment | Handled by verify_admin_key()`
        ]);
        setIsAuthorizing(false);
        setAuthSuccess(false);
        return;
      }

      setTerminalLogs(prev => [
        ...prev,
        `✅ Handshake approved! Sender matched authorized role: '${role}'`,
        `📦 Fetching pre-cleared workspace buffers...`
      ]);

      setTimeout(() => {
        setIsAuthorizing(false);
        setAuthSuccess(true);
        setTerminalLogs(prev => [
          ...prev,
          `💚 INDUSTRY PORTAL GRANTED // Loaded customized variables for role: '${role}'. 200 OK.`
        ]);
      }, 800);
    }, 1000);
  };

  const handleDisconnect = () => {
    setActiveRole(null);
    setAuthSuccess(false);
    setTerminalLogs([]);
  };

  return (
    <div id="industry-portal-view" className="py-12 px-4 md:px-8 max-w-5xl mx-auto pt-6 flex flex-col gap-10 min-h-screen text-neutral-100">
      
      {/* Heavy Header Block */}
      <div className="border-b border-neutral-900 pb-5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#9d4edd] font-black block mb-1">
          VIP ENTERPRISE SYSTEM
        </span>
        <h1 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-white uppercase select-none flex items-center gap-2">
          <Shield className="text-purple-500 animate-pulse" size={26} />
          ROLE-BASED INDUSTRY PORTAL
        </h1>
        <p className="text-neutral-500 font-sans text-xs mt-1">
          Role-based gateway protecting industry-grade masters, exclusive stems, and advanced scouter matrices.
        </p>
      </div>

      {!activeRole ? (
        /* DISCONNECTED ROLE MATRIX SCREEN */
        <div className="space-y-6 animate-fadeIn">
          
          <div className="p-6 bg-purple-950/15 border border-purple-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <FolderLock className="text-purple-400 mt-0.5 shrink-0" size={24} />
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-white">
                  Select your industry credentials to authenticate
                </h4>
                <p className="text-neutral-450 font-sans text-xs leading-relaxed max-w-xl">
                  By selecting an role card, you authorize the FastAPI middleware to execute validation mapping queries with secure, private master password verification.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[220px] bg-neutral-950 p-3 rounded-xl border border-neutral-850 self-stretch md:self-center">
              <label className="font-mono text-[8px] uppercase tracking-wider text-purple-400 font-bold block">
                X-Admin-Token (Header Protection)
              </label>
              <input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Enter password..."
                className="bg-neutral-950 text-neutral-100 border border-neutral-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 font-mono tracking-tight"
              />
              <span className="text-[7.5px] font-mono text-neutral-500 text-right">
                Default: TyroxMasterPass2026!
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* RAP label CARD */}
            <div 
              onClick={() => handleRoleSelect('RAP label')}
              className="bg-[#08080d] border border-neutral-900 rounded-2xl p-6 text-center hover:border-purple-500/40 cursor-pointer active:scale-95 duration-200 transition space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-purple-950/40 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/10">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm uppercase text-white">RAP Label Executor</h3>
                <p className="font-sans text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  Grants unlimited premium licensing templates and custom production quotes directly with pre-cleared, full-ownership files.
                </p>
              </div>
              <span className="inline-block mt-4 text-[9px] font-mono text-purple-400 font-bold bg-[#141026] px-2.5 py-1 rounded">
                UNLOCK MASTER CREDENTIALS
              </span>
            </div>

            {/* RAP engineer CARD */}
            <div 
              onClick={() => handleRoleSelect('RAP engineer')}
              className="bg-[#08080d] border border-neutral-900 rounded-2xl p-6 text-center hover:border-purple-500/40 cursor-pointer active:scale-95 duration-200 transition space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-purple-950/40 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/10">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm uppercase text-white">RAP Engineer</h3>
                <p className="font-sans text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  Provides high-tier access to original lossless WAV sample stems, mixing blueprints, and multitrack channels.
                </p>
              </div>
              <span className="inline-block mt-4 text-[9px] font-mono text-purple-400 font-bold bg-[#141026] px-2.5 py-1 rounded">
                REQUEST MULTITRACKS
              </span>
            </div>

            {/* ANR REPRESENTATIVE CARD */}
            <div 
              onClick={() => handleRoleSelect('ANR')}
              className="bg-[#08080d] border border-neutral-900 rounded-2xl p-6 text-center hover:border-purple-500/40 cursor-pointer active:scale-95 duration-200 transition space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-purple-950/40 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/10">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm uppercase text-white">A&R Talent Scout</h3>
                <p className="font-sans text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  Unlocks direct scout pitching registers and performance telemetry metrics for underground phonk-metal releases.
                </p>
              </div>
              <span className="inline-block mt-4 text-[9px] font-mono text-purple-400 font-bold bg-[#141026] px-2.5 py-1 rounded">
                ENTER SCOUT CONSOLE
              </span>
            </div>

          </div>

        </div>
      ) : (
        /* CONNECTED VIEW ATTAINED */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-scaleUp">
          
          {/* Left panel: Authenticated role deliverables (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Connection Info ribbon */}
            <div className="bg-[#0b0c10] border border-neutral-850 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-neutral-300">
                  SESSION KEY: <strong className="text-white">PRO_{activeRole.toUpperCase().replace(' ', '_')}</strong>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-2 py-1 bg-red-950/30 hover:bg-red-900 border border-red-500/20 text-red-400 text-[9px] font-mono rounded tracking-wider uppercase transition cursor-pointer"
              >
                Disconnect session
              </button>
            </div>

            {/* Loading/Credentials check overlay state */}
            {isAuthorizing ? (
              <div className="p-16 text-center bg-[#07080c] border border-neutral-900 rounded-2xl space-y-3">
                <Shield className="text-purple-500 animate-spin mx-auto" size={32} />
                <h4 className="font-sans font-black text-xs uppercase text-white">Authorizing tokens via FastAPI...</h4>
                <p className="text-neutral-500 font-mono text-[9px]">Awaiting gateway mapping authorization...</p>
              </div>
            ) : !authSuccess ? (
              <div className="p-12 text-center bg-red-950/10 border border-red-500/20 rounded-2xl space-y-4">
                <AlertCircle className="text-red-500 mx-auto animate-bounce" size={32} />
                <h4 className="font-sans font-black text-xs uppercase text-red-400">401 Unauthorized Industry Access Denied</h4>
                <p className="text-neutral-400 font-mono text-[10px] leading-relaxed max-w-md mx-auto">
                  FastAPI security validation gate <code className="text-red-300 font-mono">verify_admin_key</code> returned an elevated authentication failure. Review your X-Admin-Token and confirm against environment variable <span className="text-red-300 font-mono font-bold">ADMIN_SECRET_PASSWORD</span>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-[9.5px] uppercase tracking-wider rounded transition cursor-pointer"
                  >
                    Adjust Credentials / Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* DELIVERABLES BASED ON THE CHOSEN INTENT ROLE */}
                {activeRole === 'RAP label' && (
                  <div className="space-y-4">
                    <div className="border-b border-neutral-900 pb-2">
                      <h3 className="font-sans font-black text-sm uppercase text-white">
                        Label Pre-Cleared Premium Catalog
                      </h3>
                      <p className="text-neutral-500 font-sans text-xs mt-0.5">
                        These tracks are pre-whitelisted and configured with immediate master release publishing agreements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tracks.map(track => (
                        <div key={track.id} className="bg-[#07080c] border border-neutral-900 rounded-xl p-4 flex items-center justify-between">
                          <div className="min-w-0">
                            <h4 className="font-sans font-bold text-xs uppercase text-neutral-100 truncate">{track.title}</h4>
                            <p className="font-mono text-[9px] text-neutral-500 mt-1 uppercase">BPM {track.bpm} • KEY {track.key}</p>
                          </div>
                          <button
                            onClick={() => alert(`Pre-authorized master download link mapped for: ${track.title}`)}
                            className="p-2 bg-purple-950/30 hover:bg-purple-900 text-purple-400 hover:text-white rounded-lg transition cursor-pointer border border-purple-500/10"
                            title="Download Pre-cleared master"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-[#0a0f0d] border border-emerald-500/10 rounded-xl flex items-start gap-2.5 text-emerald-450 font-sans text-xs leading-relaxed">
                      <CheckCircle className="shrink-0 mt-0.5" size={13} />
                      <p><strong>Immediate Release publishing contracts:</strong> Selected tracks include direct whitelist clearance. Click on any track's checkout in the beat store for direct invoice and contract emission.</p>
                    </div>
                  </div>
                )}

                {activeRole === 'RAP engineer' && (
                  <div className="space-y-4">
                    <div className="border-b border-neutral-900 pb-2">
                      <h3 className="font-sans font-black text-sm uppercase text-white">
                        Specialized Multitracks & Lossless stems
                      </h3>
                      <p className="text-neutral-500 font-sans text-xs mt-0.5">
                        Fetch the original separated instrument channels (drum bus, guitar leads, synth lines, subwoofers).
                      </p>
                    </div>

                    <div className="space-y-2">
                      {tracks.map(track => (
                        <div key={track.id} className="bg-[#07080c] border border-neutral-900 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 font-mono text-[8.5px] rounded text-neutral-400">stems</span>
                            <span className="font-sans font-bold text-xs uppercase">{track.title}</span>
                          </div>
                          <button
                            onClick={() => alert(`Stems bundle generated. Downloading ZIP bundle for: ${track.title} Stems...`)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-sans font-bold text-[9px] uppercase px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download size={11} />
                            <span>Download ZIP</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeRole === 'ANR' && (
                  <div className="space-y-4">
                    <div className="border-b border-neutral-900 pb-2">
                      <h3 className="font-sans font-black text-sm uppercase text-white">
                        A&R Talent Scout Performance console
                      </h3>
                      <p className="text-neutral-500 font-sans text-xs mt-0.5">
                        Performance metrics representing the current hotness quotient of Tyrox tracks across major digital avenues.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="bg-[#07080c] border border-neutral-900 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Underground Hotness</span>
                        <p className="font-sans font-extrabold text-lg text-red-500">98.4 %</p>
                        <p className="text-[8.5px] text-neutral-400 font-mono mt-1">Loudness ratio optimized for streaming algorithms</p>
                      </div>

                      <div className="bg-[#07080c] border border-neutral-900 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Track Listeners</span>
                        <p className="font-sans font-extrabold text-lg text-purple-400">124.9 K</p>
                        <p className="text-[8.5px] text-neutral-400 font-mono mt-1">Unique streams across metal & underground playlists</p>
                      </div>

                      <div className="bg-[#07080c] border border-neutral-900 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Average Streaming BPM</span>
                        <p className="font-sans font-extrabold text-lg text-emerald-400">132 BPM</p>
                        <p className="text-[8.5px] text-neutral-400 font-mono mt-1">Most effective velocity for aggressive phonk</p>
                      </div>

                    </div>

                    <div className="bg-[#07080c] border border-neutral-900 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-neutral-950 pb-2 text-white">
                        <Sparkles size={13} className="text-yellow-500" />
                        <h4 className="font-sans font-bold text-xs uppercase">Submit direct brief scout requirements</h4>
                      </div>
                      <p className="text-neutral-400 text-xs font-sans">
                        Need a highly customized exclusive track with specific metal riffs or growls? Send us the details and we will formulate stems tailored around the requirements.
                      </p>
                      <button
                        onClick={() => setActiveTab('contact')}
                        className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 border border-neutral-800 text-[10px] font-mono uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Request Customized Pitch</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* Right panel: Fast API Log feedback terminal (4 cols) */}
          <div className="md:col-span-4 bg-[#050508] border border-neutral-900 rounded-xl p-4 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Terminal className="text-purple-400" size={13} />
              <h4 className="font-mono text-[9px] uppercase text-neutral-400 tracking-wider">FastAPI handshakes log</h4>
            </div>

            <div className="space-y-3 min-h-48 overflow-y-auto max-h-[300px] no-scrollbar">
              {terminalLogs.length === 0 ? (
                <div className="text-center py-10 font-mono text-[9px] text-neutral-600">
                  <AlertCircle className="mx-auto mb-1 opacity-40 text-neutral-500" size={16} />
                  Awaiting role matrix assignment...
                </div>
              ) : (
                terminalLogs.map((log, index) => (
                  <p 
                    key={index} 
                    className={`font-mono text-[9.5px] leading-relaxed transition ${
                      log.startsWith('💚') || log.startsWith('✅') 
                        ? 'text-emerald-400 font-semibold' 
                        : log.startsWith('⚡') 
                        ? 'text-purple-400 font-bold' 
                        : 'text-neutral-400'
                    }`}
                  >
                    {log}
                  </p>
                ))
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
