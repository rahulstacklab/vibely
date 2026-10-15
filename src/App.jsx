/* eslint-disable no-unused-vars */
import { Fragment, useState, useEffect, useContext, createContext, useRef, useCallback, useMemo } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebase.js';
import { uploadToCloudinary } from './services/uploadService.js';
import {
  Home, MessageCircle, Users, User, Settings, Shield, Search, Plus, Copy, UserPlus, Crown,
  Mic, Send, Smile, Paperclip, MoreVertical, Phone, Video, Link2,
  CheckCheck, Sun, Moon, LogOut, Bell, ChevronLeft, Heart,
  Activity, X, Lock, Flame,
  Sparkles, Filter, Globe, Sliders, Bookmark, Highlighter,
  ShieldAlert, PhoneOff, MicOff, VideoOff, FileText, StopCircle, Pencil, Trash2, Camera, Save
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    username: '@alexr',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    vibe: '💻 Coding Vibely',
    mood: 'Focused',
    bio: 'Full-stack craftsperson building real-time human connection experiences.',
    role: 'admin',
    connectionsCount: 342,
    location: 'San Francisco, CA',
    joined: 'Jan 2024'
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    username: '@sarahc',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    vibe: '☕ Coffee & Chill',
    mood: 'Chill',
    bio: 'UI/UX Designer & specialty coffee enthusiast.',
    role: 'user',
    connectionsCount: 189,
    location: 'Seattle, WA',
    joined: 'Mar 2024'
  },
  {
    id: 'u3',
    name: 'Jordan Lee',
    username: '@jordan_l',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    vibe: '🔥 Launching Today',
    mood: 'Excited',
    bio: 'Product Lead @ TechFlow. Passionate about AI & social media UX.',
    role: 'user',
    connectionsCount: 512,
    location: 'Austin, TX',
    joined: 'Feb 2024'
  }
];

const MOCK_USERS = [
  ...DEMO_ACCOUNTS,
  {
    id: 'u4',
    name: 'Casey Smith',
    username: '@caseys',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    vibe: '✈ Traveling Tokyo',
    mood: 'Exploring',
    isOnline: true,
    bio: 'Digital nomad photographing cityscapes worldwide.',
    role: 'user',
    connectionsCount: 275
  },
  {
    id: 'u5',
    name: 'Morgan Doe',
    username: '@morgand',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    vibe: '🎵 Listening to Lo-Fi',
    mood: 'Relaxed',
    isOnline: false,
    lastSeen: '15m ago',
    bio: 'Audio engineer and indie musician.',
    role: 'user',
    connectionsCount: 120
  }
];

const MOCK_STORIES = [];

const MOCK_CHATS = [
  {
    id: 'c1',
    participants: ['u1', 'u2'],
    isGroup: false,
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    messages: [
      { id: 'm1', senderId: 'u2', text: 'Hey Alex! Have you tried the new Vibely voice transcript feature?', timestamp: '10:15 AM', status: 'read' },
      { id: 'm2', senderId: 'u1', text: 'Yes! It generates instant AI captions for audio notes. Check out this voice message!', timestamp: '10:18 AM', status: 'read' },
      { 
        id: 'm3', 
        senderId: 'u1', 
        type: 'voice', 
        duration: '0:14', 
        audioUrl: '#',
        transcript: 'Hey Sarah, the team approved the new interactive layout! Let us sync at 3 PM today.',
        timestamp: '10:20 AM', 
        status: 'read' 
      },
      { 
        id: 'm4', 
        senderId: 'u2', 
        text: 'That is incredible! Also, can you translate "Kal meeting kitne baje hai?" for the international channel?', 
        timestamp: '10:25 AM', 
        status: 'delivered',
        translation: 'What time is the meeting tomorrow?'
      }
    ]
  },
  {
    id: 'c2',
    participants: ['u1', 'u3', 'u4'],
    isGroup: true,
    groupName: 'Vibely Product Circle ⚡',
    groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    pinnedMessage: '🚀 Launch target: Friday 5 PM EST',
    messages: [
      { id: 'm5', senderId: 'u3', text: 'Team, poll is live for the next feature sprint!', timestamp: 'Yesterday', status: 'read' },
      { 
        id: 'm6', 
        senderId: 'u3', 
        type: 'poll', 
        question: 'Which unique feature should we expand next?',
        options: [
          { id: 'o1', text: 'AI Voice Transcripts', votes: 14 },
          { id: 'o2', text: 'Mood Match Discovery', votes: 22 },
          { id: 'o3', text: 'Private Circle Moments', votes: 9 }
        ],
        totalVotes: 45,
        timestamp: 'Yesterday', 
        status: 'read', 
        reactions: ['🔥', '💡'] 
      }
    ]
  },
  {
    id: 'c3',
    participants: ['u1', 'u4'],
    isGroup: false,
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    messages: [
      { id: 'm7', senderId: 'u4', text: 'Arrived in Tokyo! Photos uploaded to the Japan Travel Circle.', timestamp: '2 days ago', status: 'read' }
    ]
  }
];

const ThemeContext = createContext();
const AuthContext = createContext();
const RouterContext = createContext();
const DataContext = createContext();
let localAuthPersistencePromise;
const MESSAGE_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '🎉'];
const getMessageDate = (createdAt) => {
  const date = typeof createdAt?.toDate === 'function'
    ? createdAt.toDate()
    : createdAt instanceof Date
      ? createdAt
      : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const getMessageDateLabel = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const todayStart = new Date(today);
  const messageStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);
  messageStart.setHours(0, 0, 0, 0);
  const daysAgo = Math.round((todayStart - messageStart) / (24 * 60 * 60 * 1000));
  if (daysAgo > 1 && daysAgo < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};
const ATTACHMENT_MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  txt: 'text/plain'
};
const SUPPORTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/rtf',
  'text/plain'
];

