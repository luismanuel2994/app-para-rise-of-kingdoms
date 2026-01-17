
import React, { useState, useRef, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Language } from './types';
import { TRANSLATIONS } from './constants';
import { chatWithGemini } from './services/geminiService';

// Diccionario de imágenes utilizando la Wiki de Fandom (URLs estables con fallback)
const COMMANDER_IMAGES: Record<string, string> = {
  "sun tzu": "https://static.wikia.nocookie.net/riseofkingdoms/images/0/03/Sun_Tzu.png",
  "minamoto": "https://static.wikia.nocookie.net/riseofkingdoms/images/d/df/Minamoto_no_Yoshitsune.png",
  "cao cao": "https://static.wikia.nocookie.net/riseofkingdoms/images/4/4e/Cao_Cao.png",
  "ysg": "https://static.wikia.nocookie.net/riseofkingdoms/images/4/4a/Yi_Seong-Gye.png",
  "yi seong-gye": "https://static.wikia.nocookie.net/riseofkingdoms/images/4/4a/Yi_Seong-Gye.png",
  "richard": "https://static.wikia.nocookie.net/riseofkingdoms/images/2/22/Richard_I.png",
  "aethelflaed": "https://static.wikia.nocookie.net/riseofkingdoms/images/1/1a/%C3%86thelfl%C3%A6d.png",
  "alexander": "https://static.wikia.nocookie.net/riseofkingdoms/images/e/e0/Alexander_the_Great.png",
  "guan yu": "https://static.wikia.nocookie.net/riseofkingdoms/images/6/62/Guan_Yu.png",
  "nevsky": "https://static.wikia.nocookie.net/riseofkingdoms/images/b/b3/Alexander_Nevsky.png",
  "scipio": "https://static.wikia.nocookie.net/riseofkingdoms/images/c/c5/Scipio_Africanus.png",
  "boudica": "https://static.wikia.nocookie.net/riseofkingdoms/images/4/4c/Boudica.png",
  "joan of arc": "https://static.wikia.nocookie.net/riseofkingdoms/images/2/2e/Joan_of_Arc.png",
  "cleopatra": "https://static.wikia.nocookie.net/riseofkingdoms/images/b/ba/Cleopatra_VII.png",
  "julio cesar": "https://static.wikia.nocookie.net/riseofkingdoms/images/5/52/Julius_Caesar.png",
  "charles martel": "https://static.wikia.nocookie.net/riseofkingdoms/images/7/77/Charles_Martel.png",
  "cid": "https://static.wikia.nocookie.net/riseofkingdoms/images/a/a0/El_Cid.png",
  "frederic": "https://static.wikia.nocookie.net/riseofkingdoms/images/a/a2/Frederick_I.png"
};

const getCommanderAvatar = (name: string) => {
  const normalized = name.toLowerCase().trim();
  const matchKey = Object.keys(COMMANDER_IMAGES).find(key => normalized.includes(key));
  return matchKey ? COMMANDER_IMAGES[matchKey] : null;
};

interface AccountData {
  power: string;
  vip: string;
  gems: string;
  civilization: string;
  unit: string;
  kvkPhase: string;
}

interface GarrisonCommander {
  id: number;
  name: string;
  level: string;
  skills: string;
}

interface UserState {
  account: AccountData;
  garrison: GarrisonCommander[];
  activeReport: string | null;
  chatHistory: { role: 'user' | 'ai', text: string }[];
}

