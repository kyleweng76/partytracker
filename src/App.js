import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, History, Clock, AlertTriangle, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

// --- 內嵌 SVG Logo 元件 (解決圖片不顯示問題) ---
const AppIcon = ({ size = 40, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ overflow: 'visible' }} // 允許光暈特效溢出
  >
    <defs>
      <linearGradient id="bgGradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="50%" stopColor="#4338CA" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="neonGradient" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
    </defs>

    {/* 背景 (如果是圓角矩形) */}
    <rect x="0" y="0" width="512" height="512" rx="115" fill="url(#bgGradient)" />
    
    {/* 玻璃反光質感 */}
    <path d="M0 115C0 51.4873 51.4873 0 115 0H397C460.513 0 512 51.4873 512 115V256L0 120V115Z" fill="white" fillOpacity="0.1" />

    {/* 酒杯主體 */}
    <g transform="translate(106, 116)" style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }}>
      <path d="M36.4,20 L150,230 L263.6,20" stroke="url(#neonGradient)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="150" y1="230" x2="150" y2="330" stroke="url(#neonGradient)" strokeWidth="32" strokeLinecap="round" />
      <line x1="100" y1="330" x2="200" y2="330" stroke="url(#neonGradient)" strokeWidth="32" strokeLinecap="round" />
      <path d="M75,90 L150,225 L225,90 Z" fill="#EC4899" fillOpacity="0.3" />
      <path d="M75,90 L150,225 L225,90 Z" stroke="#EC4899" strokeWidth="4" strokeOpacity="0.5" fill="none"/>
      <circle cx="200" cy="50" r="15" fill="#34D399" fillOpacity="0.9" />
      <circle cx="230" cy="20" r="8" fill="#34D399" fillOpacity="0.6" />
      <circle cx="180" cy="80" r="6" fill="#F472B6" fillOpacity="0.6" />
    </g>
  </svg>
);

