'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  onUndo?: () => void;
  duration?: number;
}

export function Toast({ message, onClose, onUndo, duration = 5000 }: ToastProps) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const STEP = 50;
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + STEP;
        if (next >= duration) {
          clearInterval(timerRef.current!);
          onCloseRef.current();
          return duration;
        }
        return next;
      });
    }, STEP);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [duration]);

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const progress = Math.max(0, 1 - elapsed / duration);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="pointer-events-auto bg-[#1e2430] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm text-slate-200 flex-1">{message}</span>
          {onUndo && (
            <button
              onClick={() => { stop(); onUndo(); onClose(); }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium px-2 py-0.5 rounded hover:bg-violet-400/10 transition-colors whitespace-nowrap"
            >
              Desfazer
            </button>
          )}
          <button
            onClick={() => { stop(); onClose(); }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-violet-500"
            style={{ width: `${progress * 100}%`, transition: 'width 50ms linear' }}
          />
        </div>
      </div>
    </div>
  );
}
