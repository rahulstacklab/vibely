/* eslint-disable no-unused-vars */
import { useContext, useMemo } from 'react';
import { MessageCircle, Users, Search, Plus, Bell, Activity, Flame, Sparkles, Filter } from 'lucide-react';
import { AuthContext, RouterContext, DataContext } from '../app/contexts.js';
import { MOCK_USERS } from '../app/constants.js';
import { Avatar, StoryRing, IconButton } from '../components/SharedComponents.jsx';
import { isVibeStoriesEnabled } from './SettingsView.jsx';

export const DashboardView = () => {
  const { stories, chats, users } = useContext(DataContext);
  const { navigate } = useContext(RouterContext);
  const { user, setUser } = useContext(AuthContext);
  const storiesEnabled = isVibeStoriesEnabled();
  const visibleStories = useMemo(() => {
    const storiesByAuthor = new Map();
    stories.forEach(story => {
      const authorStories = storiesByAuthor.get(story.userId) || [];
      authorStories.push(story);
      storiesByAuthor.set(story.userId, authorStories);
    });
    return [...storiesByAuthor.values()]
      .map(authorStories => ({
        stories: authorStories,
        latestStory: authorStories[0],
        entryStory: authorStories.find(story => !story.isViewed) || authorStories[0],
        isViewed: authorStories.every(story => story.isViewed)
      }))
      .sort((first, second) => second.latestStory.createdAt - first.latestStory.createdAt)
      .slice(0, 8);
  }, [stories]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-24 md:pb-8">
      {/* Top Header Mobile */}
      <div className="md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">Vibely</span>
        </div>
        <div className="flex items-center space-x-1">
          <IconButton icon={Search} onClick={() => navigate('/discover')} />
          <IconButton icon={Bell} badge={true} onClick={() => navigate('/notifications')} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

        {storiesEnabled && (
          <section className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="mb-4 flex items-center space-x-2">
              <Sparkles className="text-violet-500" size={20} />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vibe Stories</h2>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
              <div 
                onClick={() => navigate('/stories', { create: true })} 
                className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-400 dark:border-violet-600 flex items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/60 dark:to-fuchsia-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform shadow-sm">
                  <Plus size={24} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Add Story</span>
              </div>

              {visibleStories.length === 0 ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-4 text-xs text-slate-500 dark:text-slate-400 min-w-[180px]">
                  No stories yet. Share your first moment.
                </div>
              ) : (
                visibleStories.map(({ entryStory, latestStory, isViewed }) => {
                  const author = latestStory.userId === user?.uid
                    ? { ...user, name: user.name || 'You' }
                    : users.find(profile => profile.id === latestStory.userId)
                      || MOCK_USERS.find(profile => profile.id === latestStory.userId)
                      || { name: 'Vibely friend', avatar: '' };
                  return (
                    <div 
                      key={latestStory.userId}
                      onClick={() => navigate('/stories', { storyId: entryStory.id })}
                      className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer"
                    >
                      <StoryRing src={author.avatar} isViewed={isViewed} />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-16 text-center">
                        {author.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Quick Vibe Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Chat', icon: MessageCircle, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', path: '/chats' },
            { label: 'Open Groups', icon: Users, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', path: '/groups' },
            { label: 'Mood Match', icon: Flame, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', path: '/discover' },
            { label: 'Moments Feed', icon: Sparkles, color: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400', path: '/moments' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button 
                key={idx} 
                onClick={() => navigate(item.path)}
                className={`p-4 rounded-3xl flex items-center space-x-3 transition-transform hover:scale-102 active:scale-95 border border-slate-100 dark:border-slate-800 ${item.color} bg-white dark:bg-slate-950 shadow-sm`}
              >
                <div className="p-3 rounded-2xl bg-current/10">
                  <Icon size={22} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">{item.label}</span>
                  <span className="text-[11px] text-slate-400">Explore now</span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Vibe Status Selector Filter */}
        <section className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-violet-500/20 relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Your Current Vibe</span>
              <span className="text-xs opacity-80">{user.vibe}</span>
            </div>
            <h3 className="text-xl font-bold">What is your energy right now?</h3>
            <div className="flex flex-wrap gap-2 pt-2">
              {['💻 Coding', '☕ Coffee', '🎧 Music', '✈️ Travel', '🔥 Focused', '😴 Tired'].map((vibe, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setUser(prev => prev ? { ...prev, vibe } : prev);
                    navigate('/');
                  }}
                  className="bg-white/10 hover:bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border border-white/20"
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Conversations Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageCircle className="text-violet-500" size={20} />
              <span>Recent Conversations</span>
            </h2>
            <button onClick={() => navigate('/chats')} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              View All Chats
            </button>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60">
            {chats.map(chat => {
              const isGroup = chat.isGroup;
              const otherUser = !isGroup ? users.find(u => chat.participants.includes(u.id) && u.id !== user.id) : null;
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <div 
                  key={chat.id} 
                  onClick={() => navigate(isGroup ? '/groups' : '/chats', { chatId: chat.id })}
                  className="flex items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-2xl cursor-pointer transition-colors"
                >
                  {isGroup ? (
                    chat.groupAvatar
                      ? <img src={chat.groupAvatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="Group" />
                      : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><Users size={20} /></div>
                  ) : (
                    <Avatar src={otherUser?.avatar} isOnline={otherUser?.isOnline} vibe={otherUser?.vibe} />
                  )}

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                        {isGroup ? chat.groupName : otherUser?.name || 'Vibely member'}
                      </h3>
                      <span className="text-[11px] text-slate-400 shrink-0">{lastMsg?.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {lastMsg?.type === 'voice' ? '🎙️ Voice note (AI Transcript available)' : lastMsg?.text}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="ml-3 bg-violet-600 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-md">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
            {chats.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No conversations yet</p>
                <button onClick={() => navigate('/discover')} className="mt-2 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">
                  Find someone to message
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};


