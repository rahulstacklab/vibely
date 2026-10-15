import { useState, useContext } from 'react';
import { Home, MessageCircle, Users, User, Settings, Shield, MoreVertical, Sun, Moon, LogOut, Sparkles, Globe, Bookmark } from 'lucide-react';
import { ThemeContext, AuthContext, RouterContext, DataContext } from '../app/contexts.js';
import { Avatar } from './SharedComponents.jsx';

export const Sidebar = () => {
  const { currentRoute, navigate } = useContext(RouterContext);
  const { logout, user } = useContext(AuthContext);
  const { showToast } = useContext(DataContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Unable to sign out.', error);
      showToast(`Couldn't sign out: ${error.message}`);
    }
  };

  const navItems = [
    { id: '/', icon: Home, label: 'Feed & Home' },
    { id: '/chats', icon: MessageCircle, label: 'Chats', badge: true },
    { id: '/groups', icon: Users, label: 'Groups' },
    { id: '/moments', icon: Sparkles, label: 'Moments' },
    { id: '/discover', icon: CompassIcon, label: 'Discover & Vibe' },
    { id: '/saved', icon: Bookmark, label: 'Saved Messages' },
    { id: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  return (
    <aside className="fixed inset-y-0 left-0 hidden md:flex w-16 flex-col h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 z-50 overflow-visible">
      <div className="group/home relative p-3 flex items-center justify-center my-2 cursor-pointer" onClick={() => navigate('/')} tabIndex={0} role="button" aria-label="Vibely home">
        <div className="flex h-10 w-10 items-center justify-center transition-transform hover:scale-105">
          <img src="/vibely-mark-light.png" alt="" aria-hidden="true" className="h-full w-full object-contain dark:hidden" />
          <img src="/vibely-mark-dark.png" alt="" aria-hidden="true" className="hidden h-full w-full object-contain dark:block" />
        </div>
        <span className="pointer-events-none invisible absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/home:visible group-hover/home:opacity-100 group-focus-visible/home:visible group-focus-visible/home:opacity-100 dark:bg-slate-700">
          Vibely home
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-label={item.label}
              className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-semibold shadow-sm border border-violet-100 dark:border-violet-900/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              <div className="relative flex items-center justify-center w-full">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 transition-transform group-hover:scale-110" />
                <span className="pointer-events-none invisible absolute left-full top-1/2 z-[60] ml-6 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 dark:bg-slate-700">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute right-0 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <button onClick={toggleTheme} aria-label={isDark ? 'Light Theme' : 'Dark Theme'} className="group/theme relative w-full flex items-center justify-center p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
          <span className="pointer-events-none invisible absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/theme:visible group-hover/theme:opacity-100 group-focus-visible/theme:visible group-focus-visible/theme:opacity-100 dark:bg-slate-700">
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </span>
        </button>

        <div className="group/profile relative flex items-center justify-center p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer" onClick={() => navigate('/profile')} tabIndex={0} role="link" aria-label={`${user.name} profile`}>
          <Avatar src={user.avatar} size="sm" isOnline={true} />
          <span className="pointer-events-none invisible absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/profile:visible group-hover/profile:opacity-100 group-focus-visible/profile:visible group-focus-visible/profile:opacity-100 dark:bg-slate-700">
            {user.name} · Profile
          </span>
        </div>
        <button aria-label="Log out" onClick={handleLogout} className="group/logout relative w-full flex justify-center text-slate-400 hover:text-rose-500 p-2.5">
            <LogOut size={18} />
            <span className="pointer-events-none invisible absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/logout:visible group-hover/logout:opacity-100 group-focus-visible/logout:visible group-focus-visible/logout:opacity-100 dark:bg-slate-700">
              Log out
            </span>
        </button>
      </div>
    </aside>
  );
};

export const BottomNav = () => {
  const { currentRoute, navigate } = useContext(RouterContext);
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useContext(DataContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    { id: '/', icon: Home, label: 'Home' },
    { id: '/chats', icon: MessageCircle, label: 'Chats', badge: true },
    { id: '/groups', icon: Users, label: 'Groups' },
    { id: '/moments', icon: Sparkles, label: 'Moments' },
    { id: '/profile', icon: User, label: 'Profile', avatar: user?.avatar }
  ];
  const moreItems = [
    { id: '/discover', icon: Globe, label: 'Discover' },
    { id: '/saved', icon: Bookmark, label: 'Saved messages' },
    { id: '/settings', icon: Settings, label: 'Settings' },
    ...(user?.role === 'admin' ? [{ id: '/admin', icon: Shield, label: 'Admin panel' }] : [])
  ];
  const handleLogout = async () => {
    try {
      await logout();
      setShowMore(false);
    } catch (error) {
      console.error('Unable to sign out.', error);
      showToast(`Couldn't sign out: ${error.message}`);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pb-safe z-40">
      {showMore && (
        <div className="absolute bottom-full right-2 mb-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {moreItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                navigate(id);
                setShowMore(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-violet-950/50 dark:hover:text-violet-300"
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              setShowMore(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-violet-50 dark:text-slate-200 dark:hover:bg-violet-950/50"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
            {isDark ? 'Light theme' : 'Dark theme'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut size={19} />
            Log out
          </button>
        </div>
      )}
      <div className="flex items-center justify-around gap-1 px-1 pt-1.5 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-label={item.label}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-transform active:scale-90"
            >
              {item.avatar ? (
                <div className={`rounded-full p-0.5 transition-all ${isActive ? 'ring-2 ring-violet-500 scale-105' : ''}`}>
                  <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" alt="profile" />
                </div>
              ) : (
                <Icon 
                  size={21}
                  className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span className={`max-w-full truncate text-[10px] leading-tight ${isActive ? 'font-semibold text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className="absolute top-1 right-[calc(50%-15px)] h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950"></span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="More navigation options"
          aria-expanded={showMore}
          onClick={() => setShowMore(value => !value)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <MoreVertical size={21} className={showMore ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'} />
          <span className={`text-[10px] leading-tight ${showMore ? 'font-semibold text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>More</span>
        </button>
      </div>
    </div>
  );
};

export const CompassIcon = ({ size, className }) => <Globe size={size} className={className} />;
