import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Compass,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppRoute } from '../types/domain';
import { BrandLogo, UserAvatar } from './BrandLogo';

const ROUTE_LABELS: Record<AppRoute, string> = {
  home: 'Home',
  discover: 'Discover Skills',
  skills: 'Teach & Manage Skills',
  community: 'Community & Peers',
  exchanges: 'Skill Exchanges',
  dashboard: 'Dashboard',
  progress: 'Learning Progress',
  achievements: 'Achievements',
  notifications: 'Notifications',
  profile: 'My Profile',
  settings: 'Settings & Privacy',
  onboarding: 'Onboarding Setup',
  login: 'Sign In',
  signup: 'Create Account',
  'reset-password': 'Password Reset',
  about: 'About Skill Learner',
  contact: 'Contact Us',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  deployment: 'Deployment & Setup Guide',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    sessionMode,
    currentUserProfile,
    notifications,
    toasts,
    dismissToast,
    logoutAction,
    startSandboxSession,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = sessionMode !== 'unauthenticated' && currentUserProfile !== null;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isPublicMarketingRoute =
    !isAuthenticated &&
    (route === 'home' ||
      route === 'about' ||
      route === 'contact' ||
      route === 'privacy' ||
      route === 'terms' ||
      route === 'deployment' ||
      route === 'login' ||
      route === 'signup' ||
      route === 'reset-password');

  const sidebarItems: {
    id: AppRoute;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Skills', icon: Compass },
    { id: 'skills', label: 'Teach & Manage Skills', icon: BookOpen },
    { id: 'exchanges', label: 'Skill Exchanges', icon: Repeat },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  const handleNav = (target: AppRoute) => {
    setMobileMenuOpen(false);
    navigate(target);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast Feedback Region */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-lg text-sm"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{t.title}</p>
              {t.description && (
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isPublicMarketingRoute ? (
        <>
          {/* Strict 3-Zone Top Bar Contract for Public Pages */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
              {/* Zone 1: Single Brand Wordmark */}
              <button
                type="button"
                onClick={() => handleNav('home')}
                className="text-left focus-visible:outline-2 focus-visible:outline-teal-700 rounded-lg whitespace-nowrap shrink-0"
              >
                <BrandLogo size="md" />
              </button>

              {/* Zone 2: 5 Concise Single-Line Navigation Links */}
              <nav
                aria-label="Primary Navigation"
                className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
              >
                <button
                  type="button"
                  onClick={() => handleNav('discover')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Discover Skills
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('community')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Community
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('about')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
              </nav>

              {/* Zone 3: 1 Primary Action */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Start Learning
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label="Toggle navigation menu"
                  className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleNav('discover')}
                  className="block w-full text-left py-2 text-sm font-medium text-slate-700"
                >
                  Discover Skills
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('community')}
                  className="block w-full text-left py-2 text-sm font-medium text-slate-700"
                >
                  Community
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('about')}
                  className="block w-full text-left py-2 text-sm font-medium text-slate-700"
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="block w-full text-left py-2 text-sm font-medium text-slate-700"
                >
                  Sign In
                </button>
              </div>
            )}
          </header>

          <main className="flex-1">{children}</main>
        </>
      ) : (
        /* Workspace Shell (Sidebar + Top Contextual Bar + Main Viewport) */
        <div className="flex-1 flex min-h-screen">
          {/* Desktop Left Sidebar */}
          <aside
            aria-label="Workspace Sidebar"
            className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-slate-200"
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'home')}
                className="text-left focus-visible:outline-2 focus-visible:outline-teal-700 rounded-lg"
              >
                <BrandLogo size="md" />
              </button>
            </div>

            <nav aria-label="Workspace Sections" className="flex-1 px-3 py-4 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = route === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-teal-700' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="font-mono tabular-nums text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-3">
              {isAuthenticated && currentUserProfile ? (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleNav('profile')}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:bg-slate-50 p-1.5 rounded-lg"
                  >
                    <UserAvatar
                      name={currentUserProfile.displayName}
                      color={currentUserProfile.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {currentUserProfile.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {sessionMode === 'firebase' ? 'Firebase Live' : 'Sandbox Session'}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={logoutAction}
                    aria-label="Sign out"
                    title="Sign out"
                    className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Browsing public preview. Sign in or launch Sandbox to save changes.
                  </p>
                  <button
                    type="button"
                    onClick={() => startSandboxSession()}
                    className="w-full py-2 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Launch Demo Workspace
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Workspace Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Workspace Top Bar Contract: Breadcrumb on left, 1-2 primary actions on right */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label="Open navigation drawer"
                  className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
                  <button
                    type="button"
                    onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'home')}
                    className="text-slate-500 hover:text-slate-900 font-medium whitespace-nowrap"
                  >
                    Skill Learner
                  </button>
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                  <span className="font-semibold text-slate-900 truncate">
                    {ROUTE_LABELS[route] || 'Workspace'}
                  </span>
                </nav>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNav('skills')}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      + Add Skill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('notifications')}
                      aria-label={`Notifications (${unreadCount} unread)`}
                      className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-teal-700 text-white font-mono text-[10px] font-bold rounded-full tabular-nums">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startSandboxSession()}
                      className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Interactive Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('login')}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40 flex">
                <div
                  className="fixed inset-0 bg-slate-900/50"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="relative w-72 max-w-full bg-white h-full flex flex-col z-50 shadow-xl">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <BrandLogo size="sm" />
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close navigation drawer"
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const active = route === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNav(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                            active
                              ? 'bg-teal-50 text-teal-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="font-mono text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isAuthenticated && (
                    <div className="p-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={logoutAction}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
          </div>
        </div>
      )}

      {/* Consistent Platform Footer matching uploaded design */}
      <footer className="bg-[#0B1221] text-slate-300 border-t border-slate-800/90 text-sm">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
          <div className="border-t border-slate-800/80 pt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Quick Links */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Quick Links
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('home')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('discover')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Browse Skills
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('about')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('community')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Core Features
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Support */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Support
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('contact')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('home')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('privacy')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('terms')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Contact
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-indigo-300 text-base leading-none">
                    ✉️
                  </span>
                  <a
                    href="mailto:skilllearner.1348@gmail.com"
                    className="hover:text-white transition-colors break-all"
                  >
                    skilllearner.1348@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-rose-400 text-base leading-none">
                    📍
                  </span>
                  <span>Gopalganj, Bihar, India</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Community */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Community
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Join peers across programming, design, languages, music, and more.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleNav('discover')}
                  aria-label="Explore Global Skills"
                  title="Explore Global Skills"
                  className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-sky-400 transition-colors cursor-pointer"
                >
                  🌐
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('community')}
                  aria-label="Community Discussions"
                  title="Community Discussions"
                  className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                >
                  💬
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('contact')}
                  aria-label="Contact Support"
                  title="Contact Support"
                  className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-teal-400 transition-colors cursor-pointer"
                >
                  ✉️
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Skill Learner — Teach. Learn. Connect. Grow.</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleNav('deployment')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Setup &amp; Security Guide
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
