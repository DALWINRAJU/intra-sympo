import { useState, useEffect, useRef } from 'react';

const CompetitionTimer = ({ startTime, stopped = false }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;
    const startMs = new Date(startTime).getTime();

    const update = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - startMs) / 1000)));
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  // Stop the interval when the stopped prop becomes true
  useEffect(() => {
    if (stopped && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stopped]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 font-mono text-sm font-bold bg-gray-900/90 border border-gray-700/80 px-3.5 py-1.5 rounded-lg text-yellow-400 shadow-md">
      <span className="text-gray-400 text-xs font-sans font-semibold uppercase tracking-wider">Timer:</span>
      <span className="text-base">{stopped ? '🛑' : '⏱️'}</span>
      <span className="text-yellow-300 tracking-wider text-base">{mins}:{secs}</span>
    </div>
  );
};

export default CompetitionTimer;