const getAttachmentMimeType = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return file.type && file.type !== 'application/octet-stream'
    ? file.type
    : ATTACHMENT_MIME_TYPES[extension] || file.type || 'application/octet-stream';
};

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('vibely_theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('vibely_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('vibely_theme', 'light');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    let isActive = true;
    let unsubscribe;
    let authEvent = 0;

    const startAuthListener = async () => {
      try {
        localAuthPersistencePromise ||= setPersistence(auth, browserLocalPersistence);
        await localAuthPersistencePromise;
        if (!isActive) return;

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          const currentEvent = ++authEvent;
          if (!firebaseUser) {
            setUser(null);
            setAuthLoading(false);
            return;
          }

          const fallbackProfile = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email,
            username: `@${firebaseUser.email?.split('@')[0] || 'vibely'}`,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
            vibe: '✨ Here to connect',
            bio: '',
            role: 'user'
          };

          try {
            const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
            const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
            if (!isActive || currentEvent !== authEvent || auth.currentUser?.uid !== firebaseUser.uid) return;
            setUser({
              ...fallbackProfile,
              name: profile.name || fallbackProfile.name,
              username: profile.username || fallbackProfile.username,
              avatar: profile.avatar || fallbackProfile.avatar,
              vibe: profile.vibe || fallbackProfile.vibe,
              bio: profile.bio || '',
              location: profile.location || ''
            });
          } catch (error) {
            console.error('Unable to load the signed-in user profile.', error);
            if (!isActive || currentEvent !== authEvent || auth.currentUser?.uid !== firebaseUser.uid) return;
            setUser(fallbackProfile);
          } finally {
            if (isActive && currentEvent === authEvent) setAuthLoading(false);
          }
        }, (error) => {
          console.error('Firebase authentication state listener failed.', error);
          if (!isActive) return;
          setAuthError(`Could not restore your sign-in: ${error.message}`);
          setAuthLoading(false);
        });
      } catch (error) {
        console.error('Unable to enable persistent sign-in.', error);
        if (!isActive) return;
        setAuthError(`Could not enable persistent sign-in: ${error.message}`);
        setAuthLoading(false);
      }
    };

    startAuthListener();
    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const resetPassword = async (email) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) throw new Error('Enter the email address for your account.');
    await sendPasswordResetEmail(auth, normalizedEmail);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) throw new Error('Sign in with an email and password to change your password.');
    if (newPassword.length < 6) throw new Error('Your new password must be at least 6 characters.');
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('Sign in before verifying your email.');
    if (auth.currentUser.emailVerified) return;
    await sendEmailVerification(auth.currentUser);
  };

  const register = async ({ fullName, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const name = fullName.trim();
    const profile = {
      name,
      username: `@${email.split('@')[0]}`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      vibe: '✨ Here to connect',
      bio: '',
      createdAt: serverTimestamp()
    };

    try {
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, 'users', credential.user.uid), profile);
      setUser({ id: credential.user.uid, uid: credential.user.uid, ...profile, role: 'user' });
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, logout, register, resetPassword, changePassword,
      resendVerificationEmail, authLoading, authError, isOnboarding, setIsOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const RouterProvider = ({ children }) => {
  const getRouteFromUrl = () => {
    const url = new URL(window.location.href);
    return url.searchParams.get('route') || url.pathname || '/';
  };
  const [currentRoute, setCurrentRoute] = useState(getRouteFromUrl);
  const [routeParams, setRouteParams] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params = {};
    const chatId = searchParams.get('chat');
    const storyId = searchParams.get('story');
    const create = searchParams.get('create');
    if (chatId) params.chatId = chatId;
    if (storyId) params.storyId = storyId;
    if (create === '1' || create === 'true') params.create = true;
    return params;
  });

  const navigate = (path, params = {}) => {
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.searchParams.delete('route');
    url.searchParams.delete('chat');
    url.searchParams.delete('story');
    url.searchParams.delete('create');
    if (path !== '/') url.searchParams.set('route', path);
    if (params.chatId) url.searchParams.set('chat', params.chatId);
    if (params.storyId) url.searchParams.set('story', params.storyId);
    if (params.create) url.searchParams.set('create', 'true');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setCurrentRoute(path);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const restoreRoute = () => {
      setCurrentRoute(getRouteFromUrl());
      const searchParams = new URLSearchParams(window.location.search);
      const params = {};
      const chatId = searchParams.get('chat');
      const storyId = searchParams.get('story');
      const create = searchParams.get('create');
      if (chatId) params.chatId = chatId;
      if (storyId) params.storyId = storyId;
      if (create === '1' || create === 'true') params.create = true;
      setRouteParams(params);
    };
    window.addEventListener('popstate', restoreRoute);
    return () => window.removeEventListener('popstate', restoreRoute);
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, routeParams, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

const DataProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { navigate } = useContext(RouterContext);
  const [chatState, setChatState] = useState({ uid: null, chats: [] });
  const [userState, setUserState] = useState({ uid: null, users: [] });
  const [friendState, setFriendState] = useState({ uid: null, ids: [] });
  const [requestState, setRequestState] = useState({ uid: null, requests: [] });
  const [storyState, setStoryState] = useState({ uid: null, stories: [] });
  const chats = chatState.uid === user?.uid ? chatState.chats : [];
  const users = userState.uid === user?.uid ? userState.users : [];
  const friendIds = useMemo(
    () => friendState.uid === user?.uid ? friendState.ids : [],
    [friendState, user?.uid]
  );
  const friendRequests = requestState.uid === user?.uid ? requestState.requests : [];
  const stories = user?.uid && storyState.uid === user.uid
    ? storyState.stories.filter(story => story.userId === user.uid || friendIds.includes(story.userId))
    : [];
  const setChats = useCallback((update) => setChatState(current => ({
    uid: user?.uid || null,
    chats: typeof update === 'function'
      ? update(current.uid === user?.uid ? current.chats : [])
      : update
  })), [user?.uid]);
  const setUsers = useCallback((update) => setUserState(current => ({
    uid: user?.uid || null,
    users: typeof update === 'function'
      ? update(current.uid === user?.uid ? current.users : [])
      : update
  })), [user?.uid]);
  const [momentState, setMomentState] = useState({ uid: null, moments: [] });
  const moments = momentState.uid === user?.uid ? momentState.moments : [];
  const [savedMessages, setSavedMessages] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // { user, type: 'voice' | 'video' }
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const addStory = useCallback(async (story) => {
    if (!user?.uid) throw new Error('Sign in to post a story.');
    const storyRef = doc(db, 'stories', story.id || doc(collection(db, 'stories')).id);
    await setDoc(storyRef, {
      userId: user.uid,
      image: story.image || '',
      caption: story.caption || '',
      vibe: story.vibe || '',
      createdAt: serverTimestamp(),
      likedBy: [],
      viewedBy: []
    });
    return storyRef.id;
  }, [user]);

  const toggleStoryLike = useCallback(async (story) => {
    if (!user?.uid || !story?.id) return;
    const storyRef = doc(db, 'stories', story.id);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(storyRef);
      if (!snapshot.exists()) throw new Error('This story is no longer available.');
      const likedBy = snapshot.data().likedBy || [];
      transaction.update(storyRef, {
        likedBy: likedBy.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    });
  }, [user]);

  const markStoryViewed = useCallback(async (storyId) => {
    if (!user?.uid || !storyId) return;
    try {
      await updateDoc(doc(db, 'stories', storyId), { viewedBy: arrayUnion(user.uid) });
    } catch (error) {
      console.error('Unable to mark story as viewed.', error);
      showToast(`Couldn't mark story viewed: ${error.message}`);
    }
  }, [showToast, user]);

  const createMoment = useCallback(async ({ file, title, location, circle }) => {
    if (!user?.uid) throw new Error('Sign in to share a Moment.');
    if (!(file instanceof Blob) || !file.type.startsWith('image/')) {
      throw new Error('Choose an image to share your Moment.');
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      throw new Error('Moment photos must be smaller than 10 MB.');
    }
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 120) {
      throw new Error('Add a title of up to 120 characters.');
    }

    const image = await uploadToCloudinary(file, { type: 'image', purpose: 'moment' });
    const momentRef = doc(collection(db, 'moments'));
    await setDoc(momentRef, {
      authorId: user.uid,
      authorName: user.name || 'Vibely member',
      authorAvatar: user.avatar || '',
      image: image.secureUrl,
      title: cleanTitle,
      location: location.trim().slice(0, 100),
      circle: circle.trim().slice(0, 60) || 'Community',
      createdAt: serverTimestamp(),
      likedBy: [],
      commentCount: 0
    });
    return momentRef.id;
  }, [user]);

  const toggleMomentLike = useCallback(async (momentId) => {
    if (!user?.uid || !momentId) throw new Error('Sign in to like a Moment.');
    const momentRef = doc(db, 'moments', momentId);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(momentRef);
      if (!snapshot.exists()) throw new Error('This Moment is no longer available.');
      const likedBy = snapshot.data().likedBy || [];
      transaction.update(momentRef, {
        likedBy: likedBy.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    });
  }, [user]);

  const deleteMoment = useCallback(async (momentId) => {
    if (!user?.uid || !momentId) throw new Error('Sign in to delete a Moment.');
    const momentRef = doc(db, 'moments', momentId);
    const snapshot = await getDoc(momentRef);
    if (!snapshot.exists()) throw new Error('This Moment is no longer available.');
    if (snapshot.data().authorId !== user.uid) throw new Error('You can only delete your own Moments.');
    await deleteDoc(momentRef);
  }, [user]);

  const addMomentComment = useCallback(async (momentId, text) => {
    if (!user?.uid || !momentId) throw new Error('Sign in to comment on a Moment.');
    const cleanText = text.trim();
    if (!cleanText || cleanText.length > 500) throw new Error('Comments must be 1–500 characters.');
    const momentRef = doc(db, 'moments', momentId);
    const commentRef = doc(collection(momentRef, 'comments'));
    const batch = writeBatch(db);
    batch.set(commentRef, {
      userId: user.uid,
      name: user.name || 'Vibely member',
      avatar: user.avatar || '',
      text: cleanText,
      createdAt: serverTimestamp()
    });
    batch.update(momentRef, {
      commentCount: increment(1),
      lastCommentId: commentRef.id
    });
    await batch.commit();
  }, [user]);

  const sendFriendRequest = useCallback(async (targetUserId) => {
    if (!user?.uid || !targetUserId || targetUserId === user.uid) return;
    const requestId = `${user.uid}__${targetUserId}`;
    await setDoc(doc(db, 'friendRequests', requestId), {
      senderId: user.uid,
      recipientId: targetUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  }, [user]);

  const respondToFriendRequest = useCallback(async (request, accept) => {
    if (!user?.uid || request?.recipientId !== user.uid || request.status !== 'pending') return;

    const requestRef = doc(db, 'friendRequests', request.id);
    if (!accept) {
      await updateDoc(requestRef, { status: 'rejected' });
      return;
    }

    const members = [request.senderId, request.recipientId].sort();
    const friendshipId = members.join('__');
    const batch = writeBatch(db);
    batch.update(requestRef, { status: 'accepted' });
    batch.set(doc(db, 'friendships', friendshipId), {
      members,
      requestId: request.id,
      createdAt: serverTimestamp()
    });
    await batch.commit();
  }, [user]);

  const cancelFriendRequest = useCallback(async (requestId) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db, 'friendRequests', requestId));
  }, [user]);

  const removeFriend = useCallback(async (friendId) => {
    if (!user?.uid || !friendId) return;
    const friendshipId = [user.uid, friendId].sort().join('__');
    await deleteDoc(doc(db, 'friendships', friendshipId));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const messageSubscriptions = new Map();
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs
        .map(userDoc => ({ id: userDoc.id, ...userDoc.data() }))
        .filter(profile => profile.id !== user.uid));
    }, (error) => {
      console.error('Unable to load users.', error);
      showToast(`Couldn't load users: ${error.message}`);
    });

    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribeChats = onSnapshot(chatQuery, (snapshot) => {
      const visibleChatDocs = snapshot.docs.filter(chatDoc =>
        !chatDoc.data().hiddenFor?.includes(user.uid)
      );
      const chatIds = new Set(visibleChatDocs.map(chatDoc => chatDoc.id));
      messageSubscriptions.forEach((unsubscribe, chatId) => {
        if (!chatIds.has(chatId)) {
          unsubscribe();
          messageSubscriptions.delete(chatId);
        }
      });

      setChats(previousChats => visibleChatDocs.map(chatDoc => {
        const existingChat = previousChats.find(chat => chat.id === chatDoc.id);
        return {
          id: chatDoc.id,
          ...chatDoc.data(),
          isGroup: chatDoc.data().isGroup === true,
          messages: existingChat?.messages || []
        };
      }).sort((first, second) => {
        const firstTime = first.updatedAt?.toMillis?.() || 0;
        const secondTime = second.updatedAt?.toMillis?.() || 0;
        return secondTime - firstTime;
      }));

      visibleChatDocs.forEach((chatDoc) => {
        if (messageSubscriptions.has(chatDoc.id)) return;

        const messagesQuery = query(
          collection(db, 'chats', chatDoc.id, 'messages'),
          orderBy('createdAt', 'asc')
        );
        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
          setChats(previousChats => previousChats.map(chat => chat.id === chatDoc.id
            ? {
              ...chat,
              messages: messagesSnapshot.docs
                .filter(messageDoc => !messageDoc.data().hiddenFor?.includes(user.uid))
                .map(messageDoc => {
                const message = messageDoc.data();
                return {
                  id: messageDoc.id,
                  ...message,
                  timestamp: message.createdAt?.toDate
                    ? message.createdAt.toDate().toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                    : ''
                };
              })
            }
            : chat));
        }, (error) => {
          console.error(`Unable to load messages for chat ${chatDoc.id}.`, error);
          showToast(`Couldn't load messages: ${error.message}`);
        });
        messageSubscriptions.set(chatDoc.id, unsubscribeMessages);
      });
    }, (error) => {
      console.error('Unable to load chats.', error);
      showToast(`Couldn't load chats: ${error.message}`);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeChats();
      messageSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid, setChats, setUsers, showToast]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    return onSnapshot(
      query(collection(db, 'moments'), orderBy('createdAt', 'desc')),
      snapshot => setMomentState({
        uid: user.uid,
        moments: snapshot.docs.map(momentDoc => ({ id: momentDoc.id, ...momentDoc.data() }))
      }),
      error => {
        console.error('Unable to load Moments.', error);
        showToast(`Couldn't load Moments: ${error.message}`);
      }
    );
  }, [user?.uid, showToast]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const unsubscribers = [];
    const updateRequests = (snapshot, direction) => {
      setRequestState(current => {
        const existing = current.uid === user.uid ? current.requests : [];
        const nextById = new Map(existing.map(request => [request.id, request]));
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') nextById.delete(change.doc.id);
          else nextById.set(change.doc.id, { id: change.doc.id, ...change.doc.data(), direction });
        });
        return { uid: user.uid, requests: [...nextById.values()] };
      });
    };

    unsubscribers.push(onSnapshot(
      query(collection(db, 'friendRequests'), where('recipientId', '==', user.uid)),
      snapshot => updateRequests(snapshot, 'incoming'),
      error => {
        console.error('Unable to load incoming friend requests.', error);
        showToast(`Couldn't load friend requests: ${error.message}`);
      }
    ));
    unsubscribers.push(onSnapshot(
      query(collection(db, 'friendRequests'), where('senderId', '==', user.uid)),
      snapshot => updateRequests(snapshot, 'outgoing'),
      error => {
        console.error('Unable to load sent friend requests.', error);
        showToast(`Couldn't load sent requests: ${error.message}`);
      }
    ));

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [user?.uid, showToast]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    return onSnapshot(
      query(collection(db, 'friendships'), where('members', 'array-contains', user.uid)),
      snapshot => {
        const ids = snapshot.docs
          .flatMap(friendship => friendship.data().members || [])
          .filter(memberId => memberId !== user.uid);
        setFriendState({ uid: user.uid, ids: [...new Set(ids)] });
      },
      error => {
        console.error('Unable to load friends.', error);
        showToast(`Couldn't load friends: ${error.message}`);
      }
    );
  }, [user?.uid, showToast]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const ownerIds = [...new Set([user.uid, ...friendIds])];
    const unsubscribeStories = ownerIds.reduce((unsubscribers, _, index) => {
      if (index % 30 !== 0) return unsubscribers;
      const ownerIdChunk = ownerIds.slice(index, index + 30);
      unsubscribers.push(onSnapshot(
        query(collection(db, 'stories'), where('userId', 'in', ownerIdChunk)),
        snapshot => {
          const storiesInChunk = snapshot.docs.map(storyDoc => {
            const story = storyDoc.data();
            const createdAt = story.createdAt?.toMillis?.() || Date.now();
            return {
              id: storyDoc.id,
              ...story,
              createdAt,
              timestamp: createdAt ? new Date(createdAt).toLocaleString() : 'Just now',
              likedBy: story.likedBy || [],
              viewedBy: story.viewedBy || [],
              liked: (story.likedBy || []).includes(user.uid),
              isViewed: (story.viewedBy || []).includes(user.uid),
              likes: (story.likedBy || []).length
            };
          }).filter(story => story.createdAt > Date.now() - 24 * 60 * 60 * 1000);
          setStoryState(current => {
            const previousStories = current.uid === user.uid ? current.stories : [];
            const storiesOutsideChunk = previousStories.filter(story =>
              ownerIds.includes(story.userId) && !ownerIdChunk.includes(story.userId)
            );
            return {
              uid: user.uid,
              stories: [...storiesOutsideChunk, ...storiesInChunk]
                .sort((first, second) => second.createdAt - first.createdAt)
            };
          });
        },
        error => {
          console.error('Unable to load friend stories.', error);
          showToast(`Couldn't load friend stories: ${error.message}`);
        }
      ));
      return unsubscribers;
    }, []);

    return () => unsubscribeStories.forEach(unsubscribe => unsubscribe());
  }, [user?.uid, friendIds, showToast]);

  useEffect(() => {
    if (!user?.uid) return;
    const url = new URL(window.location.href);
    const inviteCode = url.searchParams.get('join');
    if (!inviteCode) return;

    url.searchParams.delete('join');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    const joinFromInvite = async () => {
      try {
        const inviteSnapshot = await getDoc(doc(db, 'groupInvites', inviteCode));
        if (!inviteSnapshot.exists()) throw new Error('This group invite is invalid or has expired.');
        const { chatId } = inviteSnapshot.data();
        const chatRef = doc(db, 'chats', chatId);
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, 'groupInvites', inviteCode, 'joins', user.uid), {
            chatId,
            createdAt: serverTimestamp()
          });
          batch.update(chatRef, { participants: arrayUnion(user.uid) });
          await batch.commit();
          showToast('You joined the group.');
        } catch (error) {
          try {
            const existingChat = await getDoc(chatRef);
            if (!existingChat.exists() || !existingChat.data().participants.includes(user.uid)) {
              throw error;
            }
            showToast('You are already a member of this group.');
          } catch (readError) {
            if (readError === error) throw error;
            if (readError?.code !== 'permission-denied') throw readError;
            throw error;
          }
        }
        navigate('/groups', { chatId });
      } catch (error) {
        console.error('Unable to join group from invite link.', error);
        showToast(`Couldn't join group: ${error.message}`);
      }
    };

    joinFromInvite();
  }, [user?.uid, showToast, navigate]);

  const createChat = async (targetUser) => {
    if (!user?.uid || !targetUser?.id || targetUser.id === user.uid) {
      throw new Error('Choose another signed-in user to start a chat.');
    }

    const participants = [user.uid, targetUser.id].sort();
    const chatId = participants.join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, {
        participants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return chatId;
  };

  const createGroup = async (name) => {
    const groupName = name.trim();
    if (!user?.uid || groupName.length < 2 || groupName.length > 60) {
      throw new Error('Group name must be between 2 and 60 characters.');
    }
    const chatRef = doc(collection(db, 'chats'));
    const inviteCode = crypto.randomUUID().replaceAll('-', '');
    const batch = writeBatch(db);
    batch.set(chatRef, {
      participants: [user.uid],
      groupAdmins: [user.uid],
      ownerId: user.uid,
      isGroup: true,
      groupName,
      groupAvatar: '',
      description: '',
      inviteCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.set(doc(db, 'groupInvites', inviteCode), {
      chatId: chatRef.id,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    await batch.commit();
    setChats(previousChats => [
      ...previousChats.filter(chat => chat.id !== chatRef.id),
      {
        id: chatRef.id,
        participants: [user.uid],
        groupAdmins: [user.uid],
        ownerId: user.uid,
        isGroup: true,
        groupName,
        groupAvatar: '',
        description: '',
        inviteCode,
        messages: []
      }
    ]);
    return chatRef.id;
  };

  const joinGroup = async (rawInviteCode) => {
    const inviteCode = rawInviteCode.trim();
    if (!user?.uid || !inviteCode) throw new Error('Enter a valid group invite code or link.');
    const inviteSnapshot = await getDoc(doc(db, 'groupInvites', inviteCode));
    if (!inviteSnapshot.exists()) throw new Error('This group invite is invalid or has expired.');
    const { chatId } = inviteSnapshot.data();
    const chatRef = doc(db, 'chats', chatId);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'groupInvites', inviteCode, 'joins', user.uid), {
        chatId,
        createdAt: serverTimestamp()
      });
      batch.update(chatRef, { participants: arrayUnion(user.uid) });
      await batch.commit();
    } catch (error) {
      try {
        const existingChat = await getDoc(chatRef);
        if (existingChat.exists() && existingChat.data().participants.includes(user.uid)) return chatId;
      } catch (readError) {
        if (readError?.code !== 'permission-denied') throw readError;
      }
      if (error?.code !== 'permission-denied') {
        throw error;
      }
      throw error;
    }
    return chatId;
  };

  const addGroupMembers = async (chatId, memberIds) => {
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.groupAdmins?.includes(user?.uid)) {
      throw new Error('Only group admins can add members.');
    }
    const newMembers = [...new Set(memberIds)].filter(uid =>
      uid && uid !== user.uid && !chat.participants.includes(uid)
    );
    if (!newMembers.length) return;
    await updateDoc(doc(db, 'chats', chatId), {
      participants: arrayUnion(...newMembers)
    });
  };

  const removeGroupMember = async (chatId, memberId) => {
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.groupAdmins?.includes(user?.uid) || memberId === user.uid) {
      throw new Error('Only a group admin can remove another member.');
    }
    const batch = writeBatch(db);
    batch.update(doc(db, 'chats', chatId), {
      participants: arrayRemove(memberId),
      groupAdmins: arrayRemove(memberId)
    });
    await batch.commit();
  };

  const promoteGroupAdmin = async (chatId, memberId) => {
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.groupAdmins?.includes(user?.uid) || !chat.participants.includes(memberId)) {
      throw new Error('Only a group admin can promote a current member.');
    }
    await updateDoc(doc(db, 'chats', chatId), {
      groupAdmins: arrayUnion(memberId)
    });
  };

  const updateGroupProfile = async (chatId, { name, description, avatarFile, removeAvatar }) => {
    const groupName = name.trim();
    const groupDescription = description.trim();
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.groupAdmins?.includes(user?.uid)) {
      throw new Error('Only group admins can update this group profile.');
    }
    if (groupName.length < 2 || groupName.length > 60) {
      throw new Error('Group name must be between 2 and 60 characters.');
    }
    if (groupDescription.length > 500) {
      throw new Error('Group description must be 500 characters or fewer.');
    }
    const updates = {
      groupName,
      description: groupDescription,
      updatedAt: serverTimestamp()
    };
    if (removeAvatar) updates.groupAvatar = '';
    if (avatarFile) {
      if (!avatarFile.type.startsWith('image/')) throw new Error('Choose an image for the group photo.');
      if (avatarFile.size <= 0 || avatarFile.size > 5 * 1024 * 1024) {
        throw new Error('Group photos must be 5 MB or smaller.');
      }
      const uploadedImage = await uploadToCloudinary(avatarFile, {
        chatId,
        messageId: `group-profile-${crypto.randomUUID().replaceAll('-', '')}`,
        type: 'image',
        purpose: 'chat'
      });
      updates.groupAvatar = uploadedImage.secureUrl;
    }
    await updateDoc(doc(db, 'chats', chatId), updates);
  };

  const rotateGroupInvite = async (chatId) => {
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.groupAdmins?.includes(user?.uid)) {
      throw new Error('Only group admins can manage group invites.');
    }
    const inviteCode = crypto.randomUUID().replaceAll('-', '');
    const batch = writeBatch(db);
    if (chat.inviteCode) batch.delete(doc(db, 'groupInvites', chat.inviteCode));
    batch.update(doc(db, 'chats', chatId), { inviteCode });
    batch.set(doc(db, 'groupInvites', inviteCode), {
      chatId,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    await batch.commit();
    return inviteCode;
  };

  const leaveGroup = async (chatId) => {
    const chat = chats.find(item => item.id === chatId);
    if (!chat?.isGroup || !chat.participants.includes(user?.uid)) {
      throw new Error('You are not a member of this group.');
    }
    if (chat.groupAdmins?.includes(user.uid) && chat.groupAdmins.length === 1) {
      throw new Error('Promote another member to admin before you leave.');
    }
    const batch = writeBatch(db);
    const update = {
      participants: arrayRemove(user.uid),
      groupAdmins: arrayRemove(user.uid)
    };
    if (chat.ownerId === user.uid) {
      const nextOwner = chat.groupAdmins.find(uid => uid !== user.uid) ||
        chat.participants.find(uid => uid !== user.uid);
      if (nextOwner) update.ownerId = nextOwner;
    }
    batch.update(doc(db, 'chats', chatId), update);
    await batch.commit();
  };

  const sendMessage = async (chatId, text) => {
    const cleanText = text.trim();
    if (!cleanText || !user?.uid) return;

    const chatRef = doc(db, 'chats', chatId);
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const batch = writeBatch(db);
    batch.set(messageRef, {
      senderId: user.uid,
      text: cleanText,
      type: 'text',
      readBy: [user.uid],
      createdAt: serverTimestamp()
    });
    batch.set(chatRef, {
      lastMessage: cleanText,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await batch.commit();
  };

  const sendAttachment = async (chatId, file, type, duration = null) => {
    const files = (Array.isArray(file) ? file : [file]).filter(Boolean);
    if (!user?.uid || files.length === 0) throw new Error('You must be signed in to send an attachment.');
    if (files.length > 1 && type !== 'image') {
      throw new Error('Select multiple images only when sending more than one file.');
    }
    if (files.length > 10) throw new Error('You can send up to 10 photos in one message.');
    if (files.some(item => item.size <= 0 || item.size > 50 * 1024 * 1024)) {
      throw new Error('Each attachment must be smaller than 50 MB.');
    }
    if (files.reduce((total, item) => total + item.size, 0) > 50 * 1024 * 1024) {
      throw new Error('Photos selected together must total 50 MB or less.');
    }

    const chatRef = doc(db, 'chats', chatId);
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const validatedFiles = files.map(item => {
      const safeFileName = item.name.replace(/[\\/]/g, '_').slice(0, 180) || `${type}-attachment`;
      const mimeType = getAttachmentMimeType(item);
      if (
        (type === 'image' && !mimeType.startsWith('image/')) ||
        (type === 'video' && !mimeType.startsWith('video/')) ||
        (type === 'voice' && !mimeType.startsWith('audio/')) ||
        (type === 'document' && !SUPPORTED_DOCUMENT_MIME_TYPES.includes(mimeType))
      ) {
        throw new Error('Choose a supported image, video, audio recording, PDF, Office document, RTF or text file.');
      }
      return { file: item, safeFileName, mimeType };
    });
    const uploadedFiles = await Promise.all(validatedFiles.map(({ file: item }, index) =>
      uploadToCloudinary(item, {
        chatId,
        messageId: `${messageRef.id}-${index + 1}`,
        type
      })
    ));
    const label = type === 'voice'
      ? 'Voice note'
      : type === 'image'
        ? `${files.length} ${files.length === 1 ? 'photo' : 'photos'}`
        : type === 'video'
          ? 'Video'
          : 'Document';
    const batch = writeBatch(db);
    const [firstFile] = validatedFiles;
    const [firstUpload] = uploadedFiles;
    const messageData = {
      senderId: user.uid,
      text: label,
      type,
      attachmentUrl: firstUpload.secureUrl,
      cloudinaryPublicId: firstUpload.publicId,
      cloudinaryResourceType: firstUpload.resourceType,
      fileName: firstFile.safeFileName,
      mimeType: firstFile.mimeType,
      fileSize: firstUpload.bytes || firstFile.file.size,
      readBy: [user.uid],
      createdAt: serverTimestamp()
    };
    if (type === 'image') {
      messageData.attachments = uploadedFiles.map(image => image.secureUrl);
    }
    if (duration !== null) messageData.duration = duration;

    batch.set(messageRef, messageData);
    batch.set(chatRef, {
      lastMessage: label,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await batch.commit();
  };

  const editMessage = async (chatId, messageId, text) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length > 4000) {
      throw new Error('Messages must contain 1–4000 characters.');
    }
    const chat = chats.find(item => item.id === chatId);
    const message = chat?.messages.find(item => item.id === messageId);
    if (!user?.uid || message?.senderId !== user.uid || message.type !== 'text') {
      throw new Error('Only your own text messages can be edited.');
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'chats', chatId, 'messages', messageId), {
      text: cleanText,
      editedAt: serverTimestamp()
    });
    if (chat.messages.at(-1)?.id === messageId) {
      batch.update(doc(db, 'chats', chatId), {
        lastMessage: cleanText,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  };

  const deleteMessage = async (chatId, messageId) => {
    const chat = chats.find(item => item.id === chatId);
    const messageIndex = chat?.messages.findIndex(item => item.id === messageId) ?? -1;
    const message = chat?.messages[messageIndex];
    if (!user?.uid || message?.senderId !== user.uid) {
      throw new Error('You can only delete your own messages.');
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, 'chats', chatId, 'messages', messageId));
    if (messageIndex === chat.messages.length - 1) {
      batch.update(doc(db, 'chats', chatId), {
        lastMessage: chat.messages[messageIndex - 1]?.text || '',
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  };

  const hideMessageForMe = async (chatId, messageId) => {
    if (!user?.uid) throw new Error('Sign in before deleting a message.');
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      hiddenFor: arrayUnion(user.uid)
    });
  };

  const hideConversation = async (chatId) => {
    if (!user?.uid) throw new Error('Sign in before deleting a conversation.');
    await updateDoc(doc(db, 'chats', chatId), {
      hiddenFor: arrayUnion(user.uid)
    });
  };

  const addReaction = async (chatId, messageId, emoji) => {
    if (!user?.uid) throw new Error('Sign in before reacting to a message.');
    const message = chats.find(chat => chat.id === chatId)?.messages
      .find(item => item.id === messageId);
    if (!message) throw new Error('This message is no longer available.');

    const hasReacted = message.reactions?.[user.uid] === emoji;
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      [`reactions.${user.uid}`]: hasReacted ? deleteField() : emoji
    });
  };

  const forwardMessage = async (sourceChatId, message, targetChatId) => {
    if (!user?.uid) throw new Error('Sign in before forwarding a message.');
    if (!message || message.type === 'poll') {
      throw new Error('This message type cannot be forwarded.');
    }
    const targetChat = chats.find(chat => chat.id === targetChatId);
    if (!targetChat || targetChatId === sourceChatId) {
      throw new Error('Choose a different conversation to forward this message.');
    }

    const forwardedMessage = {
      senderId: user.uid,
      text: message.text || (message.type === 'voice' ? 'Voice note' : 'Attachment'),
      type: message.type,
      readBy: [user.uid],
      createdAt: serverTimestamp(),
      forwardedFrom: users.find(profile => profile.id === message.senderId)?.name || 'Vibely member'
    };
    if (message.type !== 'text') {
      Object.assign(forwardedMessage, {
        attachmentUrl: message.attachmentUrl,
        cloudinaryPublicId: message.cloudinaryPublicId,
        cloudinaryResourceType: message.cloudinaryResourceType,
        fileName: message.fileName,
        mimeType: message.mimeType,
        fileSize: message.fileSize
      });
      if (message.duration !== undefined) forwardedMessage.duration = message.duration;
    }

    const messageRef = doc(collection(db, 'chats', targetChatId, 'messages'));
    const batch = writeBatch(db);
    batch.set(messageRef, forwardedMessage);
    batch.update(doc(db, 'chats', targetChatId), {
      lastMessage: forwardedMessage.text,
      updatedAt: serverTimestamp(),
      hiddenFor: (targetChat.hiddenFor || []).filter(uid => uid !== user.uid)
    });
    await batch.commit();
  };

  const toggleSaveMessage = (message) => {
    if (savedMessages.some(m => m.id === message.id)) {
      setSavedMessages(prev => prev.filter(m => m.id !== message.id));
      showToast('Removed from Saved Messages');
    } else {
      setSavedMessages(prev => [...prev, message]);
      showToast('Saved to Starred Messages! ⭐');
    }
  };

  const votePoll = (chatId, messageId, optionId) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === messageId && m.type === 'poll') {
              const updatedOptions = m.options.map(opt => 
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
              );
              return { ...m, options: updatedOptions, totalVotes: m.totalVotes + 1 };
            }
            return m;
          })
        };
      }
      return chat;
    }));
    showToast('Vote recorded!');
  };

  return (
    <DataContext.Provider value={{
      chats, users, stories, friendIds, friendRequests, moments, savedMessages, activeCall, toastMessage,
      createChat, createGroup, joinGroup, addGroupMembers, removeGroupMember,
      promoteGroupAdmin, updateGroupProfile, rotateGroupInvite, leaveGroup,
      sendMessage, sendAttachment, editMessage, deleteMessage, hideConversation,
      hideMessageForMe,
      addReaction, forwardMessage, toggleSaveMessage, votePoll,
      addStory, toggleStoryLike, markStoryViewed,
      createMoment, toggleMomentLike, deleteMoment, addMomentComment,
      sendFriendRequest, respondToFriendRequest, cancelFriendRequest, removeFriend,
      setActiveCall, showToast
    }}>
      {children}
    </DataContext.Provider>
  );
};

