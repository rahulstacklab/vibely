/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { Users, Copy, Crown, Send, X, Camera, Save } from 'lucide-react';
import { Avatar } from '../components/SharedComponents.jsx';

export const GroupManagementDialog = ({
  group,
  users,
  currentUser,
  isPending,
  onClose,
  onUpdateGroupProfile,
  onAddMembers,
  onRemoveMember,
  onPromoteAdmin,
  onRotateInvite,
  onLeave,
  onError,
  onSuccess,
  onPending
}) => {
  const [name, setName] = useState(group.groupName || '');
  const [description, setDescription] = useState(group.description || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [rotatedInviteCode, setRotatedInviteCode] = useState(null);
  const avatarPreview = useMemo(
    () => avatarFile ? URL.createObjectURL(avatarFile) : '',
    [avatarFile]
  );
  const isAdmin = group.groupAdmins?.includes(currentUser.uid);
  const inviteCode = rotatedInviteCode ?? group.inviteCode ?? '';
  const inviteLink = inviteCode
    ? `${window.location.origin}/?join=${encodeURIComponent(inviteCode)}`
    : '';
  const memberProfiles = group.participants.map(uid => ({
    id: uid,
    ...(uid === currentUser.uid
      ? currentUser
      : users.find(profile => profile.id === uid) || {})
  }));

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const runGroupAction = async (action, successMessage) => {
    onPending(true);
    try {
      await action();
      if (successMessage) onSuccess(successMessage);
    } catch (error) {
      console.error('Group management action failed.', error);
      onError(error);
    } finally {
      onPending(false);
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      onSuccess('Invite link copied.');
    } catch (error) {
      console.error('Unable to copy group invite link.', error);
      onError(new Error('Could not copy the invite link. Copy it from the link field.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Group info</h2>
            <p className="text-xs text-slate-500">{group.participants.length} members</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        {isAdmin ? (
          <>
            <form
              onSubmit={event => {
                event.preventDefault();
                runGroupAction(async () => {
                  await onUpdateGroupProfile(group.id, { name, description, avatarFile, removeAvatar });
                  setAvatarFile(null);
                  setRemoveAvatar(false);
                }, 'Group profile updated.');
              }}
              className="mb-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                {avatarPreview || (removeAvatar ? '' : group.groupAvatar)
                  ? <img src={avatarPreview || group.groupAvatar} alt="Group profile" className="h-14 w-14 rounded-2xl bg-slate-100 object-cover dark:bg-slate-800" />
                  : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><Users size={22} /></div>}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                  <Camera size={15} />
                  Change group photo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        onError(new Error('Choose an image for the group photo.'));
                      } else if (file.size > 5 * 1024 * 1024) {
                        onError(new Error('Group photos must be 5 MB or smaller.'));
                      } else {
                        setAvatarFile(file);
                        setRemoveAvatar(false);
                      }
                    }}
                  />
                </label>
                {avatarFile && (
                  <button type="button" onClick={() => setAvatarFile(null)} className="text-xs font-semibold text-rose-600 hover:underline">
                    Remove selection
                  </button>
                )}
                {!avatarFile && group.groupAvatar && !removeAvatar && (
                  <button type="button" onClick={() => setRemoveAvatar(true)} className="text-xs font-semibold text-rose-600 hover:underline">
                    Remove photo
                  </button>
                )}
                {removeAvatar && (
                  <button type="button" onClick={() => setRemoveAvatar(false)} className="text-xs font-semibold text-slate-500 hover:underline">
                    Undo
                  </button>
                )}
              </div>
              <input
                value={name}
                maxLength={60}
                minLength={2}
                required
                onChange={event => setName(event.target.value)}
                aria-label="Group name"
                placeholder="Group name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <textarea
                value={description}
                maxLength={500}
                rows={3}
                onChange={event => setDescription(event.target.value)}
                aria-label="Group description"
                placeholder="What is this group about?"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400">{description.length}/500 characters</span>
                <button
                  type="submit"
                  disabled={isPending || (name.trim() === group.groupName
                    && description.trim() === (group.description || '')
                    && !avatarFile
                    && !removeAvatar)}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>

            <div className="mb-5 space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Invite link</p>
              <div className="flex gap-2">
                <input readOnly value={inviteLink} aria-label="Group invite link" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                <button type="button" onClick={copyInvite} disabled={!inviteLink} aria-label="Copy invite link" className="rounded-xl border border-slate-200 px-3 text-violet-600 hover:bg-violet-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"><Copy size={17} /></button>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => runGroupAction(async () => {
                  const nextCode = await onRotateInvite(group.id);
                  setRotatedInviteCode(nextCode);
                }, 'Invite link regenerated. The old link no longer works.')}
                className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                Regenerate invite link
              </button>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault();
                runGroupAction(async () => {
                  await onAddMembers(group.id, selectedMembers);
                  setSelectedMembers([]);
                }, 'Members added.');
              }}
              className="mb-5 space-y-2"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add members</p>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                {users.filter(profile => !group.participants.includes(profile.id)).map(profile => (
                  <label key={profile.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(profile.id)}
                      onChange={event => setSelectedMembers(current => event.target.checked
                        ? [...current, profile.id]
                        : current.filter(id => id !== profile.id))}
                    />
                    {profile.name || profile.username || 'Vibely member'}
                  </label>
                ))}
                {users.every(profile => group.participants.includes(profile.id)) && (
                  <p className="p-2 text-xs text-slate-500">Everyone is already in this group.</p>
                )}
              </div>
              <button type="submit" disabled={isPending || selectedMembers.length === 0} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add selected</button>
            </form>
          </>
        ) : (
          <div className="mb-5 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{group.groupName}</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{group.description || 'No group description yet.'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Group profile and invite settings are managed by group admins.</p>
          </div>
        )}

        <div className="mb-5 space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Members</p>
          {memberProfiles.map(profile => {
            const memberIsAdmin = group.groupAdmins?.includes(profile.id);
            const isSelf = profile.id === currentUser.uid;
            return (
              <div key={profile.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <Avatar src={profile.avatar} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                  {profile.name || profile.username || 'Vibely member'}{isSelf ? ' (you)' : ''}
                </span>
                {memberIsAdmin && <span className="flex items-center gap-1 text-xs text-amber-600"><Crown size={13} /> Admin</span>}
                {isAdmin && !isSelf && (
                  <div className="flex gap-2">
                    {!memberIsAdmin && (
                      <button type="button" disabled={isPending} onClick={() => runGroupAction(
                        () => onPromoteAdmin(group.id, profile.id), 'Member promoted to admin.'
                      )} className="text-xs font-semibold text-violet-600">Make admin</button>
                    )}
                    <button type="button" disabled={isPending || profile.id === group.ownerId} onClick={() => {
                      if (window.confirm(`Remove ${profile.name || 'this member'} from the group?`)) {
                        runGroupAction(() => onRemoveMember(group.id, profile.id), 'Member removed.');
                      }
                    }} className="text-xs font-semibold text-rose-600">Remove</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (window.confirm('Leave this group?')) runGroupAction(onLeave, 'You left the group.');
          }}
          className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
        >
          Leave group
        </button>
      </section>
    </div>
  );
};

export const ForwardMessageDialog = ({
  chats,
  users,
  userId,
  activeChatId,
  message,
  isForwarding,
  onClose,
  onForward
}) => {
  const availableChats = chats.filter(chat => chat.id !== activeChatId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !isForwarding) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-message-title"
        className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id="forward-message-title" className="font-bold text-slate-900 dark:text-white">Forward message</h2>
            <p className="mt-1 truncate text-xs text-slate-500">{message.text}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={isForwarding}
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {availableChats.map(chat => {
            const recipient = users.find(profile =>
              chat.participants.includes(profile.id) && profile.id !== userId
            );
            return (
              <button
                key={chat.id}
                type="button"
                disabled={isForwarding}
                onClick={() => onForward(chat.id)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-violet-50 disabled:opacity-50 dark:hover:bg-violet-950/40"
              >
                <Avatar src={recipient?.avatar} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {recipient?.name || 'Vibely member'}
                </span>
                <Send size={16} className="shrink-0 text-violet-500" />
              </button>
            );
          })}
          {availableChats.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">Start another conversation before forwarding a message.</p>
          )}
        </div>
      </section>
    </div>
  );
};