const CommanderForm = ({ setUserState, t }: { setUserState: React.Dispatch<React.SetStateAction<UserState>>, t: any }) => {
  const [newCmd, setNewCmd] = useState({ name: '', level: '', skills: '' });

  const addCommander = () => {
    if (newCmd.name && newCmd.level) {
      setUserState(prev => ({
        ...prev,
        garrison: [...prev.garrison, { ...newCmd, id: Date.now() }]
      }));
      setNewCmd({ name: '', level: '', skills: '' });
    }
  };

  return (
    <section className="bg-white/80 dark:bg-panel-dark/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-[#232f48] shadow-2xl overflow-hidden flex flex-col h-fit">
      <div className="p-5 border-b border-slate-200 dark:border-[#232f48] bg-slate-50/50 dark:bg-[#1a2436]/50 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base font-bold">military_tech</span>
        <span className="font-bold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">Registro de Oficiales</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Comandante (Ej: Sun Tzu)" 
            value={newCmd.name} 
            onChange={e => setNewCmd({...newCmd, name: e.target.value})} 
            className="w-full bg-white dark:bg-[#0a0f18] border-slate-200 dark:border-[#232f48] rounded-xl text-sm p-4 focus:ring-2 focus:ring-primary/20 shadow-inner" 
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" 
              placeholder="Nivel" 
              value={newCmd.level} 
              onChange={e => setNewCmd({...newCmd, level: e.target.value})} 
              className="bg-white dark:bg-[#0a0f18] border-slate-200 dark:border-[#232f48] rounded-xl text-sm p-4 shadow-inner" 
            />
            <input 
              type="text" 
              placeholder="Skills (5-5-5-1)" 
              value={newCmd.skills} 
              onChange={e => setNewCmd({...newCmd, skills: e.target.value})} 
              className="bg-white dark:bg-[#0a0f18] border-slate-200 dark:border-[#232f48] rounded-xl text-sm p-4 shadow-inner" 
            />
          </div>
        </div>
        <button onClick={addCommander} className="w-full bg-primary text-white py-4 rounded-2xl text-xs font-bold hover:brightness-110 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95">
          <span className="material-symbols-outlined text-sm">add_moderator</span>
          Asignar Activo
        </button>
      </div>
    </section>
  );
};