const Avatar = ({ src, size = 'md', isOnline, vibe, className = '' }) => {
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

const StoryRing = ({ src, isViewed, size = 'lg', className = '' }) => {
  const sizes = { md: 'w-14 h-14', lg: 'w-16 h-16' };
  const ringColor = isViewed ? 'border-slate-300 dark:border-slate-700' : 'border-violet-500 ring-2 ring-violet-400/40';

  return (
    <div className={`p-0.5 rounded-full border-2 ${ringColor} ${className} transition-transform hover:scale-105`}>
      <img src={src} className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-slate-950`} alt="Story" />
    </div>
  );
};

const IconButton = ({ icon: Icon, onClick, active, badge, className = '', title, disabled = false }) => (
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

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-slide-down">
      <Sparkles size={18} className="text-violet-400 animate-pulse" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

const Sidebar = () => {
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
        <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform hover:scale-105">
          <Activity className="text-white" size={22} />
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

const BottomNav = () => {
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

const CompassIcon = ({ size, className }) => <Globe size={size} className={className} />;

const DashboardView = () => {
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

const ChatView = () => {
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
  const [showTranslation, setShowTranslation] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deleteOptionsMessageId, setDeleteOptionsMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
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
  const mediaRecorderRef = useRef(null);
  const recordingStartedAtRef = useRef(0);

  const activeChat = chats.find(c => c.id === activeChatId);
  const isGroup = activeChat?.isGroup;
  const activeTheme = chatThemes[activeChatId] || 'amethyst';
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
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setReactionPickerMessageId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [reactionPickerMessageId]);

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
    sendMessage(activeChat.id, inputText)
      .then(() => setInputText(''))
      .catch((error) => {
        console.error('Unable to send message.', error);
        showToast(`Couldn't send message: ${error.message}`);
      });
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
    try {
      await addReaction(activeChat.id, messageId, emoji);
      setReactionPickerMessageId(null);
    } catch (error) {
      console.error('Unable to react to message.', error);
      showToast(`Couldn't add reaction: ${error.message}`);
    }
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
                      <div className={`relative rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_1px_1px_rgba(11,20,26,0.12)] [overflow-wrap:anywhere] ${isMe ? 'chat-message-outgoing rounded-br-md' : 'chat-message-incoming rounded-bl-md border border-black/[0.04] dark:border-white/[0.04]'} ${isHighlighted ? 'chat-message-highlighted' : ''}`}>
                        
                        {isGroup && !isMe && (
                          <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {users.find(profile => profile.id === msg.senderId)?.name || 'Group member'}
                          </p>
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
                                  className={msg.readBy?.some(uid => uid !== user.id) ? 'text-sky-300' : 'text-white'}
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
                                  ? 'text-sky-300'
                                  : 'text-slate-500/80 dark:text-white/60'}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action icons on hover */}
                      <div className={`chat-message-actions flex flex-wrap items-center gap-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="relative">
                          <button
                            type="button"
                            title="React to message"
                            aria-label="React to message"
                            aria-expanded={reactionPickerMessageId === msg.id}
                            aria-controls={`reaction-picker-${msg.id}`}
                            onClick={() => setReactionPickerMessageId(current => current === msg.id ? null : msg.id)}
                            className="flex h-9 min-w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
                          >
                            <Smile size={16} />
                          </button>
                          {reactionPickerMessageId === msg.id && (
                            <div
                              id={`reaction-picker-${msg.id}`}
                              role="group"
                              aria-label="Choose a message reaction"
                              className={`absolute bottom-full z-30 mb-2 grid w-max max-w-[calc(100vw-2rem)] grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${isMe ? 'right-0' : 'left-0'}`}
                            >
                              {MESSAGE_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  aria-label={`React with ${emoji}`}
                                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:bg-slate-800"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          title="Forward message"
                          aria-label="Forward message"
                          onClick={() => setForwardingMessage(msg)}
                          className="flex h-9 min-w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          type="button"
                          title="Save message"
                          aria-label="Save message"
                          onClick={() => toggleSaveMessage(msg)}
                          className="flex h-9 min-w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-slate-400 dark:hover:bg-amber-950"
                        >⭐</button>
                        <button
                          type="button"
                          title={isHighlighted ? 'Remove message highlight' : 'Highlight message'}
                          aria-label={isHighlighted ? 'Remove message highlight' : 'Highlight message'}
                          aria-pressed={isHighlighted}
                          onClick={() => handleMessageHighlight(messageKey)}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${isHighlighted ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-950'}`}
                        >
                          <Highlighter size={16} />
                        </button>
                        {isMe && msg.type === 'text' && editingMessageId !== msg.id && (
                          <button
                            type="button"
                            title="Edit message"
                            aria-label="Edit message"
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingText(msg.text);
                            }}
                            className="flex h-9 min-w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-400 dark:hover:bg-violet-950"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            title="Delete message"
                            aria-label="Delete message"
                            aria-expanded={deleteOptionsMessageId === msg.id}
                            onClick={() => setDeleteOptionsMessageId(current => current === msg.id ? null : msg.id)}
                            className="flex h-9 min-w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:text-slate-400 dark:hover:bg-rose-950"
                          >
                            <Trash2 size={14} />
                          </button>
                          {deleteOptionsMessageId === msg.id && (
                            <div className="absolute bottom-full right-0 z-20 mb-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              {isMe && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  Delete for everyone
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id, 'me')}
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                Delete for me
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteOptionsMessageId(null)}
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Cancel
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
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <div className="chat-theme-composer shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-700/80">
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

