import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Square, Trash2, History, Clock, 
  AlertTriangle, AlertCircle, Zap, ShieldCheck, 
  Settings, X, ArrowUp, ArrowDown, LayoutList, PlusCircle, RotateCcw 
} from 'lucide-react';

// --- 內嵌 SVG Logo 元件 ---
const AppIcon = ({ size = 40, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ overflow: 'visible' }}
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
    <rect x="0" y="0" width="512" height="512" rx="115" fill="url(#bgGradient)" />
    <path d="M0 115C0 51.4873 51.4873 0 115 0H397C460.513 0 512 51.4873 512 115V256L0 120V115Z" fill="white" fillOpacity="0.1" />
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

// --- 靜態基礎資料定義 ---
const STATIC_DRINK_KV = {
  wine: { id: 'wine', name: '紅酒', icon: '🍷', portions: [0.5, 1] },
  water: { id: 'water', name: '水', icon: '💦', portions: [0.5, 1] },
  melon: { id: 'melon', name: '哈密瓜', icon: '🍈', portions: [0.5, 1] },
  sake: { id: 'sake', name: '白酒', icon: '🍶', portions: [1] },
  beer: { id: 'beer', name: '啤酒', icon: '🍺', portions: [1] },
  whiskey: { id: 'whiskey', name: '烈酒', icon: '🥃', portions: [1] },
};

// 預設的版面配置
const DEFAULT_LAYOUT = [
  {
    id: 'block_classic',
    title: '派對區',
    drinks: ['wine', 'water', 'melon', 'sake']
  },
  {
    id: 'block_party',
    title: '經典區',
    drinks: ['beer', 'whiskey']
  },
  {
    id: 'block_custom',
    title: '自定義',
    drinks: []
  }
];

// 提供給用戶選擇的 Emoji 列表
const EMOJI_OPTIONS = ['🥂', '🍹', '🍸', '🧉', '🍾', '🥤', '🧋', '🥛', '☕', '🍵', '🧃', '🥥', '🌳', '🌹'];

