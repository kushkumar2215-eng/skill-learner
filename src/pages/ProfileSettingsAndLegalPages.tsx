import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Award,
  KeyRound,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SKILL_CATEGORIES, ExperienceLevel, DeliveryMode } from '../types/domain';
import { UserAvatar } from '../components/BrandLogo';
import {
  validateProfileInput,
  calculateProfileCompletion,
} from '../utils/skillLogic';

const AVATAR_COLOR_OPTIONS = [
  '#0D9488',
  '#0284C7',
  '#4F46E5',
  '#D97706',
  '#E11D48',
  '#059669',
  '#334155',
];

export const ProfileView: React.FC = () => {
  const {
    currentUserProfile: profile,
    userSkills,
    achievements,
    exchanges,
    saveUserProfile,
    navigate,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarColor, setAvatarColor] = useState(
    profile?.avatarColor || AVATAR_COLOR_OPTIONS[0]
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experienceLevel || 'Intermediate'
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferredLanguage || 'English'
  );
  const [learningMode, setLearningMode] = useState<DeliveryMode>(
    profile?.learningMode || 'Online'
  );
  const [regionLabel, setRegionLabel] = useState(profile?.regionLabel || 'Remote');
  const [availability, setAvailability] = useState(
    profile?.availability || 'Flexible schedule'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests || []
  );
  const [isPublic, setIsPublic] = useState(profile?.isPublic ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const myOffered = userSkills.filter((s) => s.type === 'teach');
  const myWanted = userSkills.filter((s) => s.type === 'learn');
  const unlockedBadges = achievements.filter((a) => a.earned);
  const completedExchanges = exchanges.filter((e) => e.status === 'Completed').length;
  const completionPct = calculateProfileCompletion(profile, userSkills);

  const startEditing = () => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setAvatarColor(profile.avatarColor);
    setExperienceLevel(profile.experienceLevel);
    setPreferredLanguage(profile.preferredLanguage);
    setLearningMode(profile.learningMode);
    setRegionLabel(profile.regionLabel);
    setAvailability(profile.availability);
    setSelectedInterests(profile.interests);
    setIsPublic(profile.isPublic);
    setError(null);
    setIsEditing(true);
  };

  const toggleInterest = (cat: string) => {
    setSelectedInterests((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProfileInput({
      displayName,
      bio,
      preferredLanguage,
      regionLabel,
      availability,
      interests: selectedInterests,
    });
    if (!validation.valid) {
      const firstErr = Object.values(validation.errors)[0];
      setError(firstErr || 'Please check your profile fields.');
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarColor,
        experienceLevel,
        preferredLanguage: preferredLanguage.trim(),
        learningMode,
        regionLabel: regionLabel.trim() || 'Remote',
        availability: availability.trim(),
        interests: selectedInterests,
        isPublic,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <UserAvatar
              name={profile.displayName}
              color={profile.avatarColor}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {profile.displayName}
                </h1>
                <span className="text-xs font-mono text-slate-500">
                  {profile.isPublic ? 'Public Profile' : 'Private Profile'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mb-3">
                {profile.experienceLevel} · {profile.learningMode} · {profile.regionLabel} ·{' '}
                {profile.preferredLanguage}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('settings')}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <div className="text-xs font-medium text-slate-500">Profile Completion</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {completionPct.percent}%
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Skills Teaching</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {myOffered.length}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Skills Learning</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {myWanted.length}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Exchanges Completed</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {completedExchanges}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-teal-200 p-6 sm:p-8 space-y-5 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Edit Public Profile Details
            </h2>
            <span className="text-xs text-slate-500">
              Email addresses are kept strictly private and never shown publicly
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Avatar Color Theme
              </label>
              <div className="flex items-center gap-2 pt-1">
                {AVATAR_COLOR_OPTIONS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setAvatarColor(hex)}
                    className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                      avatarColor === hex
                        ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`Select color ${hex}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bio & Learning Philosophy *
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Overall Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Mode
              </label>
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as DeliveryMode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600"
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Language *
              </label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location / Timezone Label
              </label>
              <input
                type="text"
                value={regionLabel}
                onChange={(e) => setRegionLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Typical Availability *
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Categories of Interest (up to 10)
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_CATEGORIES.map((cat) => {
                const active = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Show my profile in the public Discover Skills directory</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Two-Column Portfolio */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skills I Teach */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Skills I Can Teach ({myOffered.length})
              </h2>
              <p className="text-xs text-slate-500">
                Listed on your profile for bilateral skill swaps
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('skills')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Manage Skills →
            </button>
          </div>

          {myOffered.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <p className="text-xs text-slate-600 mb-3">
                You haven&apos;t added any teaching skills yet.
              </p>
              <button
                type="button"
                onClick={() => navigate('skills')}
                className="px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold cursor-pointer"
              >
                Add Teaching Skill
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffered.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-slate-900">{skill.title}</h3>
                    <span className="text-xs font-mono text-teal-700">
                      {skill.category} · {skill.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {skill.description}
                  </p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Format: {skill.deliveryMode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills I Want to Learn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Skills I Want to Learn ({myWanted.length})
              </h2>
              <p className="text-xs text-slate-500">
                Topics you are looking to practice with a peer mentor
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('skills')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Manage Goals →
            </button>
          </div>

          {myWanted.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <p className="text-xs text-slate-600 mb-3">
                You haven&apos;t listed any skills to learn yet.
              </p>
              <button
                type="button"
                onClick={() => navigate('skills')}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Add Learning Interest
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myWanted.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-slate-900">{skill.title}</h3>
                    <span className="text-xs font-mono text-amber-700">
                      {skill.category} · {skill.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {skill.description}
                  </p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Format: {skill.deliveryMode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements & Interests Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Earned Badges ({unlockedBadges.length}/{achievements.length})
            </h2>
            <button
              type="button"
              onClick={() => navigate('achievements')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              View All Badges →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {unlockedBadges.slice(0, 4).map((badge) => (
              <div
                key={badge.id}
                className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/80 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{badge.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-3">
            Interests & Availability
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            Typical schedule:{' '}
            <span className="font-semibold text-slate-900">{profile.availability}</span>
          </p>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Selected Categories
          </div>
          <p className="text-sm text-slate-700">
            {profile.interests.length > 0
              ? profile.interests.join(' · ')
              : 'No categories selected yet.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const {
    currentUserProfile: profile,
    privateSettings,
    firebaseUser,
    sessionMode,
    includeSampleData,
    setIncludeSampleData,
    saveUserProfile,
    savePrivateSettings,
    updateUserPasswordAction,
    deleteAccountAction,
  } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  if (!profile) return null;

  const isSandbox = sessionMode === 'sandbox';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    const ok = await updateUserPasswordAction(newPassword);
    if (ok) {
      setNewPassword('');
      setConfirmPassword('');
      setPwMessage('Password updated.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Privacy & Directory Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Shield className="w-5 h-5 text-teal-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Privacy & Directory Visibility
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Public Profile Visibility
              </div>
              <div className="text-xs text-slate-500">
                Allow other learners to find your profile and offered skills in Discover Skills.
              </div>
            </div>
            <button
              type="button"
              onClick={() => saveUserProfile({ isPublic: !profile.isPublic })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                profile.isPublic
                  ? 'bg-teal-50 border-teal-600 text-teal-800'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              {profile.isPublic ? 'Public (Visible)' : 'Private (Hidden)'}
            </button>
          </div>

          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Show Sample Community Data
              </div>
              <div className="text-xs text-slate-500">
                Include clearly labeled <span className="font-mono">(Sample Profile)</span> cards in Discover Skills so you can explore filtering and requests immediately.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeSampleData(!includeSampleData)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                includeSampleData
                  ? 'bg-teal-50 border-teal-600 text-teal-800'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              {includeSampleData ? 'Sample Data Enabled' : 'Live Records Only'}
            </button>
          </div>

          {privateSettings && (
            <>
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Allow Direct Skill Exchange Requests
                  </div>
                  <div className="text-xs text-slate-500">
                    Let community members propose bilateral skill swaps with you.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    savePrivateSettings({
                      allowDirectRequests: !privateSettings.allowDirectRequests,
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    privateSettings.allowDirectRequests
                      ? 'bg-teal-50 border-teal-600 text-teal-800'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {privateSettings.allowDirectRequests ? 'Allowed' : 'Paused'}
                </button>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Exchange Status Notifications
                  </div>
                  <div className="text-xs text-slate-500">
                    Receive alerts when a swap request is sent, accepted, or completed.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    savePrivateSettings({
                      exchangeAlerts: !privateSettings.exchangeAlerts,
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    privateSettings.exchangeAlerts
                      ? 'bg-teal-50 border-teal-600 text-teal-800'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {privateSettings.exchangeAlerts ? 'Active' : 'Muted'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Private Account Info & Password */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound className="w-5 h-5 text-slate-700" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Account Security & Credentials
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Private Account Email (Never Shown Publicly)
            </div>
            <div className="text-sm font-mono font-semibold text-slate-900 mt-0.5">
              {firebaseUser?.email || 'sandbox-learner@skilllearner.local'}
            </div>
          </div>
          <span className="text-xs font-mono text-teal-700">
            {isSandbox ? 'Interactive Sandbox Session' : 'Firebase Auth Verified'}
          </span>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <h3 className="text-sm font-semibold text-slate-900">Update Password</h3>
          {pwError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {pwError}
            </div>
          )}
          {pwMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {pwMessage}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-rose-900">
              Delete Account & Learning Data
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Permanently remove your profile, offered/wanted skills, learning goals, and private settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Delete Account
          </button>
        </div>

        {confirmDeleteOpen && (
          <div className="mt-4 pt-4 border-t border-rose-100 space-y-3">
            <p className="text-xs font-medium text-rose-800">
              Type <span className="font-mono font-bold">DELETE</span> below to confirm permanent account removal:
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="px-3.5 py-2 rounded-xl border border-rose-300 text-sm font-mono w-44"
              />
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE'}
                onClick={() => deleteAccountAction()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Permanent Deletion
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AboutView: React.FC = () => {
  const { navigate } = useApp();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10">
        <div className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold mb-2">
          About Skill Learner
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
          Teach. Learn. Connect. Grow.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          Skill Learner is built on a simple principle: everyone is both a student and a teacher. Whether you write production TypeScript, bake sourdough bread, design Figma component systems, or speak conversational Spanish, someone in our community is eager to learn what you know—and can teach you what they know in return.
        </p>
        <div className="grid sm:grid-cols-3 gap-5 pt-6 border-t border-slate-100">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 mb-1">
              Reciprocal Exchanges
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Structured 1-on-1 skill swaps with clear expectations, scheduling notes, and completion tracking.
            </p>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 mb-1">
              Privacy by Default
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your private email address is isolated in a protected subcollection and never exposed on public cards.
            </p>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 mb-1">
              Deliberate Progress
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log study sessions, track milestone goals, and unlock condition-based community achievements.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('discover')}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold cursor-pointer"
          >
            Browse Skills Directory
          </button>
          <button
            type="button"
            onClick={() => navigate('deployment')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
          >
            View Architecture & Deployment Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Community Support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const stored = JSON.parse(
      localStorage.getItem('skill_learner_contact_inquiries') || '[]'
    );
    stored.unshift({
      id: `inq_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      topic,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('skill_learner_contact_inquiries', JSON.stringify(stored));
    setSubmitted(true);
    addToast('success', 'Message recorded', 'Your inquiry has been saved.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10">
        <div className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold mb-2">
          Contact & Feedback
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Get in Touch with the Skill Learner Team
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Have a question about a skill exchange, community circle, or feature request? Reach out directly or send us a message below.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 text-xs text-slate-700">
          <div className="space-y-1">
            <div className="font-semibold text-slate-900">Official Email</div>
            <a
              href="mailto:skilllearner.1348@gmail.com"
              className="block text-teal-700 hover:underline break-all"
            >
              skilllearner.1348@gmail.com
            </a>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-slate-900">Location</div>
            <div className="text-slate-600">Gopalganj, Bihar, India</div>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200 text-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>Message Received</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thank you, <span className="font-semibold">{name}</span>. Your message under{' '}
              <span className="font-mono">{topic}</span> has been validated and recorded.
              (Note: Outbound transactional email delivery can be connected via a server webhook or Cloud Function in production).
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setMessage('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reply Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="Community Support">Community Support</option>
                <option value="Skill Exchange Question">Skill Exchange Question</option>
                <option value="New Circle Proposal">Propose a Learning Circle</option>
                <option value="Security & Privacy">Security & Privacy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPolicyView: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 space-y-6">
      <div className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold">
        Privacy Policy
      </div>
      <h1 className="font-display text-3xl font-bold text-slate-900">
        How Skill Learner Protects Your Data
      </h1>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          <strong>1. Public vs. Private Data Separation:</strong> Your public profile (`/users/&#123;uid&#125;`) contains only the display name, bio, skill categories, learning mode, and availability you choose to share. Your email address and notification preferences are stored strictly inside `/users/&#123;uid&#125;/private/settings`, accessible only to your authenticated UID.
        </p>
        <p>
          <strong>2. Bilateral Exchange Confidentiality:</strong> Skill exchange requests (`/skillExchanges/&#123;exchangeId&#125;`) and their embedded message threads are protected by Firestore Security Rules so that only the `requesterId` and `receiverId` can read or update them.
        </p>
        <p>
          <strong>3. Account Control & Deletion:</strong> You can switch your profile to private or permanently delete your profile, skills, and learning goals at any time from Settings.
        </p>
      </div>
    </div>
  </div>
);

export const TermsOfServiceView: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 space-y-6">
      <div className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold">
        Terms of Service
      </div>
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Community Guidelines & Terms
      </h1>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          <strong>1. Respectful Reciprocity:</strong> Skill Learner is a peer-to-peer educational exchange platform. Members agree to honor scheduled learning sessions or communicate cancellations promptly.
        </p>
        <p>
          <strong>2. Authentic Skill Listings:</strong> Only list skills and experience levels accurately representing what you can teach or wish to learn.
        </p>
        <p>
          <strong>3. Safe Learning Environment:</strong> Harassment, spam, or commercial solicitation inside exchange requests or community circles is strictly prohibited.
        </p>
      </div>
    </div>
  </div>
);

export const DeploymentGuideView: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-teal-700 font-semibold mb-1">
          Setup & Production Deployment Guide
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Skill Learner — Architecture & Firebase Setup
        </h1>
      </div>

      <div className="space-y-4 text-sm text-slate-700">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <h3 className="font-display font-bold text-slate-900 mb-1">
            1. Local Development & Build Commands
          </h3>
          <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto mt-2">
{`npm install
npm run dev       # Starts Vite development server on port 3000
npm run build     # Builds production bundle into dist/
npx tsx --test src/utils/skillLogic.test.ts firestore.rules.test.ts`}
          </pre>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <h3 className="font-display font-bold text-slate-900 mb-1">
            2. Firebase Configuration & Auth Providers
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            Firebase config is loaded from <code className="font-mono">firebase-applet-config.json</code> (Project ID: <code className="font-mono">lustrous-processor-m4mm2</code>). Google Sign-In works immediately. To enable Email/Password sign-up in the live Firebase project:
          </p>
          <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
            <li>Open the Firebase Console for project <code className="font-mono">lustrous-processor-m4mm2</code>.</li>
            <li>Navigate to <strong>Authentication → Sign-in method</strong>.</li>
            <li>Enable <strong>Email/Password</strong> and click Save.</li>
            <li>Ensure your deployment domain (Vercel / Netlify / Cloud Run URL) is listed under <strong>Authentication → Settings → Authorized domains</strong>.</li>
          </ol>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <h3 className="font-display font-bold text-slate-900 mb-1">
            3. Firestore Security Rules & Indexes
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Production rules in <code className="font-mono">firestore.rules</code> enforce owner-only writes on <code className="font-mono">/users/&#123;uid&#125;</code>, strict private access on <code className="font-mono">/users/&#123;uid&#125;/private/settings</code>, and participant-verified state transitions on <code className="font-mono">/skillExchanges/&#123;exchangeId&#125;</code>. Before broad public launch, review the rules in the Firebase Console and add rate-limiting or Firebase App Check as your community scales.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const NotFoundView: React.FC = () => {
  const { navigate } = useApp();
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-slate-200 p-8">
        <div className="text-xs font-mono text-teal-700 uppercase font-semibold mb-2">
          404 · Page Not Found
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
          We couldn&apos;t find that learning route
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          The page you requested may have moved or does not exist.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold cursor-pointer"
          >
            Return Home
          </button>
          <button
            type="button"
            onClick={() => navigate('discover')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Discover Skills
          </button>
        </div>
      </div>
    </div>
  );
};
