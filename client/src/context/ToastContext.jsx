import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const colors = {
    success: { border: '#22C55E', icon: '✓', iconColor: '#22C55E' },
    error:   { border: '#EF4444', icon: '✕', iconColor: '#EF4444' },
    info:    { border: '#8B5CF6', icon: '●', iconColor: '#8B5CF6' },
    warning: { border: '#F59E0B', icon: '⚠', iconColor: '#F59E0B' },
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(t => {
            const c = colors[t.type] || colors.info;
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: '#111113',
                  border: '1px solid #27272A',
                  borderLeft: `3px solid ${c.border}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 240,
                  maxWidth: 320,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                <span style={{ color: c.iconColor, fontSize: 13, fontWeight: 700 }}>{c.icon}</span>
                <span style={{ fontSize: 13, color: '#FAFAFA', flex: 1 }}>{t.message}</span>
                <button
                  onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                  style={{ background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                >✕</button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