const GroupManagementDialog = ({
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

const ForwardMessageDialog = ({
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

const StoriesView = () => {
  const { stories, users, showToast, addStory, toggleStoryLike, markStoryViewed } = useContext(DataContext);
  const { navigate, routeParams } = useContext(RouterContext);
  const { user } = useContext(AuthContext);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [draft, setDraft] = useState({
    image: '',
    caption: '',
    vibe: '✨ Fresh update'
  });
  const storiesEnabled = isVibeStoriesEnabled();
  const isComposerOpen = Boolean(routeParams.create);
  const requestedIndex = stories.findIndex(story => story.id === routeParams.storyId);
  const currentIndex = requestedIndex >= 0 ? requestedIndex : Math.min(selectedIndex, Math.max(0, stories.length - 1));

  const activeStory = stories[currentIndex] || stories[0] || null;
  const storyAuthor = activeStory
    ? (activeStory.userId === user?.uid
      ? { ...user, name: user.name || 'You' }
      : users.find(profile => profile.id === activeStory.userId)
        || MOCK_USERS.find(profile => profile.id === activeStory.userId)
        || { name: 'Vibely friend', avatar: '' })
    : null;

  useEffect(() => {
    if (!activeStory || activeStory.isViewed) return;
    markStoryViewed(activeStory.id);
  }, [activeStory, markStoryViewed]);

  useEffect(() => {
    if (!storiesEnabled) {
      showToast('Vibe Stories are turned off in Settings.');
      navigate('/');
    }
  }, [storiesEnabled, navigate, showToast]);

  if (!storiesEnabled) return null;

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file for your story.');
      event.target.value = '';
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast('Choose an image smaller than 12 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const maxWidth = 720;
        const maxHeight = 1280;
        const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
        const encodeStoryImage = (width, height, qualityIndex = 0) => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width));
          canvas.height = Math.max(1, Math.round(height));
          const context = canvas.getContext('2d');
          if (!context) {
            showToast('Could not prepare this image. Try another photo.');
            return;
          }
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          const qualities = [0.72, 0.58, 0.45];
          canvas.toBlob(blob => {
            if (!blob) {
              showToast('Could not prepare this image. Try another photo.');
              return;
            }
            if (blob.size > 480 * 1024) {
              if (qualityIndex < qualities.length - 1) {
                encodeStoryImage(width, height, qualityIndex + 1);
              } else if (Math.max(width, height) > 320) {
                encodeStoryImage(width * 0.8, height * 0.8);
              } else {
                showToast('This image is too large to store safely. Choose a smaller photo.');
              }
              return;
            }

            const imageReader = new FileReader();
            imageReader.onload = () => setDraft(prev => ({ ...prev, image: imageReader.result }));
            imageReader.onerror = () => showToast('Could not prepare this image. Try another photo.');
            imageReader.readAsDataURL(blob);
          }, 'image/jpeg', qualities[qualityIndex]);
        };
        encodeStoryImage(source.width * scale, source.height * scale);
      };
      source.onerror = () => showToast('Could not read this image. Try another photo.');
      source.src = reader.result;
    };
    reader.onerror = () => showToast('Could not read this image. Try again.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const createStory = async () => {
    if (isPosting) return;
    setIsPosting(true);
    const normalizedCaption = draft.caption.trim() || (draft.image ? 'Fresh from my day ✨' : 'Just sharing a moment');
    const normalizedVibe = draft.vibe.trim() || '✨ Fresh update';
    const author = user || MOCK_USERS[0];
    try {
      const createdId = await addStory({
        userId: author.id || author.uid,
        image: draft.image,
        caption: normalizedCaption,
        vibe: normalizedVibe
      });
      setDraft({ image: '', caption: '', vibe: '✨ Fresh update' });
      navigate('/stories', { storyId: createdId });
    } catch (error) {
      console.error('Unable to post story.', error);
      showToast(`Couldn't post story: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleNextStory = () => {
    if (!stories.length) return;
    const nextIndex = Math.min(stories.length - 1, currentIndex + 1);
    setSelectedIndex(nextIndex);
    navigate('/stories', { storyId: stories[nextIndex].id });
  };

  const handlePrevStory = () => {
    if (!stories.length) return;
    const previousIndex = Math.max(0, currentIndex - 1);
    setSelectedIndex(previousIndex);
    navigate('/stories', { storyId: stories[previousIndex].id });
  };

  if (!stories.length && !isComposerOpen) {
    return (
      <div className="flex-1 h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No stories yet</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Share a quick moment with your circle and keep your vibe current.</p>
          <button
            onClick={() => navigate('/stories', { create: true })}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30"
          >
            <Plus size={16} />
            Create Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen bg-[#0b0f17] flex items-center justify-center relative p-4">
      <button onClick={() => navigate('/')} className="absolute top-5 right-5 text-white bg-white/10 p-3 rounded-full backdrop-blur-md z-40 border border-white/10 hover:bg-white/15">
        <X size={20} />
      </button>

      {isComposerOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/90 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Create story</p>
                <h3 className="text-xl font-bold text-white">Share a moment</h3>
              </div>
              <button onClick={() => {
                setDraft({ image: '', caption: '', vibe: '✨ Fresh update' });
                navigate('/stories');
              }} className="rounded-full bg-white/5 p-2 text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-800/80">
              {draft.image ? (
                <img src={draft.image} alt="Story preview" className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-violet-500/20 via-slate-900 to-fuchsia-500/20 text-sm text-slate-300">
                  Add a photo to feature your story
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
              {draft.image && (
                <button onClick={() => setDraft(prev => ({ ...prev, image: '' }))} className="text-sm text-slate-300 hover:text-white">
                  Remove
                </button>
              )}
            </div>

            <textarea
              value={draft.caption}
              onChange={(event) => setDraft(prev => ({ ...prev, caption: event.target.value }))}
              rows={3}
              placeholder="Write something meaningful..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none"
            />

            <input
              value={draft.vibe}
              onChange={(event) => setDraft(prev => ({ ...prev, vibe: event.target.value }))}
              placeholder="Vibe label"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none"
            />

            <button
              disabled={isPosting}
              onClick={createStory}
              className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:cursor-wait disabled:opacity-60"
            >
              {isPosting ? 'Posting…' : 'Post Story'}
            </button>
          </div>
        </div>
      )}

      {!isComposerOpen && activeStory && (
        <div className="w-full max-w-sm h-[88vh] bg-slate-900 rounded-[32px] overflow-hidden relative shadow-[0_30px_80px_rgba(15,23,42,0.7)] border border-white/10 flex flex-col justify-between">
          {activeStory.image ? (
            <img src={activeStory.image} className="absolute inset-0 w-full h-full object-cover" alt="Story" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/10 to-slate-950/80"></div>

          <div className="relative z-10 space-y-3 p-4 pt-5">
            <div className="flex space-x-1.5">
              {stories.map((story, idx) => (
                <div key={story.id} className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden">
                  <div className={`h-full rounded-full bg-white transition-all duration-300 ${idx === currentIndex ? 'w-full' : idx < currentIndex ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={storyAuthor?.avatar || user?.avatar || MOCK_USERS[0].avatar} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{storyAuthor?.name || user?.name || 'You'}</p>
                  <p className="text-[10px] text-white/75">{activeStory.timestamp}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                {activeStory.vibe}
              </span>
            </div>
          </div>

          <div className="relative z-10 space-y-4 p-4 pb-5">
            <p className="max-w-[90%] text-xl font-semibold leading-snug text-white drop-shadow-md">{activeStory.caption}</p>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Reply to story..."
                className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white placeholder:text-white/70 focus:border-violet-300 focus:outline-none backdrop-blur-sm"
              />
              <button
                onClick={() => toggleStoryLike(activeStory).catch(error => {
                  console.error('Unable to update story like.', error);
                  showToast(`Couldn't update like: ${error.message}`);
                })}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${activeStory.liked ? 'border-pink-400 bg-pink-500/20 text-pink-300' : 'border-white/15 bg-white/10 text-white'}`}
                aria-label="Like story"
              >
                <Heart size={18} fill={activeStory.liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/10 px-2.5 py-1.5 backdrop-blur-sm">
                <Heart size={12} fill={activeStory.liked ? 'currentColor' : 'none'} className={activeStory.liked ? 'text-pink-300' : 'text-white/80'} />
                {activeStory.likes || 0}
              </span>
              <button onClick={() => navigate('/stories', { create: true })} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                + Add story
              </button>
            </div>
          </div>

          <div className="absolute inset-0 flex z-[5]">
            <div className="w-1/2 h-full cursor-pointer" onClick={handlePrevStory}></div>
            <div className="w-1/2 h-full cursor-pointer" onClick={handleNextStory}></div>
          </div>
        </div>
      )}
    </div>
  );
};

const MomentsView = () => {
  const {
    moments, users, createMoment, toggleMomentLike, deleteMoment, addMomentComment, showToast
  } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [circle, setCircle] = useState('');
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentsByMoment, setCommentsByMoment] = useState({});
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const photoPreview = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!openCommentsId) return undefined;
    return onSnapshot(
      query(collection(db, 'moments', openCommentsId, 'comments'), orderBy('createdAt', 'asc')),
      snapshot => setCommentsByMoment(previous => ({
        ...previous,
        [openCommentsId]: snapshot.docs.map(commentDoc => ({ id: commentDoc.id, ...commentDoc.data() }))
      })),
      error => {
        console.error('Unable to load Moment comments.', error);
        showToast(`Couldn't load comments: ${error.message}`);
      }
    );
  }, [openCommentsId, showToast]);

  const submitMoment = async (event) => {
    event.preventDefault();
    if (!photo) {
      showToast('Choose a photo before sharing your Moment.');
      return;
    }
    setIsPosting(true);
    try {
      await createMoment({ file: photo, title, location, circle });
      setPhoto(null);
      setTitle('');
      setLocation('');
      setCircle('');
      setIsComposerOpen(false);
      showToast('Your Moment has been shared.');
    } catch (error) {
      console.error('Unable to create Moment.', error);
      showToast(`Couldn't share Moment: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const submitComment = async (event, momentId) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      await addMomentComment(momentId, commentText);
      setCommentText('');
    } catch (error) {
      console.error('Unable to add Moment comment.', error);
      showToast(`Couldn't add comment: ${error.message}`);
    } finally {
      setIsCommenting(false);
    }
  };

  const toggleComments = (momentId) => {
    setOpenCommentsId(current => current === momentId ? null : momentId);
    setCommentText('');
  };

  const formatMomentTime = (createdAt) => {
    const date = createdAt?.toDate?.();
    return date ? date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
  };

  const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950';

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shared Moments</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Share photos and catch up with your community.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsComposerOpen(value => !value)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            {isComposerOpen ? <X size={17} /> : <Plus size={17} />}
            <span className="hidden sm:inline">{isComposerOpen ? 'Close' : 'Share a Moment'}</span>
            <span className="sm:hidden">{isComposerOpen ? 'Close' : 'Share'}</span>
          </button>
        </div>

        {isComposerOpen && (
          <form onSubmit={submitMoment} className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 md:p-6">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Create a Moment</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add a photo and a few details to share it with the community.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 p-3 transition hover:border-violet-400 dark:border-slate-700">
              {photoPreview ? (
                <img src={photoPreview} alt="Moment preview" className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                  <Plus size={24} />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{photo?.name || 'Choose a photo'}</span>
                <span className="mt-1 block text-xs text-slate-500">JPG, PNG, or another image format · up to 10 MB</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={event => {
                  const selectedFile = event.target.files?.[0];
                  event.target.value = '';
                  if (!selectedFile) return;
                  if (!selectedFile.type.startsWith('image/')) {
                    showToast('Choose an image file for your Moment.');
                    return;
                  }
                  if (selectedFile.size > 10 * 1024 * 1024) {
                    showToast('Moment photos must be 10 MB or smaller.');
                    return;
                  }
                  setPhoto(selectedFile);
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} required placeholder="Give your Moment a title" className={fieldClassName} />
              <input value={location} onChange={event => setLocation(event.target.value)} maxLength={100} placeholder="Add a location (optional)" className={fieldClassName} />
              <input value={circle} onChange={event => setCircle(event.target.value)} maxLength={60} placeholder="Community or circle (optional)" className={`${fieldClassName} sm:col-span-2`} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isPosting} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
                {isPosting ? 'Sharing…' : 'Share Moment'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {moments.map(moment => {
            const author = moment.authorId === user?.uid
              ? user
              : users.find(profile => profile.id === moment.authorId);
            const isLiked = moment.likedBy?.includes(user?.uid);
            const comments = commentsByMoment[moment.id] || [];
            const authorName = author?.name || moment.authorName || 'Vibely member';
            const authorAvatar = author?.avatar || moment.authorAvatar || '';
            const isCommentsOpen = openCommentsId === moment.id;

            return (
              <article key={moment.id} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={authorAvatar} size="sm" />
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white">{authorName}</h3>
                      <p className="truncate text-[10px] text-slate-400">
                        {moment.location ? `${moment.location} · ` : ''}{formatMomentTime(moment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="max-w-32 truncate rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 dark:bg-violet-950 dark:text-violet-400">{moment.circle || 'Community'}</span>
                    {moment.authorId === user?.uid && (
                      <button
                        type="button"
                        aria-label="Delete Moment"
                        title="Delete Moment"
                        onClick={async () => {
                          if (!window.confirm('Delete this Moment? This cannot be undone.')) return;
                          try {
                            await deleteMoment(moment.id);
                            if (openCommentsId === moment.id) setOpenCommentsId(null);
                            showToast('Moment deleted.');
                          } catch (error) {
                            console.error('Unable to delete Moment.', error);
                            showToast(`Couldn't delete Moment: ${error.message}`);
                          }
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <img src={moment.image} className="max-h-[32rem] w-full bg-slate-100 object-cover dark:bg-slate-900" alt={moment.title || 'Shared Moment'} />
                <div className="space-y-3 p-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{moment.title}</h4>
                  <div className="flex items-center gap-5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleMomentLike(moment.id).catch(error => {
                        console.error('Unable to update Moment like.', error);
                        showToast(`Couldn't like Moment: ${error.message}`);
                      })}
                      aria-pressed={isLiked}
                      className={`inline-flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                    >
                      <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{moment.likedBy?.length || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(moment.id)}
                      aria-expanded={isCommentsOpen}
                      className={`inline-flex items-center gap-1.5 transition ${isCommentsOpen ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-violet-500'}`}
                    >
                      <MessageCircle size={16} />
                      <span>{moment.commentCount || 0} comments</span>
                    </button>
                  </div>
                  {isCommentsOpen && (
                    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-2.5">
                          <Avatar src={comment.avatar} size="sm" />
                          <p className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            <span className="mr-1 font-bold">{comment.name}</span>{comment.text}
                          </p>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-xs text-slate-400">No comments yet. Start the conversation.</p>
                      )}
                      <form onSubmit={event => submitComment(event, moment.id)} className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={event => setCommentText(event.target.value)}
                          maxLength={500}
                          placeholder="Write a comment…"
                          aria-label="Write a comment"
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <button type="submit" disabled={!commentText.trim() || isCommenting} aria-label="Post comment" className="rounded-xl bg-violet-600 px-3 text-white transition hover:bg-violet-700 disabled:opacity-50">
                          <Send size={15} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {moments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950">
              <Sparkles className="mx-auto text-violet-400" size={32} />
              <h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">No Moments yet</h2>
              <p className="mt-1 text-xs text-slate-500">Share the first photo and start a new conversation.</p>
              {!isComposerOpen && (
                <button type="button" onClick={() => setIsComposerOpen(true)} className="mt-4 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                  Share your first Moment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DiscoverView = () => {
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

const SavedMessagesView = () => {
  const { savedMessages } = useContext(DataContext);

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Starred Messages</h1>
        {savedMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Bookmark className="mx-auto text-slate-300" size={40} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No starred messages yet</p>
            <p className="text-xs text-slate-400">Click the star icon on any message to store it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedMessages.map(m => (
              <div key={m.id} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-900 dark:text-white">{m.text}</p>
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, setUser } = useContext(AuthContext);
  const { showToast } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    username: (user.username || '').replace(/^@/, ''),
    bio: user.bio || '',
    location: user.location || '',
    vibe: user.vibe || ''
  }));
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const imagePreview = useMemo(
    () => selectedImage ? URL.createObjectURL(selectedImage) : '',
    [selectedImage]
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file for your profile photo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile photos must be 5 MB or smaller.');
      return;
    }
    setSelectedImage(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const usernameValue = form.username.trim().replace(/^@+/, '');
    if (!name) {
      showToast('Enter your name before saving.');
      return;
    }
    if (!/^[A-Za-z0-9._-]{2,30}$/.test(usernameValue)) {
      showToast('Username must be 2–30 characters using letters, numbers, dots, dashes, or underscores.');
      return;
    }
    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
      showToast('Your sign-in has expired. Sign in again to update your profile.');
      return;
    }

    setIsSaving(true);
    try {
      let avatar = user.avatar;
      if (selectedImage) {
        const uploadedImage = await uploadToCloudinary(selectedImage, { type: 'image', purpose: 'profile' });
        avatar = uploadedImage.secureUrl;
      }

      const updatedProfile = {
        name,
        username: `@${usernameValue}`,
        bio: form.bio.trim(),
        location: form.location.trim(),
        vibe: form.vibe.trim(),
        avatar
      };
      const profileRef = doc(db, 'users', user.uid);
      const profileSnapshot = await getDoc(profileRef);
      await setDoc(profileRef, {
        ...updatedProfile,
        ...(!profileSnapshot.exists() ? { createdAt: serverTimestamp() } : {})
      }, { merge: true });

      let authNameSyncError = null;
      if (auth.currentUser.displayName !== name) {
        try {
          await updateProfile(auth.currentUser, { displayName: name });
        } catch (error) {
          authNameSyncError = error;
          console.error('Profile saved but the authentication display name could not be updated.', error);
        }
      }
      setUser(previous => ({ ...previous, ...updatedProfile }));
      setSelectedImage(null);
      setIsEditing(false);
      showToast(authNameSyncError
        ? `Profile saved, but the sign-in display name could not be synced: ${authNameSyncError.message}`
        : 'Profile updated successfully.');
    } catch (error) {
      console.error('Unable to update the profile.', error);
      showToast(`Couldn't update profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950';
  const displayedAvatar = imagePreview || user.avatar;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24 dark:bg-slate-900 md:p-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isEditing ? 'Update how you appear to other Vibely members.' : 'View how you appear to other Vibely members.'}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <User size={16} />
              Edit Profile
            </button>
          )}
        </header>

        {!isEditing ? (
          <section className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col items-center gap-5 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start">
              <Avatar src={user.avatar} size="xl" />
              <div className="min-w-0 text-center sm:text-left">
                <h2 className="break-words text-2xl font-bold text-slate-900 dark:text-white">{user.name || 'Your name'}</h2>
                {user.username && <p className="mt-1 text-sm text-violet-600 dark:text-violet-400">{user.username.startsWith('@') ? user.username : `@${user.username}`}</p>}
                {user.vibe && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{user.vibe}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">About</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{user.bio || 'No bio added yet.'}</p>
            </div>
            {user.location && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</h3>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{user.location}</p>
              </div>
            )}
          </section>
        ) : (
        <form onSubmit={saveProfile} className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 md:p-8">
          <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row">
            <Avatar src={displayedAvatar} size="xl" />
            <div className="text-center sm:text-left">
              <h2 className="font-bold text-slate-900 dark:text-white">Profile photo</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose an image up to 5 MB.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900">
                <Camera size={15} />
                Change photo
                <input type="file" accept="image/*" onChange={selectImage} className="sr-only" />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</span>
              <input name="name" value={form.name} onChange={updateField} maxLength={60} required className={fieldClassName} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-sm text-slate-400">@</span>
                <input name="username" value={form.username} onChange={updateField} maxLength={30} required className="min-w-0 flex-1 bg-transparent py-2.5 pl-1 text-sm text-slate-900 outline-none dark:text-white" />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</span>
              <input name="location" value={form.location} onChange={updateField} maxLength={80} placeholder="City, country" className={fieldClassName} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current vibe</span>
              <input name="vibe" value={form.vibe} onChange={updateField} maxLength={80} placeholder="What are you up to?" className={fieldClassName} />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">About you</span>
            <textarea name="bio" value={form.bio} onChange={updateField} maxLength={240} rows={4} placeholder="Share a little about yourself..." className={`${fieldClassName} resize-y`} />
            <span className="block text-right text-[11px] text-slate-400">{form.bio.length}/240</span>
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setForm({
                  name: user.name || '',
                  username: (user.username || '').replace(/^@/, ''),
                  bio: user.bio || '',
                  location: user.location || '',
                  vibe: user.vibe || ''
                });
                setSelectedImage(null);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              {isSaving ? 'Saving profile…' : 'Save changes'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

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

const isVibeStoriesEnabled = () => {
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

const SettingsView = () => {
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

const AdminDashboardView = () => {
  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vibely Admin Console</h1>
          <p className="text-xs text-slate-500">Real-time system health and user moderation.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Accounts', value: '14,820', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
            { label: 'Active Vibes Today', value: '4,105', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
            { label: 'Transcripts Processed', value: '8,920', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950' },
            { label: 'Moderation Reports', value: '3 Pending', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Management Table */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active System Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-4 flex items-center space-x-3">
                      <Avatar src={u.avatar} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.username}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${u.role === 'admin' ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-emerald-500 font-semibold">Active</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-rose-500 hover:underline font-semibold">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

const ActiveCallOverlay = () => {
  const { activeCall, setActiveCall } = useContext(DataContext);
  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-8 text-white animate-fade-in">
      <div className="text-center space-y-2 mt-8">
        <Avatar src={activeCall.user?.avatar} size="xl" className="mx-auto" />
        <h2 className="text-2xl font-bold">{activeCall.user?.name}</h2>
        <p className="text-xs text-violet-400 font-medium">Vibely Encrypted {activeCall.type === 'video' ? 'Video' : 'Voice'} Call...</p>
      </div>

      <div className="flex items-center space-x-6 mb-12">
        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <MicOff size={22} />
        </button>
        <button onClick={() => setActiveCall(null)} className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/40">
          <PhoneOff size={28} />
        </button>
        {activeCall.type === 'video' && (
          <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
            <VideoOff size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

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