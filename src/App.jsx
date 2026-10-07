/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext, createContext, useRef, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebase.js';
import {
  Home, MessageCircle, Users, User, Settings, Shield, Search, Plus,
  Mic, Send, Smile, Paperclip, MoreVertical, Phone, Video,
  CheckCheck, Sun, Moon, LogOut, Bell, ChevronLeft, Heart,
  Activity, X, Play, Pause, Lock, Coffee, Laptop, Flame,
  Sparkles, Filter, Globe, Sliders, Bookmark,
  ShieldAlert, PhoneOff, MicOff, VideoOff
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

const MOCK_STORIES = [
  {
    id: 's1',
    userId: 'u1',
    isViewed: false,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    caption: 'Midnight coding session! 🚀',
    timestamp: '1h ago',
    vibe: '💻 Focused'
  },
  {
    id: 's2',
    userId: 'u2',
    isViewed: false,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    caption: 'Best cappuccino in Seattle town ☕✨',
    timestamp: '3h ago',
    vibe: '☕ Coffee Time'
  },
  {
    id: 's3',
    userId: 'u3',
    isViewed: true,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    caption: 'Live demo start in 10 minutes!',
    timestamp: '5h ago',
    vibe: '🔥 Excited'
  },
  {
    id: 's4',
    userId: 'u4',
    isViewed: true,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    caption: 'Shibuya crossing at night 🌆',
    timestamp: '8h ago',
    vibe: '✈️ Traveling'
  }
];

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

const MOCK_CIRCLES = [
  { id: 'cir1', name: 'Inner Circle', icon: Lock, members: 12, color: 'bg-gradient-to-r from-violet-500 to-indigo-600', description: 'Close friends & core updates.' },
  { id: 'cir2', name: 'Design Squad', icon: Laptop, members: 8, color: 'bg-gradient-to-r from-pink-500 to-rose-500', description: 'Figma prototypes and feedback.' },
  { id: 'cir3', name: 'Coffee & Tech', icon: Coffee, members: 24, color: 'bg-gradient-to-r from-amber-500 to-orange-500', description: 'Weekend coffee meetups & tech chatter.' }
];

const MOCK_MOMENTS = [
  {
    id: 'mom1',
    author: MOCK_USERS[1],
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
    title: 'Morning Brew Routine',
    location: 'Seattle Artisan Roasters',
    circle: 'Coffee & Tech',
    likes: 28,
    comments: 6,
    time: '2 hours ago'
  },
  {
    id: 'mom2',
    author: MOCK_USERS[3],
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    title: 'Night Lights at Senso-ji',
    location: 'Tokyo, Japan',
    circle: 'Inner Circle',
    likes: 45,
    comments: 12,
    time: '6 hours ago'
  }
];

const ThemeContext = createContext();
const AuthContext = createContext();
const RouterContext = createContext();
const DataContext = createContext();

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
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: profile.name || firebaseUser.displayName || firebaseUser.email,
        username: profile.username || `@${firebaseUser.email?.split('@')[0] || 'vibely'}`,
        avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
        vibe: profile.vibe || '✨ Here to connect',
        bio: profile.bio || '',
        role: 'user'
      });
    } catch (error) {
      console.error('Unable to load the signed-in user profile.', error);
      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email,
        username: `@${firebaseUser.email?.split('@')[0] || 'vibely'}`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
        vibe: '✨ Here to connect',
        bio: '',
        role: 'user'
      });
    } finally {
      setAuthLoading(false);
    }
  }), []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

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
    <AuthContext.Provider value={{ user, setUser, login, logout, register, authLoading, isOnboarding, setIsOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

const RouterProvider = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [routeParams, setRouteParams] = useState({});

  const navigate = (path, params = {}) => {
    setCurrentRoute(path);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ currentRoute, routeParams, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

const DataProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [chatState, setChatState] = useState({ uid: null, chats: [] });
  const [userState, setUserState] = useState({ uid: null, users: [] });
  const chats = chatState.uid === user?.uid ? chatState.chats : [];
  const users = userState.uid === user?.uid ? userState.users : [];
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
  const [stories, setStories] = useState(MOCK_STORIES);
  const [circles, setCircles] = useState(MOCK_CIRCLES);
  const [moments, setMoments] = useState(MOCK_MOMENTS);
  const [savedMessages, setSavedMessages] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // { user, type: 'voice' | 'video' }
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

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
      const chatIds = new Set(snapshot.docs.map(chatDoc => chatDoc.id));
      messageSubscriptions.forEach((unsubscribe, chatId) => {
        if (!chatIds.has(chatId)) {
          unsubscribe();
          messageSubscriptions.delete(chatId);
        }
      });

      setChats(previousChats => snapshot.docs.map(chatDoc => {
        const existingChat = previousChats.find(chat => chat.id === chatDoc.id);
        return {
          id: chatDoc.id,
          ...chatDoc.data(),
          isGroup: false,
          messages: existingChat?.messages || []
        };
      }).sort((first, second) => {
        const firstTime = first.updatedAt?.toMillis?.() || 0;
        const secondTime = second.updatedAt?.toMillis?.() || 0;
        return secondTime - firstTime;
      }));

      snapshot.docs.forEach((chatDoc) => {
        if (messageSubscriptions.has(chatDoc.id)) return;

        const messagesQuery = query(
          collection(db, 'chats', chatDoc.id, 'messages'),
          orderBy('createdAt', 'asc')
        );
        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
          setChats(previousChats => previousChats.map(chat => chat.id === chatDoc.id
            ? {
              ...chat,
              messages: messagesSnapshot.docs.map(messageDoc => {
                const message = messageDoc.data();
                return {
                  id: messageDoc.id,
                  ...message,
                  timestamp: message.createdAt?.toDate
                    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      createdAt: serverTimestamp()
    });
    batch.set(chatRef, {
      lastMessage: cleanText,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await batch.commit();
  };

  const addReaction = (chatId, messageId, emoji) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === messageId) {
              const reactions = m.reactions ? [...m.reactions, emoji] : [emoji];
              return { ...m, reactions };
            }
            return m;
          })
        };
      }
      return chat;
    }));
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

  const createCircle = (newCircle) => {
    setCircles(prev => [...prev, { ...newCircle, id: `cir_${Date.now()}`, members: 1 }]);
    showToast('New Circle created!');
  };

  return (
    <DataContext.Provider value={{
      chats, users, stories, circles, moments, savedMessages, activeCall, toastMessage,
      createChat, sendMessage, addReaction, toggleSaveMessage, votePoll, createCircle,
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

const IconButton = ({ icon: Icon, onClick, active, badge, className = '', title }) => (
  <button 
    onClick={onClick}
    title={title}
    className={`relative p-2.5 rounded-2xl transition-all duration-200 active:scale-95
      ${active ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}
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
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const navItems = [
    { id: '/', icon: Home, label: 'Feed & Home' },
    { id: '/chats', icon: MessageCircle, label: 'Chats', badge: true },
    { id: '/circles', icon: Users, label: 'Private Circles' },
    { id: '/moments', icon: Sparkles, label: 'Moments' },
    { id: '/discover', icon: CompassIcon, label: 'Discover & Vibe' },
    { id: '/saved', icon: Bookmark, label: 'Saved Messages' },
    { id: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 z-20 shrink-0">
      <div className="p-4 flex items-center justify-center lg:justify-start space-x-3 my-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform hover:scale-105">
          <Activity className="text-white" size={22} />
        </div>
        <div className="hidden lg:block">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 tracking-tight">
            Vibely
          </span>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">SHARE YOUR VIBE</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-semibold shadow-sm border border-violet-100 dark:border-violet-900/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              <div className="relative flex items-center justify-center lg:justify-start w-full">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 transition-transform group-hover:scale-110" />
                <span className="hidden lg:block ml-3.5 text-sm">{item.label}</span>
                {item.badge && (
                  <span className="absolute right-0 lg:static lg:ml-auto w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center justify-center lg:justify-start p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
          <span className="hidden lg:block ml-3 text-sm font-medium">{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer" onClick={() => navigate('/profile')}>
          <Avatar src={user.avatar} size="sm" isOnline={true} />
          <div className="hidden lg:block ml-2.5 flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.username}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); logout(); }} className="hidden lg:block text-slate-400 hover:text-rose-500 p-1">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const BottomNav = () => {
  const { currentRoute, navigate } = useContext(RouterContext);
  const { user } = useContext(AuthContext);

  const navItems = [
    { id: '/', icon: Home },
    { id: '/chats', icon: MessageCircle, badge: true },
    { id: '/circles', icon: Users },
    { id: '/moments', icon: Sparkles },
    { id: '/profile', icon: User, avatar: user?.avatar }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pb-safe z-40">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="p-2.5 relative rounded-2xl transition-transform active:scale-90"
            >
              {item.avatar ? (
                <div className={`rounded-full p-0.5 transition-all ${isActive ? 'ring-2 ring-violet-500 scale-105' : ''}`}>
                  <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" alt="profile" />
                </div>
              ) : (
                <Icon 
                  size={22} 
                  className={isActive ? 'text-violet-600 dark:text-violet-400 scale-110' : 'text-slate-400 dark:text-slate-500'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              {item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CompassIcon = ({ size, className }) => <Globe size={size} className={className} />;

const DashboardView = () => {
  const { stories, chats, users } = useContext(DataContext);
  const { navigate } = useContext(RouterContext);
  const { user, setUser } = useContext(AuthContext);

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

        {/* Stories Section */}
        <section className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-violet-500" size={20} />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vibe Stories</h2>
            </div>
            <button onClick={() => navigate('/stories')} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              View All
            </button>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
            {/* Add Story Card */}
            <div 
              onClick={() => navigate('/stories', { create: true })} 
              className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-400 dark:border-violet-600 flex items-center justify-center bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Story</span>
            </div>

            {/* Story List */}
            {stories.map(story => {
              const author = MOCK_USERS.find(u => u.id === story.userId) || user;
              return (
                <div 
                  key={story.id} 
                  onClick={() => navigate('/stories', { storyId: story.id })}
                  className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer"
                >
                  <StoryRing src={author.avatar} isViewed={story.isViewed} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate w-16 text-center">
                    {author.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Vibe Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Chat', icon: MessageCircle, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', path: '/chats' },
            { label: 'Create Circle', icon: Users, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', path: '/circles' },
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
                  onClick={() => navigate('/chats', { chatId: chat.id })}
                  className="flex items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-2xl cursor-pointer transition-colors"
                >
                  {isGroup ? (
                    <img src={chat.groupAvatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="Group" />
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
  const { chats, users, createChat, sendMessage, addReaction, toggleSaveMessage, votePoll, setActiveCall, showToast } = useContext(DataContext);
  const { routeParams, navigate } = useContext(RouterContext);
  const { user } = useContext(AuthContext);

  const activeChatId = routeParams.chatId || null;
  const [inputText, setInputText] = useState('');
  const [audioSpeed, setAudioSpeed] = useState('1x');
  const [isPlayingAudio, setIsPlayingAudio] = useState({});
  const [showTranscript, setShowTranscript] = useState({});
  const [showTranslation, setShowTranslation] = useState({});
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const isGroup = activeChat?.isGroup;
  const otherUser = !isGroup ? users.find(u => activeChat?.participants.includes(u.id) && u.id !== user.id) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

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

  return (
    <div className="flex-1 flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden pb-16 md:pb-0">
      
      {/* Conversations Sidebar (Left) */}
      <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col ${routeParams.chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <div className="flex items-center space-x-1">
            <IconButton icon={Plus} title="New Chat" onClick={() => navigate('/discover')} />
            <IconButton icon={Filter} title="Filter Chats" />
          </div>
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
          {chats.map(chat => {
            const chatIsGroup = chat.isGroup;
            const targetUser = !chatIsGroup ? users.find(u => chat.participants.includes(u.id) && u.id !== user.id) : null;
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isSelected = chat.id === activeChatId;

            return (
              <div 
                key={chat.id}
                onClick={() => {
                  navigate('/chats', { chatId: chat.id });
                }}
                className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
              >
                {chatIsGroup ? (
                  <img src={chat.groupAvatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="Group" />
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
        </div>
      </div>

      {/* Main Conversation Window (Right) */}
      <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 ${!routeParams.chatId && 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/chats')} className="md:hidden text-slate-500">
                  <ChevronLeft size={22} />
                </button>
                {isGroup ? (
                  <img src={activeChat.groupAvatar} className="w-10 h-10 rounded-full object-cover" alt="Group" />
                ) : (
                  <Avatar src={otherUser?.avatar} size="sm" isOnline={otherUser?.isOnline} />
                )}
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {isGroup ? activeChat.groupName : otherUser?.name || 'Vibely member'}
                  </h2>
                  <p className="text-[11px] text-emerald-500 font-medium">
                    {isGroup ? `${activeChat.participants.length} members` : 'Live chat'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <IconButton icon={Phone} title="Voice Call" onClick={() => setActiveCall({ user: otherUser, type: 'voice' })} />
                <IconButton icon={Video} title="Video Call" onClick={() => setActiveCall({ user: otherUser, type: 'video' })} />
                <IconButton icon={MoreVertical} title="Chat Options" />
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center my-2">
                <span className="text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                  Live messages • Your conversation is saved to your account
                </span>
              </div>

              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === user.id;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[80%] md:max-w-[65%] space-y-1`}>
                      
                      {/* Bubble */}
                      <div className={`p-3.5 rounded-3xl shadow-sm relative text-sm ${isMe ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-xs' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-800/80'}`}>
                        
                        {/* Voice Message Player Layout */}
                        {msg.type === 'voice' ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => setIsPlayingAudio(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                                className={`p-2.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-violet-600 text-white'}`}
                              >
                                {isPlayingAudio[msg.id] ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              
                              {/* Simulated Waveform */}
                              <div className="flex-1 flex items-center space-x-1 h-6">
                                {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70].map((h, i) => (
                                  <div key={i} className={`flex-1 rounded-full transition-all ${isMe ? 'bg-white/60' : 'bg-violet-500'}`} style={{ height: `${h}%` }}></div>
                                ))}
                              </div>

                              <span className="text-xs opacity-80">{msg.duration}</span>
                              <button 
                                onClick={() => setAudioSpeed(s => s === '1x' ? '1.5x' : s === '1.5x' ? '2x' : '1x')}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10"
                              >
                                {audioSpeed}
                              </button>
                            </div>

                            {/* AI Voice Transcript Button */}
                            {msg.transcript && (
                              <div className="pt-2 border-t border-current/10">
                                <button 
                                  onClick={() => setShowTranscript(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                                  className="text-[11px] font-semibold flex items-center space-x-1 opacity-90 hover:underline"
                                >
                                  <Sparkles size={12} />
                                  <span>{showTranscript[msg.id] ? 'Hide AI Transcript' : 'View AI Transcript'}</span>
                                </button>
                                {showTranscript[msg.id] && (
                                  <p className="text-xs italic mt-1.5 p-2 rounded-xl bg-black/10 dark:bg-white/10">
                                    "{msg.transcript}"
                                  </p>
                                )}
                              </div>
                            )}
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
                        ) : (
                          /* Standard Text Layout */
                          <p>{msg.text}</p>
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

                        <div className="flex items-center justify-end space-x-1.5 mt-1">
                          <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                          {isMe && <CheckCheck size={14} className="opacity-80" />}
                        </div>
                      </div>

                      {/* Action icons on hover */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        <button onClick={() => addReaction(activeChat.id, msg.id, '❤️')} className="text-xs hover:scale-125 transition-transform">❤️</button>
                        <button onClick={() => addReaction(activeChat.id, msg.id, '🔥')} className="text-xs hover:scale-125 transition-transform">🔥</button>
                        <button onClick={() => toggleSaveMessage(msg)} className="text-xs text-slate-400 hover:text-amber-400">⭐</button>
                      </div>

                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
              <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-4xl mx-auto">
                <IconButton icon={Paperclip} title="Attach media" onClick={() => showToast('Attachment options open!')} />
                
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center px-4 py-2 border border-transparent focus-within:border-violet-500 transition-all">
                  <Smile size={20} className="text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a vibe or message..."
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {inputText.trim() ? (
                  <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-2xl transition-transform active:scale-95 shadow-md shadow-violet-500/20">
                    <Send size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={() => showToast('Type a message to send it live.')} title="Send a message" className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-2xl hover:bg-slate-800 transition-transform active:scale-95">
                    <Mic size={18} />
                  </button>
                )}
              </form>
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

    </div>
  );
};

const StoriesView = () => {
  const { stories } = useContext(DataContext);
  const { navigate } = useContext(RouterContext);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeStory = stories[currentIndex] || stories[0];
  const storyAuthor = MOCK_USERS.find(u => u.id === activeStory?.userId) || MOCK_USERS[0];

  return (
    <div className="flex-1 h-screen bg-black flex items-center justify-center relative p-4">
      <button onClick={() => navigate('/')} className="absolute top-5 right-5 text-white bg-white/20 p-3 rounded-full backdrop-blur-md z-30">
        <X size={20} />
      </button>

      <div className="w-full max-w-sm h-[85vh] bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
        {/* Background Image */}
        <img src={activeStory?.image} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Story" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>

        {/* Story Header */}
        <div className="relative z-10 space-y-3">
          <div className="flex space-x-1">
            {stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all duration-300 ${idx === currentIndex ? 'w-full' : idx < currentIndex ? 'w-full' : 'w-0'}`}></div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Avatar src={storyAuthor.avatar} size="sm" />
              <div>
                <p className="text-xs font-bold">{storyAuthor.name}</p>
                <p className="text-[10px] opacity-75">{activeStory?.timestamp}</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-violet-600 px-2.5 py-1 rounded-full">{activeStory?.vibe}</span>
          </div>
        </div>

        {/* Story Content Bottom */}
        <div className="relative z-10 space-y-4">
          <p className="text-white text-base font-semibold drop-shadow-md">{activeStory?.caption}</p>

          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Reply to story..." 
              className="flex-1 bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl border border-white/20 placeholder-white/70 focus:outline-none"
            />
            <button className="bg-violet-600 text-white p-2.5 rounded-2xl">
              <Heart size={18} />
            </button>
          </div>
        </div>

        {/* Tap areas for prev/next */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}></div>
          <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentIndex(p => Math.min(stories.length - 1, p + 1))}></div>
        </div>
      </div>
    </div>
  );
};

const CirclesView = () => {
  const { circles, createCircle } = useContext(DataContext);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return;
    createCircle({ name, description, icon: Lock, color: 'bg-gradient-to-r from-violet-500 to-indigo-600' });
    setName('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Private Circles</h1>
            <p className="text-xs text-slate-500">Selective social spaces with custom privacy boundaries.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs font-bold transition-all shadow-md shadow-violet-500/20">
            <Plus size={16} />
            <span>New Circle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {circles.map(circle => {
            const Icon = circle.icon || Lock;
            return (
              <div key={circle.id} className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl ${circle.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{circle.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{circle.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">{circle.members} Members</span>
                  <button className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">Open Circle</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Private Circle</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input 
                type="text" 
                placeholder="Circle Name (e.g., Founders Club)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs border border-transparent focus:border-violet-500 focus:outline-none"
              />
              <textarea 
                placeholder="Description & purpose..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs border border-transparent focus:border-violet-500 focus:outline-none h-20 resize-none"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="bg-violet-600 text-white px-4 py-2 rounded-2xl text-xs font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MomentsView = () => {
  const { moments } = useContext(DataContext);

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shared Moments</h1>
          <p className="text-xs text-slate-500">Temporary timeline memories shared inside your circles.</p>
        </div>

        <div className="space-y-6">
          {moments.map(m => (
            <div key={m.id} className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar src={m.author.avatar} size="sm" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{m.author.name}</h3>
                    <p className="text-[10px] text-slate-400">{m.location} • {m.time}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-full">{m.circle}</span>
              </div>
              <img src={m.image} className="w-full h-80 object-cover" alt="Moment" />
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                <div className="flex items-center space-x-4 text-xs text-slate-500 pt-2">
                  <button className="flex items-center space-x-1 hover:text-rose-500"><Heart size={16} /> <span>{m.likes}</span></button>
                  <button className="flex items-center space-x-1 hover:text-violet-500"><MessageCircle size={16} /> <span>{m.comments}</span></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DiscoverView = () => {
  const { users, createChat, showToast } = useContext(DataContext);
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
              <button 
                onClick={() => messageUser(u)}
                className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-2xl text-xs font-semibold hover:bg-violet-600 transition-colors"
              >
                Message
              </button>
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

const SettingsView = () => {
  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { title: 'Account Privacy', desc: 'Control who sees your vibe and online status', icon: Shield },
            { title: 'Notifications', desc: 'Message alerts and story updates', icon: Bell },
            { title: 'Security & Password', desc: 'Two-factor auth and active sessions', icon: Lock },
            { title: 'Storage & Data', desc: 'Network usage and media auto-download', icon: Sliders }
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </div>
                </div>
                <ChevronLeft size={18} className="rotate-180 text-slate-400" />
              </div>
            );
          })}
        </div>
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
  const { user, authLoading, login, register } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
    setIsSubmitting(true);

    try {
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
        'auth/weak-password': 'Use a password with at least 6 characters.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.'
      };
      setErrorMessage(messages[error.code] || error.message || 'Unable to authenticate. Please try again.');
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
            {isRegistering ? 'Create an account and meet your people.' : 'Sign in to catch up and chat live.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
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
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              required
              type="password"
              minLength={6}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="At least 6 characters"
            />
          </label>
          {errorMessage && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isRegistering ? 'Already have an account?' : 'New to Vibely?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(value => !value);
              setErrorMessage('');
            }}
            className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  );
};

const MainAppLayout = () => {
  const { currentRoute } = useContext(RouterContext);
  const { toastMessage } = useContext(DataContext);

  const renderCurrentView = () => {
    if (currentRoute === '/') return <DashboardView />;
    if (currentRoute === '/chats') return <ChatView />;
    if (currentRoute === '/stories') return <StoriesView />;
    if (currentRoute === '/circles') return <CirclesView />;
    if (currentRoute === '/moments') return <MomentsView />;
    if (currentRoute === '/discover') return <DiscoverView />;
    if (currentRoute === '/saved') return <SavedMessagesView />;
    if (currentRoute === '/settings') return <SettingsView />;
    if (currentRoute === '/admin') return <AdminDashboardView />;
    
    // Default fallback
    return <DashboardView />;
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <Toast message={toastMessage} />
      <Sidebar />
      {renderCurrentView()}
      <BottomNav />
      <ActiveCallOverlay />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <RouterProvider>
            <AuthGate />
          </RouterProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}