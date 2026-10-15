import { useState, useEffect, useContext, useMemo } from 'react';
import { MessageCircle, Plus, Send, Heart, X, Sparkles, Trash2 } from 'lucide-react';
import { AuthContext, DataContext } from '../app/contexts.js';
import { Avatar } from '../components/SharedComponents.jsx';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.js';

export const MomentsView = () => {
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

