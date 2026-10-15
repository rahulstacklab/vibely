/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { Settings, Plus, Heart, X, Sparkles } from 'lucide-react';
import { AuthContext, RouterContext, DataContext } from '../app/contexts.js';
import { MOCK_USERS } from '../app/constants.js';
import { Avatar } from '../components/SharedComponents.jsx';
import { isVibeStoriesEnabled } from './SettingsView.jsx';

export const StoriesView = () => {
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


