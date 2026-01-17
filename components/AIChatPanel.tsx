
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini, analyzeImage } from '../services/geminiService';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AIChatPanelProps {
  lang: Language;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ lang }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = `Eres un experto estratega de Rise of Kingdoms. Responde siempre en ${lang}.`;
      const aiResponse = await chatWithGemini(userMsg, systemPrompt);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'No pude procesar eso.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error de conexión con Gemini.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await analyzeImage(base64, "Analiza esta captura de pantalla de Rise of Kingdoms. ¿Qué recomiendas mejorar en base a los recursos o comandantes visibles?");
        setMessages(prev => [
          ...prev, 
          { role: 'user', text: "[Imagen enviada]" },
          { role: 'ai', text: result || 'Imagen analizada.' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-[#232f48] bg-white dark:bg-panel-dark flex flex-col hidden lg:flex">
      <div className="p-4 border-b border-slate-200 dark:border-[#232f48] flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          {t.aiAssistant}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-[#232f48] text-slate-800 dark:text-slate-200'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 animate-pulse">Gemini está pensando...</div>}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-[#232f48] space-y-2">
        <div className="flex gap-2 mb-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-[#111722] rounded text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-[#1c283e]"
          >
            <span className="material-symbols-outlined text-sm">image</span>
            {t.uploadImage.split(' ')[1]}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
        <div className="relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe..." 
            className="w-full bg-slate-100 dark:bg-[#111722] border-none rounded-lg py-2 pl-3 pr-10 text-xs focus:ring-1 focus:ring-primary"
          />
          <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
