import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FIREBASE_PROJECT_INFO } from '../lib/firebase';
import {
  DeliveryMode,
  ExperienceLevel,
  SKILL_CATEGORIES,
} from '../types/domain';
import {
  validateEmailPassword,
  validateProfileInput,
} from '../utils/skillLogic';
import { BrandLogo } from '../components/BrandLogo';

export const AuthView: React.FC<{ mode: 'login' | 'signup' | 'reset-password' }> = ({
  mode,
}) => {
  const {
    navigate,
    signInWithGoogleAction,
    signInWithEmailAction,
    signUpWithEmailAction,
    sendPasswordResetAction,
    startSandboxSession,
    authConfigNotice,
    clearAuthConfigNotice,
  } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthConfigNotice();
    setResetSent(false);

    const nextErrors: Record<string, string> = {};
    if (mode === 'signup' && displayName.trim().length < 2) {
      nextErrors.displayName = 'Display name must be at least 2 characters.';
    }

    const emailPassCheck = validateEmailPassword(
      email,
      password,
      mode !== 'reset-password'
    );
    Object.assign(nextErrors, emailPassCheck.errors);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAction(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmailAction(email, password, displayName);
      } else {
        const ok = await sendPasswordResetAction(email);
        if (ok) setResetSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 pt-2">
            {mode === 'login'
              ? 'Sign in to Skill Learner'
              : mode === 'signup'
              ? 'Create your Skill Learner account'
              : 'Reset your password'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Access your skill exchanges, learning goals, and community connections.'
              : mode === 'signup'
              ? 'Join the community to teach what you know and learn from peers.'
              : 'Enter your registered email address to receive a password reset link.'}
          </p>
        </div>

        {/* Google Sign-In Button (Provisioned by Firebase) */}
        {mode !== 'reset-password' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={signInWithGoogleAction}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.11H1.04v3.14C3.05 21.18 7.21 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.04 14.04C4.79 13.32 4.65 12.55 4.65 11.75s.14-1.57.39-2.29V6.32H1.04C.38 7.64 0 9.14 0 11.75s.38 4.11 1.04 5.43l4-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.5-3.5C18.07 1.14 15.3 0 12 0 7.21 0 3.05 2.82 1.04 6.82l4 3.14c.98-2.93 3.72-5.21 6.96-5.21z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 mx-3 text-xs text-slate-400">or email & password</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
          </div>
        )}

        {authConfigNotice && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{authConfigNotice}</p>
            </div>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  startSandboxSession(displayName || 'New Learner', true)
                }
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
              >
                Continue as New User Now
              </button>
              <a
                href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_INFO.projectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg"
              >
                Open Firebase Auth Console ↗
              </a>
            </div>
          </div>
        )}

        {resetSent && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Password reset instructions have been sent to {email}.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-display-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>
              {errors.displayName && (
                <p className="text-xs text-red-600 font-medium">{errors.displayName}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          {mode !== 'reset-password' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      navigate('reset-password');
                    }}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {submitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Password Reset Email'}
          </button>
        </form>

        {/* Instant New User Setup Option */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-800">
                New User Quick-Start (No Password Required)
              </p>
              <p className="text-[11px] text-slate-500">
                Start with a 100% fresh profile and add your own skills.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => startSandboxSession(displayName || 'New Learner', true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Profile Setup
              </button>
              <button
                type="button"
                onClick={() => startSandboxSession(displayName || 'New Learner', false)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-600">
            {mode === 'login' ? (
              <span>
                New to Skill Learner?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    navigate('signup');
                  }}
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    navigate('login');
                  }}
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const OnboardingView: React.FC = () => {
  const {
    currentUserProfile,
    saveUserProfile,
    addOrUpdateSkill,
    navigate,
    startSandboxSession,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState(
    currentUserProfile?.displayName || 'Alex Rivera'
  );
  const [bio, setBio] = useState(
    currentUserProfile?.bio ||
      'Curious builder excited to share practical programming skills and learn design & languages.'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    currentUserProfile?.experienceLevel || 'Intermediate'
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    currentUserProfile?.preferredLanguage || 'English'
  );
  const [learningMode, setLearningMode] = useState<DeliveryMode>(
    currentUserProfile?.learningMode || 'Online'
  );
  const [regionLabel, setRegionLabel] = useState(
    currentUserProfile?.regionLabel || 'UTC-5 (Online)'
  );
  const [availability, setAvailability] = useState(
    currentUserProfile?.availability || 'Weekday evenings & weekends'
  );
  const [interests, setInterests] = useState<string[]>(
    currentUserProfile?.interests || ['Web Development', 'Design and Creativity']
  );

  // Step 2 optional initial skills
  const [teachTitle, setTeachTitle] = useState('');
  const [teachCategory, setTeachCategory] = useState<string>(SKILL_CATEGORIES[1]);
  const [learnTitle, setLearnTitle] = useState('');
  const [learnCategory, setLearnCategory] = useState<string>(SKILL_CATEGORIES[2]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUserProfile) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Sign in to start onboarding
        </h1>
        <p className="text-sm text-slate-600">
          Please sign in or start an interactive sandbox session to customize your profile.
        </p>
        <button
          type="button"
          onClick={() => startSandboxSession('Alex Rivera', true)}
          className="px-5 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-xl"
        >
          Start Onboarding in Sandbox
        </button>
      </div>
    );
  }

  const toggleInterest = (cat: string) => {
    setInterests((prev) =>
      prev.includes(cat)
        ? prev.filter((item) => item !== cat)
        : prev.length < 10
        ? [...prev, cat]
        : prev
    );
  };

  const handleNextFromStep1 = () => {
    const check = validateProfileInput({
      displayName,
      bio,
      preferredLanguage,
      regionLabel,
      availability,
      interests,
    });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    await saveUserProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      experienceLevel,
      preferredLanguage: preferredLanguage.trim(),
      learningMode,
      regionLabel: regionLabel.trim(),
      availability: availability.trim(),
      interests,
      onboardingCompleted: true,
    });

    if (teachTitle.trim().length >= 2) {
      await addOrUpdateSkill({
        title: teachTitle.trim(),
        category: teachCategory,
        type: 'teach',
        level: experienceLevel,
        description: `Offering peer mentorship and hands-on practice in ${teachTitle.trim()}.`,
        deliveryMode: learningMode,
      });
    }

    if (learnTitle.trim().length >= 2) {
      await addOrUpdateSkill({
        title: learnTitle.trim(),
        category: learnCategory,
        type: 'learn',
        level: 'Beginner',
        description: `Looking to learn ${learnTitle.trim()} through collaborative sessions.`,
        deliveryMode: learningMode,
      });
    }

    navigate('dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto my-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-teal-800">Welcome Onboarding</span>
            <span className="font-mono tabular-nums">Step {step} of 3</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-700 transition-all duration-200"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Introduce yourself to the community
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Tell other learners and mentors who you are and how you prefer to collaborate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Display Name *
                </label>
                <input
                  id="onboard-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                />
                {errors.displayName && (
                  <p className="text-xs text-red-600">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-level"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Overall Experience Level
                </label>
                <select
                  id="onboard-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboard-bio" className="block text-xs font-semibold text-slate-700">
                Short Introduction / Biography
              </label>
              <textarea
                id="onboard-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
              />
              {errors.bio && <p className="text-xs text-red-600">{errors.bio}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-lang"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Preferred Language *
                </label>
                <input
                  id="onboard-lang"
                  type="text"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                />
                {errors.preferredLanguage && (
                  <p className="text-xs text-red-600">{errors.preferredLanguage}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-mode"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Learning Format Preference
                </label>
                <select
                  id="onboard-mode"
                  value={learningMode}
                  onChange={(e) => setLearningMode(e.target.value as DeliveryMode)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value="Online">Online</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Flexible">Flexible (Online or In-Person)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2"
              >
                <span>Continue to Skills</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                What would you like to teach and learn?
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Add an initial skill you can share and a skill you want to learn (optional—you can
                edit or add more anytime).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-teal-800">1. A Skill You Can Teach</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="onboard-teach-title"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Skill Name
                  </label>
                  <input
                    id="onboard-teach-title"
                    type="text"
                    value={teachTitle}
                    onChange={(e) => setTeachTitle(e.target.value)}
                    placeholder="e.g., TypeScript Fundamentals"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboard-teach-cat"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="onboard-teach-cat"
                    value={teachCategory}
                    onChange={(e) => setTeachCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {SKILL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-800">2. A Skill You Want to Learn</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="onboard-learn-title"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Skill Name
                  </label>
                  <input
                    id="onboard-learn-title"
                    type="text"
                    value={learnTitle}
                    onChange={(e) => setLearnTitle(e.target.value)}
                    placeholder="e.g., Conversational Spanish"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboard-learn-cat"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="onboard-learn-cat"
                    value={learnCategory}
                    onChange={(e) => setLearnCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {SKILL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip step
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
                >
                  Continue to Interests
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Select your learning interests & availability
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                We use your interests to recommend compatible peers and community study circles.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">
                Topics of Interest (select up to 10)
              </span>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES.map((cat) => {
                  const selected = interests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleInterest(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selected
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-region"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Timezone or Coarse Region (Optional)
                </label>
                <input
                  id="onboard-region"
                  type="text"
                  value={regionLabel}
                  onChange={(e) => setRegionLabel(e.target.value)}
                  placeholder="e.g., UTC-5 / North America"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="onboard-avail"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Weekly Availability
                </label>
                <input
                  id="onboard-avail"
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g., Tue/Thu evenings"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
              >
                Complete Setup & Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
