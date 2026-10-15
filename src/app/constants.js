

export const DEMO_ACCOUNTS = [
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

export const MOCK_USERS = [
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

export const MOCK_STORIES = [];

export const MOCK_CHATS = [
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

export const MESSAGE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
export const MORE_MESSAGE_REACTIONS = [
  '😀', '😁', '😆', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '🙄', '😴',
  '😭', '😡', '🥳', '🤗', '🤩', '😇', '🤝', '👏', '🙌', '💪', '🫶', '💯',
  '🔥', '🎉', '✨', '💖', '💕', '💔', '✅', '❌', '👀', '💐', '🤦', '🤷',
  '🍰', '☕', '🌹', '⭐', '🤍', '🫡', '😋', '😜', '🥺', '🤯', '😬'
];
export const getMessageDate = (createdAt) => {
  const date = typeof createdAt?.toDate === 'function'
    ? createdAt.toDate()
    : createdAt instanceof Date
      ? createdAt
      : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
export const getMessageDateLabel = (date) => {
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
export const ATTACHMENT_MIME_TYPES = {
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
export const SUPPORTED_DOCUMENT_MIME_TYPES = [
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

export const getAttachmentMimeType = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return file.type && file.type !== 'application/octet-stream'
    ? file.type
    : ATTACHMENT_MIME_TYPES[extension] || file.type || 'application/octet-stream';
};

