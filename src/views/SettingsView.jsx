/* eslint-disable no-unused-vars, react-refresh/only-export-components */
import { useState, useEffect, useContext } from 'react';
import { Settings, Shield, Bell, ChevronLeft, X, Lock, Sliders } from 'lucide-react';
import { AuthContext, DataContext } from '../app/contexts.js';
import { auth } from '../firebase.js';

const DEFAULT_SETTINGS = {
  privacy: {
    privateProfile: true,
    showOnlineStatus: true,
    publicVibeBadges: true,
    discoverableByVibe: true,
    vibeStories: true
  },
  notifications: {
    pushAlerts: true,
    messagePreviews: true,
    storyUpdates: true,
    soundEffects: false
  },
  security: {
    twoFactor: true,
    loginAlerts: true,
    activeSessions: false,
    biometricUnlock: false
  },
  storage: {
    autoDownloadMedia: true,
    wifiOnlyDownloads: true,
    dataSaverMode: false
  }
};

const normalizeSettings = (stored = {}) => {
  const source = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};

  return {
    privacy: {
      ...DEFAULT_SETTINGS.privacy,
      ...(source.privacy || {}),
      ...(typeof source.vibeStories === 'boolean' ? { vibeStories: source.vibeStories } : {}),
      ...(typeof source.privateProfile === 'boolean' ? { privateProfile: source.privateProfile } : {}),
      ...(typeof source.showOnlineStatus === 'boolean' ? { showOnlineStatus: source.showOnlineStatus } : {}),
      ...(typeof source.publicVibeBadges === 'boolean' ? { publicVibeBadges: source.publicVibeBadges } : {}),
      ...(typeof source.discoverableByVibe === 'boolean' ? { discoverableByVibe: source.discoverableByVibe } : {})
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(source.notifications || {}),
      ...(typeof source.pushAlerts === 'boolean' ? { pushAlerts: source.pushAlerts } : {}),
      ...(typeof source.messagePreviews === 'boolean' ? { messagePreviews: source.messagePreviews } : {}),
      ...(typeof source.storyUpdates === 'boolean' ? { storyUpdates: source.storyUpdates } : {}),
      ...(typeof source.soundEffects === 'boolean' ? { soundEffects: source.soundEffects } : {})
    },
    security: {
      ...DEFAULT_SETTINGS.security,
      ...(source.security || {}),
      ...(typeof source.twoFactor === 'boolean' ? { twoFactor: source.twoFactor } : {}),
      ...(typeof source.loginAlerts === 'boolean' ? { loginAlerts: source.loginAlerts } : {}),
      ...(typeof source.activeSessions === 'boolean' ? { activeSessions: source.activeSessions } : {}),
      ...(typeof source.biometricUnlock === 'boolean' ? { biometricUnlock: source.biometricUnlock } : {})
    },
    storage: {
      ...DEFAULT_SETTINGS.storage,
      ...(source.storage || {}),
      ...(typeof source.autoDownloadMedia === 'boolean' ? { autoDownloadMedia: source.autoDownloadMedia } : {}),
      ...(typeof source.wifiOnlyDownloads === 'boolean' ? { wifiOnlyDownloads: source.wifiOnlyDownloads } : {}),
      ...(typeof source.dataSaverMode === 'boolean' ? { dataSaverMode: source.dataSaverMode } : {})
    }
  };
};

const getSavedSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = JSON.parse(window.localStorage.getItem('vibely_settings') || '{}');
    return normalizeSettings(stored);
  } catch (error) {
    console.error('Unable to load saved settings.', error);
    return DEFAULT_SETTINGS;
  }
};

export const isVibeStoriesEnabled = () => {
  if (typeof window === 'undefined') return true;

  try {
    const stored = JSON.parse(window.localStorage.getItem('vibely_settings') || '{}');
    const settings = normalizeSettings(stored);
    return settings.privacy.vibeStories !== false;
  } catch (error) {
    console.error('Unable to read Vibe Stories preference.', error);
    return true;
  }
};

