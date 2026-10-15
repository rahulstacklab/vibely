import { Sparkles } from 'lucide-react';

export const Avatar = ({ src, size = 'md', isOnline, vibe, className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <img src={src} alt="Avatar" className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm`} />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
      )}
      {vibe && (
        <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 whitespace-nowrap">
          {vibe.split(' ')[0]}
        </span>
      )}
    </div>
  );
};

export const StoryRing = ({ src, isViewed, size = 'lg', className = '' }) => {
  const sizes = { md: 'w-14 h-14', lg: 'w-16 h-16' };
  const ringColor = isViewed ? 'border-slate-300 dark:border-slate-700' : 'border-violet-500 ring-2 ring-violet-400/40';

  return (
    <div className={`p-0.5 rounded-full border-2 ${ringColor} ${className} transition-transform hover:scale-105`}>
      <img src={src} className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-slate-950`} alt="Story" />
    </div>
  );
};

export const IconButton = ({ icon: Icon, onClick, active, badge, className = '', title, disabled = false }) => (
  <button 
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`relative p-2.5 rounded-2xl transition-all duration-200 active:scale-95
      ${active ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}
      ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      ${className}
    `}
  >
    <Icon size={20} strokeWidth={2.2} />
    {Boolean(badge) && (
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
    )}
  </button>
);

export const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-slide-down">
      <Sparkles size={18} className="text-violet-400 animate-pulse" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

