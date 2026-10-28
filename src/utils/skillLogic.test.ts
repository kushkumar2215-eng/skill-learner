import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProfileCompletion,
  canTransitionExchangeStatus,
  evaluateAchievements,
  filterAndSortSkills,
  validateEmailPassword,
  validateExchangeRequest,
  validateSkillInput,
} from './skillLogic';
import { SkillRecord, UserProfile } from '../types/domain';

test('validateEmailPassword rejects invalid emails and short passwords', () => {
  const badEmail = validateEmailPassword('not-an-email', 'ValidPass123');
  assert.equal(badEmail.valid, false);
  assert.ok(badEmail.errors.email);

  const shortPass = validateEmailPassword('alex@example.com', '12345');
  assert.equal(shortPass.valid, false);
  assert.ok(shortPass.errors.password);

  const good = validateEmailPassword('alex@example.com', 'SecurePass123');
  assert.equal(good.valid, true);
});

test('validateSkillInput enforces length bounds and blocks duplicate skills of same type', () => {
  const existing: SkillRecord[] = [
    {
      id: 'skill_1',
      ownerId: 'user_1',
      ownerName: 'Alex Rivera',
      title: 'TypeScript Architecture',
      category: 'Programming and Technology',
      type: 'teach',
      level: 'Advanced',
      description: 'Pragmatic domain modeling and type safety.',
      deliveryMode: 'Online',
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    },
  ];

  const dupResult = validateSkillInput(
    {
      title: 'typescript architecture',
      category: 'Programming and Technology',
      type: 'teach',
      level: 'Intermediate',
      description: 'Teaching TypeScript generics and strict mode.',
      deliveryMode: 'Online',
    },
    existing
  );
  assert.equal(dupResult.valid, false);
  assert.ok(dupResult.errors.title.includes('already have'));

  const validResult = validateSkillInput(
    {
      title: 'GraphQL Schema Design',
      category: 'Web Development',
      type: 'teach',
      level: 'Advanced',
      description: 'Designing federated GraphQL schemas and resolvers.',
      deliveryMode: 'Online',
    },
    existing
  );
  assert.equal(validResult.valid, true);
});

test('canTransitionExchangeStatus enforces strict role and state transitions', () => {
  const pendingEx = {
    requesterId: 'user_req',
    receiverId: 'user_rec',
    status: 'Pending' as const,
  };

  // Requester cannot accept their own request
  assert.equal(canTransitionExchangeStatus(pendingEx, 'user_req', 'Accepted').allowed, false);
  // Receiver can accept
  assert.equal(canTransitionExchangeStatus(pendingEx, 'user_rec', 'Accepted').allowed, true);
  // Requester can cancel
  assert.equal(canTransitionExchangeStatus(pendingEx, 'user_req', 'Cancelled').allowed, true);
  // Cannot jump straight from Pending to Completed
  assert.equal(canTransitionExchangeStatus(pendingEx, 'user_rec', 'Completed').allowed, false);

  // Terminal state lock
  const completedEx = {
    requesterId: 'user_req',
    receiverId: 'user_rec',
    status: 'Completed' as const,
  };
  assert.equal(canTransitionExchangeStatus(completedEx, 'user_rec', 'Accepted').allowed, false);
});

test('filterAndSortSkills filters by query, category, level, privacy, and demo flag', () => {
  const skills: SkillRecord[] = [
    {
      id: 's1',
      ownerId: 'u1',
      ownerName: 'Maya Lin',
      title: 'UI Systems in Figma',
      category: 'Design and Creativity',
      type: 'teach',
      level: 'Advanced',
      description: 'Component tokens and responsive constraints.',
      deliveryMode: 'Online',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      isDemoRecord: true,
    },
    {
      id: 's2',
      ownerId: 'u2',
      ownerName: 'Devon Brooks',
      title: 'Full-Stack React & TypeScript',
      category: 'Web Development',
      type: 'teach',
      level: 'Intermediate',
      description: 'Building accessible web applications.',
      deliveryMode: 'Flexible',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
      isDemoRecord: false,
    },
  ];

  const onlyReal = filterAndSortSkills(skills, {
    query: '',
    category: 'All',
    type: 'all',
    level: 'all',
    deliveryMode: 'all',
    includeDemo: false,
  });
  assert.equal(onlyReal.length, 1);
  assert.equal(onlyReal[0].id, 's2');

  const figmaSearch = filterAndSortSkills(skills, {
    query: 'figma',
    category: 'All',
    type: 'all',
    level: 'all',
    deliveryMode: 'all',
    includeDemo: true,
  });
  assert.equal(figmaSearch.length, 1);
  assert.equal(figmaSearch[0].id, 's1');
});

test('evaluateAchievements awards badges only when real conditions are met', () => {
  const emptyBadges = evaluateAchievements({
    userSkills: [],
    userExchanges: [],
    userGoals: [],
    userActivities: [],
    userConnections: [],
  });
  assert.equal(emptyBadges.every((b) => b.earned === false), true);

  const withSkillAndGoal = evaluateAchievements({
    userSkills: [
      {
        id: 's1',
        ownerId: 'u1',
        ownerName: 'Alex',
        title: 'Python Data Analysis',
        category: 'Programming and Technology',
        type: 'teach',
        level: 'Intermediate',
        description: 'Pandas and clean data pipelines.',
        deliveryMode: 'Online',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
    ],
    userExchanges: [],
    userGoals: [
      {
        id: 'g1',
        ownerId: 'u1',
        skillTitle: 'Conversational Spanish',
        category: 'Languages',
        targetSessions: 5,
        completedSessions: 1,
        progressPercent: 20,
        notes: 'Practice speaking weekly.',
        status: 'Active',
        createdAt: '2026-10-16T00:00:00Z',
        updatedAt: '2026-10-16T00:00:00Z',
      },
    ],
    userActivities: [],
    userConnections: [],
  });

  const firstSkillBadge = withSkillAndGoal.find((b) => b.id === 'first-skill-added');
  const firstGoalBadge = withSkillAndGoal.find((b) => b.id === 'first-goal-created');
  const firstExchangeBadge = withSkillAndGoal.find((b) => b.id === 'first-exchange-completed');

  assert.equal(firstSkillBadge?.earned, true);
  assert.equal(firstGoalBadge?.earned, true);
  assert.equal(firstExchangeBadge?.earned, false);
});

test('calculateProfileCompletion computes accurate percentage', () => {
  const profile: UserProfile = {
    uid: 'u1',
    displayName: 'Alex Rivera',
    bio: 'Full-stack engineer passionate about teaching web accessibility and learning Spanish.',
    avatarColor: 'teal',
    experienceLevel: 'Intermediate',
    preferredLanguage: 'English',
    learningMode: 'Online',
    regionLabel: 'UTC-5 (Eastern)',
    availability: 'Weekday evenings',
    isPublic: true,
    onboardingCompleted: true,
    interests: ['Web Development', 'Languages'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const result = calculateProfileCompletion(profile, []);
  assert.equal(result.percent, 60); // 3 of 5 completed (missing teach & learn skills)
});
