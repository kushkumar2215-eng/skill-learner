import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  Plus,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SKILL_CATEGORIES } from '../types/domain';
import {
  calculateProfileCompletion,
  validateLearningActivityInput,
  validateLearningGoalInput,
} from '../utils/skillLogic';

export const DashboardView: React.FC = () => {
  const {
    currentUserProfile,
    sessionMode,
    userSkills,
    exchanges,
    learningGoals,
    learningActivities,
    achievements,
    notifications,
    navigate,
    startSandboxSession,
  } = useApp();

  if (!currentUserProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Your Personalized Skill Learner Dashboard
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Sign in with your account or launch the Interactive Sandbox to track your skill
          exchanges, learning milestones, and earned badges.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('login')}
            className="px-5 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-xl"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => startSandboxSession()}
            className="px-5 py-2.5 bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl"
          >
            Launch Sandbox Workspace
          </button>
        </div>
      </div>
    );
  }

  const completion = calculateProfileCompletion(currentUserProfile, userSkills);
  const teachSkills = userSkills.filter((s) => s.type === 'teach');
  const learnSkills = userSkills.filter((s) => s.type === 'learn');
  const pendingExchanges = exchanges.filter((e) => e.status === 'Pending');
  const activeExchanges = exchanges.filter((e) => e.status === 'Accepted');
  const earnedBadges = achievements.filter((a) => a.earned);
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-8">
      {/* Welcome & Session Status Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-teal-800">
              {sessionMode === 'firebase'
                ? 'Firebase Live Authenticated Session'
                : 'Interactive Sandbox Session (Local Persistence)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentUserProfile.experienceLevel}</span>
            <span aria-hidden="true">·</span>
            <span>{currentUserProfile.learningMode}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {currentUserProfile.displayName}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">{currentUserProfile.bio}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('discover')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors whitespace-nowrap"
          >
            Find a Skill Partner
          </button>
          <button
            type="button"
            onClick={() => navigate('progress')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
          >
            Log Study Session
          </button>
        </div>
      </div>

      {/* Key Metrics Strip (Tabular Numerals, Single-Elevation Flat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('skills')}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-300 transition-colors space-y-1"
        >
          <span className="text-xs text-slate-500">Skills Offered / Wanted</span>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {teachSkills.length} / {learnSkills.length}
          </p>
          <span className="text-xs font-medium text-teal-700 inline-block pt-1">
            Manage skills →
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('exchanges')}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-300 transition-colors space-y-1"
        >
          <span className="text-xs text-slate-500">Pending / Active Swaps</span>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {pendingExchanges.length} / {activeExchanges.length}
          </p>
          <span className="text-xs font-medium text-teal-700 inline-block pt-1">
            View exchanges →
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('progress')}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-300 transition-colors space-y-1"
        >
          <span className="text-xs text-slate-500">Logged Study Sessions</span>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {learningActivities.length}
          </p>
          <span className="text-xs font-medium text-teal-700 inline-block pt-1">
            Track progress →
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('achievements')}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-300 transition-colors space-y-1"
        >
          <span className="text-xs text-slate-500">Earned Achievements</span>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {earnedBadges.length} / {achievements.length}
          </p>
          <span className="text-xs font-medium text-teal-700 inline-block pt-1">
            View badges →
          </span>
        </button>
      </div>

      {/* Profile Completion Checklist + Pending Exchanges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Profile & Readiness
            </h2>
            <span className="font-mono text-sm font-bold text-teal-700 tabular-nums">
              {completion.percent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-700 rounded-full transition-all"
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          <ul className="space-y-2 text-xs">
            {completion.completedSteps.map((step) => (
              <li key={step} className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
            {completion.missingSteps.map((step) => (
              <li key={step} className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 rounded-full border border-slate-300 inline-block shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('profile')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Edit Profile Details →
            </button>
            <button
              type="button"
              onClick={() => navigate('onboarding')}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Re-run Onboarding
            </button>
          </div>
        </section>

        {/* Active & Pending Exchanges Panel */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Recent Skill Exchanges
            </h2>
            <button
              type="button"
              onClick={() => navigate('exchanges')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Manage All ({exchanges.length}) →
            </button>
          </div>

          {exchanges.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <p className="text-sm font-medium text-slate-800">No skill exchanges yet</p>
              <p className="text-xs text-slate-500">
                Explore skills offered by community members and send your first exchange request.
              </p>
              <button
                type="button"
                onClick={() => navigate('discover')}
                className="mt-1 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg"
              >
                Browse Skills
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exchanges.slice(0, 3).map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">Status: {ex.status}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        With{' '}
                        {ex.requesterId === currentUserProfile.uid
                          ? ex.receiverName
                          : ex.requesterName}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {ex.skillOfferedTitle} ⇄ {ex.skillRequestedTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('exchanges')}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap shrink-0"
                  >
                    Open Exchange
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Learning Progress & Recent Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Active Learning Goals
            </h2>
            <button
              type="button"
              onClick={() => navigate('progress')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Open Progress Tracker →
            </button>
          </div>

          {learningGoals.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <p className="text-sm font-medium text-slate-800">No learning goals created yet</p>
              <button
                type="button"
                onClick={() => navigate('progress')}
                className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 rounded-lg"
              >
                Create First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {learningGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{goal.skillTitle}</span>
                    <span className="font-mono font-semibold text-teal-700 tabular-nums">
                      {goal.completedSessions}/{goal.targetSessions} sessions ({goal.progressPercent}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 rounded-full"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Recent Notifications ({unreadNotifs.length} unread)
            </h2>
            <button
              type="button"
              onClick={() => navigate('notifications')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              View All →
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No notifications yet.</p>
          ) : (
            <div className="space-y-2.5">
              {notifications.slice(0, 3).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate('notifications')}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {n.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.body}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export const LearningProgressView: React.FC = () => {
  const {
    currentUserProfile,
    learningGoals,
    learningActivities,
    createLearningGoal,
    deleteLearningGoal,
    logLearningActivity,
    startSandboxSession,
  } = useApp();

  // Goal Form State
  const [skillTitle, setSkillTitle] = useState('');
  const [category, setCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [targetSessions, setTargetSessions] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [goalErrors, setGoalErrors] = useState<Record<string, string>>({});

  // Activity Log Form State
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [reflection, setReflection] = useState('');
  const [activityErrors, setActivityErrors] = useState<Record<string, string>>({});

  if (!currentUserProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
        <TrendingUp className="w-8 h-8 text-teal-700 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Track Your Learning Progress
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Sign in or launch the Interactive Sandbox to create learning goals, log completed study
          sessions, and record reflections.
        </p>
        <button
          type="button"
          onClick={() => startSandboxSession()}
          className="px-5 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-xl"
        >
          Launch Interactive Workspace
        </button>
      </div>
    );
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateLearningGoalInput({
      skillTitle,
      category,
      targetSessions: Number(targetSessions),
      notes,
    });
    if (!check.valid) {
      setGoalErrors(check.errors);
      return;
    }
    setGoalErrors({});
    await createLearningGoal({
      skillTitle,
      category,
      targetSessions: Number(targetSessions),
      notes,
    });
    setSkillTitle('');
    setNotes('');
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveGoalId = selectedGoalId || learningGoals[0]?.id || '';
    const check = validateLearningActivityInput({
      goalId: effectiveGoalId,
      title: sessionTitle,
      durationMinutes: Number(durationMinutes),
      reflection,
    });
    if (!check.valid) {
      setActivityErrors(check.errors);
      return;
    }
    setActivityErrors({});
    await logLearningActivity({
      goalId: effectiveGoalId,
      title: sessionTitle,
      durationMinutes: Number(durationMinutes),
      reflection,
    });
    setSessionTitle('');
    setReflection('');
  };

  const totalMinutes = learningActivities.reduce((sum, a) => sum + a.durationMinutes, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Learning Progress & Session Log
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Set structured learning goals and log real study or mentorship sessions.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono tabular-nums text-slate-700">
          Total Logged Practice: <span className="font-bold text-teal-800">{totalMinutes} mins</span>{' '}
          ({learningActivities.length} sessions)
        </div>
      </div>

      {/* Create Goal + Log Session Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: New Learning Goal */}
        <form
          onSubmit={handleCreateGoal}
          noValidate
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-700" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Create a Learning Goal
            </h2>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="goal-skill-input" className="block text-xs font-semibold text-slate-700">
              Skill / Milestone Title *
            </label>
            <input
              id="goal-skill-input"
              type="text"
              value={skillTitle}
              onChange={(e) => setSkillTitle(e.target.value)}
              placeholder="e.g., Master Asynchronous TypeScript & Testing"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
            {goalErrors.skillTitle && (
              <p className="text-xs text-red-600">{goalErrors.skillTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="goal-cat-select" className="block text-xs font-semibold text-slate-700">
                Category
              </label>
              <select
                id="goal-cat-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="goal-target-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Target Sessions *
              </label>
              <input
                id="goal-target-input"
                type="number"
                min={1}
                max={500}
                value={targetSessions}
                onChange={(e) => setTargetSessions(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
              {goalErrors.targetSessions && (
                <p className="text-xs text-red-600">{goalErrors.targetSessions}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="goal-notes-input" className="block text-xs font-semibold text-slate-700">
              Goal Notes / Focus Areas
            </label>
            <textarea
              id="goal-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What specific outcomes will mark this goal complete?"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Learning Goal</span>
          </button>
        </form>

        {/* Form 2: Log Completed Session */}
        <form
          onSubmit={handleLogSession}
          noValidate
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Log Completed Learning Activity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="activity-goal-select"
                className="block text-xs font-semibold text-slate-700"
              >
                Associated Learning Goal *
              </label>
              <select
                id="activity-goal-select"
                value={selectedGoalId || learningGoals[0]?.id || ''}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {learningGoals.length === 0 ? (
                  <option value="">Create a goal first</option>
                ) : (
                  learningGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.skillTitle} ({g.completedSessions}/{g.targetSessions})
                    </option>
                  ))
                )}
              </select>
              {activityErrors.goalId && (
                <p className="text-xs text-red-600">{activityErrors.goalId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="activity-duration-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Duration (mins) *
              </label>
              <input
                id="activity-duration-input"
                type="number"
                min={5}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
              {activityErrors.durationMinutes && (
                <p className="text-xs text-red-600">{activityErrors.durationMinutes}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="activity-title-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Session Summary Title *
            </label>
            <input
              id="activity-title-input"
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g., Completed 45-min pair programming session on custom hooks"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
            {activityErrors.title && (
              <p className="text-xs text-red-600">{activityErrors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="activity-reflection-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Reflection / Key Notes
            </label>
            <textarea
              id="activity-reflection-input"
              rows={2}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn or practice during this session?"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={learningGoals.length === 0}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
          >
            Log Completed Session
          </button>
        </form>
      </div>

      {/* Active Goals List */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Your Learning Goals ({learningGoals.length})
        </h2>
        {learningGoals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
            No learning goals created yet. Add one above to track your progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {goal.category} · Status: {goal.status}
                    </p>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {goal.skillTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteLearningGoal(goal.id)}
                    aria-label={`Delete goal ${goal.skillTitle}`}
                    className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {goal.notes && <p className="text-xs text-slate-600">{goal.notes}</p>}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-600">
                      {goal.completedSessions} of {goal.targetSessions} sessions completed
                    </span>
                    <span className="font-bold text-teal-800">{goal.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 rounded-full transition-all"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Sessions Log */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Completed Learning Sessions ({learningActivities.length})
        </h2>
        {learningActivities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
            No learning sessions logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {learningActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{act.completedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{act.durationMinutes} minutes</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">{act.title}</h3>
                  {act.reflection && (
                    <p className="text-xs text-slate-600 leading-relaxed">{act.reflection}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-emerald-700 shrink-0">
                  Logged & Saved
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const AchievementsView: React.FC = () => {
  const { achievements } = useApp();
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Achievements & Participation Badges
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Badges are computed strictly from your actual saved skills, learning goals, logged
            activities, and completed skill exchanges.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono tabular-nums">
          Unlocked: <span className="font-bold text-teal-800">{earnedCount}</span> /{' '}
          {achievements.length}
        </div>
      </div>

      {/* Transparency & Verification Policy Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-900">
            How Achievements & Verification Work on Skill Learner
          </p>
          <p>
            Ordinary participation badges cannot be manually self-awarded—each badge evaluates live
            database records against its stated condition. Creating an account or earning a badge
            does not label a user as an externally "verified identity"; instead, each badge records
            the exact activity condition and timestamp when that milestone was achieved.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {achievements.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-2xl p-6 border flex flex-col justify-between space-y-4 ${
              badge.earned
                ? 'bg-white border-teal-600/40'
                : 'bg-slate-50/80 border-slate-200 opacity-85'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      badge.earned ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {badge.earned ? 'Earned' : 'Locked'}
                  </span>
                  {badge.earned && badge.earnedAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">
                        {badge.earnedAt.slice(0, 10)}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900">{badge.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{badge.description}</p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  badge.earned
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/70 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Condition: {badge.conditionText}</span>
                <span className="font-mono font-semibold text-slate-700 tabular-nums">
                  {badge.progressCurrent}/{badge.progressTarget}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    badge.earned ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((badge.progressCurrent / badge.progressTarget) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    navigate,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Notifications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Stay updated on skill exchange requests, status updates, and earned achievements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Bell className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="font-display text-base font-bold text-slate-900">
            {filter === 'unread' ? 'You have no unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-slate-500">
            When you send or receive exchange requests or unlock badges, updates appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.isRead ? 'border-slate-200' : 'border-teal-600/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`font-semibold ${
                      item.isRead ? 'text-slate-500' : 'text-teal-800'
                    }`}
                  >
                    {item.isRead ? 'Read' : 'New'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{item.createdAt.slice(0, 10)}</span>
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-600">{item.body}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(item.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!item.isRead) markNotificationRead(item.id);
                    navigate((item.linkPath as any) || 'dashboard');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
