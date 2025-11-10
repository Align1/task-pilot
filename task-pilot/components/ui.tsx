
import React, { PropsWithChildren } from 'react';
import { Icon } from './icons';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none";
    const variantClasses = {
      primary: "text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
      secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
      ghost: "hover:bg-slate-200 dark:hover:bg-slate-800",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizeClasses = {
      sm: "h-9 px-3",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    };
    return <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} ref={ref} {...props} />;
  }
);

// Card
// FIX: Update Card component to accept all div attributes (like style) to fix type error.
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={`bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/50 rounded-2xl shadow-lg ${className}`} {...props}>
    {children}
  </div>
);

// Dialog
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><Icon name="Close" className="w-5 h-5" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Progress
interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}
export const Progress: React.FC<ProgressProps> = ({ value, className }) => (
  <div className={`relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
    <div className="h-full w-full flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </div>
);

// Input
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input className={`flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} ref={ref} {...props} />
    )
)

// Label
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 ${className}`} ref={ref} {...props} />
    )
)

// Toggle Group
interface ToggleGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
}
export const ToggleGroup = <T extends string,>({ value, onValueChange, options }: ToggleGroupProps<T>) => {
  return (
    <div className="inline-flex items-center justify-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
      {options.map(option => (
        <button key={option.value} onClick={() => onValueChange(option.value)} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${value === option.value ? 'bg-white dark:bg-slate-900/80 shadow-md text-indigo-500' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Switch
interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}
export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, ...props }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:ring-offset-slate-900`}
        {...props}
    >
        <span
            aria-hidden="true"
            className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);