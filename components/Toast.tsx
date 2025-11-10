import React, { useEffect, createContext, useContext } from 'react';
import { ToastMessage } from '../types';
import { Icon } from './icons';

// --- Toast Context ---
type ToastContextType = {
  addToast: (message: string, type: ToastMessage['type']) => void;
};
export const ToastContext = createContext<ToastContextType | null>(null);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <Icon name="CheckCircle" className="w-6 h-6 text-green-500" />,
    error: <Icon name="XCircle" className="w-6 h-6 text-red-500" />,
    info: <Icon name="Zap" className="w-6 h-6 text-indigo-500" />,
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-fade-in-up w-full">
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-grow pr-2">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0">
        <Icon name="Close" className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};