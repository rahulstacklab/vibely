import { useContext } from 'react';
import { RouterContext, DataContext } from '../app/contexts.js';
import { Avatar } from '../components/SharedComponents.jsx';

export const DiscoverView = () => {
  const {
    users, friendIds, friendRequests, createChat, sendFriendRequest,
    respondToFriendRequest, cancelFriendRequest, removeFriend, showToast
  } = useContext(DataContext);
  const { navigate } = useContext(RouterContext);

  const messageUser = async (targetUser) => {
    try {
      const chatId = await createChat(targetUser);
      navigate('/chats', { chatId });
    } catch (error) {
      console.error('Unable to start chat.', error);
      showToast(`Couldn't start chat: ${error.message}`);
    }
  };

  const friendAction = async (action, targetUser) => {
    try {
      if (action === 'add') await sendFriendRequest(targetUser.id);
      if (action === 'accept' || action === 'reject') {
        const request = friendRequests.find(item =>
          item.direction === 'incoming' && item.senderId === targetUser.id && item.status === 'pending'
        );
        if (request) await respondToFriendRequest(request, action === 'accept');
      }
      if (action === 'cancel') {
        const request = friendRequests.find(item =>
          item.direction === 'outgoing' && item.recipientId === targetUser.id && item.status === 'pending'
        );
        if (request) await cancelFriendRequest(request.id);
      }
      if (action === 'remove') await removeFriend(targetUser.id);
    } catch (error) {
      console.error(`Unable to ${action} friend.`, error);
      showToast(`Couldn't ${action} friend: ${error.message}`);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discover & Mood Match</h1>
          <p className="text-xs text-slate-500">Connect with people sharing your vibe right now.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <Avatar src={u.avatar} size="md" isOnline={u.isOnline} vibe={u.vibe} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</h3>
                  <p className="text-xs text-violet-600 dark:text-violet-400">{u.vibe || '✨ Here to connect'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{u.bio || 'Ready to meet new people.'}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {friendIds.includes(u.id) ? (
                  <button
                    onClick={() => friendAction('remove', u)}
                    className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    Friends · Remove
                  </button>
                ) : friendRequests.some(request =>
                  request.direction === 'incoming' && request.senderId === u.id && request.status === 'pending'
                ) ? (
                  <div className="flex gap-1">
                    <button onClick={() => friendAction('accept', u)} className="rounded-xl bg-violet-600 px-2.5 py-2 text-xs font-semibold text-white">Accept</button>
                    <button onClick={() => friendAction('reject', u)} className="rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Decline</button>
                  </div>
                ) : friendRequests.some(request =>
                  request.direction === 'outgoing' && request.recipientId === u.id && request.status === 'pending'
                ) ? (
                  <button onClick={() => friendAction('cancel', u)} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Request sent</button>
                ) : (
                  <button onClick={() => friendAction('add', u)} className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700">Add friend</button>
                )}
                <button
                  onClick={() => messageUser(u)}
                  className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-600 dark:bg-slate-800"
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
        {users.length === 0 && (
          <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            No other Vibely members yet. Invite a friend to create an account and start chatting.
          </p>
        )}
      </div>
    </div>
  );
};

