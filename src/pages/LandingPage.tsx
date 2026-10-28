import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Repeat,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COMMUNITY_CIRCLES, LANDING_FAQ } from '../data/demoCatalog';
import { SKILL_CATEGORIES } from '../types/domain';
import {
  COLLABORATIVE_LEARNING_IMAGE_URL,
  SKILL_LEARNER_LOGO_URL,
  UserAvatar,
} from '../components/BrandLogo';

export const LandingPage: React.FC = () => {
  const {
    navigate,
    allSkills,
    startSandboxSession,
    includeSampleData,
    setIncludeSampleData,
  } = useApp();
  const [previewQuery, setPreviewQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredPreviewSkills = allSkills
    .filter((s) => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
      if (!previewQuery.trim()) return true;
      const q = previewQuery.trim().toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-12 pb-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Column: Headline, Explanation, CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-3">
              <img
                src={SKILL_LEARNER_LOGO_URL}
                alt="Skill Learner Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs"
              />
              <p className="text-xs font-semibold tracking-wider text-teal-800">
                Teach · Learn · Connect · Grow
              </p>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]">
              Exchange real skills with peers who want to grow with you.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Welcome to Skill Learner! Built for totally new learners and mentors—create your
              fresh profile, list the first skill you can teach or want to learn, connect with
              peers for 1-on-1 exchanges, and track every learning session from day one.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('signup')}
                className="px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Start as New User</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => startSandboxSession('New Learner', true)}
                className="px-5 py-3 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Quick New-User Setup (Add First Skill)
              </button>
              <button
                type="button"
                onClick={() => navigate('discover')}
                className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Browse Skill Directory
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>100% Fresh Account Setup</span>
              <span aria-hidden="true">·</span>
              <span>Bilateral Skill Exchange Workflow</span>
              <span aria-hidden="true">·</span>
              <span>Firebase Auth & Protected Firestore Rules</span>
            </div>
          </div>

          {/* Right Column: Collaborative Learning Visual + New User Onboarding Card */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
            {/* Featured Collaborative Learning & Knowledge Sharing Banner */}
            <div className="relative h-56 sm:h-64 w-full overflow-hidden border-b border-slate-800">
              <img
                src={COLLABORATIVE_LEARNING_IMAGE_URL}
                alt="Collaborative Learning, Teamwork, and Knowledge Sharing on Skill Learner"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/25 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-md">
                  <img
                    src={SKILL_LEARNER_LOGO_URL}
                    alt="Skill Learner Official Crest"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-teal-300">
                    Collaborative Knowledge Sharing
                  </div>
                  <h2 className="font-display text-lg font-bold text-white leading-tight">
                    Start Your Learning Journey
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between text-xs text-teal-300">
                    <span>Step 1 · Set Up Your Profile</span>
                    <span className="font-mono">0% → 100%</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Enter your name, preferred language & learning style
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between text-xs text-teal-300">
                    <span>Step 2 · Add Skills to Teach & Learn</span>
                    <span className="font-mono">12 Categories</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    List what you can teach and what you want to learn
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-amber-300">Step 3 · Grow & Earn Badges</p>
                    <p className="text-sm font-medium text-white">
                      Log study sessions & unlock 8 real achievements
                    </p>
                  </div>
                  <Award className="w-7 h-7 text-amber-300 shrink-0" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => startSandboxSession('New Learner', true)}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Begin New User Setup Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Skill Discovery & Search Preview */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-teal-700">Live Skill Directory</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Discover Skills Offered & Wanted
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Explore live skills added by members across 12 categories, or add your very first
              skill to get started.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncludeSampleData(!includeSampleData)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {includeSampleData ? 'Hide Sample Skills' : 'Preview Sample Skills'}
            </button>
            <button
              type="button"
              onClick={() => navigate('discover')}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Full Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Interactive Category Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="landing-skill-search" className="sr-only">
                Search skills by name, category, or topic
              </label>
              <input
                id="landing-skill-search"
                type="text"
                value={previewQuery}
                onChange={(e) => setPreviewQuery(e.target.value)}
                placeholder="Search skills (e.g., TypeScript, Figma, Spanish, Guitar)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('discover')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Search All Skills
            </button>
          </div>

          <div
            role="group"
            aria-label="Filter by skill category"
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {['All', ...SKILL_CATEGORIES.slice(0, 7)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Skill Cards (Zero-Pill Static Metadata Discipline) */}
        {filteredPreviewSkills.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
            <img
              src={SKILL_LEARNER_LOGO_URL}
              alt="Skill Learner Logo"
              className="w-16 h-16 mx-auto rounded-2xl object-contain border border-slate-200 p-1 bg-white shadow-2xs"
            />
            <div className="space-y-1.5 max-w-md mx-auto">
              <p className="text-base font-bold text-slate-900">
                {previewQuery
                  ? `No matching skills found for "${previewQuery}"`
                  : 'Fresh Directory — Ready for New Users!'}
              </p>
              <p className="text-sm text-slate-500">
                {previewQuery
                  ? 'Try clearing the search query or selecting "All" categories.'
                  : 'This platform is set up clean for brand-new users. Create your profile to add your first skill, or preview sample skills to explore how filtering works.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => startSandboxSession('New Learner', true)}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
              >
                + Add Your First Skill
              </button>
              {!includeSampleData && (
                <button
                  type="button"
                  onClick={() => setIncludeSampleData(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl cursor-pointer"
                >
                  Preview Sample Skills
                </button>
              )}
              {(previewQuery || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPreviewSkills.map((skill) => (
              <article
                key={skill.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5">
                  {/* Quiet 1-line unboxed text metadata with separators */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-teal-800">
                      {skill.type === 'teach' ? 'Offering to Teach' : 'Wanting to Learn'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{skill.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{skill.level}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {skill.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={skill.ownerName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {skill.ownerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {skill.deliveryMode}
                        {skill.isDemoRecord ? ' · Sample Data' : ' · Live Member'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('discover')}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* How Skill Learner Works & Benefits for Learners and Teachers */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-teal-700">Platform Architecture</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Designed for Beginners, Mentors, and Lifelong Learners
            </h2>
            <p className="text-sm text-slate-600">
              Every workflow on Skill Learner connects directly to persistent state, structured
              progress tracking, and clear privacy controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <Compass className="w-6 h-6 text-teal-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                01. Create Your Skill Profile
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add the skills you can teach and the skills you want to learn across 12 categories,
                along with your preferred schedule and experience level.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <Repeat className="w-6 h-6 text-teal-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                02. Request a Skill Exchange
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Send a structured exchange proposal specifying the skill you offer and the skill you
                seek. Recipients can accept, decline, or message you directly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <TrendingUp className="w-6 h-6 text-teal-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                03. Log Learning Sessions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Set measurable learning goals, log completed study sessions with reflection notes,
                and watch your progress bar advance automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <ShieldCheck className="w-6 h-6 text-teal-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                04. Earn Real Achievements
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Unlock 8 participation badges strictly when their conditions are met—never
                self-awarded or fabricated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Highlights & Learning Circles */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-teal-700">Community Learning</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Collaborative Study Circles & Peer Sessions
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Join recurring study groups or invite friends via WhatsApp to practice together.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('community')}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Explore Community Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMMUNITY_CIRCLES.map((circle) => (
            <div
              key={circle.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  {circle.category} · {circle.format}
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900">{circle.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{circle.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono">{circle.schedule}</span>
                <button
                  type="button"
                  onClick={() => navigate('community')}
                  className="font-semibold text-teal-700 hover:underline whitespace-nowrap"
                >
                  Join Circle →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-teal-700">Frequently Asked Questions</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Everything You Need to Know to Get Started
          </h2>
        </div>

        <div className="space-y-3">
          {LANDING_FAQ.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.question}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-display font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{item.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
