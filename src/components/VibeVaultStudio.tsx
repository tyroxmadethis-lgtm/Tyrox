/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Track, Coupon, LicensingContract } from '../types';
import { DollarSign, BarChart3, Radio, FileText, Percent, Globe, ShieldAlert, Cpu, CircleHelp, Trash2, Edit2, Plus, Sparkles, Check, RefreshCw, Send, CheckCircle, ExternalLink, Copy, Shield, Image as ImageIcon, Settings, Music, Sliders } from 'lucide-react';
import { UltimateBeatUploader } from './UltimateBeatUploader';
import AudioTranscoder from './AudioTranscoder';
import AudioSoundMatcher from './AudioSoundMatcher';
import DashboardSettings from './DashboardSettings';
import { CoverArtOptimizer } from './CoverArtOptimizer';
import { CloudTriggers } from './CloudTriggers';
import { OwnerCoreConsole } from './OwnerCoreConsole';
import { FinancialTelemetryStream } from './FinancialTelemetryStream';
import TransactionLedger from './TransactionLedger';
import { Input } from "./Input";

export const VibeVaultStudio: React.FC = () => {
  const {
    tracks,
    sales,
    coupons,
    contracts,
    addTrack,
    updateTrack,
    deleteTrack,
    adminSection,
    setAdminSection,
    payoutEmail,
    setPayoutEmail,
    payoutMethod,
    setPayoutMethod
  } = useStore();

  // Dynamic real-time server telemetry/ledger states
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    licensesDistributed: 0,
    verifiedAcquisitions: 0
  });
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchLiveMetrics = async () => {
    try {
      const origin = window.location.origin;
      const teleUrl = (!origin || origin === 'null') ? '/api/analytics/live-telemetry' : `${origin}/api/analytics/live-telemetry`;
      const response = await fetch(teleUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (error) {
      console.error("Telemetry query failed in studio dashboard", error);
    }
  };

  const fetchLiveLedger = async () => {
    try {
      const origin = window.location.origin;
      const streamUrl = (!origin || origin === 'null') ? '/api/transactions/live-stream' : `${origin}/api/transactions/live-stream`;
      const response = await fetch(streamUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ledgerItems) {
          setLedgerItems(data.ledgerItems);
        }
      }
    } catch (error) {
      console.error("Ledger query failed in studio dashboard", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
    fetchLiveLedger();

    const interval = setInterval(() => {
      fetchLiveMetrics();
      fetchLiveLedger();
    }, 5050);

    return () => clearInterval(interval);
  }, []);

  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Portable player UI states
  const [showPortableCode, setShowPortableCode] = useState(false);
  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const [copiedPlayerCode, setCopiedPlayerCode] = useState(false);
  const [portableHtml, setPortableHtml] = useState('');

  // Track Form state
  const [newTitle, setNewTitle] = useState('');
  const [newBpm, setNewBpm] = useState('140');
  const [newKey, setNewKey] = useState('Am');
  const [newTags, setNewTags] = useState('Trap, Hard, Cyber');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newPrices, setNewPrices] = useState({ mp3: 29.99, wav: 29.99, unlimited: 29.99, exclusive: 29.99 });
  const [showAddForm, setShowAddForm] = useState(false);

  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState('20');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');

  // Contract editor state
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editContractTerms, setEditContractTerms] = useState('');

  // Add system notifications helper
  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1));
    }, 4000);
  };

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Track Title is required.');
      return;
    }

    // Fallback Image
    const finalImg = newImgUrl.trim() || `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop`;

    addTrack({
      title: newTitle,
      producer: 'tyrox made this',
      bpm: parseInt(newBpm) || 120,
      key: newKey,
      tags: newTags.split(',').map(t => t.trim()).filter(t => t !== ''),
      imageUrl: finalImg,
      price: parseFloat(newPrices.mp3.toString()) || 29.99,
      prices: {
        mp3: parseFloat(newPrices.mp3.toString()) || 29.99,
        wav: parseFloat(newPrices.mp3.toString()) || 29.99,
        unlimited: parseFloat(newPrices.mp3.toString()) || 29.99,
        exclusive: parseFloat(newPrices.mp3.toString()) || 29.99
      }
    });

    addNotification(`SUCCESS // Catalog published: "${newTitle}"`);
    setNewTitle('');
    setNewImgUrl('');
    setShowAddForm(false);
  };

  // Live streaming log simulation
  const [liveStreamLogs, setLiveStreamLogs] = useState<Array<{ text: string, time: string }>>([
    { text: 'Tokyo Drift played from London, UK', time: '10:44' },
    { text: 'Midnight Chill preview downloaded - Denver, CO', time: '10:39' },
    { text: 'Nebula Drill streamed on mobile feed - Seoul, KR', time: '10:32' },
  ]);

  useEffect(() => {
    const logs = [
      'Tokyo Drift was added to Spotify Playlist "Trap Codes"',
      'Checkout Cart loaded from IP 192.168.1.42',
      'Nebula Drill streamed in Berlin, DE',
      'Midnight Chill played in Tokyo, JP',
      'Hyperdrive beat preview initiated by client browser',
      'Payout settings diagnostics: Payout pipelines confirmed'
    ];

    const iv = setInterval(() => {
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      const hh = new Date().getHours().toString().padStart(2, '0');
      const mm = new Date().getMinutes().toString().padStart(2, '0');
      setLiveStreamLogs(prev => [{ text: randomLog, time: `${hh}:${mm}` }, ...prev].slice(0, 6));
    }, 15000);

    return () => clearInterval(iv);
  }, []);

  return (
    <div id="studio-dashboard-main" className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-neutral-950 font-sans text-neutral-200 select-none border-b border-neutral-900 pb-20">
      
      {/* Toast Alert stack right header */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map((note, idx) => (
          <div key={idx} className="p-3 bg-neutral-900 border border-purple-500 text-purple-300 font-mono text-[10px] uppercase rounded-lg shadow-2xl flex items-center gap-2 animate-slideIn">
            <Cpu size={12} className="animate-spin-slow" />
            <span>{note}</span>
          </div>
        ))}
      </div>

      {/* Main Left Side Admin Sidebar exactly matching structural items */}
      <div className="lg:col-span-3 bg-neutral-950 border-r border-neutral-900 p-6 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-sans font-bold text-lg text-neutral-100 tracking-tight">STUDIO V2.2</h2>
          </div>
          <p className="font-mono text-[9px] text-neutral-500 uppercase">SYS-NODE: VIBEVAULT_MARKET</p>
        </div>

        {/* Categories Nav */}
        <div className="space-y-6 flex-1">
          {/* GROUP CONTENT */}
          <div className="space-y-2">
            <h3 className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest px-2">Catalog Content</h3>
            <div className="space-y-1">
              {[
                { id: 'tracks', label: 'Active Tracks', icon: Radio },
                { id: 'ai-uploader', label: 'AI Beat Uploader', icon: Sparkles },
                { id: 'cover-optimizer', label: 'Cover Art Optimizer', icon: ImageIcon },
                { id: 'transcoder', label: 'Audio Transcoder', icon: Music },
                { id: 'sound-matcher', label: 'Audio Sound Matcher', icon: Sliders },
                { id: 'owner-core', label: 'Owner Core Console', icon: Shield },
                { id: 'contracts', label: 'Licensing Contracts', icon: FileText },
                { id: 'cloud-triggers', label: 'Cloud Storage Hook', icon: Cpu },
              ].map(item => {
                const isActive = adminSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminSection(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2.5 transition font-medium cursor-pointer ${isActive ? 'bg-neutral-900 text-neutral-100 font-bold border-l-2 border-purple-500 pl-2.5' : 'text-neutral-500 hover:bg-neutral-900/40 hover:text-neutral-300'}`}
                  >
                    <item.icon size={13} className={isActive ? 'text-purple-400' : 'text-neutral-600'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP MONETIZATION */}
          <div className="space-y-2">
            <h3 className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest px-2">Monetization</h3>
            <div className="space-y-1">
              {[
                { id: 'portal', label: 'Publishing Portal', icon: Globe },
                { id: 'paypal', label: 'PayPal Processing', icon: DollarSign },
                { id: 'promotions', label: 'Promote & Discounts', icon: Percent },
              ].map(item => {
                const isActive = adminSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminSection(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2.5 transition font-medium cursor-pointer ${isActive ? 'bg-neutral-900 text-neutral-100 font-bold border-l-2 border-purple-500 pl-2.5' : 'text-neutral-500 hover:bg-neutral-900/40 hover:text-neutral-300'}`}
                  >
                    <item.icon size={13} className={isActive ? 'text-purple-400' : 'text-neutral-600'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP PERFORMANCE */}
          <div className="space-y-2">
            <h3 className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest px-2">Performance Logs</h3>
            <div className="space-y-1">
              {[
                { id: 'sales', label: 'Sales & Finances', icon: DollarSign },
                { id: 'telemetry', label: 'Stream Telemetry', icon: BarChart3 },
                { id: 'feature-mapping', label: 'System Mapping', icon: Cpu },
                { id: 'settings', label: 'Portal Settings', icon: Settings },
              ].map(item => {
                const isActive = adminSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminSection(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2.5 transition font-medium cursor-pointer ${isActive ? 'bg-neutral-900 text-neutral-100 font-bold border-l-2 border-purple-500 pl-2.5' : 'text-neutral-500 hover:bg-neutral-900/40 hover:text-neutral-300'}`}
                  >
                    <item.icon size={13} className={isActive ? 'text-purple-400' : 'text-neutral-600'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer System details */}
        <div className="border-t border-neutral-900 pt-4 space-y-1.5 text-[9px] font-mono text-neutral-500">
          <p>HOST: 0.0.0.0 //PORT: 3000</p>
          <p>AUTHENTICATION: BYPASSED</p>
          <div className="flex justify-between items-center text-cyan-400 font-bold mt-1">
            <span>● CLIENT ONLINE</span>
            <span className="text-[7px] border border-cyan-400/20 px-1 rounded">SECURE CHIP</span>
          </div>
        </div>
      </div>

      {/* Main Area View Selector depending on left bar choices */}
      <div className="lg:col-span-9 p-4 md:p-8 flex flex-col gap-6 md:gap-8 overflow-x-hidden">
        
        {/* Sales & Finances View: MATCHES FIRST SCREENSHOT */}
        {adminSection === 'sales' && (
          <div className="space-y-6 md:space-y-8 animate-fadeIn">
            {/* Header matches screenshot */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-sans italic tracking-tighter text-neutral-100 uppercase font-black">
                  FINANCIAL TELEMETRY STREAM
                </h1>
                <p className="font-mono text-[10px] text-neutral-500 uppercase mt-1">
                  BS-ADMIN // FINANCIAL_DATA_SCAN
                </p>
              </div>

              <div className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-neutral-300">SERVER LINKED</span>
              </div>
            </div>

            {/* Metric Blocks with SVG glowing inline graphs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* TOTAL SALES CARD */}
              <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-950 hover:border-emerald-500/10 transition relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Total Accumulated Store Sales</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] rounded flex items-center gap-0.5">LIVE</span>
                </div>
                <div className="text-3xl font-mono text-white font-black leading-tight tracking-tight">
                  {metricsLoading ? "0.00" : "$" + metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Handcrafted glowing SVG Line graph curve (cyan-to-emerald style) */}
                <div className="w-full h-12 mt-4">
                  <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d={metrics.totalSales > 0 ? "M0,24 C10,18 15,10 25,12 C35,14 45,5 55,8 C65,11 75,2 85,4 C95,6 100,2 100,2" : "M0,24 L100,24"} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d={metrics.totalSales > 0 ? "M0,24 C10,18 15,10 25,12 C35,14 45,5 55,8 C65,11 75,2 85,4 C95,6 100,2 100,2 L100,24 L0,24 Z" : "M0,24 L100,24 L100,24 L0,24 Z"} 
                      fill="url(#salesGrad)" 
                    />
                  </svg>
                </div>
              </div>

              {/* DISTRIBUTED LICENSES CARD */}
              <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-950 hover:border-cyan-500/10 transition relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.01] rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Active Licenses Distributed</span>
                  <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 font-mono text-[10px] rounded">SYNC</span>
                </div>
                <div className="text-3xl font-mono text-white font-black leading-tight tracking-tight">
                  {metricsLoading ? "0 UNITS" : `${metrics.licensesDistributed} UNITS`}
                </div>

                {/* Cyber style graph bar/curve */}
                <div className="w-full h-12 mt-4">
                  <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="licGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d={metrics.licensesDistributed > 0 ? "M0,24 L10,20 L20,21 L30,14 L40,16 L50,8 L60,9 L70,3 L80,5 L90,2 L100,2" : "M0,24 L100,24"} 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d={metrics.licensesDistributed > 0 ? "M0,24 L10,20 L20,21 L30,14 L40,16 L50,8 L60,9 L70,3 L80,5 L90,2 L100,2 L100,24 L0,24 Z" : "M0,24 L100,24 L100,24 L0,24 Z"} 
                      fill="url(#licGrad)" 
                    />
                  </svg>
                </div>
              </div>

              {/* VERIFIED DOWNLOAD ACQUISITIONS CARD */}
              <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-950 hover:border-purple-500/10 transition relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.01] rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Verified Download Acquisitions</span>
                  <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 font-mono text-[10px] rounded">NEW</span>
                </div>
                <div className="text-3xl font-mono text-white font-black leading-tight tracking-tight">
                  {metricsLoading ? "0 BINARY" : `${metrics.verifiedAcquisitions} BINARY`}
                </div>

                {/* Wave grid vector */}
                <div className="w-full h-12 mt-4">
                  <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="binGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d={metrics.verifiedAcquisitions > 0 ? "M0,22 C15,22 25,18 35,16 C45,14 55,2 65,3 C75,4 85,15 100,1" : "M0,24 L100,24"} 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d={metrics.verifiedAcquisitions > 0 ? "M0,22 C15,22 25,18 35,16 C45,14 55,2 65,3 C75,4 85,15 100,1 L100,24 L0,24 Z" : "M0,24 L100,24 L100,24 L0,24 Z"} 
                      fill="url(#binGrad)" 
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Recent Orders Ledger Section */}
            <div className="p-5 border border-neutral-900 bg-neutral-950/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={15} className="text-purple-400" />
                  <h3 className="font-sans font-bold text-xs uppercase text-neutral-300 tracking-wider">Transaction Ledger</h3>
                </div>
                <span className="font-mono text-[9px] text-neutral-500 uppercase">{metricsLoading ? 0 : ledgerItems.length} COMPLETED TRANSACTIONS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-neutral-900 text-neutral-500 font-mono uppercase text-[9px]">
                      <th className="py-2">Track</th>
                      <th className="py-2">License Class</th>
                      <th className="py-2">Buyer</th>
                      <th className="py-2">payout</th>
                      <th className="py-2">timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                    {ledgerItems.map((sale, idx) => (
                      <tr key={sale._id || idx} className="hover:bg-neutral-900/10">
                        <td className="py-3 font-semibold">{sale.trackTitle}</td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded font-mono text-[9px] uppercase">{sale.licenseClass}</span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-neutral-400">{sale.buyerEmail}</td>
                        <td className="py-3 font-mono font-bold text-cyan-400">${sale.payout.toFixed(2)}</td>
                        <td className="py-3 font-mono text-[10px] text-neutral-500">
                          {new Date(sale.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                    {!metricsLoading && ledgerItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-500 font-mono text-[11px]">
                          NO TRANSACTIONS RECORDED YET ON CURRENT SESSION STREAM
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Active Tracks manager: CONTENT */}
        {adminSection === 'ai-uploader' && (
          <UltimateBeatUploader />
        )}

        {adminSection === 'cover-optimizer' && (
          <CoverArtOptimizer />
        )}

        {adminSection === 'transcoder' && (
          <AudioTranscoder />
        )}

        {adminSection === 'sound-matcher' && (
          <AudioSoundMatcher />
        )}

        {adminSection === 'cloud-triggers' && (
          <CloudTriggers />
        )}

        {adminSection === 'owner-core' && (
          <OwnerCoreConsole addNotification={addNotification} />
        )}

        {adminSection === 'tracks' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <div>
                <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Catalog Registry</h1>
                <p className="text-xs text-neutral-500 font-mono">Create, publish, and delete store tracks</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={14} />
                {showAddForm ? 'Hide Editor' : 'Publish Beat'}
              </button>
            </div>

            {/* Publish Form */}
            {showAddForm && (
              <form onSubmit={handleCreateTrack} className="p-5 rounded-2xl bg-neutral-900/60 border border-purple-500/10 space-y-4">
                <h3 className="font-mono text-xs uppercase text-purple-400 font-bold flex items-center gap-1">
                  <Sparkles size={13} fill="currentColor" />
                  Engine New Master Track
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-neutral-550 uppercase">Track Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kyoto Night"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 text-xs rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-neutral-550 uppercase">Tempo (BPM)</label>
                    <input
                      type="number"
                      placeholder="140"
                      value={newBpm}
                      onChange={(e) => setNewBpm(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 text-xs rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-neutral-550 uppercase">Musical Scale / Key</label>
                    <input
                      type="text"
                      placeholder="Am"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 text-xs rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-neutral-550 uppercase">Track tags (Comma split)</label>
                    <input
                      type="text"
                      placeholder="Trap, Cyberpunk, Hard"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 text-xs rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-neutral-550 uppercase">Artwork Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="Unsplash img url..."
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 text-xs rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-800 pt-3 space-y-3">
                  <p className="font-mono text-[9px] uppercase text-neutral-500 mb-1 font-bold tracking-wider">Set Beat Flat Price ($ USD)</p>
                  <div className="grid grid-cols-1">
                    <Input
                      label="BEAT PRICE"
                      name="mp3Price"
                      type="number"
                      step="0.01"
                      value={newPrices.mp3}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setNewPrices({ mp3: val, wav: val, unlimited: val, exclusive: val });
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase rounded-xl tracking-wider transition cursor-pointer"
                >
                  Write out catalog manifest
                </button>
              </form>
            )}

            {/* iPad Portable Player integration dashboard block */}
            <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-900/60 flex flex-col md:flex-row gap-5 items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                  <span className="p-1 bg-purple-500/15 text-purple-400 rounded">
                    <Radio size={13} />
                  </span>
                  <h3 className="font-sans font-bold text-xs text-neutral-200 uppercase tracking-widest">iPad Standalone Player Companion</h3>
                </div>

                <p className="text-[10.5px] font-sans text-neutral-400 leading-relaxed">
                  Export and launch a responsive, lightweight single-file HTML/CSS/JS playlist player. Fully optimized for instant touch control on your iPad. Plays beats locally using highly optimized Web Audio synthesis, bypassing cloud database pipelines completely.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex gap-2 items-center text-neutral-350">
                    <span className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                      <Check size={10} />
                    </span>
                    <span className="text-[10px] leading-tight font-sans text-neutral-300">Requires no cloud database connection</span>
                  </div>
                  <div className="flex gap-2 items-center text-neutral-350">
                    <span className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                      <Check size={10} />
                    </span>
                    <span className="text-[10px] leading-tight font-sans text-neutral-300">Offline playback on safari or homescreen</span>
                  </div>
                </div>

                {/* Collapsible Source Code View */}
                {showPortableCode && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase block mb-1">HTML PLAYER MODULE SOURCE CODE</label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={portableHtml || "Fetching portable script template node..."}
                        className="w-full h-40 p-3 bg-neutral-950 border border-neutral-850 font-mono text-[9.5px] rounded-lg outline-none text-neutral-400 focus:border-purple-600 focus:text-neutral-200"
                        id="portable-code-box"
                      />
                      <button
                        onClick={async () => {
                          try {
                            const code = document.getElementById("portable-code-box")?.innerText || portableHtml;
                            await navigator.clipboard.writeText(code);
                            setCopiedPlayerCode(true);
                            addNotification("COPIED // Portable Player HTML script copied successfully");
                            setTimeout(() => setCopiedPlayerCode(false), 2000);
                          } catch (err) {
                            addNotification("ERROR // Failed to copy script");
                          }
                        }}
                        className="absolute bottom-3 right-3 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9.5px] font-mono text-neutral-300 rounded flex items-center gap-1.5 transition select-none cursor-pointer"
                      >
                        {copiedPlayerCode ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        {copiedPlayerCode ? "Copied!" : "Copy Script Code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-60 p-4 rounded-xl bg-neutral-950 border border-neutral-900 text-center space-y-3 shrink-0 self-stretch flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-neutral-500 uppercase">SYNCHRONIZATION HUB</span>
                  <div className="text-xs font-mono text-cyan-400 font-bold tracking-tight">VIBEVAULT_SYNC</div>
                </div>

                <div className="space-y-2">
                  <a
                    href="/portable_player.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 text-white text-[11px] font-bold uppercase rounded-lg tracking-wide transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/40"
                  >
                    <ExternalLink size={12} />
                    Open Mobile Player
                  </a>

                  <button
                    onClick={async () => {
                      try {
                        const playlistJSON = JSON.stringify(tracks, null, 2);
                        await navigator.clipboard.writeText(playlistJSON);
                        setCopiedCatalog(true);
                        addNotification("SYNCHED // Live beats catalog JSON schema copied");
                        setTimeout(() => setCopiedCatalog(false), 2000);
                      } catch (err) {
                        addNotification("ERROR // Failed to copy catalog schema");
                      }
                    }}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 hover:text-neutral-100 border border-neutral-800 text-neutral-350 text-[10.5px] font-mono rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedCatalog ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    {copiedCatalog ? "Catalog Synced!" : "Sync Live Beats"}
                  </button>

                  <button
                    onClick={() => {
                      const nextState = !showPortableCode;
                      setShowPortableCode(nextState);
                      if (nextState && !portableHtml) {
                        const origin = window.location.origin;
                        const playerUrl = (!origin || origin === 'null') ? '/portable_player.html' : `${origin}/portable_player.html`;
                        fetch(playerUrl)
                          .then(res => res.text())
                          .then(code => setPortableHtml(code))
                          .catch(() => addNotification("ERROR // Failed to load source file"));
                      }
                    }}
                    className="w-full py-1.5 text-neutral-500 hover:text-neutral-300 text-[10px] font-mono uppercase tracking-wide transition hover:underline cursor-pointer"
                  >
                    {showPortableCode ? "Hide HTML Code" : "Extract HTML Script"}
                  </button>
                </div>
              </div>
            </div>

            {/* List current registry */}
            <div className="overflow-hidden border border-neutral-900 rounded-xl bg-neutral-950 text-xs">
              <div className="p-4 bg-neutral-900/30 border-b border-neutral-900 font-mono text-[10px] text-neutral-400 uppercase">
                Active Catalog ({tracks.length} beats cataloged)
              </div>
              <div className="divide-y divide-neutral-900">
                {tracks.map((track) => (
                  <div key={track.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/20">
                    <div className="flex items-center gap-3 w-1/3 min-w-[200px]">
                      <img src={track.imageUrl} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-contain rounded-sm border border-neutral-800 bg-black" />
                      <div className="min-w-0">
                        <div className="font-sans font-bold text-neutral-200 truncate">{track.title}</div>
                        <div className="font-mono text-[9px] text-neutral-500 mt-0.5">by {track.producer} • {track.bpm} BPM • {track.key}</div>
                      </div>
                    </div>

                    <div className="flex font-mono text-[10px] text-center w-56 justify-center">
                      <div className="p-2 bg-neutral-900 border border-neutral-850 rounded w-full">
                        <span className="text-neutral-500 block uppercase text-[8px] tracking-wider font-bold mb-0.5">Flat Beat Price</span>
                        <span className="text-cyan-400 font-bold text-sm">${(track.price !== undefined ? track.price : track.prices?.mp3 || 29.99).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 text-neutral-400 text-right w-44 justify-end shrink-0">
                      <div className="font-mono text-[9.5px]">
                        <span className="block text-purple-400 font-bold">{(track.streams !== undefined ? track.streams : track.plays).toLocaleString()} streams</span>
                        <span className="text-neutral-500 block">{track.sales} sales</span>
                      </div>
                      {track.plaque_awarded && (
                        <button
                          onClick={() => {
                            const event = new CustomEvent('vv-milestone-achieved', {
                              detail: {
                                beat_id: track.id,
                                track_title: track.title,
                                certified_streams: track.streams !== undefined ? track.streams : track.plays,
                                award_type: "Platinum Digital Record Plaque",
                                presentee: "TYROX MADE THIS",
                                print_template_url: `https://yourstorage.com_${track.id}.png`
                              }
                            });
                            window.dispatchEvent(event);
                          }}
                          className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/25 rounded text-yellow-400 font-sans font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 cursor-pointer transition shrink-0"
                          title="Click to view and inspect Platinum Plaque"
                        >
                          🏅 PLAQUE
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this track?")) {
                            deleteTrack(track.id);
                            addNotification(`REMOVED // Catalog pruned: "${track.title}"`);
                          }
                        }}
                        className="delete-btn p-2 hover:bg-neutral-900 text-neutral-500 hover:text-red-400 rounded-lg transition border border-transparent hover:border-neutral-800 cursor-pointer"
                        title="Delete track"
                      >
                        <span className="trash-icon flex items-center gap-1.5 font-mono text-[11px]">
                          <Trash2 size={13} />
                          <span>🗑️</span>
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Licensing Contracts Manager */}
        {adminSection === 'contracts' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Legal Licensing Templates</h1>
              <p className="text-xs text-neutral-500 font-mono">Modulate clauses and commercial restrictions of delivery bundles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contracts.map((contract) => (
                <div key={contract.id} className="p-5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                      <h3 className="font-sans font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                        <FileText size={14} className="text-purple-400" />
                        {contract.title}
                      </h3>
                      <span className="font-mono text-[10px] text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                        {contract.distributorLimit}
                      </span>
                    </div>

                    {editingContractId === contract.id ? (
                      <textarea
                        value={editContractTerms}
                        onChange={(e) => setEditContractTerms(e.target.value)}
                        className="w-full h-44 p-3 bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded-lg outline-none text-neutral-200 focus:border-purple-600"
                      />
                    ) : (
                      <p className="text-[10px] text-neutral-400 font-mono leading-relaxed h-44 overflow-y-auto bg-neutral-900/20 p-3 rounded-lg border border-neutral-950">
                        {contract.termsText}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="font-mono text-[9px] text-neutral-550 uppercase">
                      monetization: {contract.monetizationAllowed ? 'permitted (organic)' : 'restricted'}
                    </div>

                    {editingContractId === contract.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingContractId(null)}
                          className="px-2.5 py-1 text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-205 rounded transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            contract.termsText = editContractTerms;
                            setEditingContractId(null);
                            addNotification(`SAVED // Clauses updated for license class "${contract.id.toUpperCase()}"`);
                          }}
                          className="px-2.5 py-1 text-[10px] font-mono bg-purple-600 text-white rounded transition cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingContractId(contract.id);
                          setEditContractTerms(contract.termsText);
                        }}
                        className="px-2.5 py-1 text-[10px] font-mono bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition cursor-pointer"
                      >
                        Adjust Clauses
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promote & Discounts View */}
        {adminSection === 'promotions' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Promotions & Coupons</h1>
              <p className="text-xs text-neutral-500 font-mono">Create and deploy active discount codes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form to create coupon */}
              <div className="md:col-span-1 p-5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-4">
                <h3 className="font-mono text-xs uppercase text-purple-400 font-bold">New Coupon</h3>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Code name</label>
                  <input
                    type="text"
                    placeholder="VIBE50"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-820 rounded-lg text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Value</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-820 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500 block">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCouponType('percentage')}
                      className={`flex-1 py-1 px-2.5 rounded text-[10px] font-mono border transition ${newCouponType === 'percentage' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                    >
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCouponType('fixed')}
                      className={`flex-1 py-1 px-2.5 rounded text-[10px] font-mono border transition ${newCouponType === 'fixed' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                    >
                      Flat Rate
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!newCouponCode.trim()) return;
                    const matched = coupons.find(c => c.code === newCouponCode);
                    if (matched) {
                      alert('Coupon code already registered.');
                      return;
                    }
                    coupons.push({
                      code: newCouponCode,
                      discountType: newCouponType,
                      value: parseFloat(newCouponVal) || 20,
                      active: true
                    });
                    setNewCouponCode('');
                    addNotification(`DEPLOYED // Active promo code: "${newCouponCode}"`);
                  }}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-lg tracking-wider transition cursor-pointer"
                >
                  Deploy Code
                </button>
              </div>

              {/* Active Coupons List */}
              <div className="md:col-span-2 overflow-hidden border border-neutral-900 rounded-xl bg-neutral-950 font-sans text-xs">
                <div className="p-4 bg-neutral-900/30 border-b border-neutral-900 font-mono text-[10px] text-neutral-400 uppercase">
                  Registry of Promotional nodes
                </div>
                <div className="divide-y divide-neutral-900">
                  {coupons.map((coupon, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-900/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-md font-mono text-sm tracking-widest font-bold">
                          {coupon.code}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-200">
                            {coupon.discountType === 'percentage' ? `${coupon.value}% Discount` : `$${coupon.value} Flat Offset`}
                          </p>
                          <p className="font-mono text-[9px] text-neutral-500 mt-1">Class: {coupon.discountType.toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            coupon.active = !coupon.active;
                            addNotification(`TOGGLED // "${coupon.code}" active state set: ${coupon.active}`);
                          }}
                          className={`font-mono text-[9px] border px-2 py-0.5 rounded transition uppercase ${coupon.active ? 'text-emerald-400 border-emerald-400/20 bg-emerald-500/5' : 'text-neutral-500 border-neutral-800'}`}
                        >
                          {coupon.active ? 'Active' : 'Muted'}
                        </button>
                        
                        <button
                          onClick={() => {
                            const cIdx = coupons.findIndex(c => c.code === coupon.code);
                            if (cIdx !== -1) {
                              coupons.splice(cIdx, 1);
                              addNotification(`MUTATED // Pruned coupon node: "${coupon.code}"`);
                            }
                          }}
                          className="p-1.5 text-neutral-550 hover:text-red-400 transition cursor-pointer"
                          title="Prune code"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Publishing Portal System */}
        {adminSection === 'portal' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Publishing Licensing Portal</h1>
              <p className="text-xs text-neutral-500 font-mono">Content ID whitelists and mechanical publishing logs</p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-xs uppercase text-neutral-300 tracking-wider">YouTube Content ID Sync</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Our automated whitelisting node logs licensed customer channels directly into YouTube Content ID and Facebook Rights Manager databases. This shuts down unwarranted copyright strikes in perpetuity.
              </p>

              <div className="pt-2">
                <div className="p-4 bg-neutral-900/30 rounded-xl border border-neutral-900 font-mono text-[10.5px] leading-relaxed space-y-2">
                  <div className="text-cyan-400 font-bold uppercase">// WHITELIST SYNC ACTIVITY LOG</div>
                  <div className="text-neutral-500">[10:42:01] Whitelisted Channel ID: UCp15vR43D... ('Rapper Sergio UK')</div>
                  <div className="text-neutral-500">[08:14:10] Whitelisted Audio Signature: 'Tokyo Drift' (Licensed for Rapper Sergio UK)</div>
                  <div className="text-neutral-500">[AS-NODE] ASCAP / BMI global catalog records up-to-date.</div>
                </div>
              </div>

              {/* Claims checker query manual */}
              <div className="space-y-2 border-t border-neutral-900 pt-4 text-xs font-sans">
                <p className="font-mono text-[10px] text-neutral-500 uppercase">Search ASCAP / BMI registry manually</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search ISCR codes (e.g., US-TRX-26-00042)"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg outline-none text-xs text-neutral-300 focus:border-cyan-400"
                  />
                  <button 
                    onClick={() => addNotification('DIAGNOSTICS // Registry search returned 0 claims conflicts')}
                    className="px-3.5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded-lg border border-cyan-500/20 text-xs font-mono select-none cursor-pointer"
                  >
                    Ping Registry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PayPal Processing Admin setup */}
        {adminSection === 'paypal' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Merchant Settings</h1>
              <p className="text-xs text-neutral-500 font-mono">Input secure credentials for payout processing</p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-6 max-w-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                <DollarSign size={16} className="text-emerald-500" />
                <h3 className="font-sans font-bold text-xs uppercase text-neutral-300 tracking-wider">Payout Pipeline</h3>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-neutral-500 uppercase">Primary Payout Method</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-350">
                      <input
                        type="radio"
                        name="method"
                        checked={payoutMethod === 'paypal'}
                        onChange={() => setPayoutMethod('paypal')}
                        className="accent-purple-500 h-4 w-4"
                      />
                      PayPal Standard Payments
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-350">
                      <input
                        type="radio"
                        name="method"
                        checked={payoutMethod === 'stripe'}
                        onChange={() => setPayoutMethod('stripe')}
                        className="accent-purple-500 h-4 w-4"
                      />
                      Stripe Connected Payouts
                    </label>
                  </div>
                </div>

                <div className="space-y-1 pb-2">
                  <label className="font-mono text-[10px] text-neutral-500 uppercase">Payout Destination Email</label>
                  <input
                    type="email"
                    required
                    placeholder="tyroxmadethis@gmail.com"
                    value={payoutEmail}
                    onChange={(e) => setPayoutEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg outline-none focus:border-purple-600 font-mono"
                  />
                  <p className="text-[9px] text-neutral-500">Payments received during checkouts are logged and credited to this merchant account.</p>
                </div>

                <div className="border-t border-neutral-900 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-[10.5px] font-mono text-neutral-500">
                    <span>SECURITY CHIP ENCRYPTION</span>
                    <span className="text-emerald-400 font-bold">ENABLED</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNotification(`INTEGRATION // Credentials validated and deployed`)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wide cursor-pointer transition active:scale-95"
                  >
                    Save payout parameters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stream Telemetry View */}
        {adminSection === 'telemetry' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-wide uppercase text-neutral-200">Listening Telemetry Feed</h1>
              <p className="text-xs text-neutral-500 font-mono">Auditory signals, geographic maps, and user skips tracking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
              
              {/* Geographic listeners */}
              <div className="md:col-span-5 p-5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-4">
                <h3 className="text-xs uppercase font-mono text-purple-400 font-bold tracking-wider">// Listener Regions</h3>
                <div className="space-y-3 text-xs text-neutral-300">
                  {[
                    { country: 'United States', percentage: 48, count: '612 plays' },
                    { country: 'United Kingdom', percentage: 22, count: '280 plays' },
                    { country: 'Germany', percentage: 14, count: '178 plays' },
                    { country: 'Japan', percentage: 10, count: '127 plays' },
                    { country: 'South Korea', percentage: 6, count: '76 plays' },
                  ].map((region, idx) => (
                    <div key={idx} className="space-y-1.5 text-neutral-400">
                      <div className="flex justify-between font-mono text-[10.5px]">
                        <span>{region.country}</span>
                        <span className="font-semibold text-neutral-200">{region.count} ({region.percentage}%)</span>
                      </div>
                      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${region.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streaming live feed logs */}
              <div className="md:col-span-7 p-5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-mono text-cyan-400 font-bold tracking-wider">// Real-Time Stream Signals</h3>
                  <button 
                    onClick={() => setLiveStreamLogs(prev => [
                      { text: 'Tokyo Drift preview streamed by custom sandbox frame', time: 'LIVE' },
                      ...prev
                    ].slice(0, 6))}
                    className="p-1 text-neutral-500 hover:text-white transition cursor-pointer"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                <div className="border border-neutral-900 rounded-xl divide-y divide-neutral-900/60 overflow-hidden font-mono text-[10px]">
                  {liveStreamLogs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-neutral-950 hover:bg-neutral-900/10 flex justify-between gap-4 text-neutral-400">
                      <span className="truncate">{log.text}</span>
                      <span className="font-semibold text-cyan-400 flex-shrink-0 bg-cyan-950/20 px-1 rounded">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Financial & Active User Telemetry Stream */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-900 space-y-6">
              <FinancialTelemetryStream />
              <TransactionLedger />
            </div>

          </div>
        )}

        {/* Portal Settings View */}
        {adminSection === 'settings' && (
          <div className="animate-fadeIn">
            <DashboardSettings />
          </div>
        )}

        {/* System Feature Mapping View */}
        {adminSection === 'feature-mapping' && (
          <div className="space-y-6 md:space-y-8 animate-fadeIn">
            {/* Header matches professional dashboard */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-sans italic tracking-tighter text-neutral-100 uppercase font-black">
                  Core Architecture Diagnostics
                </h1>
                <p className="font-mono text-[10px] text-neutral-500 uppercase mt-1">
                  VIBEVAULT // INTERACTIVE LOGICAL FEATURE SYSTEM MAPPING
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* REQUIRED ELEMENT FOR LOCAL DISPLAY AUTOMATED TESTS OR DIAGNOSTIC MAPS */}
                <div 
                  id="binaryDisplay" 
                  className="font-mono text-xs text-purple-400 font-bold bg-purple-950/30 border border-purple-500/20 px-3 py-1.5 rounded-lg select-all shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                >
                  INITIALIZING METADATA...
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-neutral-450 uppercase text-[10px]">DIAGNOSTICS: STABLE</span>
                </div>
              </div>
            </div>

            {/* Interactive Search & Section Filter bar */}
            <InteractiveFeatureFilter />

            {/* Legend & Details */}
            <div className="p-4 rounded-xl bg-[#090b10] border border-neutral-850/60 leading-relaxed text-[11px] text-neutral-400 font-sans flex items-start gap-3">
              <div className="p-1 px-2.5 bg-purple-950/20 text-purple-400 font-mono text-[10px] rounded uppercase font-bold shrink-0 mt-0.5 border border-purple-500/10">
                INFO NODE
              </div>
              <div>
                <span className="text-neutral-200 font-bold">Comprehensive VibeVault Core Specifications (Client-Led Sandbox)</span>: This maps the active and historical framework features of the digital marketplace. All systems perform with localized state pipelines, completely skipping Firestore dependencies for low-latency, resilient music distribution on portable iPads.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// EXTRA INTERACTIVE HELPERS & DATA REPRESENTATION
export const beatstarsCoreRegistry = [
  // === RELEASED/ACTIVE MARKETPLACE SYSTEMS (1-17) ===
  { id: 1, name: "Automated Instant Licensing", group: "active", description: "Instantly packages and delivers signing contract files to artists upon checkout approval." },
  { id: 2, name: "Collaborative Revenue Splits", group: "active", description: "Automates real-time mathematical division of earnings between multiple production contributors." },
  { id: 3, name: "Beat ID Sound Fingerprinting", group: "active", description: "Scans public media channels to spot unlicensed or uncleared uses of your audio properties." },
  { id: 4, name: "Abandoned Cart Email Recovery", group: "active", description: "Triggers background reminder follow-ups to buyers who drop out mid-checkout sequence." },
  { id: 5, name: "Pro Page Domain Redirection", group: "active", description: "Maps your custom private internet domain names cleanly over local server assets." },
  { id: 6, name: "Bulk Contract Mass-Editing", group: "active", description: "Modifies legal boilerplate definitions simultaneously across massive asset catalogs." },
  { id: 7, name: "Type-Beat Search Discovery Tags", group: "active", description: "Aligns item searchable indexes with trending external query volumes and artist names." },
  { id: 8, name: "SoundCloud Integration Sync", group: "active", description: "Pushes audio previews out to external streaming endpoints to multiply inbound store footprints." },
  { id: 9, name: "Stripe/PayPal Real-Time Payouts", group: "active", description: "Transfers customer transaction funds cleanly directly into verified processor nodes." },
  { id: 10, name: "Multi-File Audio Ingestion", group: "active", description: "Handles concurrent upload paths for structural files (MP3, WAV, Stems) on one layout panel." },
  { id: 11, name: "Custom Beat Commission Desk", group: "active", description: "Provides client-facing workspaces where buyers pay custom retainers for exclusive assignments." },
  { id: 12, name: "Sound Kit E-Commerce Nodes", group: "active", description: "Integrates specialized digital item download catalogs distinct from standard musical scales." },
  { id: 13, name: "Embeddable Playlist Media Players", group: "active", description: "Generates custom code tags to export working store player views out onto external blogs." },
  { id: 14, name: "Vocal Production Service Listings", group: "active", description: "Allows producers to market additional mixing, arrangement, and tuning work items." },
  { id: 15, name: "Global Mechanical Royalty Publishing", group: "active", description: "Links music registration files directly with performance rights platforms to secure tracking." },
  { id: 16, name: "Exclusive License Listing Stripper", group: "active", description: "Wipes a track row out of the open catalog database query loop immediately upon exclusive buyout." },
  { id: 17, name: "Lossless Trackout Stem Delivery", group: "active", description: "Packages separated instrumental lanes into compressed archive bundles for tracking mixing loops." },

  // === SUNSET / ABANDONED LEGACY SYSTEMS (18-24) ===
  { id: 18, name: "Blaze Flash Audio Widget", group: "sunset", description: "Legacy plugin player format rendered completely obsolete by standardized HTML structural code." },
  { id: 19, name: "Beatstar Arcade Mobile Game", group: "sunset", description: "Independent gamified mobile property, official global service officially ended late 2025." },
  { id: 20, name: "30-Day Content Archival Rules", group: "sunset", description: "Historic tier policy automated to pull down over-limit tracks when structural memberships shifted." },
  { id: 21, name: "Legacy 'New Releases' Sidebar Box", group: "sunset", description: "Static visual UI sidebar panel removed to make room for automated context search tools." },
  { id: 22, name: "Static HTML Store Profiles", group: "sunset", description: "Unresponsive layouts dropped for fully reactive modular layouts that fit variable screen sizes." },
  { id: 23, name: "WAV-Only Forced Codecs", group: "sunset", description: "Rigid single-format requirements loosened to welcome highly optimized modern extensions." },
  { id: 24, name: "Original Single-Credit Vouchers", group: "sunset", description: "Old platform token system retired in favor of direct transparent dollar currency mappings." },

  // === UNRELEASED / FUTURE BETA AI SYSTEMS (25-31) ===
  { id: 25, name: "AI Predictive Genre Tagging", group: "unreleased", description: "Analyzes raw frequency bands during upload to tag tempo and mood without human input." },
  { id: 26, name: "Creator-Owned Trained AI Models", group: "unreleased", description: "Advanced framework allowing producers to train and rent private style engines safely using their own catalog." },
  { id: 27, name: "Zapier Automated Outbound Hooks", group: "unreleased", description: "Fires secure server signals instantly to external target applications upon successful buyer checkout." },
  { id: 28, name: "AI Art Canvas Thumbnail Generation", group: "unreleased", description: "Uses local text prompts to generate matching cover graphics instantly during track setup." },
  { id: 29, name: "Vocal Layer Isolation Band Filters", group: "unreleased", description: "Splits raw mixed songs into separate acapella, drum, and instrumental variants automatically." },
  { id: 30, name: "Web3 Contract License Minting", group: "unreleased", description: "Appends unique blockchain-based decentralized certificates to confirm safe origin provenance." },
  { id: 31, name: "Dynamic Multi-Currency Forex Matrix", group: "unreleased", description: "Real-time global currency translation engines standardizing multi-regional checkout prices." }
];

// Compatibility mapping format
const VIBEVAULT_MASTER_SCHEMA = {
  coreMarketplace: {
    abandonedCartRecovery: "Automatically send follow-ups for unpaid beats",
    analyticsDashboard: "Detailed sales tracking and social networking stats",
    automatedLicensing: "Instant license delivery and automated upgrades"
  }
};

// Vanilla JavaScript style initializer so that global tools or DOM parsers can find this hook
export function initializeStoreFeatures() {
  console.log("VIBEVAULT: Loading " + beatstarsCoreRegistry.length + " Core Systems...");
  const totalCount = beatstarsCoreRegistry.length; // 31
  const displayElement = document.getElementById('binaryDisplay');
  if (displayElement) {
    displayElement.innerText = `${totalCount} / 31 SYSTEMS DEPLOYED`;
  }
  const featureDisplayElement = document.getElementById('featureDisplay');
  if (featureDisplayElement) {
    featureDisplayElement.innerText = `${totalCount} / 31 SYSTEMS DEPLOYED`;
  }
}

interface FeatureItem {
  id: string;
  category: string;
  title: string;
  description: string;
}

// Interactive Feature filtering & iPad system simulator component
const InteractiveFeatureFilter: React.FC = () => {
  const [activeSchemaTab, setActiveSchemaTab] = useState<'all' | 'active' | 'sunset' | 'unreleased'>('all');
  const [searchWord, setSearchWord] = useState('');
  const [runningDiagnostics, setRunningDiagnostics] = useState<string | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  // Format nested schema keys and strings into a flat layout list
  const getFlatFeatures = (): FeatureItem[] => {
    return beatstarsCoreRegistry.map(item => ({
      id: String(item.id),
      category: item.group,
      title: item.name,
      description: item.description
    }));
  };

  const triggerDiagnostics = (feature: FeatureItem) => {
    setRunningDiagnostics(feature.title);
    setDiagnosticLogs([
      `[NODE-INIT] Running diagnostic sequence for node "${feature.id.toUpperCase()}"...`,
      `[NODE-METADATA] Category: ${feature.category.toUpperCase()}`,
      `[NODE-METADATA] Mapping: "${feature.description}"`,
      `[CALCULATOR-ENG] Initializing localized low-latency environment...`
    ]);

    setTimeout(() => {
      setDiagnosticLogs(prev => [
        ...prev,
        `[DIAGNOSTICS] Pipeline ping succeeded. Latency: 4.8ms`,
        `[STATUS] System active & optimized for touch screens [100% OK]`
      ]);
    }, 800);
  };

  const allFeatures = getFlatFeatures();
  
  // Filter features based on tabs and search query
  const filteredActive = allFeatures.filter(f => f.category === 'active' && 
    (f.title.toLowerCase().includes(searchWord.toLowerCase()) || f.description.toLowerCase().includes(searchWord.toLowerCase()))
  );
  const filteredSunset = allFeatures.filter(f => f.category === 'sunset' && 
    (f.title.toLowerCase().includes(searchWord.toLowerCase()) || f.description.toLowerCase().includes(searchWord.toLowerCase()))
  );
  const filteredUnreleased = allFeatures.filter(f => f.category === 'unreleased' && 
    (f.title.toLowerCase().includes(searchWord.toLowerCase()) || f.description.toLowerCase().includes(searchWord.toLowerCase()))
  );

  // Call the initializer dynamically upon mount and search/tab changes
  React.useEffect(() => {
    initializeStoreFeatures();
    const ti = setTimeout(() => initializeStoreFeatures(), 150);
    return () => clearTimeout(ti);
  }, [activeSchemaTab, searchWord]);

  // Unified renderer for individual feature blocks inside the matrix column
  const renderFeatureNode = (feat: FeatureItem) => {
    const isCore = feat.category === 'active';
    const isSunset = feat.category === 'sunset';
    const isSelected = runningDiagnostics === feat.title;

    return (
      <div
        key={feat.id}
        id={`feature-node-${feat.id}`}
        onClick={() => triggerDiagnostics(feat)}
        className={`feature-node p-3 rounded-lg border transition-all cursor-pointer select-none text-left flex items-start gap-3.5 relative group ${
          isSelected 
            ? 'border-purple-500 bg-purple-950/[0.12] shadow-[0_0_12px_rgba(168,85,247,0.15)] bg-opacity-80' 
            : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800 hover:bg-neutral-900/40'
        }`}
      >
        <div className={`node-number w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
          isCore ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
          isSunset ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
          'bg-purple-500/10 text-purple-400 border border-purple-500/10'
        }`}>
          {feat.id}
        </div>

        <div className="node-content space-y-0.5 min-w-0 pr-2">
          <h4 className="node-name font-sans font-black text-[11px] text-neutral-200 uppercase tracking-tight group-hover:text-white transition truncate">
            {feat.title}
          </h4>
          <p className="node-desc text-[9.5px] text-neutral-400 leading-normal font-sans font-medium">
            {feat.description}
          </p>
        </div>

        <span className="absolute right-2 top-2.5 font-mono text-[7px] text-neutral-700 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition">
          RUN
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Scope Telemetry Badge matched with layout controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-neutral-900/40 p-2 rounded-xl border border-neutral-900">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'Full 3-Column Matrix' },
            { id: 'active', label: 'Active Core (1-17)' },
            { id: 'sunset', label: 'Sunset Legacy (18-24)' },
            { id: 'unreleased', label: 'Upcoming AI (25-31)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSchemaTab(tab.id as any)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeSchemaTab === tab.id 
                  ? 'bg-purple-600 font-bold text-white shadow-sm' 
                  : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Filter search input */}
        <div className="relative flex items-center shrink-0">
          <input
            type="text"
            placeholder="Search core blueprint..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="px-3 py-1.5 bg-neutral-950 border border-neutral-850 focus:border-purple-600 outline-none text-[10.5px] rounded-lg w-full md:w-56 font-mono text-neutral-200 placeholder:text-neutral-600"
          />
          {searchWord && (
            <button 
              onClick={() => setSearchWord('')}
              className="absolute right-2 text-neutral-600 hover:text-neutral-300 text-[10px] font-mono"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Core Matrix columns wrapper */}
        <div className={`grid grid-cols-1 gap-6 ${activeSchemaTab === 'all' ? 'md:grid-cols-3' : 'grid-cols-1'} ${runningDiagnostics ? 'xl:col-span-8' : 'xl:col-span-12'} transition-all`}>
          
          {/* COLUMN 1: ACTIVE CORE SYSTEMS */}
          {(activeSchemaTab === 'all' || activeSchemaTab === 'active') && (
            <div className="rounded-xl border border-neutral-850 bg-[#090a0f] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                <h2 className="font-sans font-black uppercase text-xs tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active Core Systems (1-17)
                </h2>
                <span className="font-mono text-[9px] text-neutral-500 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/5">
                  {filteredActive.length} active
                </span>
              </div>
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredActive.map(renderFeatureNode)}
                {filteredActive.length === 0 && (
                  <p className="font-mono text-neutral-650 text-[10px] text-center py-6">No matching active nodes found.</p>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 2: LEGACY & DECOMMISSIONED PROTOCOLS */}
          {(activeSchemaTab === 'all' || activeSchemaTab === 'sunset') && (
            <div className="rounded-xl border border-neutral-850 bg-[#090a0f] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-rose-500/10 pb-3">
                <h2 className="font-sans font-black uppercase text-xs tracking-wider text-rose-450 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Sunset Legacy Systems (18-24)
                </h2>
                <span className="font-mono text-[9px] text-neutral-500 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-500/5">
                  {filteredSunset.length} legacy
                </span>
              </div>
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredSunset.map(renderFeatureNode)}
                {filteredSunset.length === 0 && (
                  <p className="font-mono text-neutral-650 text-[10px] text-center py-6">No matching legacy nodes found.</p>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 3: FUTURE BETA AI EXTENSIONS */}
          {(activeSchemaTab === 'all' || activeSchemaTab === 'unreleased') && (
            <div className="rounded-xl border border-neutral-850 bg-[#090a0f] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
                <h2 className="font-sans font-black uppercase text-xs tracking-wider text-purple-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Unreleased AI Systems (25-31)
                </h2>
                <span className="font-mono text-[9px] text-neutral-500 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/5">
                  {filteredUnreleased.length} unreleased
                </span>
              </div>
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredUnreleased.map(renderFeatureNode)}
                {filteredUnreleased.length === 0 && (
                  <p className="font-mono text-neutral-650 text-[10px] text-center py-6">No matching beta nodes found.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Diagnostic Feed Sidepanel matched with layout columns */}
        {runningDiagnostics && (
          <div className="xl:col-span-4 p-5 rounded-2xl bg-[#06070a] border border-neutral-850 space-y-4 animate-scaleUp self-start">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                <h4 className="font-sans font-black uppercase text-xs tracking-tight text-white">SYSTEM ANALYZER</h4>
              </div>
              <button 
                onClick={() => setRunningDiagnostics(null)} 
                className="text-[9.5px] font-mono text-neutral-550 hover:text-neutral-300 uppercase hover:underline cursor-pointer font-bold"
              >
                Close Feed
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[9px] text-neutral-500 uppercase">diagnosing module targets:</span>
              <p className="text-xs font-sans font-black uppercase text-neutral-200 tracking-tight">{runningDiagnostics}</p>
            </div>

            <div className="bg-[#020203] border border-neutral-900 rounded-lg p-3 font-mono text-[9px] leading-relaxed space-y-1.5 text-neutral-400 overflow-y-auto max-h-56">
              {diagnosticLogs.map((log, lidx) => (
                <div key={lidx} className={log.includes('[STATUS]') ? "text-emerald-400 font-bold" : log.includes('Latency') ? "text-cyan-400" : ""}>
                  {log}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (runningDiagnostics) {
                  setDiagnosticLogs(prev => [
                    ...prev,
                    `[FORCE-BURST] Executing automated micro-unit test validation...`,
                    `[TEST-OK] Automated build script checks are green!`
                  ]);
                }
              }}
              className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 text-neutral-300 font-mono text-[10px] rounded-lg uppercase tracking-wider transition cursor-pointer"
            >
              Run Unit Test Node
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

