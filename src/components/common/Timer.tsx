import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface TimerProps {
  className?: string;
  onModeChange?: (mode: 'collapsed' | 'setup' | 'running' | 'paused' | 'completed') => void;
}

export const Timer: React.FC<TimerProps> = ({ className = '', onModeChange }) => {
  const [mode, setMode] = useState<'collapsed' | 'setup' | 'running' | 'paused' | 'completed'>('collapsed');
  const [minutes, setMinutes] = useState<number>(5);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useEffect(() => {
    if (mode === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setMode('completed');
            toast.success('⏰ Уақыт вышло!', { duration: 5000 });
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [mode, timeLeft]);

  const handleStart = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds === 0) {
      toast.error('Установите время больше 0');
      return;
    }
    setTimeLeft(totalSeconds);
    setMode('running');
  };

  const handlePause = () => {
    setMode('paused');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleResume = () => {
    setMode('running');
  };

  const handleReset = () => {
    setMode('setup');
    setTimeLeft(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleClose = () => {
    setMode('collapsed');
    setTimeLeft(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Collapsed state - just a button
  if (mode === 'collapsed') {
    return (
      <button
        onClick={() => setMode('setup')}
        className={`px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5 ${className}`}
        title="Таймер"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Таймер
      </button>
    );
  }

  // Setup state - input fields
  if (mode === 'setup') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md ${className}`}>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
          className="w-12 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="0"
          max="99"
        />
        <span className="text-sm text-gray-600">:</span>
        <input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
          className="w-12 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="0"
          max="59"
        />
        <button
          onClick={handleStart}
          className="px-2 py-0.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
        >
          Старт
        </button>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Жабу"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // Running or Paused state - display time with controls
  if (mode === 'running' || mode === 'paused') {
    const isLowTime = timeLeft <= 10 && mode === 'running';

    return (
      <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 ${mode === 'running' ? 'bg-indigo-50 border-indigo-300' : 'bg-amber-50 border-amber-300'} border rounded-lg ${className}`}>
        <svg className={`w-5 h-5 md:w-6 md:h-6 hidden md:block ${mode === 'running' ? 'text-indigo-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span
          className={`font-mono font-bold ${mode === 'running' ? 'text-indigo-900' : 'text-amber-900'} ${isLowTime ? 'text-3xl md:text-5xl animate-pulse text-red-600' : 'text-2xl md:text-4xl'}`}
          style={{ lineHeight: '1', minWidth: '80px', textAlign: 'center' }}
        >
          {formatTime(timeLeft)}
        </span>
        {mode === 'running' ? (
          <button
            onClick={handlePause}
            className="p-1.5 md:p-2 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
            title="Пауза"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="p-1.5 md:p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            title="Жалғастыру"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </button>
        )}
        <button
          onClick={handleReset}
          className="p-1.5 md:p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          title="Ысыру"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 md:p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          title="Жабу"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // Completed state - show completion message
  if (mode === 'completed') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-md ${className}`}>
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-green-900">Уақыт вышло!</span>
        <button
          onClick={handleReset}
          className="px-2 py-0.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Заново
        </button>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Жабу"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return null;
};
