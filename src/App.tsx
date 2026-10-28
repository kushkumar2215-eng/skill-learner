/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthView, OnboardingView } from './pages/AuthPages';
import { DiscoverSkillsView, SkillsManagementView } from './pages/DiscoverAndSkillsPages';
import { SkillExchangeView, CommunityView } from './pages/ExchangeAndCommunityPages';
import {
  DashboardView,
  LearningProgressView,
  AchievementsView,
  NotificationsView,
} from './pages/DashboardAndProgressPages';
import {
  ProfileView,
  SettingsView,
  AboutView,
  ContactView,
  PrivacyPolicyView,
  TermsOfServiceView,
  DeploymentGuideView,
  NotFoundView,
} from './pages/ProfileSettingsAndLegalPages';

const RouteView: React.FC = () => {
  const { route, authReady, sessionMode } = useApp();
  const isAuthenticated = sessionMode !== 'unauthenticated';

  if (!authReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
          <span>Loading Skill Learner workspace...</span>
        </div>
      </div>
    );
  }

  const protectedRoutes = new Set([
    'onboarding',
    'dashboard',
    'skills',
    'exchanges',
    'progress',
    'achievements',
    'notifications',
    'profile',
    'settings',
  ]);

  if (protectedRoutes.has(route) && !isAuthenticated) {
    return <AuthView mode="login" />;
  }

  switch (route) {
    case 'home':
      return <LandingPage />;
    case 'login':
      return <AuthView mode="login" />;
    case 'signup':
      return <AuthView mode="signup" />;
    case 'reset-password':
      return <AuthView mode="reset-password" />;
    case 'onboarding':
      return <OnboardingView />;
    case 'dashboard':
      return <DashboardView />;
    case 'discover':
      return <DiscoverSkillsView />;
    case 'skills':
      return <SkillsManagementView />;
    case 'exchanges':
      return <SkillExchangeView />;
    case 'community':
      return <CommunityView />;
    case 'progress':
      return <LearningProgressView />;
    case 'achievements':
      return <AchievementsView />;
    case 'notifications':
      return <NotificationsView />;
    case 'profile':
      return <ProfileView />;
    case 'settings':
      return <SettingsView />;
    case 'about':
      return <AboutView />;
    case 'contact':
      return <ContactView />;
    case 'privacy':
      return <PrivacyPolicyView />;
    case 'terms':
      return <TermsOfServiceView />;
    case 'deployment':
      return <DeploymentGuideView />;
    default:
      return <NotFoundView />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <RouteView />
      </AppShell>
    </AppProvider>
  );
}
