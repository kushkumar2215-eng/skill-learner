import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  FIREBASE_PROJECT_INFO,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  AchievementBadge,
  AppRoute,
  DeliveryMode,
  ExchangeMessage,
  ExchangeStatus,
  ExperienceLevel,
  LearningActivity,
  LearningGoal,
  NotificationItem,
  PeerConnection,
  SkillExchange,
  SkillRecord,
  SkillType,
  UserPrivateSettings,
  UserProfile,
} from '../types/domain';
import { DEMO_PROFILES, DEMO_SKILLS } from '../data/demoCatalog';
import {
  canTransitionExchangeStatus,
  evaluateAchievements,
  sanitizeId,
} from '../utils/skillLogic';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface AppContextValue {
  // Navigation
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  // Auth & Session Mode
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
  sessionMode: 'unauthenticated' | 'firebase' | 'sandbox';
  authConfigNotice: string | null;
  clearAuthConfigNotice: () => void;
  currentUserProfile: UserProfile | null;
  privateSettings: UserPrivateSettings | null;
  // Data
  allProfiles: UserProfile[];
  allSkills: SkillRecord[];
  userSkills: SkillRecord[];
  exchanges: SkillExchange[];
  messagesByExchange: Record<string, ExchangeMessage[]>;
  learningGoals: LearningGoal[];
  learningActivities: LearningActivity[];
  notifications: NotificationItem[];
  connections: PeerConnection[];
  achievements: AchievementBadge[];
  joinedCircleIds: string[];
  includeSampleData: boolean;
  setIncludeSampleData: (val: boolean) => void;
  // Toast feedback
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;
  // Auth Actions
  signInWithGoogleAction: () => Promise<void>;
  signInWithEmailAction: (email: string, password: string) => Promise<boolean>;
  signUpWithEmailAction: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<boolean>;
  sendPasswordResetAction: (email: string) => Promise<boolean>;
  updateUserPasswordAction: (newPassword: string) => Promise<boolean>;
  startSandboxSession: (customName?: string, goToOnboarding?: boolean) => void;
  logoutAction: () => Promise<void>;
  deleteAccountAction: () => Promise<void>;
  // Domain Actions
  saveUserProfile: (
    updates: Partial<
      Pick<
        UserProfile,
        | 'displayName'
        | 'bio'
        | 'avatarColor'
        | 'experienceLevel'
        | 'preferredLanguage'
        | 'learningMode'
        | 'regionLabel'
        | 'availability'
        | 'isPublic'
        | 'onboardingCompleted'
        | 'interests'
      >
    >
  ) => Promise<void>;
  savePrivateSettings: (
    updates: Partial<
      Pick<
        UserPrivateSettings,
        | 'emailNotifications'
        | 'exchangeAlerts'
        | 'communityUpdates'
        | 'allowDirectRequests'
      >
    >
  ) => Promise<void>;
  addOrUpdateSkill: (
    input: {
      title: string;
      category: string;
      type: SkillType;
      level: ExperienceLevel;
      description: string;
      deliveryMode: DeliveryMode;
    },
    editingId?: string
  ) => Promise<void>;
  deleteSkill: (skillId: string) => Promise<void>;
  createExchangeRequest: (input: {
    receiverId: string;
    receiverName: string;
    skillOfferedTitle: string;
    skillRequestedTitle: string;
    introMessage: string;
  }) => Promise<boolean>;
  updateExchangeStatus: (
    exchangeId: string,
    nextStatus: ExchangeStatus,
    completionNotes?: string
  ) => Promise<boolean>;
  sendExchangeMessage: (exchangeId: string, content: string) => Promise<boolean>;
  loadExchangeMessages: (exchangeId: string) => void;
  createLearningGoal: (input: {
    skillTitle: string;
    category: string;
    targetSessions: number;
    notes: string;
  }) => Promise<void>;
  deleteLearningGoal: (goalId: string) => Promise<void>;
  logLearningActivity: (input: {
    goalId: string;
    title: string;
    durationMinutes: number;
    reflection: string;
  }) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  togglePeerConnection: (peer: UserProfile, sharedSkill: string) => Promise<void>;
  toggleCommunityCircle: (circleId: string, circleTitle: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SANDBOX_STORAGE_KEY = 'skill_learner_new_user_v2';

function timestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

interface SandboxState {
  active: boolean;
  profile: UserProfile;
  privateSettings: UserPrivateSettings;
  skills: SkillRecord[];
  exchanges: SkillExchange[];
  messagesByExchange: Record<string, ExchangeMessage[]>;
  goals: LearningGoal[];
  activities: LearningActivity[];
  notifications: NotificationItem[];
  connections: PeerConnection[];
  joinedCircles: string[];
}

function createInitialSandboxState(displayName = 'New Learner'): SandboxState {
  const now = new Date().toISOString();
  const uid = 'new_learner_workspace';
  return {
    active: true,
    profile: {
      uid,
      displayName,
      bio: '',
      avatarColor: 'teal',
      experienceLevel: 'Beginner',
      preferredLanguage: 'English',
      learningMode: 'Online',
      regionLabel: 'Online / Global',
      availability: 'Flexible weekly schedule',
      isPublic: true,
      onboardingCompleted: false,
      interests: [],
      createdAt: now,
      updatedAt: now,
    },
    privateSettings: {
      uid,
      emailNotifications: true,
      exchangeAlerts: true,
      communityUpdates: true,
      allowDirectRequests: true,
      updatedAt: now,
    },
    skills: [],
    exchanges: [],
    messagesByExchange: {},
    goals: [],
    activities: [],
    notifications: [
      {
        id: 'welcome_notif_1',
        recipientId: uid,
        senderId: uid,
        type: 'system',
        title: 'Welcome to Skill Learner!',
        body: 'Your new account is ready. Complete your profile and add your first skill to start teaching and learning.',
        linkPath: 'skills',
        isRead: false,
        createdAt: now,
      },
    ],
    connections: [],
    joinedCircles: [],
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL hash or ?autostart=1
  const getInitialRoute = (): AppRoute => {
    if (typeof window === 'undefined') return 'home';
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'dashboard';
    }
    const hash = window.location.hash.replace('#/', '').replace('#', '') as AppRoute;
    const validRoutes: AppRoute[] = [
      'home', 'discover', 'skills', 'community', 'exchanges', 'dashboard',
      'progress', 'achievements', 'notifications', 'profile', 'settings',
      'onboarding', 'login', 'signup', 'reset-password', 'about', 'contact',
      'privacy', 'terms', 'deployment'
    ];
    return validRoutes.includes(hash) ? hash : 'home';
  };

  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authConfigNotice, setAuthConfigNotice] = useState<string | null>(null);
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sandbox state persisted in localStorage
  const [sandbox, setSandbox] = useState<SandboxState | null>(() => {
    if (typeof window === 'undefined') return null;
    window.localStorage.removeItem('skill_learner_sandbox_v1');
    const params = new URLSearchParams(window.location.search);
    const saved = window.localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SandboxState;
        if (parsed.active) return parsed;
      } catch {
        // ignore invalid JSON
      }
    }
    if (params.get('autostart') === '1') {
      const initial = createInitialSandboxState();
      window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return null;
  });

  // Firestore Live State
  const [liveProfile, setLiveProfile] = useState<UserProfile | null>(null);
  const [livePrivateSettings, setLivePrivateSettings] = useState<UserPrivateSettings | null>(null);
  const [livePublicProfiles, setLivePublicProfiles] = useState<UserProfile[]>([]);
  const [liveSkills, setLiveSkills] = useState<SkillRecord[]>([]);
  const [liveExchanges, setLiveExchanges] = useState<SkillExchange[]>([]);
  const [liveMessagesByExchange, setLiveMessagesByExchange] = useState<Record<string, ExchangeMessage[]>>({});
  const [liveGoals, setLiveGoals] = useState<LearningGoal[]>([]);
  const [liveActivities, setLiveActivities] = useState<LearningActivity[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);
  const [liveConnections, setLiveConnections] = useState<PeerConnection[]>([]);
  const [liveJoinedCircles, setLiveJoinedCircles] = useState<string[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate = (next: AppRoute) => {
    setRoute(next);
    if (typeof window !== 'undefined') {
      window.location.hash = `/${next}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '') as AppRoute;
      if (hash) setRoute(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Save sandbox changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sandbox && sandbox.active) {
      window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(sandbox));
    } else {
      window.localStorage.removeItem(SANDBOX_STORAGE_KEY);
    }
  }, [sandbox]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        // Turn off sandbox if real Firebase user logs in
        setSandbox(null);
        // Ensure user profile document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const defaultName =
              user.displayName && user.displayName.trim().length >= 2
                ? user.displayName.trim().slice(0, 80)
                : (user.email?.split('@')[0] || 'Skill Learner').slice(0, 80);
            await setDoc(userRef, {
              uid: user.uid,
              displayName: defaultName.length >= 2 ? defaultName : 'Learner',
              bio: 'Passionate about sharing skills and learning with the community.',
              avatarColor: 'teal',
              experienceLevel: 'Intermediate',
              preferredLanguage: 'English',
              learningMode: 'Online',
              regionLabel: 'Global / Online',
              availability: 'Flexible weekly schedule',
              isPublic: true,
              onboardingCompleted: false,
              interests: ['Web Development'],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            const privRef = doc(db, 'users', user.uid, 'private', 'settings');
            await setDoc(privRef, {
              uid: user.uid,
              emailNotifications: true,
              exchangeAlerts: true,
              communityUpdates: true,
              allowDirectRequests: true,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Initial profile check warning:', err);
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners when authenticated with Firebase
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setLiveProfile(null);
      setLivePrivateSettings(null);
      setLiveExchanges([]);
      setLiveGoals([]);
      setLiveActivities([]);
      setLiveNotifications([]);
      setLiveConnections([]);
      return;
    }

    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    // 1. User's own profile
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setLiveProfile({
              ...(d as Omit<UserProfile, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    // 2. User's private settings
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private', 'settings'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setLivePrivateSettings({
              ...(d as Omit<UserPrivateSettings, 'updatedAt'>),
              updatedAt: timestampToIso(d.updatedAt),
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/settings`)
      )
    );

    // 3. Public profiles
    unsubs.push(
      onSnapshot(
        query(collection(db, 'users'), where('isPublic', '==', true)),
        (snap) => {
          const list: UserProfile[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<UserProfile, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          setLivePublicProfiles(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );

    // 4. Skills (teach and learn)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'skills'), where('type', 'in', ['teach', 'learn'])),
        (snap) => {
          const list: SkillRecord[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<SkillRecord, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          setLiveSkills(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'skills')
      )
    );

    // 5. Skill Exchanges (sent and received)
    let sentExchanges: SkillExchange[] = [];
    let receivedExchanges: SkillExchange[] = [];
    const mergeExchanges = () => {
      const map = new Map<string, SkillExchange>();
      [...sentExchanges, ...receivedExchanges].forEach((ex) => map.set(ex.id, ex));
      setLiveExchanges(
        Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    };

    unsubs.push(
      onSnapshot(
        query(collection(db, 'skillExchanges'), where('requesterId', '==', uid)),
        (snap) => {
          sentExchanges = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<SkillExchange, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          mergeExchanges();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'skillExchanges')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'skillExchanges'), where('receiverId', '==', uid)),
        (snap) => {
          receivedExchanges = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<SkillExchange, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          mergeExchanges();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'skillExchanges')
      )
    );

    // 6. Learning Goals
    unsubs.push(
      onSnapshot(
        query(collection(db, 'learningGoals'), where('ownerId', '==', uid)),
        (snap) => {
          const list: LearningGoal[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<LearningGoal, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          setLiveGoals(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'learningGoals')
      )
    );

    // 7. Learning Activities
    unsubs.push(
      onSnapshot(
        query(collection(db, 'learningActivities'), where('ownerId', '==', uid)),
        (snap) => {
          const list: LearningActivity[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<LearningActivity, 'createdAt'>),
              createdAt: timestampToIso(d.createdAt),
            };
          });
          setLiveActivities(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'learningActivities')
      )
    );

    // 8. Notifications
    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('recipientId', '==', uid)),
        (snap) => {
          const list: NotificationItem[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                ...(d as Omit<NotificationItem, 'createdAt'>),
                createdAt: timestampToIso(d.createdAt),
              };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setLiveNotifications(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    // 9. Connections
    unsubs.push(
      onSnapshot(
        query(collection(db, 'connections'), where('initiatorId', '==', uid)),
        (snap) => {
          const list: PeerConnection[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              ...(d as Omit<PeerConnection, 'createdAt' | 'updatedAt'>),
              createdAt: timestampToIso(d.createdAt),
              updatedAt: timestampToIso(d.updatedAt),
            };
          });
          setLiveConnections(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'connections')
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, firebaseUser]);

  const sessionMode: 'unauthenticated' | 'firebase' | 'sandbox' = firebaseUser
    ? 'firebase'
    : sandbox?.active
    ? 'sandbox'
    : 'unauthenticated';

  const currentUserProfile =
    sessionMode === 'firebase'
      ? liveProfile
      : sessionMode === 'sandbox'
      ? sandbox?.profile || null
      : null;

  const privateSettings =
    sessionMode === 'firebase'
      ? livePrivateSettings
      : sessionMode === 'sandbox'
      ? sandbox?.privateSettings || null
      : null;

  const allProfiles = useMemo(() => {
    const map = new Map<string, UserProfile>();
    if (includeSampleData) {
      DEMO_PROFILES.forEach((p) => map.set(p.uid, p));
    }
    livePublicProfiles.forEach((p) => map.set(p.uid, p));
    if (currentUserProfile) {
      map.set(currentUserProfile.uid, currentUserProfile);
    }
    return Array.from(map.values());
  }, [includeSampleData, livePublicProfiles, currentUserProfile]);

  const allSkills = useMemo(() => {
    const map = new Map<string, SkillRecord>();
    if (includeSampleData) {
      DEMO_SKILLS.forEach((s) => map.set(s.id, s));
    }
    liveSkills.forEach((s) => map.set(s.id, s));
    if (sessionMode === 'sandbox' && sandbox) {
      sandbox.skills.forEach((s) => map.set(s.id, s));
    }
    return Array.from(map.values());
  }, [includeSampleData, liveSkills, sessionMode, sandbox]);

  const userSkills = useMemo(() => {
    if (!currentUserProfile) return [];
    return allSkills.filter((s) => s.ownerId === currentUserProfile.uid);
  }, [allSkills, currentUserProfile]);

  const exchanges =
    sessionMode === 'firebase'
      ? liveExchanges
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.exchanges
      : [];

  const messagesByExchange =
    sessionMode === 'firebase'
      ? liveMessagesByExchange
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.messagesByExchange
      : {};

  const learningGoals =
    sessionMode === 'firebase'
      ? liveGoals
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.goals
      : [];

  const learningActivities =
    sessionMode === 'firebase'
      ? liveActivities
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.activities
      : [];

  const notifications =
    sessionMode === 'firebase'
      ? liveNotifications
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.notifications
      : [];

  const connections =
    sessionMode === 'firebase'
      ? liveConnections
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.connections
      : [];

  const joinedCircleIds =
    sessionMode === 'firebase'
      ? liveJoinedCircles
      : sessionMode === 'sandbox' && sandbox
      ? sandbox.joinedCircles
      : [];

  const achievements = useMemo(
    () =>
      evaluateAchievements({
        userSkills,
        userExchanges: exchanges,
        userGoals: learningGoals,
        userActivities: learningActivities,
        userConnections: connections,
      }),
    [userSkills, exchanges, learningGoals, learningActivities, connections]
  );

  // Auth Actions
  const signInWithGoogleAction = async () => {
    setAuthConfigNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addToast('success', 'Signed in with Google', 'Welcome to Skill Learner.');
      navigate('dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        addToast('info', 'Google Sign-In popup closed', 'You can retry Google Sign-In or launch the Interactive Sandbox Workspace.');
      } else {
        setAuthConfigNotice(
          `Google Sign-In returned "${code || err?.message}". Ensure Google Sign-In and your domain are authorized in Firebase Console > Authentication > Settings > Authorized domains for project "${FIREBASE_PROJECT_INFO.projectId}".`
        );
      }
    }
  };

  const signInWithEmailAction = async (email: string, password: string): Promise<boolean> => {
    setAuthConfigNotice(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      addToast('success', 'Signed in successfully', 'Welcome back to Skill Learner.');
      navigate('dashboard');
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthConfigNotice(
          `Email/Password Authentication is not yet enabled in Firebase Console for project "${FIREBASE_PROJECT_INFO.projectId}". By default, automated Firebase provisioning configures Google Sign-In only. Enable "Email/Password" in Firebase Console -> Authentication -> Sign-in method, use Google Sign-In, or click "Enter Interactive Sandbox" below to test all platform features immediately.`
        );
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        addToast('error', 'Invalid credentials', 'No matching account found for that email and password.');
      } else {
        setAuthConfigNotice(`Authentication error (${code || 'unknown'}): ${err?.message || 'Unable to sign in.'}`);
      }
      return false;
    }
  };

  const signUpWithEmailAction = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<boolean> => {
    setAuthConfigNotice(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: displayName.trim().slice(0, 80),
        bio: 'New Skill Learner member excited to teach and learn.',
        avatarColor: 'teal',
        experienceLevel: 'Beginner',
        preferredLanguage: 'English',
        learningMode: 'Online',
        regionLabel: 'Online',
        availability: 'Weekdays & Weekends',
        isPublic: true,
        onboardingCompleted: false,
        interests: ['Web Development'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast('success', 'Account created', 'Complete your onboarding preferences.');
      navigate('onboarding');
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthConfigNotice(
          `Email/Password Sign-Up requires enabling the Email/Password provider in Firebase Console (Project: "${FIREBASE_PROJECT_INFO.projectId}" -> Authentication -> Sign-in method). You can sign in with Google right now, or launch the Interactive Sandbox to test onboarding and all features.`
        );
      } else if (code === 'auth/email-already-in-use') {
        addToast('error', 'Email already in use', 'Try logging in with this email instead.');
      } else {
        setAuthConfigNotice(`Sign-up error (${code || 'unknown'}): ${err?.message || 'Could not create account.'}`);
      }
      return false;
    }
  };

  const sendPasswordResetAction = async (email: string): Promise<boolean> => {
    setAuthConfigNotice(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      addToast('success', 'Password reset email sent', `Check ${email.trim()} for instructions.`);
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      setAuthConfigNotice(
        `Password reset notice (${code || 'info'}): Ensure Email/Password provider is enabled in Firebase Console (${FIREBASE_PROJECT_INFO.projectId}) and the email is registered.`
      );
      return false;
    }
  };

  const updateUserPasswordAction = async (newPassword: string): Promise<boolean> => {
    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await updatePassword(firebaseUser, newPassword);
        addToast('success', 'Password updated', 'Your Firebase account password has been updated.');
        return true;
      } catch (err: any) {
        addToast(
          'error',
          'Password update requires recent sign-in',
          err?.message || 'Please re-authenticate before changing your password.'
        );
        return false;
      }
    }
    addToast(
      'info',
      'Sandbox Mode Active',
      'Password changes apply to live Firebase Email/Password accounts.'
    );
    return false;
  };

  const startSandboxSession = (customName = 'New Learner', goToOnboarding = true) => {
    const nextState = createInitialSandboxState(customName.trim() || 'New Learner');
    nextState.profile.onboardingCompleted = !goToOnboarding;
    setSandbox(nextState);
    setAuthConfigNotice(null);
    addToast(
      'info',
      'Welcome to Skill Learner!',
      'Set up your new profile and add your first skill to begin.'
    );
    navigate(goToOnboarding ? 'onboarding' : 'dashboard');
  };

  const logoutAction = async () => {
    if (firebaseUser) {
      await signOut(auth);
    }
    setSandbox(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SANDBOX_STORAGE_KEY);
    }
    addToast('info', 'Signed out', 'Your session has ended.');
    navigate('home');
  };

  const deleteAccountAction = async () => {
    if (sessionMode === 'firebase' && firebaseUser) {
      const uid = firebaseUser.uid;
      try {
        await deleteDoc(doc(db, 'users', uid, 'private', 'settings'));
        await deleteDoc(doc(db, 'users', uid));
        await firebaseUser.delete();
        addToast('info', 'Account deleted', 'Your profile and account records were removed.');
        navigate('home');
      } catch (err: any) {
        addToast(
          'error',
          'Account deletion requires recent authentication',
          err?.message || 'Please sign out and sign back in before deleting your account.'
        );
      }
      return;
    }

    if (sessionMode === 'sandbox') {
      setSandbox(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SANDBOX_STORAGE_KEY);
      }
      addToast('info', 'Sandbox data cleared', 'All local profile and activity records have been deleted.');
      navigate('home');
    }
  };

  // Domain Mutations
  const saveUserProfile = async (
    updates: Partial<
      Pick<
        UserProfile,
        | 'displayName'
        | 'bio'
        | 'avatarColor'
        | 'experienceLevel'
        | 'preferredLanguage'
        | 'learningMode'
        | 'regionLabel'
        | 'availability'
        | 'isPublic'
        | 'onboardingCompleted'
        | 'interests'
      >
    >
  ) => {
    if (!currentUserProfile) return;

    if (sessionMode === 'firebase' && firebaseUser) {
      const path = `users/${firebaseUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        addToast('success', 'Profile saved', 'Your profile changes are live in Firestore.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      return;
    }

    if (sessionMode === 'sandbox' && sandbox) {
      const now = new Date().toISOString();
      setSandbox((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                ...updates,
                updatedAt: now,
              },
            }
          : prev
      );
      addToast('success', 'Profile updated', 'Saved to your active session.');
    }
  };

  const savePrivateSettings = async (
    updates: Partial<
      Pick<
        UserPrivateSettings,
        | 'emailNotifications'
        | 'exchangeAlerts'
        | 'communityUpdates'
        | 'allowDirectRequests'
      >
    >
  ) => {
    if (!currentUserProfile) return;

    if (sessionMode === 'firebase' && firebaseUser) {
      const path = `users/${firebaseUser.uid}/private/settings`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'private', 'settings'), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        addToast('success', 'Privacy & notification settings saved');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      return;
    }

    if (sessionMode === 'sandbox' && sandbox) {
      const now = new Date().toISOString();
      setSandbox((prev) =>
        prev
          ? {
              ...prev,
              privateSettings: {
                ...prev.privateSettings,
                ...updates,
                updatedAt: now,
              },
            }
          : prev
      );
      addToast('success', 'Preferences updated');
    }
  };

  const addOrUpdateSkill = async (
    input: {
      title: string;
      category: string;
      type: SkillType;
      level: ExperienceLevel;
      description: string;
      deliveryMode: DeliveryMode;
    },
    editingId?: string
  ) => {
    if (!currentUserProfile) return;
    const skillId = editingId ? sanitizeId(editingId) : sanitizeId(`skill_${Date.now()}`);

    if (sessionMode === 'firebase' && firebaseUser) {
      const path = `skills/${skillId}`;
      try {
        if (editingId) {
          await updateDoc(doc(db, 'skills', skillId), {
            ownerName: currentUserProfile.displayName.slice(0, 80),
            title: input.title.trim().slice(0, 100),
            category: input.category.trim().slice(0, 80),
            type: input.type,
            level: input.level,
            description: input.description.trim().slice(0, 600),
            deliveryMode: input.deliveryMode,
            updatedAt: serverTimestamp(),
          });
          addToast('success', 'Skill updated', `"${input.title.trim()}" has been updated.`);
        } else {
          await setDoc(doc(db, 'skills', skillId), {
            id: skillId,
            ownerId: firebaseUser.uid,
            ownerName: currentUserProfile.displayName.slice(0, 80),
            title: input.title.trim().slice(0, 100),
            category: input.category.trim().slice(0, 80),
            type: input.type,
            level: input.level,
            description: input.description.trim().slice(0, 600),
            deliveryMode: input.deliveryMode,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          addToast('success', 'Skill added', `"${input.title.trim()}" added to your profile.`);
        }
      } catch (err) {
        handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
      }
      return;
    }

    if (sessionMode === 'sandbox' && sandbox) {
      const now = new Date().toISOString();
      const record: SkillRecord = {
        id: skillId,
        ownerId: currentUserProfile.uid,
        ownerName: currentUserProfile.displayName,
        title: input.title.trim(),
        category: input.category.trim(),
        type: input.type,
        level: input.level,
        description: input.description.trim(),
        deliveryMode: input.deliveryMode,
        createdAt: now,
        updatedAt: now,
      };
      setSandbox((prev) => {
        if (!prev) return prev;
        const exists = prev.skills.some((s) => s.id === skillId);
        const nextSkills = exists
          ? prev.skills.map((s) => (s.id === skillId ? { ...record, createdAt: s.createdAt } : s))
          : [record, ...prev.skills];
        return {
          ...prev,
          skills: nextSkills,
        };
      });
      addToast(
        'success',
        editingId ? 'Skill updated' : 'Skill added',
        `"${input.title.trim()}" is now listed on your profile.`
      );
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (!currentUserProfile) return;
    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'skills', skillId));
        addToast('info', 'Skill removed');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `skills/${skillId}`);
      }
      return;
    }
    if (sessionMode === 'sandbox' && sandbox) {
      setSandbox((prev) =>
        prev ? { ...prev, skills: prev.skills.filter((s) => s.id !== skillId) } : prev
      );
      addToast('info', 'Skill removed');
    }
  };

  const createExchangeRequest = async (input: {
    receiverId: string;
    receiverName: string;
    skillOfferedTitle: string;
    skillRequestedTitle: string;
    introMessage: string;
  }): Promise<boolean> => {
    if (!currentUserProfile) return false;
    const exchangeId = sanitizeId(`ex_${Date.now()}`);
    const now = new Date().toISOString();

    const targetIsDemo = input.receiverId.startsWith('demo_');

    if (sessionMode === 'firebase' && firebaseUser && !targetIsDemo) {
      try {
        await setDoc(doc(db, 'skillExchanges', exchangeId), {
          id: exchangeId,
          requesterId: firebaseUser.uid,
          requesterName: currentUserProfile.displayName.slice(0, 80),
          receiverId: sanitizeId(input.receiverId),
          receiverName: input.receiverName.trim().slice(0, 80),
          skillOfferedTitle: input.skillOfferedTitle.trim().slice(0, 100),
          skillRequestedTitle: input.skillRequestedTitle.trim().slice(0, 100),
          introMessage: input.introMessage.trim().slice(0, 800),
          status: 'Pending',
          completionNotes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const notifId = sanitizeId(`notif_${Date.now()}`);
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          recipientId: sanitizeId(input.receiverId),
          senderId: firebaseUser.uid,
          type: 'exchange_request',
          title: 'New Skill Exchange Request',
          body: `${currentUserProfile.displayName} offered "${input.skillOfferedTitle.trim()}" for "${input.skillRequestedTitle.trim()}".`,
          linkPath: 'exchanges',
          isRead: false,
          createdAt: serverTimestamp(),
        });

        addToast('success', 'Skill exchange request sent', `Sent to ${input.receiverName}.`);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `skillExchanges/${exchangeId}`);
      }
    }

    // For sandbox mode OR when sending a preview exchange request to a Sample Profile
    const newExchange: SkillExchange = {
      id: exchangeId,
      requesterId: currentUserProfile.uid,
      requesterName: currentUserProfile.displayName,
      receiverId: input.receiverId,
      receiverName: input.receiverName,
      skillOfferedTitle: input.skillOfferedTitle.trim(),
      skillRequestedTitle: input.skillRequestedTitle.trim(),
      introMessage: input.introMessage.trim(),
      status: 'Pending',
      completionNotes: '',
      createdAt: now,
      updatedAt: now,
      isDemoRecord: targetIsDemo,
    };

    const initialMsg: ExchangeMessage = {
      id: sanitizeId(`msg_${Date.now()}`),
      exchangeId,
      requesterId: currentUserProfile.uid,
      receiverId: input.receiverId,
      senderId: currentUserProfile.uid,
      senderName: currentUserProfile.displayName,
      content: input.introMessage.trim(),
      createdAt: now,
    };

    if (sessionMode === 'sandbox') {
      setSandbox((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exchanges: [newExchange, ...prev.exchanges],
          messagesByExchange: {
            ...prev.messagesByExchange,
            [exchangeId]: [initialMsg],
          },
          notifications: [
            {
              id: sanitizeId(`notif_${Date.now()}`),
              recipientId: currentUserProfile.uid,
              senderId: currentUserProfile.uid,
              type: 'exchange_update',
              title: 'Exchange Request Sent',
              body: `You proposed teaching "${newExchange.skillOfferedTitle}" to ${newExchange.receiverName}.`,
              linkPath: 'exchanges',
              isRead: false,
              createdAt: now,
            },
            ...prev.notifications,
          ],
        };
      });
    } else {
      setLiveExchanges((prev) => [newExchange, ...prev]);
      setLiveMessagesByExchange((prev) => ({
        ...prev,
        [exchangeId]: [initialMsg],
      }));
    }

    addToast('success', 'Exchange request created', `Request sent to ${input.receiverName}.`);
    return true;
  };

  const updateExchangeStatus = async (
    exchangeId: string,
    nextStatus: ExchangeStatus,
    completionNotes = ''
  ): Promise<boolean> => {
    if (!currentUserProfile) return false;
    const target = exchanges.find((e) => e.id === exchangeId);
    if (!target) return false;

    const check = canTransitionExchangeStatus(target, currentUserProfile.uid, nextStatus);
    if (!check.allowed) {
      addToast('error', 'Action not permitted', check.reason);
      return false;
    }

    if (sessionMode === 'firebase' && firebaseUser && !target.isDemoRecord) {
      try {
        const updatePayload: Record<string, any> = {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        };
        if (nextStatus === 'Completed') {
          updatePayload.completionNotes = completionNotes.trim().slice(0, 600);
        }
        await updateDoc(doc(db, 'skillExchanges', exchangeId), updatePayload);
        addToast('success', `Exchange marked ${nextStatus}`);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `skillExchanges/${exchangeId}`);
      }
    }

    const now = new Date().toISOString();
    if (sessionMode === 'sandbox') {
      setSandbox((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exchanges: prev.exchanges.map((ex) =>
            ex.id === exchangeId
              ? {
                  ...ex,
                  status: nextStatus,
                  completionNotes:
                    nextStatus === 'Completed' ? completionNotes.trim() : ex.completionNotes,
                  updatedAt: now,
                }
              : ex
          ),
          notifications: [
            {
              id: sanitizeId(`notif_${Date.now()}`),
              recipientId: currentUserProfile.uid,
              senderId: currentUserProfile.uid,
              type: 'exchange_update',
              title: `Exchange ${nextStatus}`,
              body: `Your skill exchange "${target.skillOfferedTitle} ⇄ ${target.skillRequestedTitle}" is now ${nextStatus}.`,
              linkPath: 'exchanges',
              isRead: false,
              createdAt: now,
            },
            ...prev.notifications,
          ],
        };
      });
    } else {
      setLiveExchanges((prev) =>
        prev.map((ex) =>
          ex.id === exchangeId
            ? {
                ...ex,
                status: nextStatus,
                completionNotes:
                  nextStatus === 'Completed' ? completionNotes.trim() : ex.completionNotes,
                updatedAt: now,
              }
            : ex
        )
      );
    }

    addToast('success', `Exchange ${nextStatus}`, 'Status updated.');
    return true;
  };

  const loadExchangeMessages = (exchangeId: string) => {
    if (sessionMode !== 'firebase' || !firebaseUser) return;
    const target = exchanges.find((e) => e.id === exchangeId);
    if (!target || target.isDemoRecord) return;

    const q = query(
      collection(db, 'skillExchanges', exchangeId, 'messages'),
      where(
        target.requesterId === firebaseUser.uid ? 'requesterId' : 'receiverId',
        '==',
        firebaseUser.uid
      )
    );
    getDocs(q)
      .then((snap) => {
        const list: ExchangeMessage[] = snap.docs
          .map((dSnap) => {
            const d = dSnap.data();
            return {
              ...(d as Omit<ExchangeMessage, 'createdAt'>),
              createdAt: timestampToIso(d.createdAt),
            };
          })
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setLiveMessagesByExchange((prev) => ({ ...prev, [exchangeId]: list }));
      })
      .catch((err) =>
        handleFirestoreError(err, OperationType.LIST, `skillExchanges/${exchangeId}/messages`)
      );
  };

  const sendExchangeMessage = async (exchangeId: string, content: string): Promise<boolean> => {
    if (!currentUserProfile) return false;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 1000) return false;

    const target = exchanges.find((e) => e.id === exchangeId);
    if (!target) return false;

    const msgId = sanitizeId(`msg_${Date.now()}`);
    const now = new Date().toISOString();

    if (sessionMode === 'firebase' && firebaseUser && !target.isDemoRecord) {
      try {
        await setDoc(doc(db, 'skillExchanges', exchangeId, 'messages', msgId), {
          id: msgId,
          exchangeId,
          requesterId: target.requesterId,
          receiverId: target.receiverId,
          senderId: firebaseUser.uid,
          senderName: currentUserProfile.displayName.slice(0, 80),
          content: trimmed,
          createdAt: serverTimestamp(),
        });
        loadExchangeMessages(exchangeId);
        return true;
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `skillExchanges/${exchangeId}/messages/${msgId}`
        );
      }
    }

    const newMsg: ExchangeMessage = {
      id: msgId,
      exchangeId,
      requesterId: target.requesterId,
      receiverId: target.receiverId,
      senderId: currentUserProfile.uid,
      senderName: currentUserProfile.displayName,
      content: trimmed,
      createdAt: now,
    };

    if (sessionMode === 'sandbox') {
      setSandbox((prev) => {
        if (!prev) return prev;
        const existing = prev.messagesByExchange[exchangeId] || [];
        return {
          ...prev,
          messagesByExchange: {
            ...prev.messagesByExchange,
            [exchangeId]: [...existing, newMsg],
          },
        };
      });
    } else {
      setLiveMessagesByExchange((prev) => ({
        ...prev,
        [exchangeId]: [...(prev[exchangeId] || []), newMsg],
      }));
    }
    return true;
  };

  const createLearningGoal = async (input: {
    skillTitle: string;
    category: string;
    targetSessions: number;
    notes: string;
  }) => {
    if (!currentUserProfile) return;
    const goalId = sanitizeId(`goal_${Date.now()}`);
    const now = new Date().toISOString();

    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await setDoc(doc(db, 'learningGoals', goalId), {
          id: goalId,
          ownerId: firebaseUser.uid,
          skillTitle: input.skillTitle.trim().slice(0, 100),
          category: input.category.trim().slice(0, 80),
          targetSessions: input.targetSessions,
          completedSessions: 0,
          progressPercent: 0,
          notes: input.notes.trim().slice(0, 600),
          status: 'Active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast('success', 'Learning goal created', `"${input.skillTitle.trim()}" added.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `learningGoals/${goalId}`);
      }
      return;
    }

    if (sessionMode === 'sandbox') {
      const newGoal: LearningGoal = {
        id: goalId,
        ownerId: currentUserProfile.uid,
        skillTitle: input.skillTitle.trim(),
        category: input.category.trim(),
        targetSessions: input.targetSessions,
        completedSessions: 0,
        progressPercent: 0,
        notes: input.notes.trim(),
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      };
      setSandbox((prev) => (prev ? { ...prev, goals: [newGoal, ...prev.goals] } : prev));
      addToast('success', 'Learning goal created', `"${newGoal.skillTitle}" added.`);
    }
  };

  const deleteLearningGoal = async (goalId: string) => {
    if (!currentUserProfile) return;
    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'learningGoals', goalId));
        addToast('info', 'Learning goal removed');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `learningGoals/${goalId}`);
      }
      return;
    }
    if (sessionMode === 'sandbox') {
      setSandbox((prev) =>
        prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== goalId) } : prev
      );
      addToast('info', 'Learning goal removed');
    }
  };

  const logLearningActivity = async (input: {
    goalId: string;
    title: string;
    durationMinutes: number;
    reflection: string;
  }) => {
    if (!currentUserProfile) return;
    const goal = learningGoals.find((g) => g.id === input.goalId);
    if (!goal) return;

    const activityId = sanitizeId(`act_${Date.now()}`);
    const now = new Date().toISOString();
    const nextCompleted = Math.min(goal.completedSessions + 1, goal.targetSessions);
    const nextPercent = Math.min(100, Math.round((nextCompleted / goal.targetSessions) * 100));
    const nextStatus: 'Active' | 'Completed' =
      nextCompleted >= goal.targetSessions ? 'Completed' : 'Active';

    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await setDoc(doc(db, 'learningActivities', activityId), {
          id: activityId,
          ownerId: firebaseUser.uid,
          goalId: goal.id,
          title: input.title.trim().slice(0, 120),
          durationMinutes: input.durationMinutes,
          reflection: input.reflection.trim().slice(0, 800),
          completedDate: now.slice(0, 10),
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'learningGoals', goal.id), {
          completedSessions: nextCompleted,
          progressPercent: nextPercent,
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
        addToast('success', 'Learning session logged', `Progress updated to ${nextPercent}%.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `learningActivities/${activityId}`);
      }
      return;
    }

    if (sessionMode === 'sandbox') {
      const newAct: LearningActivity = {
        id: activityId,
        ownerId: currentUserProfile.uid,
        goalId: goal.id,
        title: input.title.trim(),
        durationMinutes: input.durationMinutes,
        reflection: input.reflection.trim(),
        completedDate: now.slice(0, 10),
        createdAt: now,
      };
      setSandbox((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activities: [newAct, ...prev.activities],
          goals: prev.goals.map((g) =>
            g.id === goal.id
              ? {
                  ...g,
                  completedSessions: nextCompleted,
                  progressPercent: nextPercent,
                  status: nextStatus,
                  updatedAt: now,
                }
              : g
          ),
        };
      });
      addToast('success', 'Learning session logged', `Goal progress is now ${nextPercent}%.`);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!currentUserProfile) return;
    if (sessionMode === 'firebase' && firebaseUser) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
      }
      return;
    }
    if (sessionMode === 'sandbox') {
      setSandbox((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === notificationId ? { ...n, isRead: true } : n
              ),
            }
          : prev
      );
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUserProfile) return;
    if (sessionMode === 'firebase' && firebaseUser) {
      const unread = notifications.filter((n) => !n.isRead);
      for (const item of unread) {
        try {
          await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `notifications/${item.id}`);
        }
      }
      addToast('info', 'All notifications marked read');
      return;
    }
    if (sessionMode === 'sandbox') {
      setSandbox((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
            }
          : prev
      );
      addToast('info', 'All notifications marked read');
    }
  };

  const togglePeerConnection = async (peer: UserProfile, sharedSkill: string) => {
    if (!currentUserProfile) return;
    const existing = connections.find((c) => c.peerId === peer.uid);
    const now = new Date().toISOString();

    if (existing) {
      if (sessionMode === 'firebase' && firebaseUser && !peer.isDemoRecord) {
        try {
          await deleteDoc(doc(db, 'connections', existing.id));
          addToast('info', `Disconnected from ${peer.displayName}`);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `connections/${existing.id}`);
        }
        return;
      }
      if (sessionMode === 'sandbox') {
        setSandbox((prev) =>
          prev
            ? { ...prev, connections: prev.connections.filter((c) => c.id !== existing.id) }
            : prev
        );
      } else {
        setLiveConnections((prev) => prev.filter((c) => c.id !== existing.id));
      }
      addToast('info', `Removed connection with ${peer.displayName}`);
      return;
    }

    const connId = sanitizeId(`conn_${Date.now()}`);
    if (sessionMode === 'firebase' && firebaseUser && !peer.isDemoRecord) {
      try {
        await setDoc(doc(db, 'connections', connId), {
          id: connId,
          initiatorId: firebaseUser.uid,
          initiatorName: currentUserProfile.displayName.slice(0, 80),
          peerId: sanitizeId(peer.uid),
          peerName: peer.displayName.slice(0, 80),
          sharedSkill: (sharedSkill || 'Skill Sharing').slice(0, 100),
          status: 'Connected',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast('success', `Connected with ${peer.displayName}`);
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `connections/${connId}`);
      }
    }

    const newConn: PeerConnection = {
      id: connId,
      initiatorId: currentUserProfile.uid,
      initiatorName: currentUserProfile.displayName,
      peerId: peer.uid,
      peerName: peer.displayName,
      sharedSkill: sharedSkill || 'Peer Learning',
      status: 'Connected',
      createdAt: now,
      updatedAt: now,
    };

    if (sessionMode === 'sandbox') {
      setSandbox((prev) =>
        prev ? { ...prev, connections: [newConn, ...prev.connections] } : prev
      );
    } else {
      setLiveConnections((prev) => [newConn, ...prev]);
    }
    addToast('success', `Connected with ${peer.displayName}`);
  };

  const toggleCommunityCircle = (circleId: string, circleTitle: string) => {
    const joined = joinedCircleIds.includes(circleId);
    if (sessionMode === 'sandbox') {
      setSandbox((prev) => {
        if (!prev) return prev;
        const next = joined
          ? prev.joinedCircles.filter((id) => id !== circleId)
          : [...prev.joinedCircles, circleId];
        return { ...prev, joinedCircles: next };
      });
    } else {
      setLiveJoinedCircles((prev) =>
        joined ? prev.filter((id) => id !== circleId) : [...prev, circleId]
      );
    }
    addToast(
      joined ? 'info' : 'success',
      joined ? 'Left learning circle' : 'Joined learning circle',
      circleTitle
    );
  };

  return (
    <AppContext.Provider
      value={{
        route,
        navigate,
        authReady,
        firebaseUser,
        sessionMode,
        authConfigNotice,
        clearAuthConfigNotice: () => setAuthConfigNotice(null),
        currentUserProfile,
        privateSettings,
        allProfiles,
        allSkills,
        userSkills,
        exchanges,
        messagesByExchange,
        learningGoals,
        learningActivities,
        notifications,
        connections,
        achievements,
        joinedCircleIds,
        includeSampleData,
        setIncludeSampleData,
        toasts,
        addToast,
        dismissToast,
        signInWithGoogleAction,
        signInWithEmailAction,
        signUpWithEmailAction,
        sendPasswordResetAction,
        updateUserPasswordAction,
        startSandboxSession,
        logoutAction,
        deleteAccountAction,
        saveUserProfile,
        savePrivateSettings,
        addOrUpdateSkill,
        deleteSkill,
        createExchangeRequest,
        updateExchangeStatus,
        sendExchangeMessage,
        loadExchangeMessages,
        createLearningGoal,
        deleteLearningGoal,
        logLearningActivity,
        markNotificationRead,
        markAllNotificationsRead,
        togglePeerConnection,
        toggleCommunityCircle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