const PartyDrinkTracker = () => {
  // ---------------- State Management ----------------
  const [partyStatus, setPartyStatus] = useState('idle'); // 'idle', 'active', 'ended'
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [records, setRecords] = useState([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' | 'warning'
    message: '',
    onConfirm: () => {},
  });

  // 酒類配置
  const DRINK_CONFIG = [
    { id: 'wine', icon: '🍷', portions: [0.5, 1] },
    { id: 'sake', icon: '🍶', portions: [1] },
    { id: 'water', icon: '💦', portions: [0.5, 1] },
    { id: 'melon', icon: '🍈', portions: [0.5, 1] },
    { id: 'beer', icon: '🍺', portions: [1] },
  ];

  // ---------------- Effects ----------------

  useEffect(() => {
    let interval;
    if (partyStatus === 'active' && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now - new Date(startTime);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [partyStatus, startTime]);

  useEffect(() => {
    const savedData = localStorage.getItem('party_tracker_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setPartyStatus(parsed.partyStatus);
      setStartTime(parsed.startTime);
      setEndTime(parsed.endTime);
      setRecords(parsed.records);
      setIsExpertMode(parsed.isExpertMode || false);
    }
  }, []);

  useEffect(() => {
    const dataToSave = { partyStatus, startTime, endTime, records, isExpertMode };
    localStorage.setItem('party_tracker_data', JSON.stringify(dataToSave));
  }, [partyStatus, startTime, endTime, records, isExpertMode]);


  // ---------------- Helper Functions ----------------

  const openConfirmModal = (message, action) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message,
      onConfirm: () => {
        action();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openWarningModal = (message, nextAction) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (nextAction) setTimeout(nextAction, 100); 
      }
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const getTimeSinceLastDrink = (drinkIcon) => {
    const lastRecord = records.find(r => r.icon === drinkIcon);
    if (!lastRecord) return null;

    const now = new Date();
    const lastTime = new Date(lastRecord.timestamp);
    const diffMs = now - lastTime;
    
    if (diffMs < 0) return '剛剛';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '剛剛';
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) return `${hours}小時${mins}分鐘`;
    return `${mins}分鐘`;
  };

  // ---------------- Logic ----------------
  const startPartyLogic = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setPartyStatus('active');
    setEndTime(null);
    setRecords([]);
    setElapsedTime('00:00:00');
  };

  const handleStartSafeParty = () => {
    setIsExpertMode(false);
    startPartyLogic();
  };

  const handleStartExpertParty = () => {
    openWarningModal('請理解在此模式下不會跳出任何警示視窗，請自行留意安全。', () => {
      setIsExpertMode(true);
      startPartyLogic();
    });
  };

  const toggleMode = () => {
    if (isExpertMode) {
      openConfirmModal('確定要切換回「安全模式」嗎？所有的健康警示將會重新啟用。', () => {
        setIsExpertMode(false);
      });
    } else {
      openWarningModal('切換至專家模式：請理解在此模式下不會跳出任何警示視窗，請自行留意安全。', () => {
        setIsExpertMode(true);
      });
    }
  };

  const handleEndParty = () => {
    openConfirmModal('確定要結束這場派對嗎？', () => {
      setEndTime(new Date().toISOString());
      setPartyStatus('ended');
    });
  };

  const handleReset = () => {
    openConfirmModal('確定要清除所有資料並開始新的一局嗎？', () => {
      setPartyStatus('idle');
      setStartTime(null);
      setEndTime(null);
      setRecords([]);
      setIsExpertMode(false);
      localStorage.removeItem('party_tracker_data');
    });
  };

  const checkHealthRules = (newDrinkIcon, newPortion) => {
    if (isExpertMode) return null;
    const now = new Date();
    const hasUsedBeer = records.some(r => r.icon === '🍺');
    const hasUsedWater = records.some(r => r.icon === '💦');

    if (newDrinkIcon === '🍺' && !hasUsedBeer) return '請留意🍺不得與💦混用';
    if (newDrinkIcon === '💦' && !hasUsedWater) return '請留意🍺不得與💦混用';

    const lastRecord = records.length > 0 ? records[0] : null;

    if (newDrinkIcon === '🍷') {
      const lastWineRecord = records.find(r => r.icon === '🍷');
      if (lastWineRecord) {
         const lastWineTime = new Date(lastWineRecord.timestamp);
         const diffMinutes = (now - lastWineTime) / (1000 * 60);
         if (diffMinutes < 30) return '請留意距離上次使用並未超過30分鐘';
      }
    }

    if (lastRecord) {
      const lastTime = new Date(lastRecord.timestamp);
      const diffHours = (now - lastTime) / (1000 * 60 * 60);
      if (diffHours <= 4) {
        if ((newDrinkIcon === '🍺' && lastRecord.icon === '💦') || (newDrinkIcon === '💦' && lastRecord.icon === '🍺')) return '請留意🍺不得與💦混用';
        if ((newDrinkIcon === '🍈' && lastRecord.icon === '🍺') || (newDrinkIcon === '🍺' && lastRecord.icon === '🍈')) return '請留意過量的🍈與🍺容易造成斷片';
      }
    }

    if (newDrinkIcon === '💦' && hasUsedWater) {
      const recentWaterRecords = records.filter(r => {
        if (r.icon !== '💦') return false;
        const rTime = new Date(r.timestamp);
        const diffHours = (now - rTime) / (1000 * 60 * 60);
        return diffHours <= 1;
      });
      const currentSum = recentWaterRecords.reduce((sum, r) => sum + r.portion, 0);
      if (currentSum + newPortion >= 1) return '請留意💦至少間隔超過1小時';
    }
    return null;
  };

  const handleAddRecordClick = (drinkIcon, portion) => {
    const warningMsg = checkHealthRules(drinkIcon, portion);
    const proceedToConfirm = () => {
      openConfirmModal(`確定要記錄 ${drinkIcon} ${portion} 份嗎？`, () => {
        addRecord(drinkIcon, portion);
      });
    };
    if (warningMsg) openWarningModal(warningMsg, proceedToConfirm);
    else proceedToConfirm();
  };

  const addRecord = (drinkIcon, portion) => {
    const newRecord = {
      id: Date.now(),
      icon: drinkIcon,
      portion: portion,
      totalAmount: portion,
      timestamp: new Date().toISOString(),
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const deleteRecord = (id) => {
    openConfirmModal('確定要刪除這筆紀錄嗎？', () => {
        setRecords(prev => prev.filter(r => r.id !== id));
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  };

  const getSummary = () => {
    const summary = {};
    DRINK_CONFIG.forEach(d => summary[d.icon] = 0);
    records.forEach(r => {
      if (summary[r.icon] !== undefined) summary[r.icon] += r.totalAmount;
    });
    return summary;
  };
  const summaryData = getSummary();
  const isIdle = partyStatus === 'idle';

  // ---------------- UI Components ----------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col relative">
      
      {/* Header */}
      <header className={`bg-slate-900/80 backdrop-blur-md p-4 z-20 flex flex-col border-b border-slate-800 transition-all duration-500 ${isIdle ? 'border-transparent bg-transparent' : ''}`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             {/* 小 Logo：改用內嵌 SVG 元件 */}
             {!isIdle && (
               <div className="animate-fade-in-right">
                  <AppIcon size={32} className="drop-shadow-md" />
               </div>
             )}
             <h1 className={`text-lg font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-2 ${isIdle ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
               派對飲酒記錄
             </h1>
          </div>
          
          {partyStatus !== 'idle' && (
            <button
              onClick={toggleMode}
              className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer group ${
                isExpertMode 
                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isExpertMode ? <Zap size={10} /> : <ShieldCheck size={10} />}
              {isExpertMode ? '專家' : '安全'}
            </button>
          )}
        </div>
        
        {partyStatus !== 'idle' && (
          <div className="text-xs text-slate-400 mt-2 flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
            <span className="font-mono flex items-center gap-1"><Clock size={10}/> 開始: {formatTime(startTime)}</span>
            {endTime && <span className="font-mono">結束: {formatTime(endTime)}</span>}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto ${isIdle ? 'flex flex-col justify-center items-center p-8' : 'p-4 space-y-6 pb-24'}`}>
        
        {/* === IDLE STATE (置中、大 Logo) === */}
        {partyStatus === 'idle' && (
          <div className="w-full flex flex-col items-center animate-fade-in-up">
            
            {/* 大 Logo 區域 */}
            <div className="relative mb-8 group">
              {/* 背景光暈 */}
              <div className="absolute inset-0 bg-violet-600/30 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
              {/* Logo 本體：改用內嵌 SVG 元件 */}
              <div className="relative z-10 transition-transform duration-700 hover:scale-105 hover:rotate-3">
                 <AppIcon size={160} className="drop-shadow-2xl" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 text-center bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              Party Tracker
            </h1>
            <p className="text-slate-400 text-sm mb-10 text-center max-w-[200px] leading-relaxed">
              記錄每一杯歡樂<br/>守護每一次安全
            </p>
            
            <div className="w-full space-y-4 max-w-xs">
              {/* 一般(安全)模式開始 */}
              <button 
                onClick={handleStartSafeParty}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl text-white font-bold text-lg shadow-xl shadow-violet-900/20 hover:shadow-violet-900/40 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play size={24} fill="currentColor" />
                開始派對
              </button>

              {/* 專家模式開始 */}
              <button 
                onClick={handleStartExpertParty}
                className="w-full py-3 bg-transparent text-slate-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={14} />
                專家模式 (無警示)
              </button>
            </div>
          </div>
        )}

        {/* === ACTIVE STATE (活躍狀態) === */}
        {partyStatus === 'active' && (
          <>
            {/* Timer Card */}
            <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
               <div className="text-slate-400 text-xs tracking-widest uppercase mb-2">Duration</div>
               <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-wider text-shadow-glow">
                 {elapsedTime}
               </div>
               <button 
                 onClick={handleEndParty}
                 className="mt-6 px-6 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-full text-sm font-medium hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all flex items-center gap-2 mx-auto"
               >
                 <Square size={14} fill="currentColor" /> 結束
               </button>
            </div>

            {/* Drink Controls */}
            <div className="grid grid-cols-1 gap-3 animate-fade-in-up">
              {DRINK_CONFIG.map((drink) => {
                const timeSince = getTimeSinceLastDrink(drink.icon);
                return (
                  <div key={drink.id} className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl filter drop-shadow-lg">{drink.icon}</div>
                      {timeSince && (
                        <div className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {timeSince}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {drink.portions.map((portion) => (
                        <button
                          key={portion}
                          onClick={() => handleAddRecordClick(drink.icon, portion)}
                          className={`
                            relative group overflow-hidden px-5 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 border-b-4
                            ${drink.id === 'wine' ? 'bg-rose-900/30 border-rose-800 text-rose-200 hover:bg-rose-900/50' : ''}
                            ${drink.id === 'sake' ? 'bg-slate-200/10 border-slate-500 text-slate-200 hover:bg-slate-200/20' : ''}
                            ${drink.id === 'water' ? 'bg-cyan-900/30 border-cyan-800 text-cyan-200 hover:bg-cyan-900/50' : ''}
                            ${drink.id === 'melon' ? 'bg-green-900/30 border-green-800 text-green-200 hover:bg-green-900/50' : ''}
                            ${drink.id === 'beer' ? 'bg-amber-500/10 border-amber-600 text-amber-200 hover:bg-amber-500/20' : ''}
                          `}
                        >
                          {portion}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* History List */}
            {records.length > 0 && (
              <div className="pt-2 pb-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs px-2 mb-2 uppercase tracking-wider font-bold">
                  <History size={12} /> Recent History
                </div>
                <div className="space-y-2">
                  {records.map((record) => (
                    <div key={record.id} className="bg-slate-800/40 p-3 rounded-lg flex items-center justify-between border border-slate-700/30 animate-fade-in-right hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{record.icon}</span>
                        <div>
                           <div className="font-bold text-white">{record.portion} <span className="text-slate-500 text-xs font-normal">份</span></div>
                           <span className="text-xs text-slate-500 flex items-center gap-1 font-mono"><Clock size={10} /> {formatTime(record.timestamp)}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteRecord(record.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === ENDED STATE (結束畫面) === */}
        {partyStatus === 'ended' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
            <div className="text-6xl mb-2 animate-bounce">😴</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Party Over</h2>
              <p className="text-slate-400 text-sm font-mono">Total Time: {elapsedTime}</p>
            </div>
            
            <div className="w-full bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 grid grid-cols-5 gap-2">
              {Object.entries(summaryData).map(([icon, total]) => (
                <div key={icon} className="flex flex-col items-center p-2 rounded-lg bg-slate-800/80">
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className={`font-bold ${total > 0 ? 'text-white' : 'text-slate-600'}`}>{total}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleReset}
              className="w-full py-4 bg-slate-700 rounded-xl text-slate-200 font-bold shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <History size={18} /> 開始新的一局
            </button>
          </div>
        )}
      </main>

      {/* Footer Summary (Active Only) */}
      {partyStatus === 'active' && (
        <div className="bg-slate-900/90 backdrop-blur-xl p-4 border-t border-slate-800 z-20 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           <div className="grid grid-cols-5 gap-2 text-center">
             {Object.entries(summaryData).map(([icon, total]) => (
                <div key={icon} className="flex flex-col items-center group cursor-default">
                  <span className="text-xs opacity-40 mb-1 group-hover:opacity-100 transition-opacity transform group-hover:-translate-y-1 duration-200">{icon}</span>
                  <span className={`font-bold font-mono text-lg ${total > 0 ? 'text-white scale-110' : 'text-slate-700'} transition-all`}>
                    {total}
                  </span>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 px-8">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className={`bg-slate-900 border rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100 overflow-hidden relative z-10 ${modalConfig.type === 'warning' ? 'border-red-500/30' : 'border-slate-700'}`}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`mb-4 p-3 rounded-full ${modalConfig.type === 'warning' ? 'bg-red-500/10 text-red-500' : 'bg-violet-500/10 text-violet-400'}`}>
                {modalConfig.type === 'warning' ? <AlertTriangle size={32} /> : <AlertCircle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{modalConfig.type === 'warning' ? '健康警示' : '確認操作'}</h3>
              <p className="text-slate-300 leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-800 divide-x divide-slate-800">
              <button onClick={modalConfig.type === 'warning' ? modalConfig.onConfirm : closeModal} className={`py-4 font-bold transition-colors ${modalConfig.type === 'warning' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 col-span-2' : 'text-slate-400 hover:bg-slate-800'}`}>
                {modalConfig.type === 'warning' ? '我了解了' : '取消'}
              </button>
              {modalConfig.type !== 'warning' && (
                <button onClick={modalConfig.onConfirm} className="py-4 font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                  確定
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .text-shadow-glow { text-shadow: 0 0 20px rgba(167, 139, 250, 0.5); }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in-right { animation: fadeInRight 0.3s ease-out forwards; }
        .safe-area-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};

export default PartyDrinkTracker;