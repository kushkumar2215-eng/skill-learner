# Skill Learner — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **PII Isolation Invariant**: Public profiles in `/users/{userId}` never store email addresses, phone numbers, or street addresses. Private preferences live exclusively in `/users/{userId}/private/{docId}` and are readable/writable only by `request.auth.uid == userId`.
2. **Identity Ownership Invariant**: Every created document (`UserProfile`, `SkillRecord`, `SkillExchange`, `ExchangeMessage`, `LearningGoal`, `LearningActivity`, `NotificationItem`, `PeerConnection`) must bind its creator/owner UID field (`uid`, `ownerId`, `requesterId`, `senderId`, `initiatorId`) strictly to `request.auth.uid` and require `request.auth.token.email_verified == true`.
3. **Master Gate Invariant (Messages)**: An `ExchangeMessage` in `/skillExchanges/{exchangeId}/messages/{messageId}` can only be read or created if the parent `/skillExchanges/{exchangeId}` document exists and `request.auth.uid` is either `requesterId` or `receiverId` on that parent exchange.
4. **Exchange State Machine & Terminal Lock Invariant**: Once a `SkillExchange` reaches a terminal status (`Completed`, `Declined`, or `Cancelled`), no further updates are permitted. Only the `receiverId` can transition `Pending -> Accepted | Declined`. Only the `requesterId` can transition `Pending -> Cancelled`. Either participant can transition `Accepted -> Completed`.
5. **Strict Key & Size Boundary Invariant**: All writes enforce `.keys().hasAll(...)` and `.keys().hasOnly(...)` with explicit string `.size()` bounds and ID regex validation (`^[a-zA-Z0-9_\-]+$`).
6. **Temporal Integrity Invariant**: All `createdAt` fields on `create` and `updatedAt` fields on `update` must equal `request.time`. `createdAt` and ownership fields are immutable on `update`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Profile**: Creating `/users/user_1` with `{ ..., "isAdmin": true }` -> Rejected by `hasOnly`.
2. **Unverified Email Write**: Creating `/skills/skill_1` when `request.auth.token.email_verified == false` -> Rejected by `isVerifiedUser()`.
3. **Cross-User Profile Hijack**: Authenticated `user_2` attempting to update `/users/user_1` -> Rejected by `request.auth.uid == userId`.
4. **Private Settings PII Snooping**: Authenticated `user_2` attempting `get` on `/users/user_1/private/settings` -> Rejected by owner-only gate.
5. **Identity Spoofing on Skill Creation**: `user_1` creating `/skills/skill_1` with `ownerId: "user_2"` -> Rejected by `data.ownerId == request.auth.uid`.
6. **Self-Exchange Creation**: `user_1` creating `/skillExchanges/ex_1` with `requesterId: "user_1", receiverId: "user_1"` -> Rejected by `data.requesterId != data.receiverId`.
7. **Unauthorized Exchange Acceptance**: `requesterId` attempting to change `status` from `Pending` to `Accepted` (only `receiverId` may accept) -> Rejected by role-specific action branch.
8. **Terminal State Resurrection**: Attempting to update `/skillExchanges/ex_1` after `resource.data.status == 'Completed'` -> Rejected by terminal state lock.
9. **Orphaned / Non-Participant Message Injection**: `user_3` attempting to read or post in `/skillExchanges/ex_1/messages/msg_1` where `ex_1` belongs to `user_1` and `user_2` -> Rejected by Master Gate `get()` check on parent exchange.
10. **ID Poisoning Attack**: Creating a document with a 300-character ID or special characters `../admin` -> Rejected by `isValidId()`.
11. **Timestamp Forgery**: Creating a skill or exchange with a backdated `createdAt` timestamp != `request.time` -> Rejected by `data.createdAt == request.time`.
12. **Unbounded Query Scraping on Private Collections**: Running an unfiltered `list` query on `/notifications` or `/learningGoals` for another user's records -> Rejected by `resource.data.recipientId == request.auth.uid` / `resource.data.ownerId == request.auth.uid`.
