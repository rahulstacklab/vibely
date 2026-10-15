import { useContext, useState } from 'react';
import { Activity } from 'lucide-react';
import { firebaseConfigured } from './firebase.js';
import { AuthContext, RouterContext, DataContext } from './app/contexts.js';
import { ThemeProvider, AuthProvider, RouterProvider, DataProvider } from './app/AppProviders.jsx';
import { Toast } from './components/SharedComponents.jsx';
import { Sidebar, BottomNav } from './components/Navigation.jsx';
import { ActiveCallOverlay } from './components/ActiveCallOverlay.jsx';
import { DashboardView } from './views/DashboardView.jsx';
import { ChatView } from './views/ChatView.jsx';
import { StoriesView } from './views/StoriesView.jsx';
import { MomentsView } from './views/MomentsView.jsx';
import { DiscoverView } from './views/DiscoverView.jsx';
import { SavedMessagesView } from './views/SavedMessagesView.jsx';
import { ProfileView } from './views/ProfileView.jsx';
import { SettingsView, isVibeStoriesEnabled } from './views/SettingsView.jsx';
import { AdminDashboardView } from './views/AdminDashboardView.jsx';

const AuthGate = () => {
  const { user, authLoading, authError, login, register, resetPassword } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        Connecting to Vibely…
      </div>
    );
  }

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-900">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-900 dark:bg-slate-950">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finish Firebase setup</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add your Firebase Web API key and app ID to a local <code>.env</code> file. See the project README for setup and Firestore rules.
          </p>
        </div>
      </div>
    );
  }

  if (user) return <MainAppLayout />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      if (isResettingPassword) {
        await resetPassword(email);
        setStatusMessage('If an account exists for that email, a password reset link has been sent.');
        return;
      }
      if (isRegistering) {
        await register({ fullName, email: email.trim(), password });
      } else {
        await login(email.trim(), password);
      }
    } catch (error) {
      console.error('Authentication failed.', error);
      const messages = {
        'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Wait a while and try again.',
        'auth/user-not-found': 'If an account exists for that email, a password reset link has been sent.',
        'auth/user-disabled': 'This account is disabled. Contact support for help.',
        'auth/weak-password': 'Use a password with at least 6 characters.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.'
      };
      if (isResettingPassword && error.code === 'auth/user-not-found') {
        setStatusMessage(messages[error.code]);
      } else {
        setErrorMessage(messages[error.code] || error.message || (isResettingPassword
          ? 'Unable to send a password reset email. Please try again.'
          : 'Unable to authenticate. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white">
            <Activity size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Vibely</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isResettingPassword
              ? 'Enter your account email and we’ll send a secure password reset link.'
              : isRegistering
                ? 'Create an account and meet your people.'
                : 'Sign in to catch up and chat live.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authError && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {authError}
            </p>
          )}
          {isRegistering && !isResettingPassword && (
            <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
              <input
                required
                minLength={2}
                autoComplete="name"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="you@example.com"
            />
          </label>
          {!isResettingPassword && <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              required
              type="password"
              minLength={isRegistering ? 6 : undefined}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="At least 6 characters"
            />
          </label>}
          {errorMessage && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMessage}
            </p>
          )}
          {statusMessage && (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {statusMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : isResettingPassword ? 'Send reset link' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {!isResettingPassword && !isRegistering && (
          <p className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(true);
                setErrorMessage('');
                setStatusMessage('');
              }}
              className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              Forgot password?
            </button>
          </p>
        )}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isRegistering ? 'Already have an account?' : 'New to Vibely?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsResettingPassword(false);
              setIsRegistering(value => !value);
              setErrorMessage('');
              setStatusMessage('');
            }}
            className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        {isResettingPassword && (
          <p className="mt-3 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(false);
                setErrorMessage('');
                setStatusMessage('');
              }}
              className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              Back to sign in
            </button>
          </p>
        )}
      </section>
    </main>
  );
};

const MainAppLayout = () => {
  const { currentRoute } = useContext(RouterContext);
  const { toastMessage } = useContext(DataContext);

  const renderCurrentView = () => {
    if (currentRoute === '/') return <DashboardView />;
    if (currentRoute === '/profile') return <ProfileView />;
    if (currentRoute === '/chats' || currentRoute === '/groups') return <ChatView />;
    if (currentRoute === '/stories') return isVibeStoriesEnabled() ? <StoriesView /> : <DashboardView />;
    if (currentRoute === '/moments') return <MomentsView />;
    if (currentRoute === '/discover') return <DiscoverView />;
    if (currentRoute === '/saved') return <SavedMessagesView />;
    if (currentRoute === '/settings') return <SettingsView />;
    if (currentRoute === '/admin') return <AdminDashboardView />;
    
    // Default fallback
    return <DashboardView />;
  };

  return (
    <div className="flex h-screen md:pl-16 bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <Toast message={toastMessage} />
      <Sidebar />
      <div className="flex min-w-0 flex-1">
        {renderCurrentView()}
      </div>
      <BottomNav />
      <ActiveCallOverlay />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <DataProvider>
            <AuthGate />
          </DataProvider>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}