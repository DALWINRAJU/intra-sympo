import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { reportViolation } from '../../services/quizService';

const AntiCheatWrapper = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const location = useLocation();

  // Don't enforce on Lobby or Results pages
  const isProtectedPage = location.pathname.startsWith('/level/');

  const recordViolation = useCallback(() => {
    setShowWarning(true);
    setViolationCount(prev => prev + 1);
    // Report to server (fire-and-forget)
    reportViolation();
  }, []);

  useEffect(() => {
    if (!isProtectedPage) return;

    // Check if currently fullscreen
    const checkFullscreen = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      // If they exited fullscreen during a protected page, show warning
      if (!isFull) {
        recordViolation();
      }
    };

    // Tab visibility change (switching tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation();
      }
    };

    // Disable keyboard shortcuts (F12, Ctrl+Shift+I, etc)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        recordViolation();
      }
    };

    // Disable right click
    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation();
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Initial check
    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isProtectedPage, recordViolation]);

  const enforceFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setShowWarning(false);
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  if (!isProtectedPage) {
    return children;
  }

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-8 max-w-md">
            <h2 className="text-3xl font-bold text-red-500 mb-4">⚠️ Anti-Cheat Warning</h2>
            <p className="text-gray-200 mb-4 text-lg">
              You have left the test environment or attempted an unauthorized action.
            </p>
            <p className="text-gray-400 mb-6 text-sm">
              Tab switching, minimizing, right-clicking, and exiting full-screen are strictly prohibited during the exam.
              <br/><br/>
              <span className="font-bold text-red-400">Violations recorded: {violationCount}</span>
            </p>
            <button 
              onClick={enforceFullscreen} 
              className="btn-primary bg-red-600 hover:bg-red-500 w-full py-4 text-lg font-bold"
            >
              Return to Full Screen
            </button>
          </div>
        </div>
      )}
      <div className={showWarning ? 'blur-md pointer-events-none' : ''}>
        {children}
      </div>
    </>
  );
};

export default AntiCheatWrapper;

