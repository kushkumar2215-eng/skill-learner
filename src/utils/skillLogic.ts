import {
  AchievementBadge,
  DeliveryMode,
  ExchangeStatus,
  ExperienceLevel,
  LearningActivity,
  LearningGoal,
  PeerConnection,
  SkillExchange,
  SkillRecord,
  SkillType,
  UserProfile,
} from '../types/domain';

// Synchronized verbatim with firebase-blueprint.json constraints
export const BLUEPRINT_LIMITS = {
  ID_MAX: 128,
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 80,
  BIO_MAX: 600,
  SKILL_TITLE_MIN: 2,
  SKILL_TITLE_MAX: 100,
  SKILL_DESC_MIN: 5,
  SKILL_DESC_MAX: 600,
  CATEGORY_MAX: 80,
  INTRO_MESSAGE_MIN: 5,
  INTRO_MESSAGE_MAX: 800,
  COMPLETION_NOTES_MAX: 600,
  MESSAGE_CONTENT_MIN: 1,
  MESSAGE_CONTENT_MAX: 1000,
  INTERESTS_MAX_COUNT: 10,
  INTEREST_TAG_MAX: 40,
} as const;

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, BLUEPRINT_LIMITS.ID_MAX);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export function isValidBlueprintId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.ID_MAX &&
    BLUEPRINT_LIMITS.ID_REGEX.test(id)
  );
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmailPassword(
  email: string,
  password?: string,
  requirePassword = true
): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address (e.g., alex@example.com).';
  }

  if (requirePassword) {
    if (!password || password.length === 0) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProfileInput(input: {
  displayName: string;
  bio: string;
  preferredLanguage: string;
  regionLabel: string;
  availability: string;
  interests: string[];
}): ValidationResult {
  const errors: Record<string, string> = {};
  const name = input.displayName.trim();

  if (name.length < BLUEPRINT_LIMITS.DISPLAY_NAME_MIN) {
    errors.displayName = `Display name must be at least ${BLUEPRINT_LIMITS.DISPLAY_NAME_MIN} characters.`;
  } else if (name.length > BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) {
    errors.displayName = `Display name cannot exceed ${BLUEPRINT_LIMITS.DISPLAY_NAME_MAX} characters.`;
  }

  if (input.bio.trim().length > BLUEPRINT_LIMITS.BIO_MAX) {
    errors.bio = `Bio cannot exceed ${BLUEPRINT_LIMITS.BIO_MAX} characters.`;
  }

  if (!input.preferredLanguage.trim()) {
    errors.preferredLanguage = 'Preferred language is required.';
  } else if (input.preferredLanguage.trim().length > 40) {
    errors.preferredLanguage = 'Preferred language cannot exceed 40 characters.';
  }

  if (input.regionLabel.trim().length > 80) {
    errors.regionLabel = 'Location/timezone label cannot exceed 80 characters.';
  }

  if (input.availability.trim().length > 120) {
    errors.availability = 'Availability description cannot exceed 120 characters.';
  }

  if (input.interests.length > BLUEPRINT_LIMITS.INTERESTS_MAX_COUNT) {
    errors.interests = `Select up to ${BLUEPRINT_LIMITS.INTERESTS_MAX_COUNT} interests.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSkillInput(
  input: {
    title: string;
    category: string;
    type: SkillType;
    level: ExperienceLevel;
    description: string;
    deliveryMode: DeliveryMode;
  },
  existingUserSkills: SkillRecord[] = [],
  editingSkillId?: string
): ValidationResult {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  const desc = input.description.trim();

  if (title.length < BLUEPRINT_LIMITS.SKILL_TITLE_MIN) {
    errors.title = `Skill name must be at least ${BLUEPRINT_LIMITS.SKILL_TITLE_MIN} characters.`;
  } else if (title.length > BLUEPRINT_LIMITS.SKILL_TITLE_MAX) {
    errors.title = `Skill name cannot exceed ${BLUEPRINT_LIMITS.SKILL_TITLE_MAX} characters.`;
  }

  if (!input.category || input.category.trim().length < 2) {
    errors.category = 'Please select a valid skill category.';
  }

  if (desc.length < BLUEPRINT_LIMITS.SKILL_DESC_MIN) {
    errors.description = `Provide a short description (at least ${BLUEPRINT_LIMITS.SKILL_DESC_MIN} characters).`;
  } else if (desc.length > BLUEPRINT_LIMITS.SKILL_DESC_MAX) {
    errors.description = `Description cannot exceed ${BLUEPRINT_LIMITS.SKILL_DESC_MAX} characters.`;
  }

  const duplicate = existingUserSkills.find(
    (s) =>
      s.id !== editingSkillId &&
      s.type === input.type &&
      s.title.trim().toLowerCase() === title.toLowerCase()
  );
  if (duplicate) {
    errors.title = `You already have "${title}" listed under skills you ${input.type === 'teach' ? 'teach' : 'want to learn'}.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateExchangeRequest(
  input: {
    requesterId: string;
    receiverId: string;
    skillOfferedTitle: string;
    skillRequestedTitle: string;
    introMessage: string;
  },
  existingExchanges: SkillExchange[] = []
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.requesterId || !input.receiverId) {
    errors.receiverId = 'Both requester and recipient must be selected.';
  } else if (input.requesterId === input.receiverId) {
    errors.receiverId = 'You cannot request a skill exchange with yourself.';
  }

  const offered = input.skillOfferedTitle.trim();
  const requested = input.skillRequestedTitle.trim();
  const msg = input.introMessage.trim();

  if (offered.length < BLUEPRINT_LIMITS.SKILL_TITLE_MIN) {
    errors.skillOfferedTitle = 'Specify the skill you are offering to teach.';
  } else if (offered.length > BLUEPRINT_LIMITS.SKILL_TITLE_MAX) {
    errors.skillOfferedTitle = 'Skill offered title is too long.';
  }

  if (requested.length < BLUEPRINT_LIMITS.SKILL_TITLE_MIN) {
    errors.skillRequestedTitle = 'Specify the skill you want to learn.';
  } else if (requested.length > BLUEPRINT_LIMITS.SKILL_TITLE_MAX) {
    errors.skillRequestedTitle = 'Skill requested title is too long.';
  }

  if (msg.length < BLUEPRINT_LIMITS.INTRO_MESSAGE_MIN) {
    errors.introMessage = `Write a short introductory message (at least ${BLUEPRINT_LIMITS.INTRO_MESSAGE_MIN} characters).`;
  } else if (msg.length > BLUEPRINT_LIMITS.INTRO_MESSAGE_MAX) {
    errors.introMessage = `Introductory message cannot exceed ${BLUEPRINT_LIMITS.INTRO_MESSAGE_MAX} characters.`;
  }

  // Prevent duplicate active pending request for the same pair and skills
  const duplicatePending = existingExchanges.find(
    (ex) =>
      ex.status === 'Pending' &&
      ex.requesterId === input.requesterId &&
      ex.receiverId === input.receiverId &&
      ex.skillOfferedTitle.toLowerCase() === offered.toLowerCase() &&
      ex.skillRequestedTitle.toLowerCase() === requested.toLowerCase()
  );

  if (duplicatePending) {
    errors.general = 'You already have a pending exchange request with this member for these skills.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function canTransitionExchangeStatus(
  exchange: Pick<SkillExchange, 'requesterId' | 'receiverId' | 'status'>,
  actorUid: string,
  nextStatus: ExchangeStatus
): { allowed: boolean; reason?: string } {
  if (
    exchange.status === 'Completed' ||
    exchange.status === 'Declined' ||
    exchange.status === 'Cancelled'
  ) {
    return {
      allowed: false,
      reason: `Exchange is already in terminal state "${exchange.status}" and cannot be modified.`,
    };
  }

  if (actorUid !== exchange.requesterId && actorUid !== exchange.receiverId) {
    return {
      allowed: false,
      reason: 'Only participants in this skill exchange can update its status.',
    };
  }

  if (exchange.status === 'Pending') {
    if (nextStatus === 'Accepted' || nextStatus === 'Declined') {
      if (actorUid !== exchange.receiverId) {
        return {
          allowed: false,
          reason: 'Only the receiving member can accept or decline a pending request.',
        };
      }
      return { allowed: true };
    }
    if (nextStatus === 'Cancelled') {
      if (actorUid !== exchange.requesterId) {
        return {
          allowed: false,
          reason: 'Only the requesting member can cancel their pending request.',
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'A pending exchange must be accepted before it can be marked completed.',
    };
  }

  if (exchange.status === 'Accepted') {
    if (nextStatus === 'Completed') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'An accepted exchange can only transition to Completed.',
    };
  }

  return { allowed: false, reason: 'Invalid status transition.' };
}

export function validateLearningGoalInput(input: {
  skillTitle: string;
  category: string;
  targetSessions: number;
  notes: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const title = input.skillTitle.trim();

  if (title.length < 2 || title.length > 100) {
    errors.skillTitle = 'Goal skill title must be between 2 and 100 characters.';
  }
  if (!input.category || input.category.trim().length < 2) {
    errors.category = 'Please choose a category.';
  }
  if (!Number.isFinite(input.targetSessions) || input.targetSessions < 1 || input.targetSessions > 500) {
    errors.targetSessions = 'Target sessions must be between 1 and 500.';
  }
  if (input.notes.trim().length > 600) {
    errors.notes = 'Notes cannot exceed 600 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLearningActivityInput(input: {
  goalId: string;
  title: string;
  durationMinutes: number;
  reflection: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.goalId) {
    errors.goalId = 'Select a learning goal for this session.';
  }
  if (input.title.trim().length < 2 || input.title.trim().length > 120) {
    errors.title = 'Session title must be between 2 and 120 characters.';
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 600) {
    errors.durationMinutes = 'Session duration must be between 5 and 600 minutes.';
  }
  if (input.reflection.trim().length > 800) {
    errors.reflection = 'Reflection notes cannot exceed 800 characters.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export interface SkillFilterCriteria {
  query: string;
  category: string;
  type: 'all' | SkillType;
  level: 'all' | ExperienceLevel;
  deliveryMode: 'all' | DeliveryMode;
  includeDemo: boolean;
}

export function filterAndSortSkills(
  skills: SkillRecord[],
  criteria: SkillFilterCriteria,
  profilesById: Record<string, UserProfile> = {}
): SkillRecord[] {
  const normalizedQuery = criteria.query.trim().toLowerCase();

  return skills
    .filter((skill) => {
      if (!criteria.includeDemo && skill.isDemoRecord) {
        return false;
      }
      // Respect profile privacy setting if profile is loaded
      const ownerProfile = profilesById[skill.ownerId];
      if (ownerProfile && ownerProfile.isPublic === false) {
        return false;
      }
      if (criteria.type !== 'all' && skill.type !== criteria.type) {
        return false;
      }
      if (criteria.category !== 'All' && criteria.category !== '' && skill.category !== criteria.category) {
        return false;
      }
      if (criteria.level !== 'all' && skill.level !== criteria.level) {
        return false;
      }
      if (criteria.deliveryMode !== 'all' && skill.deliveryMode !== criteria.deliveryMode) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      const inTitle = skill.title.toLowerCase().includes(normalizedQuery);
      const inCategory = skill.category.toLowerCase().includes(normalizedQuery);
      const inDesc = skill.description.toLowerCase().includes(normalizedQuery);
      const inOwner = skill.ownerName.toLowerCase().includes(normalizedQuery);

      return inTitle || inCategory || inDesc || inOwner;
    })
    .sort((a, b) => {
      if (normalizedQuery) {
        const aTitleMatch = a.title.toLowerCase().startsWith(normalizedQuery) ? 2 : a.title.toLowerCase().includes(normalizedQuery) ? 1 : 0;
        const bTitleMatch = b.title.toLowerCase().startsWith(normalizedQuery) ? 2 : b.title.toLowerCase().includes(normalizedQuery) ? 1 : 0;
        if (bTitleMatch !== aTitleMatch) return bTitleMatch - aTitleMatch;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function calculateProfileCompletion(
  profile: UserProfile | null,
  userSkills: SkillRecord[]
): { percent: number; completedSteps: string[]; missingSteps: string[] } {
  if (!profile) {
    return {
      percent: 0,
      completedSteps: [],
      missingSteps: [
        'Set display name',
        'Write a short biography',
        'Add a skill you can teach',
        'Add a skill you want to learn',
        'Select learning interests',
      ],
    };
  }

  const checks: { label: string; done: boolean }[] = [
    { label: 'Set display name', done: profile.displayName.trim().length >= 2 },
    { label: 'Write a short biography (20+ chars)', done: profile.bio.trim().length >= 20 },
    { label: 'Add a skill you can teach', done: userSkills.some((s) => s.type === 'teach') },
    { label: 'Add a skill you want to learn', done: userSkills.some((s) => s.type === 'learn') },
    { label: 'Select learning interests', done: profile.interests.length > 0 },
  ];

  const completedSteps = checks.filter((c) => c.done).map((c) => c.label);
  const missingSteps = checks.filter((c) => !c.done).map((c) => c.label);
  const percent = Math.round((completedSteps.length / checks.length) * 100);

  return { percent, completedSteps, missingSteps };
}

export function evaluateAchievements(params: {
  userSkills: SkillRecord[];
  userExchanges: SkillExchange[];
  userGoals: LearningGoal[];
  userActivities: LearningActivity[];
  userConnections: PeerConnection[];
}): AchievementBadge[] {
  const { userSkills, userExchanges, userGoals, userActivities, userConnections } = params;

  const firstSkill = userSkills[0];
  const firstGoal = userGoals[0];
  const firstExchange = userExchanges[0];
  const acceptedExchanges = userExchanges.filter(
    (e) => e.status === 'Accepted' || e.status === 'Completed'
  );
  const completedExchanges = userExchanges.filter((e) => e.status === 'Completed');
  const firstActivity = userActivities[0];
  const teachSkills = userSkills.filter((s) => s.type === 'teach');

  return [
    {
      id: 'first-skill-added',
      title: 'First Skill Added',
      description: 'Added your first skill to teach or learn on your profile.',
      conditionText: 'Add at least 1 skill to your profile.',
      iconName: 'Sparkles',
      earned: userSkills.length >= 1,
      earnedAt: firstSkill ? firstSkill.createdAt : null,
      progressCurrent: Math.min(userSkills.length, 1),
      progressTarget: 1,
    },
    {
      id: 'first-goal-created',
      title: 'First Learning Goal Created',
      description: 'Established a structured learning goal with target milestones.',
      conditionText: 'Create at least 1 personal learning goal.',
      iconName: 'Target',
      earned: userGoals.length >= 1,
      earnedAt: firstGoal ? firstGoal.createdAt : null,
      progressCurrent: Math.min(userGoals.length, 1),
      progressTarget: 1,
    },
    {
      id: 'first-exchange-requested',
      title: 'First Skill Exchange Requested',
      description: 'Initiated or participated in your first peer-to-peer skill exchange.',
      conditionText: 'Send or receive 1 skill exchange request.',
      iconName: 'ArrowLeftRight',
      earned: userExchanges.length >= 1,
      earnedAt: firstExchange ? firstExchange.createdAt : null,
      progressCurrent: Math.min(userExchanges.length, 1),
      progressTarget: 1,
    },
    {
      id: 'first-exchange-accepted',
      title: 'First Exchange Accepted',
      description: 'Confirmed a mutual skill-sharing agreement with another learner.',
      conditionText: 'Have at least 1 exchange reach Accepted or Completed status.',
      iconName: 'Handshake',
      earned: acceptedExchanges.length >= 1,
      earnedAt: acceptedExchanges[0] ? acceptedExchanges[0].updatedAt : null,
      progressCurrent: Math.min(acceptedExchanges.length, 1),
      progressTarget: 1,
    },
    {
      id: 'first-activity-completed',
      title: 'First Learning Activity Completed',
      description: 'Logged a completed study or mentorship session with reflection notes.',
      conditionText: 'Log 1 completed learning activity.',
      iconName: 'CheckCircle2',
      earned: userActivities.length >= 1,
      earnedAt: firstActivity ? firstActivity.createdAt : null,
      progressCurrent: Math.min(userActivities.length, 1),
      progressTarget: 1,
    },
    {
      id: 'first-exchange-completed',
      title: 'First Skill Exchange Completed',
      description: 'Successfully concluded a full bilateral skill exchange.',
      conditionText: 'Complete 1 accepted skill exchange.',
      iconName: 'Award',
      earned: completedExchanges.length >= 1,
      earnedAt: completedExchanges[0] ? completedExchanges[0].updatedAt : null,
      progressCurrent: Math.min(completedExchanges.length, 1),
      progressTarget: 1,
    },
    {
      id: 'community-contributor',
      title: 'Community Contributor',
      description: 'Actively sharing knowledge by offering at least 2 teaching skills and connecting with peers.',
      conditionText: 'Offer 2+ teaching skills and form 1+ peer connection.',
      iconName: 'Users',
      earned: teachSkills.length >= 2 && userConnections.length >= 1,
      earnedAt:
        teachSkills.length >= 2 && userConnections.length >= 1
          ? userConnections[0].createdAt
          : null,
      progressCurrent: Math.min(teachSkills.length, 2) + Math.min(userConnections.length, 1),
      progressTarget: 3,
    },
    {
      id: 'consistent-learner',
      title: 'Consistent Learner',
      description: 'Demonstrated sustained practice across 3 or more logged learning sessions.',
      conditionText: 'Complete 3+ logged learning activities.',
      iconName: 'Flame',
      earned: userActivities.length >= 3,
      earnedAt: userActivities.length >= 3 ? userActivities[2].createdAt : null,
      progressCurrent: Math.min(userActivities.length, 3),
      progressTarget: 3,
    },
  ];
}
