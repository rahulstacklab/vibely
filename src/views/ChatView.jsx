/* eslint-disable no-unused-vars */
import { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { MessageCircle, Users, Search, Plus, Copy, Mic, Send, Smile, Paperclip, MoreVertical, Phone, Video, Link2, CheckCheck, ChevronLeft, ChevronDown, X, Globe, Bookmark, Highlighter, FileText, StopCircle, Pencil, Trash2, Save } from 'lucide-react';
import { AuthContext, RouterContext, DataContext } from '../app/contexts.js';
import { MESSAGE_REACTIONS, MORE_MESSAGE_REACTIONS, getMessageDate, getMessageDateLabel, getAttachmentMimeType } from '../app/constants.js';
import { Avatar, IconButton } from '../components/SharedComponents.jsx';
import { createPortal } from 'react-dom';
import { GroupManagementDialog, ForwardMessageDialog } from '../components/ChatDialogs.jsx';
import { arrayUnion, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.js';

export const ChatView = () => {
  const {
    chats, users, createChat, createGroup, joinGroup, addGroupMembers,
    removeGroupMember, promoteGroupAdmin, updateGroupProfile, rotateGroupInvite, leaveGroup,
    sendMessage, sendAttachment, editMessage,
    deleteMessage, hideMessageForMe, hideConversation, addReaction, forwardMessage,
    toggleSaveMessage, votePoll,
    setActiveCall, showToast
  } = useContext(DataContext);
  const { routeParams, navigate, currentRoute } = useContext(RouterContext);
  const { user } = useContext(AuthContext);

  const chatThemeOptions = [
    { id: 'amethyst', label: 'Amethyst', swatch: '#7657c8' },
    { id: 'lagoon', label: 'Lagoon', swatch: '#258b91' },
    { id: 'terracotta', label: 'Terracotta', swatch: '#c86f50' },
    { id: 'meadow', label: 'Meadow', swatch: '#568568' },
    { id: 'berry', label: 'Berry', swatch: '#b6537f' }
  ];
  const isGroupsRoute = currentRoute === '/groups';
  const activeChatId = routeParams.chatId || null;
  const [inputText, setInputText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [showTranslation, setShowTranslation] = useState({});
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deleteOptionsMessageId, setDeleteOptionsMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [reactionPickerAnchor, setReactionPickerAnchor] = useState(null);
  const [isExpandedReactionPicker, setIsExpandedReactionPicker] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [chatThemes, setChatThemes] = useState(() => {
    try {
      const storedThemes = JSON.parse(window.localStorage.getItem(`vibely_chat_themes_${user.uid}`) || '{}');
      return storedThemes && typeof storedThemes === 'object' && !Array.isArray(storedThemes)
        ? Object.fromEntries(Object.entries(storedThemes).filter(([, theme]) =>
          ['amethyst', 'lagoon', 'terracotta', 'meadow', 'berry'].includes(theme)
        ))
        : {};
    } catch (error) {
      console.error('Unable to load saved chat themes.', error);
      return {};
    }
  });
  const [highlightedMessages, setHighlightedMessages] = useState(() => {
    try {
      const storedHighlights = JSON.parse(window.localStorage.getItem(`vibely_highlighted_messages_${user.uid}`) || '[]');
      return Array.isArray(storedHighlights)
        ? storedHighlights.filter(messageKey => typeof messageKey === 'string')
        : [];
    } catch (error) {
      console.error('Unable to load highlighted messages.', error);
      return [];
    }
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupInviteInput, setGroupInviteInput] = useState('');
  const [isGroupActionPending, setIsGroupActionPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStartedAtRef = useRef(0);

  const activeChat = chats.find(c => c.id === activeChatId);
  const isGroup = activeChat?.isGroup;
  const activeTheme = chatThemes[activeChatId] || 'amethyst';
  const reactionPickerPosition = reactionPickerAnchor
    ? (() => {
      const width = Math.min(320, window.innerWidth - 16);
      const height = isExpandedReactionPicker
        ? Math.min(360, window.innerHeight - 16)
        : 52;
      const left = Math.max(
        8,
        Math.min(
          reactionPickerAnchor.left + reactionPickerAnchor.width / 2 - width / 2,
          window.innerWidth - width - 8
        )
      );
      const above = reactionPickerAnchor.top - height - 8 >= 8;
      const top = above
        ? reactionPickerAnchor.top - height - 8
        : Math.max(8, Math.min(reactionPickerAnchor.bottom + 8, window.innerHeight - height - 8));
      return { left, top, width };
    })()
    : null;
  const visibleChats = chats.filter(chat => Boolean(chat.isGroup) === isGroupsRoute);
  const otherUser = !isGroup ? users.find(u => activeChat?.participants.includes(u.id) && u.id !== user.id) : null;

  const handleChatThemeChange = (themeId) => {
    if (!activeChat) return;
    try {
      const preferencesKey = `vibely_chat_themes_${user.uid}`;
      const savedThemes = JSON.parse(window.localStorage.getItem(preferencesKey) || '{}');
      const nextThemes = { ...savedThemes, [activeChat.id]: themeId };
      window.localStorage.setItem(preferencesKey, JSON.stringify(nextThemes));
      setChatThemes(previous => ({ ...previous, [activeChat.id]: themeId }));
    } catch (error) {
      console.error('Unable to save chat theme.', error);
      showToast(`Couldn't save chat theme: ${error.message}`);
    }
  };

  const handleMessageHighlight = (messageKey) => {
    const nextHighlights = highlightedMessages.includes(messageKey)
      ? highlightedMessages.filter(key => key !== messageKey)
      : [...highlightedMessages, messageKey];
    try {
      window.localStorage.setItem(
        `vibely_highlighted_messages_${user.uid}`,
        JSON.stringify(nextHighlights)
      );
      setHighlightedMessages(nextHighlights);
    } catch (error) {
      console.error('Unable to save highlighted messages.', error);
      showToast(`Couldn't update message highlight: ${error.message}`);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (!reactionPickerMessageId) return undefined;
    const closePicker = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setIsExpandedReactionPicker(false);
        return;
      }
      if (event.type === 'pointerdown' &&
        !event.target.closest('[data-reaction-picker]') &&
        !event.target.closest('[data-reaction-trigger]')) {
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setIsExpandedReactionPicker(false);
      }
      if (event.type === 'scroll') {
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setIsExpandedReactionPicker(false);
      }
      if (event.type === 'resize') {
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setIsExpandedReactionPicker(false);
      }
    };
    window.addEventListener('keydown', closePicker);
    window.addEventListener('resize', closePicker);
    document.addEventListener('pointerdown', closePicker);
    document.addEventListener('scroll', closePicker, true);
    return () => {
      window.removeEventListener('keydown', closePicker);
      window.removeEventListener('resize', closePicker);
      document.removeEventListener('pointerdown', closePicker);
      document.removeEventListener('scroll', closePicker, true);
    };
  }, [reactionPickerMessageId]);

  useEffect(() => {
    if (!openMessageMenuId) return undefined;
    const closeMenu = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setOpenMessageMenuId(null);
        return;
      }
      if (event.type === 'pointerdown' &&
        event.target.closest('[data-message-actions]')?.dataset.messageActions !== openMessageMenuId) {
        setOpenMessageMenuId(null);
      }
    };
    document.addEventListener('pointerdown', closeMenu);
    window.addEventListener('keydown', closeMenu);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      window.removeEventListener('keydown', closeMenu);
    };
  }, [openMessageMenuId]);

  useEffect(() => {
    if (!activeChat || !user?.uid) return undefined;

    let isActive = true;
    const markVisibleMessagesAsRead = async () => {
      if (!isActive || document.visibilityState !== 'visible') return;
      const unreadMessages = activeChat.messages.filter(message =>
        message.senderId !== user.uid && !message.readBy?.includes(user.uid)
      );
      for (let index = 0; index < unreadMessages.length; index += 450) {
        const batch = writeBatch(db);
        unreadMessages.slice(index, index + 450).forEach(message => {
          batch.update(doc(db, 'chats', activeChat.id, 'messages', message.id), {
            readBy: arrayUnion(user.uid)
          });
        });
        try {
          await batch.commit();
        } catch (error) {
          console.error('Unable to mark messages as read.', error);
          showToast(`Couldn't update read status: ${error.message}`);
          return;
        }
      }
    };

    markVisibleMessagesAsRead();
    document.addEventListener('visibilitychange', markVisibleMessagesAsRead);
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', markVisibleMessagesAsRead);
    };
  }, [activeChat, user?.uid, showToast]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!activeChat) return;
    const replyTo = replyingToMessage
      ? {
        messageId: replyingToMessage.id,
        senderId: replyingToMessage.senderId,
        text: replyingToMessage.text || 'Attachment'
      }
      : null;
    sendMessage(activeChat.id, inputText, replyTo)
      .then(() => {
        setInputText('');
        setReplyingToMessage(null);
      })
      .catch((error) => {
        console.error('Unable to send message.', error);
        showToast(`Couldn't send message: ${error.message}`);
      });
  };

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || message.attachmentUrl || '');
      showToast('Message copied.');
    } catch (error) {
      console.error('Unable to copy message.', error);
      showToast(`Couldn't copy message: ${error.message}`);
    }
    setOpenMessageMenuId(null);
  };

  const handleSaveEdit = async (messageId) => {
    try {
      await editMessage(activeChat.id, messageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
      showToast('Message updated.');
    } catch (error) {
      console.error('Unable to edit message.', error);
      showToast(`Couldn't edit message: ${error.message}`);
    }
  };

  const handleDeleteMessage = async (messageId, scope) => {
    try {
      if (scope === 'everyone') {
        await deleteMessage(activeChat.id, messageId);
        showToast('Message deleted for everyone.');
      } else {
        await hideMessageForMe(activeChat.id, messageId);
        showToast('Message deleted for you.');
      }
      setDeleteOptionsMessageId(null);
    } catch (error) {
      console.error('Unable to delete message.', error);
      showToast(`Couldn't delete message: ${error.message}`);
    }
  };

  const handleHideConversation = async () => {
    if (!window.confirm('Remove this conversation from your chat list? The other participant will still have their copy.')) return;
    try {
      await hideConversation(activeChat.id);
      setShowChatOptions(false);
      navigate(isGroup ? '/groups' : '/chats');
      showToast('Conversation removed from your chat list.');
    } catch (error) {
      console.error('Unable to remove conversation.', error);
      showToast(`Couldn't remove conversation: ${error.message}`);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    setReactionPickerMessageId(null);
    setReactionPickerAnchor(null);
    setIsExpandedReactionPicker(false);
    try {
      await addReaction(activeChat.id, messageId, emoji);
    } catch (error) {
      console.error('Unable to react to message.', error);
      showToast(`Couldn't add reaction: ${error.message}`);
    }
  };

  const handleOpenReactionPicker = (messageId, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setReactionPickerMessageId(messageId);
    setReactionPickerAnchor({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width
    });
    setIsExpandedReactionPicker(false);
    setOpenMessageMenuId(null);
  };

  const handleReplyToMessage = (message) => {
    setReplyingToMessage(message);
    setOpenMessageMenuId(null);
    messageInputRef.current?.focus();
  };

  const handleForwardMessage = async (targetChatId) => {
    if (!forwardingMessage || isForwarding) return;
    setIsForwarding(true);
    try {
      await forwardMessage(activeChat.id, forwardingMessage, targetChatId);
      setForwardingMessage(null);
      showToast('Message forwarded.');
    } catch (error) {
      console.error('Unable to forward message.', error);
      showToast(`Couldn't forward message: ${error.message}`);
    } finally {
      setIsForwarding(false);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (isGroupActionPending) return;
    setIsGroupActionPending(true);
    try {
      const chatId = await createGroup(newGroupName);
      setShowCreateGroup(false);
      setNewGroupName('');
      navigate('/groups', { chatId });
      showToast('Group created. Invite members from Group info.');
    } catch (error) {
      console.error('Unable to create group.', error);
      showToast(`Couldn't create group: ${error.message}`);
    } finally {
      setIsGroupActionPending(false);
    }
  };

  const handleJoinGroup = async (event) => {
    event.preventDefault();
    if (isGroupActionPending) return;
    setIsGroupActionPending(true);
    try {
      let inviteCode = groupInviteInput.trim();
      if (inviteCode.includes('://')) {
        inviteCode = new URL(inviteCode).searchParams.get('join') || '';
      }
      const chatId = await joinGroup(inviteCode);
      setShowJoinGroup(false);
      setGroupInviteInput('');
      navigate('/groups', { chatId });
      showToast('You joined the group.');
    } catch (error) {
      console.error('Unable to join group.', error);
      showToast(`Couldn't join group: ${error.message}`);
    } finally {
      setIsGroupActionPending(false);
    }
  };

  const handleAttachmentSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0 || !activeChat) return;

    const mimeType = getAttachmentMimeType(files[0]);
    const type = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
        ? 'video'
        : 'document';
    setIsUploading(true);
    try {
      await sendAttachment(activeChat.id, files.length === 1 ? files[0] : files, type);
    } catch (error) {
      console.error('Unable to upload attachment.', error);
      showToast(`Couldn't send file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (isUploading || !activeChat) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(candidate => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      const chatId = activeChat.id;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = event => {
        console.error('Voice recording failed.', event.error);
        showToast(`Voice recording failed: ${event.error?.message || 'unknown error'}`);
      };
      recorder.onstart = () => {
        recordingStartedAtRef.current = Date.now();
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);
        const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        if (!chunks.length) return;

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
        const voiceFile = new File([audioBlob], `voice-note-${Date.now()}.${extension}`, {
          type: audioBlob.type
        });
        setIsUploading(true);
        try {
          await sendAttachment(chatId, voiceFile, 'voice', durationSeconds);
        } catch (error) {
          console.error('Unable to send voice note.', error);
          showToast(`Couldn't send voice note: ${error.message}`);
        } finally {
          setIsUploading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Unable to start voice recording.', error);
      showToast(`Couldn't access your microphone: ${error.message}`);
    }
  };

  return (
    <div className="flex-1 flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden pb-16 md:pb-0">
      
      {/* Conversations Sidebar (Left) */}
      <div className={`w-full md:w-80 lg:w-96 min-w-0 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col ${routeParams.chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isGroupsRoute ? 'Groups' : 'Chats'}</h1>
          <div className="flex items-center space-x-1">
            {isGroupsRoute ? (
              <>
                <IconButton icon={Users} title="Create group" onClick={() => setShowCreateGroup(true)} />
                <IconButton icon={Link2} title="Join group" onClick={() => setShowJoinGroup(true)} />
              </>
            ) : (
              <IconButton icon={Plus} title="New Chat" onClick={() => navigate('/discover')} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 border-b border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => navigate('/chats')}
            aria-current={!isGroupsRoute ? 'page' : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              !isGroupsRoute
                ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-800 dark:text-violet-300'
                : 'text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800'
            }`}
          >
            Chats
          </button>
          <button
            type="button"
            onClick={() => navigate('/groups')}
            aria-current={isGroupsRoute ? 'page' : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              isGroupsRoute
                ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-800 dark:text-violet-300'
                : 'text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800'
            }`}
          >
            Groups
          </button>
        </div>

        {/* Search Chat */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search chats & transcripts..." 
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-2 space-y-1">
          {visibleChats.map(chat => {
            const chatIsGroup = chat.isGroup;
            const targetUser = !chatIsGroup ? users.find(u => chat.participants.includes(u.id) && u.id !== user.id) : null;
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isSelected = chat.id === activeChatId;

            return (
              <div 
                key={chat.id}
                onClick={() => {
                  navigate(chatIsGroup ? '/groups' : '/chats', { chatId: chat.id });
                }}
                className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
              >
                {chatIsGroup ? (
                  chat.groupAvatar
                    ? <img src={chat.groupAvatar} alt={`${chat.groupName || 'Group'} image`} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"><Users size={20} /></div>
                ) : (
                  <Avatar src={targetUser?.avatar} isOnline={targetUser?.isOnline} vibe={targetUser?.vibe} />
                )}

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {chatIsGroup ? chat.groupName : targetUser?.name || 'Vibely member'}
                    </h3>
                    <span className="text-[10px] text-slate-400">{lastMsg?.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {lastMsg?.type === 'voice' ? '🎙️ Voice note' : lastMsg?.text}
                  </p>
                </div>
              </div>
            );
          })}
          {visibleChats.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isGroupsRoute ? 'No groups yet' : 'No conversations yet'}
              </p>
              {isGroupsRoute ? (
                <div className="mt-3 flex justify-center gap-2">
                  <button type="button" onClick={() => setShowCreateGroup(true)} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                    Create group
                  </button>
                  <button type="button" onClick={() => setShowJoinGroup(true)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Join group
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => navigate('/discover')} className="mt-2 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">
                  Find someone to message
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Window (Right) */}
      <div className={`chat-theme chat-theme-${activeTheme} flex-1 flex min-w-0 flex-col ${!routeParams.chatId && 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="chat-theme-header shrink-0 p-3.5 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate(isGroup ? '/groups' : '/chats')} className="md:hidden text-slate-500">
                  <ChevronLeft size={22} />
                </button>
                {isGroup ? (
                  activeChat.groupAvatar
                    ? <img src={activeChat.groupAvatar} alt="Group" className="h-10 w-10 rounded-full object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"><Users size={19} /></div>
                ) : (
                  <Avatar src={otherUser?.avatar} size="sm" isOnline={otherUser?.isOnline} />
                )}
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {isGroup ? activeChat.groupName : otherUser?.name || 'Vibely member'}
                  </h2>
                  <p className="chat-theme-status text-[11px] font-medium">
                    {isGroup ? `${activeChat.participants.length} members · ${activeChat.groupAdmins?.includes(user.id) ? 'Admin' : 'Group'}` : 'Live chat'}
                  </p>
                </div>
              </div>

              <div className="relative flex items-center space-x-1">
                {!isGroup && <IconButton icon={Phone} title="Voice Call" onClick={() => setActiveCall({ user: otherUser, type: 'voice' })} />}
                {!isGroup && <IconButton icon={Video} title="Video Call" onClick={() => setActiveCall({ user: otherUser, type: 'video' })} />}
                <IconButton
                  icon={MoreVertical}
                  title="Chat Options"
                  onClick={() => setShowChatOptions(value => !value)}
                />
                {showChatOptions && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <div className="px-2 pb-2 pt-1">
                      <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Chat theme</p>
                      <div className="grid grid-cols-5 gap-1">
                        {chatThemeOptions.map(theme => (
                          <button
                            key={theme.id}
                            type="button"
                            title={theme.label}
                            aria-label={`${theme.label} chat theme`}
                            aria-pressed={activeTheme === theme.id}
                            onClick={() => handleChatThemeChange(theme.id)}
                            className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[9px] font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-300 dark:hover:bg-slate-800 ${activeTheme === theme.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                          >
                            <span
                              className={`h-6 w-6 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 dark:border-slate-900 ${activeTheme === theme.id ? 'scale-110' : ''}`}
                              style={{ backgroundColor: theme.swatch }}
                            />
                            {theme.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    {isGroup ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowGroupManagement(true);
                          setShowChatOptions(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Users size={16} />
                        Group info
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleHideConversation}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={16} />
                        Remove conversation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="chat-wallpaper min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6">
              <div className="mx-auto max-w-5xl space-y-3.5">
              {activeChat.messages.map((msg, index) => {
                const messageDate = getMessageDate(msg.createdAt);
                const previousDate = getMessageDate(activeChat.messages[index - 1]?.createdAt);
                const showDateSeparator = messageDate &&
                  (!previousDate || messageDate.toDateString() !== previousDate.toDateString());
                const isMe = msg.senderId === user.id;
                const imageAttachments = msg.type === 'image'
                  ? (Array.isArray(msg.attachments) && msg.attachments.length > 0
                    ? msg.attachments.map(attachment => typeof attachment === 'string'
                      ? attachment
                      : attachment.attachmentUrl)
                    : [msg.attachmentUrl])
                  : [];
                const messageKey = `${activeChat.id}:${msg.id}`;
                const isHighlighted = highlightedMessages.includes(messageKey);
                const reactionCounts = Object.values(msg.reactions || {}).reduce((counts, emoji) => ({
                  ...counts,
                  [emoji]: (counts[emoji] || 0) + 1
                }), {});

                return (
                  <Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div
                        className="chat-date-separator"
                        role="separator"
                      >
                        <time dateTime={messageDate.toISOString()}>{getMessageDateLabel(messageDate)}</time>
                      </div>
                    )}
                    <div
                      className={`group flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`chat-message-content space-y-1 ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                      
                      {/* Bubble */}
                      <div className={`chat-message-bubble ${msg.type === 'image' ? '' : 'chat-message-bubble-with-menu'} relative rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_1px_1px_rgba(11,20,26,0.12)] [overflow-wrap:anywhere] ${isMe ? 'chat-message-outgoing rounded-br-md' : 'chat-message-incoming rounded-bl-md border border-black/[0.04] dark:border-white/[0.04]'} ${isHighlighted ? 'chat-message-highlighted' : ''}`}>
                        
                        {isGroup && !isMe && (
                          <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {users.find(profile => profile.id === msg.senderId)?.name || 'Group member'}
                          </p>
                        )}
                        {msg.replyTo && (
                          <div className="mb-2 rounded-lg border-l-2 border-violet-500 bg-black/5 px-2.5 py-1.5 text-xs dark:bg-white/10">
                            <p className="font-semibold text-violet-700 dark:text-violet-300">
                              {users.find(profile => profile.id === msg.replyTo.senderId)?.name || 'Reply'}
                            </p>
                            <p className="mt-0.5 line-clamp-2 opacity-75">{msg.replyTo.text}</p>
                          </div>
                        )}
                        {msg.forwardedFrom && (
                          <p className="mb-2 flex items-center gap-1 text-xs italic opacity-75">
                            <Send size={12} />
                            Forwarded from {msg.forwardedFrom}
                          </p>
                        )}

                        {/* Voice Message Player Layout */}
                        {msg.type === 'voice' ? (
                          <div className="space-y-2">
                            <p className="font-semibold">Voice note</p>
                            <audio controls preload="metadata" src={msg.attachmentUrl} className="max-w-full" />
                            <p className="text-xs opacity-75">{msg.duration}s</p>
                          </div>
                        ) : msg.type === 'poll' ? (
                          /* Poll Layout */
                          <div className="space-y-3">
                            <p className="font-bold">{msg.question}</p>
                            <div className="space-y-2">
                              {msg.options.map((opt) => {
                                const percent = Math.round((opt.votes / (msg.totalVotes || 1)) * 100);
                                return (
                                  <div 
                                    key={opt.id}
                                    onClick={() => votePoll(activeChat.id, msg.id, opt.id)}
                                    className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 cursor-pointer overflow-hidden text-slate-900 dark:text-white"
                                  >
                                    <div className="absolute left-0 top-0 bottom-0 bg-violet-500/20 transition-all" style={{ width: `${percent}%` }}></div>
                                    <div className="relative flex justify-between text-xs font-semibold">
                                      <span>{opt.text}</span>
                                      <span>{percent}% ({opt.votes})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : msg.type === 'image' ? (
                          <div className={`chat-image-gallery ${imageAttachments.length === 1 ? 'chat-image-gallery-single' : ''} ${imageAttachments.length === 2 ? 'chat-image-gallery-pair' : ''}`}>
                            {imageAttachments.slice(0, 4).map((image, imageIndex) => (
                              <a
                                key={image}
                                href={image}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open photo ${imageIndex + 1}`}
                                className="chat-image-tile"
                              >
                                <img src={image} alt={`Shared photo ${imageIndex + 1}`} />
                                {imageIndex === 3 && imageAttachments.length > 4 && (
                                  <span className="chat-image-overflow">
                                    +{imageAttachments.length - 4}
                                  </span>
                                )}
                              </a>
                            ))}
                            <div className="chat-image-meta">
                              <time className="opacity-90">{msg.timestamp}</time>
                              {isMe && (
                                <CheckCheck
                                  size={14}
                                  aria-label={msg.readBy?.some(uid => uid !== user.id) ? 'Seen' : 'Sent'}
                                  title={msg.readBy?.some(uid => uid !== user.id) ? 'Seen' : 'Sent'}
                                  className={msg.readBy?.some(uid => uid !== user.id) ? 'text-violet-700' : 'text-white'}
                                  style={msg.readBy?.some(uid => uid !== user.id) ? { color: 'rgb(109 40 217)' } : undefined}
                                />
                              )}
                            </div>
                          </div>
                        ) : msg.type === 'video' ? (
                          <div className="space-y-2">
                            {msg.text && <p>{msg.text}</p>}
                            <video controls preload="metadata" src={msg.attachmentUrl} className="max-h-80 max-w-full rounded-xl" />
                          </div>
                        ) : msg.type === 'document' ? (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 rounded-xl bg-black/10 p-3 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
                          >
                            <FileText size={24} className="shrink-0" />
                            <span className="min-w-0">
                              <span className="block font-semibold">Document</span>
                              <span className="text-xs opacity-75">{(msg.fileSize / (1024 * 1024)).toFixed(2)} MB · Open file</span>
                            </span>
                          </a>
                        ) : msg.type === 'text' && editingMessageId === msg.id ? (
                          <div className="space-y-2">
                            <input
                              autoFocus
                              value={editingText}
                              maxLength={4000}
                              onChange={event => setEditingText(event.target.value)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault();
                                  handleSaveEdit(msg.id);
                                }
                                if (event.key === 'Escape') {
                                  setEditingMessageId(null);
                                  setEditingText('');
                                }
                              }}
                              className="w-full rounded-lg bg-black/10 px-2 py-1 text-current outline-none placeholder:text-current/60"
                              aria-label="Edit message"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingText('');
                                }}
                                className="rounded-md px-2 py-1 opacity-80 hover:opacity-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={!editingText.trim()}
                                className="rounded-md bg-white/20 px-2 py-1 font-semibold disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Translation Toggle */}
                        {msg.translation && (
                          <div className="mt-2 pt-2 border-t border-current/10">
                            <button 
                              onClick={() => setShowTranslation(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                              className="text-[11px] font-semibold flex items-center space-x-1 opacity-90"
                            >
                              <Globe size={12} />
                              <span>{showTranslation[msg.id] ? 'Original' : 'Translate Message'}</span>
                            </button>
                            {showTranslation[msg.id] && (
                              <p className="text-xs font-medium mt-1 text-emerald-300">
                                Translation: "{msg.translation}"
                              </p>
                            )}
                          </div>
                        )}

                        {msg.type === 'image' ? null : (
                          <div className="chat-message-meta">
                            {msg.editedAt && <span className="opacity-80">Edited</span>}
                            <time className="opacity-80">{msg.timestamp}</time>
                            {isMe && (
                              <CheckCheck
                                size={14}
                                aria-label={msg.readBy?.some(uid => uid !== user.id) ? 'Seen' : 'Sent'}
                                title={msg.readBy?.some(uid => uid !== user.id) ? 'Seen' : 'Sent'}
                                className={msg.readBy?.some(uid => uid !== user.id)
                                  ? 'text-violet-700'
                                  : 'text-slate-500/80 dark:text-white/60'}
                                style={msg.readBy?.some(uid => uid !== user.id)
                                  ? { color: 'rgb(109 40 217)' }
                                  : undefined}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        data-reaction-trigger={msg.id}
                        aria-label="React to message"
                        aria-haspopup="dialog"
                        aria-expanded={reactionPickerMessageId === msg.id}
                        onClick={event => handleOpenReactionPicker(msg.id, event)}
                        className={`chat-reaction-trigger ${isMe ? 'chat-reaction-trigger-outgoing' : 'chat-reaction-trigger-incoming'} ${reactionPickerMessageId === msg.id ? 'is-open' : ''}`}
                      >
                        <Smile size={19} />
                      </button>

                      <div className="chat-message-actions flex items-center">
                        <div className="relative" data-message-actions={msg.id}>
                          <button
                            type="button"
                            title="Open message actions"
                            aria-label="Open message actions"
                            aria-haspopup="menu"
                            aria-expanded={openMessageMenuId === msg.id}
                            onClick={() => setOpenMessageMenuId(current => current === msg.id ? null : msg.id)}
                            className={`chat-message-action-button chat-message-dropdown-trigger ${openMessageMenuId === msg.id ? 'is-open' : ''}`}
                          >
                            <ChevronDown size={14} />
                          </button>
                          {openMessageMenuId === msg.id && (
                            <div
                              role="menu"
                              aria-label="Message actions"
                              className={`chat-message-menu ${isMe ? 'right-0' : 'left-0'} ${index >= activeChat.messages.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleReplyToMessage(msg)}
                                className="chat-message-menu-item"
                              >
                                <MessageCircle size={16} /> Reply
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleCopyMessage(msg)}
                                className="chat-message-menu-item"
                              >
                                <Copy size={16} /> Copy
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={event => handleOpenReactionPicker(msg.id, event)}
                                className="chat-message-menu-item"
                              >
                                <Smile size={16} /> React
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setForwardingMessage(msg);
                                  setOpenMessageMenuId(null);
                                }}
                                className="chat-message-menu-item"
                              >
                                <Send size={16} /> Forward
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  toggleSaveMessage(msg);
                                  setOpenMessageMenuId(null);
                                }}
                                className="chat-message-menu-item"
                              >
                                <Bookmark size={16} /> Star message
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                aria-pressed={isHighlighted}
                                onClick={() => {
                                  handleMessageHighlight(messageKey);
                                  setOpenMessageMenuId(null);
                                }}
                                className="chat-message-menu-item"
                              >
                                <Highlighter size={16} /> {isHighlighted ? 'Remove highlight' : 'Highlight'}
                              </button>
                              {isMe && msg.type === 'text' && editingMessageId !== msg.id && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditingText(msg.text);
                                    setOpenMessageMenuId(null);
                                  }}
                                  className="chat-message-menu-item"
                                >
                                  <Pencil size={16} /> Edit
                                </button>
                              )}
                              <div className="chat-message-menu-divider" />
                              {deleteOptionsMessageId === msg.id ? (
                                <>
                                  {isMe && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        handleDeleteMessage(msg.id, 'everyone');
                                        setOpenMessageMenuId(null);
                                      }}
                                      className="chat-message-menu-item text-rose-600 dark:text-rose-400"
                                    >
                                      <Trash2 size={16} /> Delete for everyone
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      handleDeleteMessage(msg.id, 'me');
                                      setOpenMessageMenuId(null);
                                    }}
                                    className="chat-message-menu-item text-rose-600 dark:text-rose-400"
                                  >
                                    <Trash2 size={16} /> Delete for me
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => setDeleteOptionsMessageId(msg.id)}
                                  className="chat-message-menu-item text-rose-600 dark:text-rose-400"
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              )}
                              <div className="chat-message-menu-divider" />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMessageMenuId(null);
                                  setDeleteOptionsMessageId(null);
                                }}
                                className="chat-message-menu-item"
                              >
                                <X size={16} /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div className={`flex flex-wrap gap-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              title={`${count} reaction${count === 1 ? '' : 's'}`}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`rounded-full border px-2 py-0.5 text-xs ${
                                msg.reactions?.[user.id] === emoji
                                  ? 'border-violet-300 bg-violet-100 dark:border-violet-700 dark:bg-violet-950'
                                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                              }`}
                            >
                              {emoji} {count}
                            </button>
                          ))}
                        </div>
                      )}

                      </div>
                    </div>
                    {reactionPickerMessageId === msg.id && reactionPickerAnchor && reactionPickerPosition && createPortal(
                      <div
                        data-reaction-picker
                        role="dialog"
                        aria-label="Choose a message reaction"
                        className={`chat-reaction-picker ${isExpandedReactionPicker ? 'chat-reaction-picker-expanded' : ''}`}
                        style={{
                          left: `${reactionPickerPosition.left}px`,
                          top: `${reactionPickerPosition.top}px`,
                          width: `${reactionPickerPosition.width}px`
                        }}
                        onPointerDown={event => event.stopPropagation()}
                        onClick={event => event.stopPropagation()}
                      >
                        <div className="chat-reaction-picker-quick">
                          {MESSAGE_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReaction(msg.id, emoji)}
                              aria-label={`React with ${emoji}`}
                              className="chat-reaction-picker-emoji"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label={isExpandedReactionPicker ? 'Close full emoji picker' : 'Show more emojis'}
                            aria-expanded={isExpandedReactionPicker}
                            onClick={() => setIsExpandedReactionPicker(expanded => !expanded)}
                            className="chat-reaction-picker-more"
                          >
                            {isExpandedReactionPicker ? <X size={16} /> : <Plus size={16} />}
                          </button>
                        </div>
                        {isExpandedReactionPicker && (
                          <div className="chat-reaction-picker-full" aria-label="More emojis">
                            {MORE_MESSAGE_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReaction(msg.id, emoji)}
                                aria-label={`React with ${emoji}`}
                                className="chat-reaction-picker-emoji"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>,
                      document.body
                    )}
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <div className="chat-theme-composer shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-700/80">
              {replyingToMessage && (
                <div className="mx-auto mb-2 flex max-w-5xl items-center justify-between rounded-xl border-l-2 border-violet-500 bg-white/70 px-3 py-2 dark:bg-slate-900/60">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                      Replying to {users.find(profile => profile.id === replyingToMessage.senderId)?.name || 'message'}
                    </p>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                      {replyingToMessage.text || 'Attachment'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    aria-label="Cancel reply"
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleAttachmentSelected}
                  className="hidden"
                />
                <IconButton
                  icon={Paperclip}
                  title="Attach a document, image or video"
                  disabled={isUploading || isRecording}
                  onClick={() => fileInputRef.current?.click()}
                />
                
                <div className="chat-composer-field flex-1 rounded-full border border-transparent px-4 py-2.5 transition-all">
                  <div className="flex items-center">
                  <Smile size={20} className="text-slate-400 mr-2 shrink-0" />
                  <input
                  ref={messageInputRef}
                  disabled={isUploading || isRecording}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message"
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                  </div>
                </div>

                {inputText.trim() ? (
                  <button type="submit" aria-label="Send message" disabled={isUploading || isRecording} className="chat-send-button rounded-full p-3 text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50">
                    <Send size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={handleVoiceRecord} disabled={isUploading} title={isRecording ? 'Stop and send voice note' : 'Record voice note'} className={`${isRecording ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800'} text-white p-3 rounded-2xl transition-transform active:scale-95 disabled:opacity-50`}>
                    {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                  </button>
                )}
              </form>
              {(isUploading || isRecording) && (
                <p className="mx-auto mt-2 max-w-4xl text-center text-xs text-violet-600 dark:text-violet-400" role="status">
                  {isRecording ? 'Recording… tap the stop button to send your voice note.' : 'Uploading attachment…'}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <p>Select a conversation or find someone new to chat with.</p>
            <button onClick={() => navigate('/discover')} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Discover people
            </button>
          </div>
        )}
      </div>
      {forwardingMessage && (
        <ForwardMessageDialog
          chats={chats}
          users={users}
          userId={user.id}
          activeChatId={activeChat.id}
          message={forwardingMessage}
          isForwarding={isForwarding}
          onClose={() => setForwardingMessage(null)}
          onForward={handleForwardMessage}
        />
      )}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <section className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create a group</h2>
              <button type="button" aria-label="Close" onClick={() => setShowCreateGroup(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">You’ll be the first group admin. Add members or share an invite link any time.</p>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                autoFocus
                required
                minLength={2}
                maxLength={60}
                value={newGroupName}
                onChange={event => setNewGroupName(event.target.value)}
                placeholder="Group name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isGroupActionPending} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  {isGroupActionPending ? 'Creating…' : 'Create group'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {showJoinGroup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <section className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Join a group</h2>
              <button type="button" aria-label="Close" onClick={() => setShowJoinGroup(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Paste a group invite code or full invite link.</p>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                autoFocus
                required
                value={groupInviteInput}
                onChange={event => setGroupInviteInput(event.target.value)}
                placeholder="Invite code or link"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowJoinGroup(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isGroupActionPending} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  {isGroupActionPending ? 'Joining…' : 'Join group'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {showGroupManagement && isGroup && (
        <GroupManagementDialog
          group={activeChat}
          users={users}
          currentUser={user}
          isPending={isGroupActionPending}
          onClose={() => setShowGroupManagement(false)}
          onUpdateGroupProfile={updateGroupProfile}
          onAddMembers={addGroupMembers}
          onRemoveMember={removeGroupMember}
          onPromoteAdmin={promoteGroupAdmin}
          onRotateInvite={rotateGroupInvite}
          onLeave={async () => {
            await leaveGroup(activeChat.id);
            setShowGroupManagement(false);
            navigate('/groups');
          }}
          onError={error => showToast(`Group action failed: ${error.message}`)}
          onSuccess={showToast}
          onPending={setIsGroupActionPending}
        />
      )}
    </div>
  );
};


