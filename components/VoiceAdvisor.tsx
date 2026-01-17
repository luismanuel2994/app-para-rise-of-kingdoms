
import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface VoiceAdvisorProps {
  lang: Language;
  userData: any; // Recibe el estado completo del usuario
}

const VoiceAdvisor: React.FC<VoiceAdvisorProps> = ({ lang, userData }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRes = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  const t = TRANSLATIONS[lang];

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopAdvisor = () => {
    setIsActive(false);
    setIsSpeaking(false);
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
    sources.current.forEach(s => s.stop());
    sources.current.clear();
    nextStartTime.current = 0;
  };

  const startAdvisor = async () => {
    try {
      // Fix: Always use { apiKey: process.env.API_KEY } for initialization
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");
      const ai = new GoogleGenAI({ apiKey });
      audioContextRes.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      setIsActive(true);
      
      const userDataSummary = `Poder: ${userData.account.power}, VIP: ${userData.account.vip}, Gemas: ${userData.account.gems}, Civ: ${userData.account.civilization}, KVK: ${userData.account.kvkPhase}. Comandantes: ${userData.garrison.map((c: any) => c.name).join(', ')}.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `Eres el Gran Asesor de Rise of Kingdoms. Habla en ${lang}. CONTEXTO ACTUAL DEL JUGADOR: ${userDataSummary}. Usa esta información para dar consejos personalizados sin preguntar los datos que ya tienes. Sé proactivo.`,
        },
        callbacks: {
          onopen: () => console.log("Asesor conectado"),
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRes.current) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audioData), audioContextRes.current, 24000, 1);
              const source = audioContextRes.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRes.current.destination);
              nextStartTime.current = Math.max(nextStartTime.current, audioContextRes.current.currentTime);
              source.start(nextStartTime.current);
              nextStartTime.current += buffer.duration;
              sources.current.add(source);
              source.onended = () => {
                sources.current.delete(source);
                if (sources.current.size === 0) setIsSpeaking(false);
              };
            }
          },
          onclose: () => stopAdvisor(),
          onerror: (e) => {
            console.error("Error Asesor:", e);
            stopAdvisor();
          },
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Error al iniciar asesor:", err);
      setIsActive(false);
    }
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-[#232f48] bg-white dark:bg-panel-dark flex flex-col hidden lg:flex">
      <div className="p-6 border-b border-slate-200 dark:border-[#232f48] text-center">
        <div className={`size-24 mx-auto rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isActive ? 'bg-primary ring-8 ring-primary/20 scale-110' : 'bg-slate-200 dark:bg-[#232f48]'}`}>
          <span className={`material-symbols-outlined text-4xl ${isActive ? 'text-white animate-pulse' : 'text-slate-400'}`}>
            {isActive ? 'graphic_eq' : 'mic_off'}
          </span>
        </div>
        <h3 className="mt-4 font-bold text-lg">{isActive ? 'Asesor en línea' : 'Asesor Desconectado'}</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Memoria de Cuenta Activa</p>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center items-center space-y-6">
        {isActive ? (
          <>
            <div className="flex gap-1 items-end h-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`w-1.5 bg-primary rounded-full transition-all duration-150 ${isSpeaking ? 'animate-bounce' : 'h-2'}`} style={{ animationDelay: `${i * 0.1}s`, height: isSpeaking ? `${Math.random() * 40 + 10}px` : '8px' }} />
              ))}
            </div>
            <button onClick={stopAdvisor} className="px-6 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-full hover:bg-red-500 hover:text-white transition-all">Terminar Sesión</button>
          </>
        ) : (
          <button onClick={startAdvisor} className="group flex flex-col items-center gap-4 transition-transform active:scale-95">
            <div className="size-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl">record_voice_over</span>
            </div>
            <span className="text-xs font-bold text-primary tracking-tighter uppercase">Iniciar Consulta de Voz</span>
          </button>
        )}
      </div>

      <div className="p-6 bg-slate-50 dark:bg-[#111722] border-t border-slate-200 dark:border-[#232f48]">
        <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-sm text-primary">psychology</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Contexto de la Cuenta</span>
        </div>
        <p className="text-[10px] text-slate-400">El asesor tiene acceso a tus gemas, VIP y comandantes guardados en el Dashboard para responderte con precisión.</p>
      </div>
    </div>
  );
};

export default VoiceAdvisor;
