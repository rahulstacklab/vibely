/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { browserLocalPersistence, createUserWithEmailAndPassword, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, setPersistence, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { uploadToCloudinary } from '../services/uploadService.js';
import { Video } from 'lucide-react';
import { ThemeContext, AuthContext, RouterContext, DataContext } from './contexts.js';
import { SUPPORTED_DOCUMENT_MIME_TYPES, getAttachmentMimeType } from './constants.js';

let localAuthPersistencePromise;

export const ThemeProvider = ({ children }) => {
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

export const AuthProvider = ({ children }) => {
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

export const RouterProvider = ({ children }) => {
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

export const DataProvider = ({ children }) => {
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

  const sendMessage = async (chatId, text, replyTo = null) => {
    const cleanText = text.trim();
    if (!cleanText || !user?.uid) return;

    const chatRef = doc(db, 'chats', chatId);
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const batch = writeBatch(db);
    const messageData = {
      senderId: user.uid,
      text: cleanText,
      type: 'text',
      readBy: [user.uid],
      createdAt: serverTimestamp()
    };
    if (replyTo) messageData.replyTo = replyTo;
    batch.set(messageRef, messageData);
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
