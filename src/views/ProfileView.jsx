import { useState, useEffect, useContext, useMemo } from 'react';
import { User, Camera, Save } from 'lucide-react';
import { AuthContext, DataContext } from '../app/contexts.js';
import { Avatar } from '../components/SharedComponents.jsx';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import { uploadToCloudinary } from '../services/uploadService.js';

export const ProfileView = () => {
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