const TalentTree = ({ commanders, t }: { commanders: GarrisonCommander[], t: any }) => {
  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      <header className="relative p-10 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary rounded-r-3xl">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-5xl">account_tree</span>
          {t.research} Estratégico
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide">Planos de batalla optimizados por inteligencia táctica 2025.</p>
      </header>

      {commanders.length === 0 ? (
        <div className="text-center py-24 bg-white/50 dark:bg-panel-dark/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-[#232f48] animate-pulse">
          <span className="material-symbols-outlined text-8xl text-slate-200 dark:text-slate-800 mb-4">schema</span>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em]">Pendiente de asignación de comandantes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {commanders.map(cmd => (
            <div key={cmd.id} className="relative group bg-white dark:bg-[#161e2d] rounded-[3rem] border-2 border-slate-100 dark:border-[#232f48] overflow-hidden shadow-2xl transition-all hover:border-primary/50">
              <div className="absolute top-0 right-0 p-8">
                <div className="size-20 bg-primary/5 rounded-full border border-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-110 transition-transform">
                  {cmd.level}
                </div>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white group-hover:text-primary transition-colors">{cmd.name}</h3>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Configuración de Grado Militar</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-[#0a0f18] rounded-3xl border border-slate-100 dark:border-[#232f48] shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                      <span className="text-[10px] font-black uppercase text-slate-500">Ruta Primaria</span>
                    </div>
                    <span className="font-black text-sm uppercase">Habilidad Activa</span>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-[#0a0f18] rounded-3xl border border-slate-100 dark:border-[#232f48] shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-accent-gold text-lg">shield</span>
                      <span className="text-[10px] font-black uppercase text-slate-500">Ruta Especial</span>
                    </div>
                    <span className="font-black text-sm uppercase">Versatilidad</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Puntos de Enfoque Táctico</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Furia Rebosante", "Precisión Militar", "Llamado del Destino", "Claridad"].map(t => (
                      <span key={t} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase shadow-sm">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-primary/5 border-t dark:border-[#232f48] flex items-center gap-4">
                <div className="size-2 bg-primary rounded-full animate-ping"></div>
                <p className="text-[11px] leading-relaxed font-bold italic text-slate-600 dark:text-slate-400">
                  Planos optimizados para {cmd.name}. Nivel {cmd.level} permite enfoque en generación de furia.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CommandCenter = ({ userState, setUserState, t }: { userState: UserState, setUserState: React.Dispatch<React.SetStateAction<UserState>>, t: any }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  const updateAccount = (fields: Partial<AccountData>) => {
    setUserState(prev => ({ ...prev, account: { ...prev.account, ...fields } }));
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const prompt = `INFORME ESTRATÉGICO. Poder: ${userState.account.power}, VIP: ${userState.account.vip}, Gemas: ${userState.account.gems}, Civilización: ${userState.account.civilization}, Especialización: ${userState.account.unit}, Fase KvK: ${userState.account.kvkPhase}. Comandantes: ${userState.garrison.map(c => c.name).join(', ')}. Dame 3 consejos tácticos críticos.`;
      const aiResponse = await chatWithGemini(prompt, "Eres la IA Estratega de ROK. Tono profesional y militar.");
      setUserState(prev => ({ 
        ...prev, 
        activeReport: aiResponse, 
        chatHistory: [{ role: 'ai', text: aiResponse || '' }] 
      }));
      navigate('/strategy');
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-full w-full">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img src="https://imagizer.imageshack.com/img923/6504/XmH8vP.jpg" alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-background-light via-background-light/30 to-transparent dark:from-background-dark dark:via-background-dark/40 dark:to-transparent"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
        <header className="text-center py-12">
          <h2 className="text-7xl font-black font-display text-primary uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(19,91,236,0.5)]">{t.dashboard}</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white/70 dark:bg-panel-dark/80 backdrop-blur-3xl rounded-[3rem] border border-white/40 dark:border-[#232f48] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-200 dark:border-[#232f48] flex items-center gap-3">
                <span className="material-symbols-outlined text-primary font-bold">sensors</span>
                <span className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-200">{t.dailyProgress}</span>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">Poder</label>
                  <input type="text" placeholder="Ej: 75.000.000" value={userState.account.power} onChange={(e) => updateAccount({ power: e.target.value })} className="w-full bg-white/50 dark:bg-[#0a0f18] border-white/50 dark:border-[#232f48] rounded-2xl p-5 font-bold shadow-xl" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">VIP</label>
                  <input type="number" placeholder="17" value={userState.account.vip} onChange={(e) => updateAccount({ vip: e.target.value })} className="w-full bg-white/50 dark:bg-[#0a0f18] border-white/50 dark:border-[#232f48] rounded-2xl p-5 font-bold shadow-xl" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">Gemas</label>
                  <input type="text" placeholder="Gemas" value={userState.account.gems} onChange={(e) => updateAccount({ gems: e.target.value })} className="w-full bg-white/50 dark:bg-[#0a0f18] border-white/50 dark:border-[#232f48] rounded-2xl p-5 font-bold shadow-xl" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">Civilización</label>
                  <select value={userState.account.civilization} onChange={(e) => updateAccount({ civilization: e.target.value })} className="w-full bg-white/50 dark:bg-[#0a0f18] border-white/50 dark:border-[#232f48] rounded-2xl p-5 font-bold shadow-xl">
                    <option>China</option><option>Alemania</option><option>Francia</option><option>Roma</option><option>Vikingos</option>
                  </select>
                </div>
              </div>
              <div className="p-12 bg-primary/10 border-t dark:border-[#232f48]">
                <button onClick={handleAnalyze} disabled={analyzing} className="w-full bg-primary text-white py-6 rounded-3xl font-black shadow-xl hover:scale-105 transition-all uppercase tracking-widest">
                  {analyzing ? 'Procesando...' : t.analyze}
                </button>
              </div>
            </section>
          </div>
          <div className="lg:col-span-4"><CommanderForm setUserState={setUserState} t={t} /></div>
        </div>
      </div>
    </div>
  );
};

const StrategyPanel = ({ userState, setUserState, lang, t }: { userState: UserState, setUserState: React.Dispatch<React.SetStateAction<UserState>>, lang: Language, t: any }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [userState.chatHistory]);

  const cleanText = (text: string) => {
    return text.replace(/[*#_~`>]/g, '').replace(/[-]{2,}/g, ' ');
  };

  const readReport = () => {
    if (isReading) {
      if (!isPaused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } else {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
      return;
    }

    if (!userState.activeReport) return;

    window.speechSynthesis.cancel();
    
    const textToRead = cleanText(userState.activeReport);
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    const voices = window.speechSynthesis.getVoices();
    const latinoVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-US')) 
                        || voices.find(v => v.lang.includes('es-')) 
                        || null;
    
    if (latinoVoice) utterance.voice = latinoVoice;
    
    const langMap: Record<Language, string> = {
      es: 'es-MX',
      en: 'en-US',
      fr: 'fr-FR',
      cn: 'zh-CN',
      pt: 'pt-BR'
    };
    
    utterance.lang = langMap[lang] || 'es-MX';
    utterance.rate = speed;
    utterance.pitch = 1;

    utterance.onstart = () => { setIsReading(true); setIsPaused(false); };
    utterance.onend = () => { setIsReading(false); setIsPaused(false); };
    utterance.onerror = () => { setIsReading(false); setIsPaused(false); };

    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    stopReading();
    setIsTyping(true);
    setUserState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'user', text: userMsg }] }));

    try {
      const context = userState.chatHistory.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n');
      const aiResponse = await chatWithGemini(`Contexto:\n${context}\n\nPregunta: ${userMsg}`, `Eres un General Estratega experto. Responde en ${lang}.`);
      setUserState(prev => ({ 
        ...prev, 
        activeReport: aiResponse || '', 
        chatHistory: [...prev.chatHistory, { role: 'ai', text: aiResponse || '' }] 
      }));
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsTyping(false); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f18]/40 backdrop-blur-sm">
      <header className="p-6 border-b dark:border-[#232f48] flex justify-between items-center bg-white/90 dark:bg-panel-dark/90 backdrop-blur-xl z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-outlined text-2xl font-bold">spatial_audio_off</span>
          </div>
          <div>
            <span className="block font-black text-xs uppercase tracking-[0.3em] text-primary">{t.aiAssistant}</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">General Táctico</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-[#111722] p-1.5 rounded-xl border dark:border-[#232f48]">
            {[1, 1.5, 2].map(s => (
              <button key={s} onClick={() => setSpeed(s)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${speed === s ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}>x{s}</button>
            ))}
          </div>
          <button onClick={readReport} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl ${isReading ? (isPaused ? 'bg-amber-500 text-white' : 'bg-primary text-white') : 'bg-primary text-white hover:scale-105 active:scale-95'}`}>
            <span className="material-symbols-outlined text-xl">{isReading ? (isPaused ? 'play_circle' : 'pause_circle') : 'play_circle'}</span>
            {isReading ? (isPaused ? 'REANUDAR' : 'PAUSAR') : 'LECTURA'}
          </button>
          {isReading && (
            <button onClick={stopReading} className="p-3 bg-red-500 text-white rounded-2xl hover:brightness-110 transition-all shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined">stop_circle</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-10">
          {userState.chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[75%] p-8 rounded-[2.5rem] border shadow-2xl relative ${msg.role === 'user' ? 'bg-primary text-white border-primary/20 rounded-tr-none' : 'bg-white/80 dark:bg-panel-dark/90 text-slate-800 dark:text-slate-100 dark:border-[#232f48] rounded-tl-none'}`}>
                <div className="text-sm leading-loose font-bold italic whitespace-pre-line">{msg.text}</div>
              </div>
            </div>
          ))}
          {isTyping && <div className="text-primary font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Analizando órdenes...</div>}
        </div>
      </div>

      <div className="p-8 border-t dark:border-[#232f48] bg-white/90 dark:bg-background-dark/90 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto flex gap-5">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t.search} className="flex-1 dark:bg-[#111722] border-none rounded-2xl py-6 px-10 text-sm font-bold focus:ring-4 focus:ring-primary/20 shadow-inner" />
          <button onClick={handleSendMessage} className="bg-primary text-white px-10 rounded-2xl shadow-xl hover:scale-105 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-3xl font-bold">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children, userState, lang, setLang, t }: { children?: React.ReactNode, userState: UserState, lang: Language, setLang: (l: Language) => void, t: any }) => {
  const location = useLocation();
  const flags = { es: '🇲🇽', en: '🇺🇸', pt: '🇧🇷', fr: '🇫🇷', cn: '🇨🇳' };
  const menuItems = [
    { path: '/', icon: 'settings_suggest', label: t.dashboard },
    { path: '/strategy', icon: 'analytics', label: t.tactics },
    { path: '/commanders', icon: 'military_tech', label: t.commanders },
    { path: '/talents', icon: 'account_tree', label: t.research },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <aside className="w-72 bg-white dark:bg-background-dark border-r dark:border-[#232f48] flex flex-col hidden xl:flex z-50 shadow-2xl">
        <div className="p-10 flex-1">
          <div className="flex items-center gap-4 mb-16">
            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl"><span className="material-symbols-outlined text-4xl font-bold">security</span></div>
            <h1 className="text-3xl font-black">ROK IA</h1>
          </div>
          <nav className="space-y-4">
            {menuItems.map(item => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-5 px-6 py-5 rounded-3xl transition-all ${location.pathname === item.path ? 'bg-primary text-white shadow-xl scale-105' : 'text-slate-400 hover:text-primary'}`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-10 border-t dark:border-[#232f48]"><div className="text-[11px] font-black text-primary uppercase bg-primary/10 p-3 rounded-xl border border-primary/20">Poder: {userState.account.power || '0'}</div></div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 border-b dark:border-[#232f48] bg-white/40 dark:bg-background-dark/40 backdrop-blur-3xl flex items-center justify-between px-12 z-50">
          <span className="text-xs font-black text-primary uppercase tracking-widest">{t.aiAssistant} v2.5</span>
          <div className="flex items-center gap-4 bg-white/60 dark:bg-[#111722]/60 p-2 rounded-2xl border dark:border-[#232f48]">
            {(['es', 'en', 'pt', 'fr', 'cn'] as Language[]).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`p-2.5 text-3xl rounded-xl transition-all ${lang === l ? 'bg-primary/10 scale-125' : 'grayscale opacity-20 hover:opacity-100'}`}>{flags[l]}</button>
            ))}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar">{children}</main>
      </div>
    </div>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('es');
  const t = TRANSLATIONS[lang];
  const [userState, setUserState] = useState<UserState>({
    account: { power: '', vip: '', gems: '', civilization: 'China', unit: 'Infantería', kvkPhase: 'Preparación' },
    garrison: [],
    activeReport: null,
    chatHistory: []
  });

  return (
    <HashRouter>
      <Layout lang={lang} setLang={setLang} userState={userState} t={t}>
        <Routes>
          <Route path="/" element={<CommandCenter userState={userState} setUserState={setUserState} t={t} />} />
          <Route path="/strategy" element={<StrategyPanel userState={userState} setUserState={setUserState} lang={lang} t={t} />} />
          <Route path="/talents" element={<TalentTree commanders={userState.garrison} t={t} />} />
          <Route path="/commanders" element={
            <div className="p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 sticky top-0"><CommanderForm setUserState={setUserState} t={t} /></div>
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {userState.garrison.map(cmd => {
                  const avatarUrl = getCommanderAvatar(cmd.name);
                  return (
                    <div key={cmd.id} className="bg-white/70 dark:bg-panel-dark/80 backdrop-blur-3xl rounded-[3rem] border-2 border-slate-100 dark:border-[#232f48] shadow-2xl overflow-hidden hover:scale-105 transition-all group relative">
                      <div className="h-48 overflow-hidden relative bg-primary/5 flex items-center justify-center">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={cmd.name} 
                            className="h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" 
                            loading="lazy"
                            onError={(e) => {
                              // Intenta un proxy o fallback si la URL directa falla por referer
                              const img = e.target as HTMLImageElement;
                              if (!img.src.includes('weserv.nl')) {
                                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl)}`;
                              } else {
                                img.style.display = 'none';
                                if (img.parentElement) {
                                  img.parentElement.innerHTML = '<span class="material-symbols-outlined text-6xl opacity-50 text-primary">person_filled</span>';
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-6xl opacity-50">person_filled</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#161e2d] via-transparent to-transparent"></div>
                      </div>
                      
                      <div className="p-8 pt-0 relative z-10">
                        <div className="flex justify-between items-center mb-4">
                           <div className="px-4 py-1.5 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-full text-[10px] font-black uppercase">Nivel {cmd.level}</div>
                        </div>
                        <h4 className="font-black text-2xl uppercase tracking-tighter text-slate-800 dark:text-white truncate">{cmd.name}</h4>
                        <div className="mt-4 p-4 bg-slate-100 dark:bg-[#0a0f18] rounded-2xl border dark:border-[#232f48]">
                           <span className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Estructura Habilidad</span>
                           <span className="text-xs font-black font-mono tracking-widest text-slate-600 dark:text-slate-300">{cmd.skills}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
