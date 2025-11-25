import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import { Gamepad2, ArrowLeft, ArrowRight, ArrowUp, Crosshair, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [gameId, setGameId] = useState(0);

  const handleRestart = () => {
    setGameId(prev => prev + 1);
  };

  return (
    <div className="w-screen h-screen bg-neutral-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-neutral-800 border-b border-neutral-700 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-2 text-yellow-500">
          <Gamepad2 size={20} />
          <span className="font-bold text-sm tracking-wider">RETRO-ARCADE</span>
        </div>
        <div className="text-[10px] text-neutral-500 font-mono">
          V1.3 // RE-ARMED
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex overflow-hidden">
         {/* Left Control Panel */}
         <aside className="w-64 bg-neutral-800 border-r border-neutral-700 p-6 flex flex-col gap-8 shadow-xl z-10 overflow-y-auto">
            
            {/* System Controls */}
            <div>
              <button 
                onClick={handleRestart}
                className="w-full bg-red-800 hover:bg-red-700 text-white font-mono text-xs font-bold py-3 px-4 rounded border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                RESTART MISSION
              </button>
            </div>

            {/* Controls Section */}
            <div>
              <h2 className="text-yellow-500 font-bold font-mono text-xs mb-4 uppercase tracking-widest border-b border-neutral-700 pb-2">
                Operations
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                     <span className="w-8 h-8 rounded bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-950 font-mono text-white text-xs"><ArrowLeft size={14}/></span>
                     <span className="w-8 h-8 rounded bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-950 font-mono text-white text-xs"><ArrowRight size={14}/></span>
                  </div>
                  <span className="text-neutral-400 text-xs font-mono">MOVE</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="w-24 h-8 rounded bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-950 font-mono text-white text-xs gap-1">
                    SPACE / <ArrowUp size={14}/>
                  </span>
                  <span className="text-neutral-400 text-xs font-mono">JUMP</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-red-900/50 flex items-center justify-center border-b-2 border-red-950 font-mono text-red-400 text-xs font-bold">Z</span>
                  <span className="text-neutral-400 text-xs font-mono">SHOOT</span>
                </div>
              </div>
            </div>

            {/* Objectives Section */}
            <div>
               <h2 className="text-blue-400 font-bold font-mono text-xs mb-4 uppercase tracking-widest border-b border-neutral-700 pb-2">
                Mission Intel
              </h2>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                   <Crosshair size={16} className="text-red-500 mt-1 shrink-0" />
                   <p className="text-neutral-400 text-xs font-mono leading-relaxed">
                     Score <span className="text-yellow-400">100,000</span> to summon the Warlord.
                   </p>
                </div>
                <div className="flex gap-3 items-start">
                   <BookOpen size={16} className="text-blue-500 mt-1 shrink-0" />
                   <p className="text-neutral-400 text-xs font-mono leading-relaxed">
                     <span className="text-blue-400">Language Check:</span> Every 10 kills. Answer correctly or face reinforcements.
                   </p>
                </div>
                 <div className="flex gap-3 items-start">
                   <AlertTriangle size={16} className="text-yellow-600 mt-1 shrink-0" />
                   <p className="text-neutral-400 text-xs font-mono leading-relaxed">
                     Look for <span className="text-white bg-red-600 px-1 rounded text-[10px]">+</span> Medkits in crates.
                   </p>
                </div>
              </div>
            </div>

         </aside>

         {/* Canvas Container */}
         <div className="flex-1 bg-neutral-900 flex items-center justify-center p-4 relative">
             <GameEngine key={gameId} />
         </div>
      </main>
    </div>
  );
};

export default App;