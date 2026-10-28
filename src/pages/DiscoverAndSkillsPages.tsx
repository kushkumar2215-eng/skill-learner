import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Edit3,
  Plus,
  Repeat,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  DeliveryMode,
  ExperienceLevel,
  SKILL_CATEGORIES,
  SkillRecord,
  SkillType,
  UserProfile,
} from '../types/domain';
import {
  filterAndSortSkills,
  validateExchangeRequest,
  validateSkillInput,
} from '../utils/skillLogic';
import { UserAvatar } from '../components/BrandLogo';

export const DiscoverSkillsView: React.FC = () => {
  const {
    allSkills,
    allProfiles,
    userSkills,
    exchanges,
    currentUserProfile,
    includeSampleData,
    setIncludeSampleData,
    createExchangeRequest,
    togglePeerConnection,
    connections,
    startSandboxSession,
    navigate,
  } = useApp();

  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<'all' | SkillType>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | ExperienceLevel>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<'all' | DeliveryMode>('all');

  // Modals
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);
  const [exchangeModalTarget, setExchangeModalTarget] = useState<{
    skill: SkillRecord;
    owner: UserProfile | undefined;
  } | null>(null);

  const [offeredSkillInput, setOfferedSkillInput] = useState('');
  const [requestedSkillInput, setRequestedSkillInput] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [exchangeErrors, setExchangeErrors] = useState<Record<string, string>>({});

  const profilesById = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    allProfiles.forEach((p) => {
      map[p.uid] = p;
    });
    return map;
  }, [allProfiles]);

  const filteredSkills = useMemo(
    () =>
      filterAndSortSkills(
        allSkills,
        {
          query: queryText,
          category: selectedCategory,
          type: selectedType,
          level: selectedLevel,
          deliveryMode: selectedDelivery,
          includeDemo: includeSampleData,
        },
        profilesById
      ),
    [
      allSkills,
      queryText,
      selectedCategory,
      selectedType,
      selectedLevel,
      selectedDelivery,
      includeSampleData,
      profilesById,
    ]
  );

  const openExchangeModal = (skill: SkillRecord) => {
    if (!currentUserProfile) {
      startSandboxSession('Alex Rivera', false);
    }
    const myTeachSkill = userSkills.find((s) => s.type === 'teach')?.title || '';
    setOfferedSkillInput(myTeachSkill);
    setRequestedSkillInput(skill.title);
    setIntroMessage(
      `Hi ${skill.ownerName.replace(/\(Sample Profile\)/i, '').trim()}, I would love to learn "${skill.title}" from you and share my knowledge in return!`
    );
    setExchangeErrors({});
    setExchangeModalTarget({ skill, owner: profilesById[skill.ownerId] });
  };

  const handleSendExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeModalTarget || !currentUserProfile) return;

    const validation = validateExchangeRequest(
      {
        requesterId: currentUserProfile.uid,
        receiverId: exchangeModalTarget.skill.ownerId,
        skillOfferedTitle: offeredSkillInput,
        skillRequestedTitle: requestedSkillInput,
        introMessage,
      },
      exchanges
    );

    if (!validation.valid) {
      setExchangeErrors(validation.errors);
      return;
    }

    const ok = await createExchangeRequest({
      receiverId: exchangeModalTarget.skill.ownerId,
      receiverName: exchangeModalTarget.skill.ownerName,
      skillOfferedTitle: offeredSkillInput,
      skillRequestedTitle: requestedSkillInput,
      introMessage,
    });

    if (ok) {
      setExchangeModalTarget(null);
      navigate('exchanges');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Discover Skills & Mentors
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Find members offering skills you want to learn or seeking skills you can teach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-white border border-slate-200 px-3 py-2 rounded-xl">
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={(e) => setIncludeSampleData(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-600"
            />
            <span>Show Sample Preview Profiles</span>
          </label>
        </div>
      </div>

      {/* Search & Multi-Facet Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="discover-search-input" className="sr-only">
              Search skills by keyword or mentor name
            </label>
            <input
              id="discover-search-input"
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by skill name, topic, or member..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="discover-category-select" className="sr-only">
              Filter by Category
            </label>
            <select
              id="discover-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            >
              <option value="All">All Categories</option>
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="discover-level-select" className="sr-only">
              Filter by Experience Level
            </label>
            <select
              id="discover-level-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as 'all' | ExperienceLevel)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="discover-mode-select" className="sr-only">
              Filter by Delivery Format
            </label>
            <select
              id="discover-mode-select"
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value as 'all' | DeliveryMode)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            >
              <option value="all">Any Format</option>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Segmented Interactive Type Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div
            role="group"
            aria-label="Filter by skill direction"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
          >
            {(
              [
                { id: 'all', label: 'All Listings' },
                { id: 'teach', label: 'Skills Offered (Mentors)' },
                { id: 'learn', label: 'Skills Wanted (Learners)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedType === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredSkills.length} matching skill{filteredSkills.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Results Grid */}
      {filteredSkills.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="font-display text-lg font-bold text-slate-900">
            No matching skills found
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {!includeSampleData
              ? 'Sample preview records are currently hidden and no live records match your filters. Enable "Show Sample Preview Profiles" or add your own skill.'
              : 'Try broadening your search terms or resetting the category and experience filters.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setQueryText('');
                setSelectedCategory('All');
                setSelectedType('all');
                setSelectedLevel('all');
                setSelectedDelivery('all');
                setIncludeSampleData(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl"
            >
              Reset All Filters
            </button>
            <button
              type="button"
              onClick={() => navigate('skills')}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
            >
              Add a Skill
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSkills.map((skill) => {
            const ownerProfile = profilesById[skill.ownerId];
            const isOwnSkill = currentUserProfile?.uid === skill.ownerId;

            return (
              <article
                key={skill.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  {/* Unboxed quiet metadata line */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-teal-800">
                      {skill.type === 'teach' ? 'Offering to Teach' : 'Seeking to Learn'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{skill.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{skill.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{skill.deliveryMode}</span>
                  </div>

                  <h2 className="font-display text-lg font-bold text-slate-900">{skill.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{skill.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => ownerProfile && setInspectedProfile(ownerProfile)}
                    className="flex items-center gap-2.5 text-left group"
                  >
                    <UserAvatar
                      name={skill.ownerName}
                      color={ownerProfile?.avatarColor || 'teal'}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {skill.ownerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {skill.isDemoRecord ? 'Sample Profile · Click to inspect' : 'Member Profile'}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {ownerProfile && (
                      <button
                        type="button"
                        onClick={() => setInspectedProfile(ownerProfile)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                      >
                        View Profile
                      </button>
                    )}
                    {!isOwnSkill && (
                      <button
                        type="button"
                        onClick={() => openExchangeModal(skill)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Request Exchange</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Member Profile Inspector Modal */}
      {inspectedProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={inspectedProfile.displayName}
                  color={inspectedProfile.avatarColor}
                  size="lg"
                />
                <div>
                  <h2
                    id="profile-modal-title"
                    className="font-display text-xl font-bold text-slate-900"
                  >
                    {inspectedProfile.displayName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {inspectedProfile.experienceLevel} · {inspectedProfile.learningMode} ·{' '}
                    {inspectedProfile.regionLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedProfile(null)}
                aria-label="Close profile modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{inspectedProfile.bio}</p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Preferred Language</span>
                <span className="font-semibold text-slate-800">
                  {inspectedProfile.preferredLanguage}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Availability</span>
                <span className="font-semibold text-slate-800">
                  {inspectedProfile.availability}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-700">
                Skills Listed by {inspectedProfile.displayName}
              </h3>
              <div className="space-y-2">
                {allSkills
                  .filter((s) => s.ownerId === inspectedProfile.uid)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs text-teal-800 font-semibold">
                          {s.type === 'teach' ? 'Teaches' : 'Wants to Learn'} · {s.level}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                      </div>
                      {currentUserProfile?.uid !== inspectedProfile.uid && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedProfile(null);
                            openExchangeModal(s);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap"
                        >
                          Propose Swap
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              {currentUserProfile && currentUserProfile.uid !== inspectedProfile.uid && (
                <button
                  type="button"
                  onClick={() =>
                    togglePeerConnection(
                      inspectedProfile,
                      inspectedProfile.interests[0] || 'Skill Sharing'
                    )
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl inline-flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {connections.some((c) => c.peerId === inspectedProfile.uid)
                      ? 'Connected'
                      : 'Connect with Peer'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectedProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Skill Exchange Modal */}
      {exchangeModalTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exchange-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="exchange-modal-title"
                  className="font-display text-xl font-bold text-slate-900"
                >
                  Request a Skill Exchange
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Propose a reciprocal learning swap with {exchangeModalTarget.skill.ownerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExchangeModalTarget(null)}
                aria-label="Close exchange request modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {exchangeErrors.general && (
              <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {exchangeErrors.general}
              </p>
            )}

            <form onSubmit={handleSendExchange} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="exchange-offered-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Skill You Offer to Teach *
                </label>
                <input
                  id="exchange-offered-input"
                  type="text"
                  value={offeredSkillInput}
                  onChange={(e) => setOfferedSkillInput(e.target.value)}
                  placeholder="e.g., React & TypeScript Architecture"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
                {exchangeErrors.skillOfferedTitle && (
                  <p className="text-xs text-red-600">{exchangeErrors.skillOfferedTitle}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="exchange-requested-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Skill You Want to Learn *
                </label>
                <input
                  id="exchange-requested-input"
                  type="text"
                  value={requestedSkillInput}
                  onChange={(e) => setRequestedSkillInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
                {exchangeErrors.skillRequestedTitle && (
                  <p className="text-xs text-red-600">{exchangeErrors.skillRequestedTitle}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="exchange-intro-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Introductory Message & Proposed Schedule *
                </label>
                <textarea
                  id="exchange-intro-input"
                  rows={3}
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
                {exchangeErrors.introMessage && (
                  <p className="text-xs text-red-600">{exchangeErrors.introMessage}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExchangeModalTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                >
                  Send Exchange Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const SkillsManagementView: React.FC = () => {
  const {
    currentUserProfile,
    userSkills,
    addOrUpdateSkill,
    deleteSkill,
    startSandboxSession,
  } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [type, setType] = useState<SkillType>('teach');
  const [level, setLevel] = useState<ExperienceLevel>('Intermediate');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('Online');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUserProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
        <BookOpen className="w-8 h-8 text-teal-700 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Manage the Skills You Teach & Learn
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Sign in or launch the Interactive Sandbox to add, edit, and organize your personal
          skills portfolio.
        </p>
        <button
          type="button"
          onClick={() => startSandboxSession()}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
        >
          Launch Interactive Workspace
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSkillInput(
      { title, category, type, level, description, deliveryMode },
      userSkills,
      editingId
    );
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await addOrUpdateSkill(
      { title, category, type, level, description, deliveryMode },
      editingId
    );
    setTitle('');
    setDescription('');
    setEditingId(undefined);
  };

  const handleEdit = (skill: SkillRecord) => {
    setEditingId(skill.id);
    setTitle(skill.title);
    setCategory(skill.category);
    setType(skill.type);
    setLevel(skill.level);
    setDeliveryMode(skill.deliveryMode);
    setDescription(skill.description);
    setErrors({});
  };

  const teachList = userSkills.filter((s) => s.type === 'teach');
  const learnList = userSkills.filter((s) => s.type === 'learn');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Teach & Manage Your Skills
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Add skills you can teach others and skills you want to learn. Your public skills power
          peer discovery and exchange recommendations.
        </p>
      </div>

      {/* Add / Edit Skill Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {editingId ? 'Edit Skill Details' : 'Add a New Skill'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(undefined);
                setTitle('');
                setDescription('');
                setErrors({});
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Cancel editing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="skill-title-input" className="block text-xs font-semibold text-slate-700">
              Skill Name *
            </label>
            <input
              id="skill-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GraphQL API Design, Conversational French, Fingerstyle Guitar"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
            />
            {errors.title && (
              <p className="text-xs text-red-600 font-medium">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-type-select" className="block text-xs font-semibold text-slate-700">
              Skill Role *
            </label>
            <select
              id="skill-type-select"
              value={type}
              onChange={(e) => setType(e.target.value as SkillType)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            >
              <option value="teach">I Can Teach This Skill</option>
              <option value="learn">I Want to Learn This Skill</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="skill-category-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Skill Category *
            </label>
            <select
              id="skill-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-600 font-medium">{errors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="skill-level-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Experience / Proficiency Level
            </label>
            <select
              id="skill-level-select"
              value={level}
              onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced Practitioner</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="skill-delivery-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Session Format
            </label>
            <select
              id="skill-delivery-select"
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="skill-description-input"
            className="block text-xs font-semibold text-slate-700"
          >
            Short Skill Description *
          </label>
          <textarea
            id="skill-description-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what topics you cover or what specific outcomes you hope to achieve..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
          />
          {errors.description && (
            <p className="text-xs text-red-600 font-medium">{errors.description}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? 'Save Skill Changes' : 'Add Skill to Profile'}</span>
          </button>
        </div>
      </form>

      {/* Current User's Teach & Learn Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Offered */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Skills I Can Teach ({teachList.length})
            </h2>
          </div>
          {teachList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
              You have not added any teaching skills yet. Add one above to start sharing knowledge.
            </div>
          ) : (
            <div className="space-y-3">
              {teachList.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {skill.category} · {skill.level} · {skill.deliveryMode}
                      </p>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                        {skill.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(skill)}
                        aria-label={`Edit ${skill.title}`}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSkill(skill.id)}
                        aria-label={`Delete ${skill.title}`}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{skill.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skills Wanted */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Skills I Want to Learn ({learnList.length})
            </h2>
          </div>
          {learnList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
              No learning skills listed yet. Add a skill you want to learn above.
            </div>
          ) : (
            <div className="space-y-3">
              {learnList.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {skill.category} · {skill.level} · {skill.deliveryMode}
                      </p>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                        {skill.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(skill)}
                        aria-label={`Edit ${skill.title}`}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSkill(skill.id)}
                        aria-label={`Delete ${skill.title}`}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{skill.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
