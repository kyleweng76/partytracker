import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Trash2, History, Clock, AlertTriangle, AlertCircle, Info, Zap, ShieldCheck } from 'lucide-react';

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

  // 取得距離上一次喝該種飲料的時間
  const getTimeSinceLastDrink = (drinkIcon) => {
    // 找出該種類最新的紀錄
    const lastRecord = records.find(r => r.icon === drinkIcon);
    if (!lastRecord) return null;

    const now = new Date();
    const lastTime = new Date(lastRecord.timestamp);
    const diffMs = now - lastTime;
    
    // 防呆
    if (diffMs < 0) return '剛剛';

    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '剛剛';
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}小時${mins}分鐘`;
    }
    return `${mins}分鐘`;
  };

  // ---------------- Handlers & Logic ----------------

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

  // 切換模式邏輯
  const toggleMode = () => {
    if (isExpertMode) {
      // 專家 -> 安全
      openConfirmModal('確定要切換回「安全模式」嗎？所有的健康警示將會重新啟用。', () => {
        setIsExpertMode(false);
      });
    } else {
      // 安全 -> 專家
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

  // ★★★ 核心邏輯：檢查交互作用與限制 ★★★
  const checkHealthRules = (newDrinkIcon, newPortion) => {
    if (isExpertMode) return null;

    const now = new Date();
    
    // 1. 首次使用 🍺 或 💦 的教育警示
    const hasUsedBeer = records.some(r => r.icon === '🍺');
    const hasUsedWater = records.some(r => r.icon === '💦');

    if (newDrinkIcon === '🍺' && !hasUsedBeer) {
      return '請留意🍺不得與💦混用';
    }
    if (newDrinkIcon === '💦' && !hasUsedWater) {
      return '請留意🍺不得與💦混用';
    }

    const lastRecord = records.length > 0 ? records[0] : null;

    // 2. 🍷 紅酒頻率檢查 (間隔 < 30分鐘)
    if (newDrinkIcon === '🍷') {
      const lastWineRecord = records.find(r => r.icon === '🍷');
      if (lastWineRecord) {
         const lastWineTime = new Date(lastWineRecord.timestamp);
         const diffMinutes = (now - lastWineTime) / (1000 * 60);
         if (diffMinutes < 30) {
            return '請留意距離上次使用並未超過30分鐘';
         }
      }
    }

    // 3. 交互作用檢查 (與上一杯的間隔時間 4小時內)
    if (lastRecord) {
      const lastTime = new Date(lastRecord.timestamp);
      const diffHours = (now - lastTime) / (1000 * 60 * 60);

      if (diffHours <= 4) {
        if (
          (newDrinkIcon === '🍺' && lastRecord.icon === '💦') ||
          (newDrinkIcon === '💦' && lastRecord.icon === '🍺')
        ) {
          return '請留意🍺不得與💦混用';
        }

        if (
          (newDrinkIcon === '🍈' && lastRecord.icon === '🍺') ||
          (newDrinkIcon === '🍺' && lastRecord.icon === '🍈')
        ) {
          return '請留意過量的🍈與🍺容易造成斷片';
        }
      }
    }

    // 4. 💦 總量/頻率檢查
    if (newDrinkIcon === '💦' && hasUsedWater) {
      const recentWaterRecords = records.filter(r => {
        if (r.icon !== '💦') return false;
        const rTime = new Date(r.timestamp);
        const diffHours = (now - rTime) / (1000 * 60 * 60);
        return diffHours <= 1;
      });
      const currentSum = recentWaterRecords.reduce((sum, r) => sum + r.portion, 0);
      if (currentSum + newPortion >= 1) {
        return '請留意💦至少間隔超過1小時';
      }
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

    if (warningMsg) {
      openWarningModal(warningMsg, proceedToConfirm);
    } else {
      proceedToConfirm();
    }
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

  // ---------------- Render Helpers ----------------

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const getSummary = () => {
    const summary = {};
    DRINK_CONFIG.forEach(d => summary[d.icon] = 0);
    records.forEach(r => {
      if (summary[r.icon] !== undefined) {
        summary[r.icon] += r.totalAmount;
      }
    });
    return summary;
  };

  const summaryData = getSummary();

  // ---------------- UI Components ----------------

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col relative">
      
      {/* Header */}
      <header className="bg-slate-800 p-4 shadow-md z-10 flex flex-col border-b border-slate-700">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-2">
            派對飲酒記錄
            {partyStatus !== 'idle' && (
              <button
                onClick={toggleMode}
                className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer group ${
                  isExpertMode 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 hover:border-red-400' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400'
                }`}
                title={isExpertMode ? "點擊切換回安全模式" : "點擊切換至專家模式"}
              >
                {isExpertMode ? <Zap size={10} fill="currentColor" /> : <ShieldCheck size={10} />}
                {isExpertMode ? '專家模式' : '安全模式'} 
                <span className="opacity-60 group-hover:opacity-100">(切換)</span>
              </button>
            )}
          </h1>
        </div>
        
        {partyStatus !== 'idle' && (
          <div className="text-xs text-slate-400 mt-2 space-y-1 bg-slate-900/30 p-2 rounded-lg">
            <div className="flex justify-between">
              <span>開始:</span>
              <span className="font-mono">{formatTime(startTime)}</span>
            </div>
            {endTime && (
              <div className="flex justify-between">
                <span>結束:</span>
                <span className="font-mono">{formatTime(endTime)}</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Status Card */}
        <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700 shadow-lg relative overflow-hidden">
          {partyStatus === 'idle' && (
            <div className="space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-slate-400">準備好開始狂歡了嗎？</p>
              
              {/* 一般(安全)模式開始 */}
              <button 
                onClick={handleStartSafeParty}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={24} fill="currentColor" />
                派對開始 (安全模式)
              </button>

              {/* 專家模式開始 */}
              <button 
                onClick={handleStartExpertParty}
                className="w-full py-3 bg-slate-900/50 border border-red-900/50 text-red-400/80 rounded-xl font-medium text-sm hover:bg-red-900/20 hover:text-red-300 hover:border-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                <Zap size={16} />
                專家模式 (無警示)
              </button>
            </div>
          )}

          {partyStatus === 'active' && (
            <div className="space-y-4">
              <div className="text-slate-400 text-sm tracking-widest uppercase flex justify-center items-center gap-2">
                 Party Duration
              </div>
              <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-wider text-shadow-glow">
                {elapsedTime}
              </div>
              <button 
                onClick={handleEndParty}
                className="mt-4 px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-sm font-medium hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                <Square size={16} fill="currentColor" />
                結束派對
              </button>
            </div>
          )}

          {partyStatus === 'ended' && (
            <div className="space-y-4">
              <div className="text-4xl mb-2">😴</div>
              <h2 className="text-2xl font-bold text-white">派對結束</h2>
              <div className="text-slate-400 text-sm">總時長: {elapsedTime}</div>
              
              <div className="grid grid-cols-5 gap-2 mt-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                {Object.entries(summaryData).map(([icon, total]) => (
                  <div key={icon} className="flex flex-col items-center">
                    <span className="text-xl mb-1">{icon}</span>
                    <span className="font-bold text-lg">{total}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleReset}
                className="w-full py-3 bg-slate-700 rounded-xl text-slate-300 font-bold shadow-lg hover:bg-slate-600 transition-colors mt-4"
              >
                開始新的一局
              </button>
            </div>
          )}
        </div>

        {/* Drink Controls - Only visible when active */}
        {partyStatus === 'active' && (
          <div className="space-y-4 animate-fade-in-up">
            
            {/* Drink Grid */}
            <div className="grid grid-cols-1 gap-3">
              {DRINK_CONFIG.map((drink) => {
                const timeSince = getTimeSinceLastDrink(drink.icon);
                return (
                  <div key={drink.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between shadow-sm">
                    {/* Left side: Icon + Time Since */}
                    <div className="flex items-center gap-2">
                      <div className="text-4xl w-14 flex justify-center filter drop-shadow-md">
                        {drink.icon}
                      </div>
                      {timeSince && (
                        <div className="text-sm font-bold text-emerald-400 font-mono bg-emerald-400/10 px-2 py-1 rounded-md whitespace-nowrap">
                          {timeSince}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-1 justify-end">
                      {drink.portions.map((portion) => (
                        <button
                          key={portion}
                          onClick={() => handleAddRecordClick(drink.icon, portion)}
                          className={`
                            relative group overflow-hidden
                            px-4 py-3 min-w-[80px] rounded-lg font-bold text-lg transition-all
                            active:scale-95 border-b-4
                            ${drink.id === 'wine' ? 'bg-red-900/40 border-red-900 text-red-200 hover:bg-red-900/60' : ''}
                            ${drink.id === 'sake' ? 'bg-slate-200/20 border-slate-500 text-slate-100 hover:bg-slate-200/30' : ''}
                            ${drink.id === 'water' ? 'bg-blue-900/40 border-blue-900 text-blue-200 hover:bg-blue-900/60' : ''}
                            ${drink.id === 'melon' ? 'bg-green-900/40 border-green-900 text-green-200 hover:bg-green-900/60' : ''}
                            ${drink.id === 'beer' ? 'bg-amber-500/20 border-amber-600 text-amber-200 hover:bg-amber-500/30' : ''}
                          `}
                        >
                          {portion} <span className="text-xs opacity-60">份</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History List */}
        {records.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm px-1">
              <History size={14} />
              <span>紀錄 ({records.length})</span>
            </div>
            
            <div className="space-y-2">
              {records.map((record, index) => {
                return (
                  <div key={record.id} className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between border border-slate-700/50 animate-fade-in-right">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl relative">
                        {record.icon}
                      </span>
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white text-lg">
                                {record.portion} <span className="text-slate-400 text-xs font-normal">份</span>
                            </span>
                         </div>

                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Clock size={10} /> {formatTime(record.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {partyStatus === 'active' && (
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Summary Footer */}
      {partyStatus === 'active' && (
        <div className="bg-slate-800/90 backdrop-blur-md p-3 border-t border-slate-700 z-10 safe-area-bottom">
           <div className="grid grid-cols-5 gap-1 text-center">
             {Object.entries(summaryData).map(([icon, total]) => (
                <div key={icon} className="flex flex-col">
                  <span className="text-xs opacity-50 mb-0.5">{icon}</span>
                  <span className={`font-bold font-mono ${total > 0 ? 'text-white' : 'text-slate-600'}`}>
                    {total}
                  </span>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* UNIFIED MODAL (Handles both Confirm and Warning) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={closeModal} 
          />
          <div className={`
             bg-slate-800 border rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100 overflow-hidden relative z-10
             ${modalConfig.type === 'warning' ? 'border-red-500/50' : 'border-slate-600'}
          `}>
            <div className="p-6">
              <div className={`flex items-center justify-center mb-4 ${modalConfig.type === 'warning' ? 'text-red-500' : 'text-amber-400'}`}>
                {modalConfig.type === 'warning' ? <AlertTriangle size={48} /> : <AlertCircle size={48} />}
              </div>
              <h3 className={`text-xl font-bold text-center mb-2 ${modalConfig.type === 'warning' ? 'text-red-400' : 'text-white'}`}>
                {modalConfig.type === 'warning' ? '健康警示' : '請確認'}
              </h3>
              <p className="text-slate-300 text-center text-lg leading-relaxed">
                {modalConfig.message}
              </p>
            </div>
            
            <div className="flex border-t border-slate-700">
              {/* BUTTON RENDERING LOGIC */}
              {modalConfig.type === 'warning' ? (
                // WARNING TYPE: Left=Confirm(I understand), Right=Cancel
                <>
                  <button 
                    onClick={modalConfig.onConfirm}
                    className="flex-1 py-4 text-white font-bold bg-red-600 hover:bg-red-700 transition-opacity"
                  >
                    我了解了
                  </button>
                  <div className="w-[1px] bg-slate-700"></div>
                  <button 
                    onClick={closeModal}
                    className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-700/50 transition-colors"
                  >
                    取消
                  </button>
                </>
              ) : (
                // CONFIRM TYPE: Left=Cancel, Right=Confirm
                <>
                  <button 
                    onClick={closeModal}
                    className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-700/50 transition-colors"
                  >
                    取消
                  </button>
                  <div className="w-[1px] bg-slate-700"></div>
                  <button 
                    onClick={modalConfig.onConfirm}
                    className="flex-1 py-4 text-white font-bold bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-90 transition-opacity"
                  >
                    確定
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.3s ease-out forwards;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
};

export default PartyDrinkTracker;