export const SettingsView = () => {
  const { showToast } = useContext(DataContext);
  const { changePassword, resendVerificationEmail } = useContext(AuthContext);
  const emailVerified = auth.currentUser?.emailVerified ?? true;
  const [expandedSection, setExpandedSection] = useState('privacy');
  const [settings, setSettings] = useState(() => getSavedSettings());
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
      showToast('Password updated successfully.');
    } catch (error) {
      console.error('Unable to change password.', error);
      const message = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : error.code === 'auth/requires-recent-login'
          ? 'Please sign out and sign in again before changing your password.'
          : error.message;
      showToast(`Couldn't change password: ${message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await resendVerificationEmail();
      showToast('Verification email sent. Check your inbox.');
    } catch (error) {
      console.error('Unable to send verification email.', error);
      showToast(`Couldn't send verification email: ${error.message}`);
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    window.localStorage.setItem('vibely_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (sectionId, key) => {
    setSettings((previous) => ({
      ...previous,
      [sectionId]: {
        ...previous[sectionId],
        [key]: !previous[sectionId][key]
      }
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Settings restored to defaults.');
  };

  const clearStorage = () => {
    window.localStorage.removeItem('vibely_settings');
    setSettings(DEFAULT_SETTINGS);
    showToast('Cache cleared.');
  };

  const sections = [
    {
      id: 'privacy',
      title: 'Account Privacy',
      desc: 'Control who sees your vibe and online status',
      icon: Shield,
      options: [
        { key: 'privateProfile', label: 'Private profile', hint: 'Limit new people from seeing your activity.' },
        { key: 'showOnlineStatus', label: 'Show online status', hint: 'Let contacts see when you are active.' },
        { key: 'publicVibeBadges', label: 'Public vibe badges', hint: 'Display your current mood on your profile.' },
        { key: 'discoverableByVibe', label: 'Discoverable by vibe', hint: 'Appear in vibe-based recommendations.' },
        { key: 'vibeStories', label: 'Vibe Stories', hint: 'Show your stories and story updates on your feed.' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      desc: 'Message alerts and story updates',
      icon: Bell,
      options: [
        { key: 'pushAlerts', label: 'Push alerts', hint: 'Receive mobile and desktop notifications.' },
        { key: 'messagePreviews', label: 'Message previews', hint: 'Show conversation text in notifications.' },
        { key: 'storyUpdates', label: 'Story updates', hint: 'Notify me when close friends post stories.' },
        { key: 'soundEffects', label: 'Sound effects', hint: 'Play audio cues for new messages and reactions.' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Password',
      desc: 'Manage your password and account verification',
      icon: Lock,
      actions: [
        { label: 'Change password', variant: 'secondary' }
      ]
    },
    {
      id: 'storage',
      title: 'Storage & Data',
      desc: 'Network usage and media auto-download',
      icon: Sliders,
      options: [
        { key: 'autoDownloadMedia', label: 'Auto-download media', hint: 'Download pictures and videos automatically.' },
        { key: 'wifiOnlyDownloads', label: 'Download on Wi‑Fi only', hint: 'Avoid mobile data usage when syncing media.' },
        { key: 'dataSaverMode', label: 'Data saver mode', hint: 'Reduce media quality to save bandwidth.' }
      ],
      actions: [
        { label: 'Clear cache', variant: 'danger' },
        { label: 'Reset preferences', variant: 'secondary' }
      ]
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

        {!emailVerified && (
          <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">Verify your email address</h2>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Confirm your email to help keep your account secure.</p>
            </div>
            <button type="button" onClick={handleResendVerification} disabled={isSendingVerification} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
              {isSendingVerification ? 'Sending…' : 'Resend email'}
            </button>
          </section>
        )}

        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{section.title}</h3>
                      <p className="text-xs text-slate-400">{section.desc}</p>
                    </div>
                  </div>
                  <ChevronLeft
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-4 space-y-4">
                    {section.options.map((option) => (
                      <div key={option.key} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{option.label}</p>
                          <p className="text-xs text-slate-400">{option.hint}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings[section.id][option.key]}
                          onClick={() => toggleSetting(section.id, option.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${settings[section.id][option.key] ? 'bg-violet-500 border-violet-500' : 'bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings[section.id][option.key] ? 'translate-x-5' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    ))}

                    {section.actions && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {section.actions.map((action) => {
                          const isDanger = action.variant === 'danger';
                          const isSecondary = action.variant === 'secondary';
                          const onAction = () => {
                            if (action.label === 'Reset preferences') return resetSettings();
                            if (action.label === 'Clear cache') return clearStorage();
                            if (action.label === 'Change password') return setIsPasswordDialogOpen(true);
                            return undefined;
                          };

                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={onAction}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                isDanger
                                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900'
                                  : isSecondary
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:hover:bg-violet-800'
                              }`}
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {isPasswordDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleChangePassword} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Change password</h2>
                  <p className="mt-1 text-xs text-slate-500">Confirm your current password to continue.</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setIsPasswordDialogOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
              </div>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current password
                <input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              </label>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                New password
                <input type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={event => setNewPassword(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              </label>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm new password
                <input type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              </label>
              <button type="submit" disabled={isChangingPassword} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                {isChangingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


