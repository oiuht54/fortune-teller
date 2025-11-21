'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TextOracle } from '@/utils/markovGenerator';
import FractalCanvas from '@/components/FractalCanvas';
import { soundManager } from '@/utils/soundEngine';
import { useTypewriter } from '@/hooks/useTypewriter';

export default function Home() {
  const [fullPrediction, setFullPrediction] = useState<string>("...");
  const [trigger, setTrigger] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Callback для звука, который не пересоздается при каждом рендере
  const playSound = useCallback(() => {
    soundManager.playKeystroke();
  }, []);

  // Передаем playSound в хук
  // Скорость 30ms — достаточно быстро, чтобы звучало как поток данных
  const displayedText = useTypewriter(fullPrediction, 30, playSound);

  const oracle = useMemo(() => new TextOracle(), []);

  useEffect(() => {
    const initOracle = async () => {
      try {
        const response = await fetch('/api/files');
        const data = await response.json();
        const files = data.files || [];

        if (files.length === 0) {
          setFullPrediction("Библиотека пуста...");
          setIsLoading(false);
          return;
        }

        await oracle.loadLibrary(files);
        setIsLoading(false);
        setFullPrediction("Система готова. Инициализируйте контакт.");
      } catch (error) {
        console.error("Error:", error);
        setFullPrediction("Сбой связи с эфиром.");
        setIsLoading(false);
      }
    };

    initOracle();
  }, [oracle]);

  const handleDivination = () => {
    if (isLoading) return;

    // Включаем звук (фон) только при первом клике
    if (!hasInteracted) {
      soundManager.initAudio();
      soundManager.startDrone();
      setHasInteracted(true);
    }

    // Сначала очищаем текст, чтобы эффект печати перезапустился
    setFullPrediction("");

    // Генерируем новый текст с небольшой задержкой, чтобы UI "мигнул"
    setTimeout(() => {
      const text = oracle.generatePrediction();
      setFullPrediction(text);
      setTrigger(prev => prev + 1);
    }, 100);
  };

  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black text-gray-100 overflow-hidden selection:bg-purple-500 selection:text-white">
        <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80 pointer-events-none"></div>

        <div className="z-10 max-w-3xl w-full items-center justify-between font-mono text-sm flex flex-col gap-8">

          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 animate-pulse mb-2 tracking-tighter text-center">
            VOID ORACLE
          </h1>

          <div className="relative group w-full max-w-[500px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg blur-lg opacity-40 group-hover:opacity-80 transition duration-1000"></div>
            <div className="relative bg-black ring-1 ring-gray-800 rounded-lg flex items-center justify-center overflow-hidden shadow-2xl">
              <FractalCanvas trigger={trigger} />
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
            </div>
          </div>

          <div className="w-full max-w-[600px] min-h-[140px] flex flex-col items-center justify-center text-center p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {isLoading ? (
                <span className="text-purple-400 animate-pulse tracking-widest">ЗАГРУЗКА ДАННЫХ...</span>
            ) : (
                <div className="relative z-10">
                  <p className="text-lg md:text-2xl text-purple-100 font-light leading-relaxed drop-shadow-md">
                    {displayedText}
                    <span className="inline-block w-2 h-6 ml-1 bg-purple-400 animate-pulse align-middle"></span>
                  </p>
                </div>
            )}
          </div>

          <button
              onClick={handleDivination}
              disabled={isLoading}
              className={`
            relative px-10 py-4 rounded-none overflow-hidden group
            border border-purple-500/30 transition-all duration-300
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400 cursor-pointer'}
          `}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-900/20 to-indigo-900/20 group-hover:from-purple-800/40 group-hover:to-indigo-800/40 transition-all"></div>
            <span className={`relative z-10 font-bold text-lg uppercase tracking-[0.2em] ${isLoading ? 'text-gray-500' : 'text-purple-200 group-hover:text-white'}`}>
            {isLoading ? 'Инициализация' : (hasInteracted ? 'Задать вопрос' : 'Коснуться бездны')}
          </span>
          </button>

        </div>
      </main>
  );
}