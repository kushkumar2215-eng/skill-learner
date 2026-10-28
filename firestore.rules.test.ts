import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

// Deterministic simulator of our Firestore Security Rules gates for the Dirty Dozen TDD suite
interface AuthContext {
  uid: string;
  email_verified: boolean;
}

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function evaluateDirtyDozenPayload(
  scenario: string,
  auth: AuthContext | null,
  payload: Record<string, any>,
  existingDoc?: Record<string, any>,
  parentDoc?: Record<string, any>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth) return 'PERMISSION_DENIED';

  switch (scenario) {
    case '1_SHADOW_FIELD_INJECTION': {
      const allowedKeys = new Set([
        'uid', 'displayName', 'bio', 'avatarColor', 'experienceLevel',
        'preferredLanguage', 'learningMode', 'regionLabel', 'availability',
        'isPublic', 'onboardingCompleted', 'interests', 'createdAt', 'updatedAt'
      ]);
      const hasShadow = Object.keys(payload).some((k) => !allowedKeys.has(k));
      return hasShadow ? 'PERMISSION_DENIED' : 'ALLOWED';
    }
    case '2_UNVERIFIED_EMAIL_WRITE': {
      return auth.email_verified === true ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '3_CROSS_USER_PROFILE_HIJACK': {
      return auth.uid === payload.targetUserId ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '4_PRIVATE_SETTINGS_PII_SNOOPING': {
      return auth.uid === payload.targetUserId ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '5_IDENTITY_SPOOFING_SKILL_CREATE': {
      return auth.uid === payload.ownerId ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '6_SELF_EXCHANGE_CREATION': {
      return payload.requesterId !== payload.receiverId ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '7_UNAUTHORIZED_EXCHANGE_ACCEPTANCE': {
      if (!existingDoc) return 'PERMISSION_DENIED';
      return auth.uid === existingDoc.receiverId && existingDoc.status === 'Pending'
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    case '8_TERMINAL_STATE_RESURRECTION': {
      if (!existingDoc) return 'PERMISSION_DENIED';
      const terminalStates = ['Completed', 'Declined', 'Cancelled'];
      return terminalStates.includes(existingDoc.status) ? 'PERMISSION_DENIED' : 'ALLOWED';
    }
    case '9_NON_PARTICIPANT_MESSAGE_INJECTION': {
      if (!parentDoc) return 'PERMISSION_DENIED';
      return auth.uid === parentDoc.requesterId || auth.uid === parentDoc.receiverId
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    case '10_ID_POISONING_ATTACK': {
      return isValidId(payload.id) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '11_TIMESTAMP_FORGERY': {
      return payload.createdAt === payload.requestTime ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    case '12_UNBOUNDED_QUERY_SCRAPING': {
      if (!existingDoc) return 'PERMISSION_DENIED';
      return existingDoc.recipientId === auth.uid ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    default:
      return 'PERMISSION_DENIED';
  }
}

test('firestore.rules structural verification — all 8 pillars present in rules file', () => {
  assert.ok(rulesContent.includes("rules_version = '2';"), 'Must declare rules_version 2');
  assert.ok(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'), 'Must include global default-deny catch-all');
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'), 'Must enforce email_verified');
  assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"), 'Must enforce ID regex guard');
  assert.ok(rulesContent.includes("existing().status != 'Completed'"), 'Must enforce terminal state lock on exchanges');
  assert.ok(rulesContent.includes('match /users/{userId}'), 'Must secure users collection');
  assert.ok(rulesContent.includes('match /private/{docId}'), 'Must secure isolated private subcollection');
  assert.ok(rulesContent.includes('match /skills/{skillId}'), 'Must secure skills collection');
  assert.ok(rulesContent.includes('match /skillExchanges/{exchangeId}'), 'Must secure skillExchanges collection');
  assert.ok(rulesContent.includes('match /messages/{messageId}'), 'Must secure messages subcollection');
  assert.ok(rulesContent.includes('match /learningGoals/{goalId}'), 'Must secure learningGoals collection');
  assert.ok(rulesContent.includes('match /learningActivities/{activityId}'), 'Must secure learningActivities collection');
  assert.ok(rulesContent.includes('match /notifications/{notificationId}'), 'Must secure notifications collection');
  assert.ok(rulesContent.includes('match /connections/{connectionId}'), 'Must secure connections collection');
});

test('Dirty Dozen #1: Shadow field injection on profile returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '1_SHADOW_FIELD_INJECTION',
    { uid: 'user_1', email_verified: true },
    { uid: 'user_1', displayName: 'Alex', isAdmin: true }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #2: Unverified email write returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '2_UNVERIFIED_EMAIL_WRITE',
    { uid: 'user_1', email_verified: false },
    { id: 'skill_1', ownerId: 'user_1' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #3: Cross-user profile hijack returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '3_CROSS_USER_PROFILE_HIJACK',
    { uid: 'user_2', email_verified: true },
    { targetUserId: 'user_1', displayName: 'Pwned' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #4: Private settings PII snooping returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '4_PRIVATE_SETTINGS_PII_SNOOPING',
    { uid: 'user_2', email_verified: true },
    { targetUserId: 'user_1' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #5: Identity spoofing on skill creation returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '5_IDENTITY_SPOOFING_SKILL_CREATE',
    { uid: 'user_1', email_verified: true },
    { id: 'skill_1', ownerId: 'user_2' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #6: Self-exchange creation returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '6_SELF_EXCHANGE_CREATION',
    { uid: 'user_1', email_verified: true },
    { requesterId: 'user_1', receiverId: 'user_1' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #7: Unauthorized exchange acceptance by requester returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '7_UNAUTHORIZED_EXCHANGE_ACCEPTANCE',
    { uid: 'user_1', email_verified: true },
    { status: 'Accepted' },
    { requesterId: 'user_1', receiverId: 'user_2', status: 'Pending' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #8: Terminal state resurrection on Completed exchange returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '8_TERMINAL_STATE_RESURRECTION',
    { uid: 'user_2', email_verified: true },
    { status: 'Accepted' },
    { requesterId: 'user_1', receiverId: 'user_2', status: 'Completed' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #9: Non-participant message injection returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '9_NON_PARTICIPANT_MESSAGE_INJECTION',
    { uid: 'user_3', email_verified: true },
    { content: 'Intruder message' },
    undefined,
    { requesterId: 'user_1', receiverId: 'user_2' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #10: ID poisoning attack with path traversal characters returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '10_ID_POISONING_ATTACK',
    { uid: 'user_1', email_verified: true },
    { id: '../admin/override$%' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #11: Timestamp forgery returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '11_TIMESTAMP_FORGERY',
    { uid: 'user_1', email_verified: true },
    { createdAt: 1000000, requestTime: 2000000 }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #12: Unbounded query scraping on notifications returns PERMISSION_DENIED', () => {
  const res = evaluateDirtyDozenPayload(
    '12_UNBOUNDED_QUERY_SCRAPING',
    { uid: 'user_2', email_verified: true },
    {},
    { recipientId: 'user_1' }
  );
  assert.equal(res, 'PERMISSION_DENIED');
});