const PartyDrinkTracker = () => {
  // ---------------- State Management ----------------
  const [partyStatus, setPartyStatus] = useState('idle');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [records, setRecords] = useState([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Settings & Data State
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [requireAddConfirm, setRequireAddConfirm] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Layout & Custom Drinks
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [customDrinks, setCustomDrinks] = useState({});

  // Add Custom Drink Modal State
  const [isAddDrinkModalOpen, setIsAddDrinkModalOpen] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkIcon, setNewDrinkIcon] = useState(EMOJI_OPTIONS[0]);

  // Unified Drinks Data (Static + Custom)
  const allDrinks = useMemo(() => ({ ...STATIC_DRINK_KV, ...customDrinks }), [customDrinks]);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm', 
    message: '',
    onConfirm: () => {},
  });

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
      setRequireAddConfirm(parsed.requireAddConfirm !== undefined ? parsed.requireAddConfirm : true);
      
      if (parsed.layout) setLayout(parsed.layout);
      if (parsed.customDrinks) setCustomDrinks(parsed.customDrinks);
    }
  }, []);

  useEffect(() => {
    const dataToSave = { 
      partyStatus, startTime, endTime, records, 
      isExpertMode, requireAddConfirm, layout, customDrinks 
    };
    localStorage.setItem('party_tracker_data', JSON.stringify(dataToSave));
  }, [partyStatus, startTime, endTime, records, isExpertMode, requireAddConfirm, layout, customDrinks]);

  // ---------------- Helpers ----------------

  const openConfirmModal = (message, action) => {
    setModalConfig({ isOpen: true, type: 'confirm', message, onConfirm: () => { action(); setModalConfig(prev => ({ ...prev, isOpen: false })); }});
  };

  const openWarningModal = (message, nextAction) => {
    setModalConfig({ isOpen: true, type: 'warning', message, onConfirm: () => { setModalConfig(prev => ({ ...prev, isOpen: false })); if (nextAction) setTimeout(nextAction, 100); }});
  };

  const closeModal = () => { setModalConfig(prev => ({ ...prev, isOpen: false })); };

  const getTimeSinceLastDrink = (drinkIcon) => {
    const lastRecord = records.find(r => r.icon === drinkIcon);
    if (!lastRecord) return null;

    const now = new Date();
    const lastTime = new Date(lastRecord.timestamp);
    const diffMs = now - lastTime;
    
    if (diffMs < 0) return '剛剛';
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins}分鐘`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}小時${mins}分鐘`;
  };

  // ---------------- Custom Drink & Layout Logic ----------------

  const handleCreateDrink = () => {
    if (!newDrinkName.trim()) {
      alert('請輸入飲品名稱');
      return;
    }

    const newId = `custom_${Date.now()}`;
    const newDrink = {
      id: newId,
      name: newDrinkName,
      icon: newDrinkIcon,
      portions: [1],
      isCustom: true
    };

    setCustomDrinks(prev => ({ ...prev, [newId]: newDrink }));

    setLayout(prev => {
      const newLayout = [...prev];
      let customBlockIndex = newLayout.findIndex(b => b.id === 'block_custom');
      
      if (customBlockIndex === -1) {
        newLayout.push({ id: 'block_custom', title: '自定義', drinks: [newId] });
      } else {
        const updatedBlock = { ...newLayout[customBlockIndex] };
        updatedBlock.drinks = [...updatedBlock.drinks, newId];
        newLayout[customBlockIndex] = updatedBlock;
      }
      return newLayout;
    });

    setNewDrinkName('');
    setIsAddDrinkModalOpen(false);
  };

  const handleResetLayout = () => {
    openConfirmModal('確定要恢復預設值嗎？這將會移除所有自定義飲品並恢復原本預設的排序位置。', () => {
      setLayout(DEFAULT_LAYOUT);
      setCustomDrinks({});
    });
  };
  
  const moveSection = (index, direction) => {
    const newLayout = [...layout];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setLayout(newLayout);
  };

  const moveDrink = (sectionIndex, drinkIndex, direction) => {
    const newLayout = [...layout];
    const section = { ...newLayout[sectionIndex] };
    const drinks = [...section.drinks];
    const targetIndex = drinkIndex + direction;
    if (targetIndex < 0 || targetIndex >= drinks.length) return;
    [drinks[drinkIndex], drinks[targetIndex]] = [drinks[targetIndex], drinks[drinkIndex]];
    section.drinks = drinks;
    newLayout[sectionIndex] = section;
    setLayout(newLayout);
  };

  // ---------------- Main Logic ----------------
  
  const startPartyLogic = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setPartyStatus('active');
    setEndTime(null);
    setRecords([]);
    setElapsedTime('00:00:00');
    setIsSettingsOpen(false);
  };

  const handleStartSafeParty = () => { setIsExpertMode(false); startPartyLogic(); };
  const handleStartExpertParty = () => { openWarningModal('請理解在此模式下不會跳出任何警示視窗，請自行留意安全。', () => { setIsExpertMode(true); startPartyLogic(); }); };

  const toggleMode = () => {
    if (isExpertMode) {
      openConfirmModal('確定要關閉 TURBO 模式嗎？將會恢復所有安全與健康警示。', () => {
        setIsExpertMode(false);
      });
    } else {
      openWarningModal('開啟 TURBO 模式：請理解在此模式下不會跳出任何警示視窗，請自行留意安全。', () => {
        setIsExpertMode(true);
      });
    }
  };

  const handleEndParty = () => { 
    openConfirmModal('確定要結束這場派對嗎？', () => { 
      setEndTime(new Date().toISOString()); 
      setPartyStatus('ended'); 
      setIsSettingsOpen(false);
    }); 
  };

  const handleClearHistory = () => {
    openConfirmModal('確定要清空所有飲酒紀錄嗎？派對計時器將會繼續執行，且不會清除自定義飲品內容。', () => {
      setRecords([]);
      setIsSettingsOpen(false);
    });
  };

  const handleReset = () => {
    openConfirmModal('確定要清除所有資料並開始新的一局嗎？', () => {
      setPartyStatus('idle'); setStartTime(null); setEndTime(null); setRecords([]); setIsExpertMode(false); localStorage.removeItem('party_tracker_data');
      setLayout(DEFAULT_LAYOUT); 
      setCustomDrinks({}); 
    });
  };

  const checkHealthRules = (newDrinkIcon, newPortion) => {
    if (isExpertMode) return null;
    const now = new Date();

    // 1. 水與酒混用檢查 (Session-wide, 無時間限制)
    const hasBeer = records.some(r => r.icon === '🍺');
    const hasWhiskey = records.some(r => r.icon === '🥃');
    const hasWater = records.some(r => r.icon === '💦');

    // 如果要喝水，檢查是否喝過酒 (啤酒或烈酒)
    if (newDrinkIcon === '💦' && (hasBeer || hasWhiskey)) {
        return '危險！💦不可與🍺或🥃混用！';
    }

    // 如果要喝啤酒或烈酒，檢查是否喝過水
    if ((newDrinkIcon === '🍺' || newDrinkIcon === '🥃') && hasWater) {
        return '危險！💦不可與🍺或🥃混用！';
    }

    const lastRecord = records.length > 0 ? records[0] : null;

    // 2. 紅酒頻率檢查 (間隔 < 30分鐘)
    if (newDrinkIcon === '🍷') {
      const lastWineRecord = records.find(r => r.icon === '🍷');
      if (lastWineRecord) {
         const lastWineTime = new Date(lastWineRecord.timestamp);
         const diffMinutes = (now - lastWineTime) / (1000 * 60);
         if (diffMinutes < 30) return '請留意距離上次使用並未超過30分鐘';
      }
    }

    // 3. 哈密瓜交互作用 (保留4小時限制，因為這是特定的化學反應)
    if (lastRecord) {
      const lastTime = new Date(lastRecord.timestamp);
      const diffHours = (now - lastTime) / (1000 * 60 * 60);
      if (diffHours <= 4) {
        if ((newDrinkIcon === '🍈' && lastRecord.icon === '🍺') || (newDrinkIcon === '🍺' && lastRecord.icon === '🍈')) return '請留意過量的🍈與🍺容易造成斷片';
      }
    }

    // 4. 水頻率檢查
    if (newDrinkIcon === '💦' && hasWater) {
      const recentWaterRecords = records.filter(r => {
        if (r.icon !== '💦') return false;
        const rTime = new Date(r.timestamp);
        const diffHours = (now - rTime) / (1000 * 60 * 60);
        return diffHours <= 1;
      });
      const currentSum = recentWaterRecords.reduce((sum, r) => sum + r.portion, 0);
      if (currentSum + newPortion >= 1) return '危險！請留意💦至少必須間隔超過1小時';
    }
    return null;
  };

  const handleAddRecordClick = (drinkIcon, portion) => {
    const warningMsg = checkHealthRules(drinkIcon, portion);
    const doAdd = () => addRecord(drinkIcon, portion);

    if (warningMsg) {
      openWarningModal(warningMsg, doAdd);
      return;
    }

    if (requireAddConfirm) {
      openConfirmModal(`確定要記錄 ${drinkIcon} ${portion} 份嗎？`, doAdd);
    } else {
      doAdd();
    }
  };

  const addRecord = (drinkIcon, portion) => {
    const newRecord = { id: Date.now(), icon: drinkIcon, portion: portion, totalAmount: portion, timestamp: new Date().toISOString() };
    setRecords(prev => [newRecord, ...prev]);
  };

  const deleteRecord = (id) => { openConfirmModal('確定要刪除這筆紀錄嗎？', () => setRecords(prev => prev.filter(r => r.id !== id))); };

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
    Object.values(allDrinks).forEach(d => summary[d.icon] = 0);
    records.forEach(r => { 
      if (summary[r.icon] === undefined) summary[r.icon] = 0;
      summary[r.icon] += r.totalAmount; 
    });
    return summary;
  };
  const summaryData = getSummary();
  const isIdle = partyStatus === 'idle';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col relative">
      
      {/* Header */}
      <header className={`bg-slate-900/80 backdrop-blur-md p-4 z-20 flex flex-col border-b border-slate-800 transition-all duration-500 ${isIdle ? 'border-transparent bg-transparent' : ''}`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             {!isIdle && (<div className="animate-fade-in-right"><AppIcon size={32} className="drop-shadow-md" /></div>)}
             <h1 className={`text-lg font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-2 ${isIdle ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
               派對飲酒記錄
             </h1>
          </div>
          
          {/* Settings Button */}
          {partyStatus !== 'idle' && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings size={24} />
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

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${isIdle ? 'flex flex-col justify-center items-center p-8' : 'p-4 space-y-6 pb-24'}`}>
        
        {/* IDLE STATE */}
        {partyStatus === 'idle' && (
          <div className="w-full flex flex-col items-center animate-fade-in-up">
            <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-violet-600/30 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
              <div className="relative z-10 transition-transform duration-700 hover:scale-105 hover:rotate-3">
                 <AppIcon size={160} className="drop-shadow-2xl" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">Party Tracker</h1>
            <p className="text-slate-400 text-sm mb-10 text-center max-w-[200px] leading-relaxed">記錄每一杯歡樂<br/>守護每一次安全</p>
            <div className="w-full space-y-4 max-w-xs">
              <button onClick={handleStartSafeParty} className="w-full py-4 bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl text-white font-bold text-lg shadow-xl shadow-violet-900/20 hover:shadow-violet-900/40 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3">
                <Play size={24} fill="currentColor" /> 開始派對
              </button>
              <button onClick={handleStartExpertParty} className="w-full py-3 bg-transparent text-slate-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Zap size={14} /> TURBO 模式 (無警示)
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE STATE */}
        {partyStatus === 'active' && (
          <>
            {/* Status Card */}
            <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
               
               <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isExpertMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {isExpertMode ? <><Zap size={8} /> TURBO</> : <><ShieldCheck size={8} /> SAFE</>}
               </div>

               <div className="text-slate-400 text-xs tracking-widest uppercase mb-2 mt-2">Duration</div>
               <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-wider text-shadow-glow">{elapsedTime}</div>
               <button onClick={handleEndParty} className="mt-6 px-6 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-full text-sm font-medium hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all flex items-center gap-2 mx-auto">
                 <Square size={14} fill="currentColor" /> 結束
               </button>
            </div>

            {/* Drink Grid - Rendered based on LAYOUT */}
            <div className="space-y-6 mt-6 animate-fade-in-up">
              {layout.map((section, sectionIndex) => (
                section.drinks.length > 0 && (
                  <div key={section.id} className="space-y-3">
                    {section.drinks.map((drinkId) => {
                      const drink = allDrinks[drinkId];
                      if (!drink) return null;
                      
                      const timeSince = getTimeSinceLastDrink(drink.icon);
                      const drinkTotal = records.filter(r => r.icon === drink.icon).reduce((acc, curr) => acc + curr.totalAmount, 0);

                      return (
                        <div key={drink.id} className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm hover:border-slate-600 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="text-4xl filter drop-shadow-lg">{drink.icon}</div>
                            <div className="flex flex-col items-start min-w-[70px]">
                              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                 Total: <span className="text-white text-sm">{drinkTotal}</span>
                              </div>
                              {timeSince ? (
                                <div className={`font-bold font-mono text-emerald-400 leading-none ${timeSince.length > 5 ? 'text-lg' : 'text-2xl'}`}>
                                  {timeSince}
                                </div>
                              ) : (
                                <div className="text-lg font-mono text-slate-600 leading-none">--</div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {drink.portions.map((portion) => (
                              <button
                                key={portion}
                                onClick={() => handleAddRecordClick(drink.icon, portion)}
                                className={`
                                  relative group overflow-hidden px-4 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 border-b-4
                                  ${drink.id === 'wine' ? 'bg-rose-900/30 border-rose-800 text-rose-200 hover:bg-rose-900/50' : ''}
                                  ${drink.id === 'sake' ? 'bg-slate-200/10 border-slate-500 text-slate-200 hover:bg-slate-200/20' : ''}
                                  ${drink.id === 'water' ? 'bg-cyan-900/30 border-cyan-800 text-cyan-200 hover:bg-cyan-900/50' : ''}
                                  ${drink.id === 'melon' ? 'bg-green-900/30 border-green-800 text-green-200 hover:bg-green-900/50' : ''}
                                  ${drink.id === 'beer' ? 'bg-amber-500/10 border-amber-600 text-amber-200 hover:bg-amber-500/20' : ''}
                                  ${drink.id === 'whiskey' ? 'bg-orange-800/30 border-orange-700 text-orange-200 hover:bg-orange-800/50' : ''}
                                  ${drink.isCustom ? 'bg-indigo-500/20 border-indigo-600 text-indigo-200 hover:bg-indigo-500/30' : ''}
                                `}
                              >
                                {portion}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {sectionIndex < layout.length - 1 && <div className="h-2" />}
                  </div>
                )
              ))}
            </div>

            {records.length > 0 && (
              <div className="pt-2 pb-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs px-2 mb-2 uppercase tracking-wider font-bold"><History size={12} /> Recent History</div>
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

        {/* ENDED STATE */}
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
            <button onClick={handleReset} className="w-full py-4 bg-slate-700 rounded-xl text-slate-200 font-bold shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
              <History size={18} /> 開始新的一局
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsSettingsOpen(false)} />
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl relative z-10 animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20} /> 設定</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              
              <div className="space-y-4">
                {/* Double Check Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div>
                    <div className="font-bold text-white mb-1">新增前確認</div>
                    <div className="text-xs text-slate-400">點擊飲料時跳出確認視窗</div>
                  </div>
                  <button 
                    onClick={() => setRequireAddConfirm(!requireAddConfirm)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${requireAddConfirm ? 'bg-violet-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${requireAddConfirm ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Turbo Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div>
                    <div className="font-bold text-white mb-1 flex items-center gap-1">
                      TURBO 模式 {isExpertMode && <Zap size={12} className="text-red-400" />}
                    </div>
                    <div className="text-xs text-slate-400">關閉所有健康警示 (請小心)</div>
                  </div>
                  <button 
                    onClick={toggleMode}
                    className={`relative w-12 h-7 rounded-full transition-colors ${isExpertMode ? 'bg-red-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isExpertMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Clear History Button */}
                <button 
                  onClick={handleClearHistory}
                  className="w-full p-4 bg-slate-800/80 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/30 rounded-xl text-slate-300 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> 清除所有紀錄
                </button>

                {/* Add Custom Drink Button */}
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsAddDrinkModalOpen(true); }}
                  className="w-full p-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 rounded-xl text-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={18} /> 新增自定義飲品
                </button>
              </div>

              {/* 自訂排序 (Custom Layout) */}
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden mt-4">
                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutList size={16} className="text-slate-400"/>
                    <span className="font-bold text-white">自訂版面排序</span>
                  </div>
                  {/* Restore Defaults Button */}
                  <button
                    onClick={handleResetLayout}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> 恢復預設值
                  </button>
                </div>
                <div className="p-2 space-y-4">
                  {layout.map((section, sIdx) => (
                    <div key={section.id} className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/30">
                      {/* 區塊標題與移動按鈕 */}
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700/30">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">{section.title}</span>
                        <div className="flex gap-1">
                           <button onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowUp size={14}/></button>
                           <button onClick={() => moveSection(sIdx, 1)} disabled={sIdx === layout.length - 1} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowDown size={14}/></button>
                        </div>
                      </div>
                      {/* 區塊內飲料列表 */}
                      <div className="space-y-1">
                        {section.drinks.map((dId, dIdx) => {
                           const d = allDrinks[dId];
                           if (!d) return null;
                           return (
                             <div key={dId} className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded text-sm">
                                <div className="flex items-center gap-2">
                                   <span>{d.icon}</span>
                                   <span className="text-slate-300">{d.name}</span>
                                </div>
                                <div className="flex gap-1">
                                   <button onClick={() => moveDrink(sIdx, dIdx, -1)} disabled={dIdx === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 disabled:opacity-30"><ArrowUp size={12}/></button>
                                   <button onClick={() => moveDrink(sIdx, dIdx, 1)} disabled={dIdx === section.drinks.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 disabled:opacity-30"><ArrowDown size={12}/></button>
                                </div>
                             </div>
                           );
                        })}
                        {section.drinks.length === 0 && <div className="text-xs text-slate-600 text-center py-2">此區塊無飲品</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                Party Drink Tracker v1.3
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Drink Modal */}
      {isAddDrinkModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsAddDrinkModalOpen(false)} />
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 p-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">新增自定義飲品</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">飲品名稱</label>
                <input 
                  type="text" 
                  value={newDrinkName}
                  onChange={(e) => setNewDrinkName(e.target.value)}
                  placeholder="例如: 龍舌蘭"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">選擇圖示</label>
                <div className="grid grid-cols-7 gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewDrinkIcon(emoji)}
                      className={`text-2xl p-1 rounded hover:bg-slate-700 ${newDrinkIcon === emoji ? 'bg-indigo-600/30 ring-2 ring-indigo-500' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-900/30 p-3 rounded-lg flex gap-2">
                <AlertCircle className="text-red-400 shrink-0" size={16} />
                <p className="text-xs text-red-300">
                  注意：自定義飲品將不會有任何健康交互作用警示。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => setIsAddDrinkModalOpen(false)}
                  className="py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateDrink}
                  className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                >
                  建立
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 px-8">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className={`bg-slate-900 border rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100 overflow-hidden relative z-10 ${modalConfig.type === 'warning' ? 'border-red-500/30' : 'border-slate-700'}`}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`mb-4 p-3 rounded-full ${modalConfig.type === 'warning' ? 'bg-red-500/10 text-red-500' : 'bg-violet-500/10 text-violet-400'}`}>
                {modalConfig.type === 'warning' ? <AlertTriangle size={32} /> : <AlertCircle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{modalConfig.type === 'warning' ? '健康警示' : '確認操作'}</h3>
              <p className="text-slate-300 leading-relaxed">{modalConfig.message}</p>
            </div>
            
            <div className="grid grid-cols-2 border-t border-slate-800 divide-x divide-slate-800">
              <button 
                onClick={closeModal} 
                className="py-4 font-bold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={modalConfig.onConfirm} 
                className={`py-4 font-bold text-white transition-colors ${modalConfig.type === 'warning' ? 'bg-red-600 hover:bg-red-500' : 'bg-violet-600 hover:bg-violet-500'}`}
              >
                {modalConfig.type === 'warning' ? '我了解了' : '確定'}
              </button>
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