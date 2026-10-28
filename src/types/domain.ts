export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type DeliveryMode = 'Online' | 'In-Person' | 'Flexible';
export type SkillType = 'teach' | 'learn';
export type ExchangeStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Completed';

export const SKILL_CATEGORIES = [
  'Programming and Technology',
  'Web Development',
  'Design and Creativity',
  'Business and Entrepreneurship',
  'Communication',
  'Languages',
  'Music and Arts',
  'Photography and Video',
  'Education and Tutoring',
  'Personal Development',
  'Digital Marketing',
  'Other Skills',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number] | string;

export interface UserProfile {
  uid: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  experienceLevel: ExperienceLevel;
  preferredLanguage: string;
  learningMode: DeliveryMode;
  regionLabel: string;
  availability: string;
  isPublic: boolean;
  onboardingCompleted: boolean;
  interests: string[];
  createdAt: string;
  updatedAt: string;
  isDemoRecord?: boolean;
}

export interface UserPrivateSettings {
  uid: string;
  emailNotifications: boolean;
  exchangeAlerts: boolean;
  communityUpdates: boolean;
  allowDirectRequests: boolean;
  updatedAt: string;
}

export interface SkillRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  category: string;
  type: SkillType;
  level: ExperienceLevel;
  description: string;
  deliveryMode: DeliveryMode;
  createdAt: string;
  updatedAt: string;
  isDemoRecord?: boolean;
}

export interface SkillExchange {
  id: string;
  requesterId: string;
  requesterName: string;
  receiverId: string;
  receiverName: string;
  skillOfferedTitle: string;
  skillRequestedTitle: string;
  introMessage: string;
  status: ExchangeStatus;
  completionNotes: string;
  createdAt: string;
  updatedAt: string;
  isDemoRecord?: boolean;
}

export interface ExchangeMessage {
  id: string;
  exchangeId: string;
  requesterId: string;
  receiverId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface LearningGoal {
  id: string;
  ownerId: string;
  skillTitle: string;
  category: string;
  targetSessions: number;
  completedSessions: number;
  progressPercent: number;
  notes: string;
  status: 'Active' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface LearningActivity {
  id: string;
  ownerId: string;
  goalId: string;
  title: string;
  durationMinutes: number;
  reflection: string;
  completedDate: string;
  createdAt: string;
}

export type NotificationType =
  | 'exchange_request'
  | 'exchange_update'
  | 'achievement'
  | 'community'
  | 'system';

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string;
  isRead: boolean;
  createdAt: string;
}

export interface PeerConnection {
  id: string;
  initiatorId: string;
  initiatorName: string;
  peerId: string;
  peerName: string;
  sharedSkill: string;
  status: 'Connected' | 'Muted';
  createdAt: string;
  updatedAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  conditionText: string;
  iconName: string;
  earned: boolean;
  earnedAt: string | null;
  progressCurrent: number;
  progressTarget: number;
}

export type AppRoute =
  | 'home'
  | 'discover'
  | 'skills'
  | 'community'
  | 'exchanges'
  | 'dashboard'
  | 'progress'
  | 'achievements'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'reset-password'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'deployment';
