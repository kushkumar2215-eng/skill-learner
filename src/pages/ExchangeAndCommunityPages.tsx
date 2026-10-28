import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageSquare,
  Repeat,
  Send,
  Share2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COMMUNITY_CIRCLES } from '../data/demoCatalog';
import { SkillExchange } from '../types/domain';
import { canTransitionExchangeStatus } from '../utils/skillLogic';
import { UserAvatar } from '../components/BrandLogo';

export const SkillExchangeView: React.FC = () => {
  const {
    currentUserProfile,
    exchanges,
    messagesByExchange,
    updateExchangeStatus,
    sendExchangeMessage,
    loadExchangeMessages,
    navigate,
    startSandboxSession,
  } = useApp();

  const [tab, setTab] = useState<'all' | 'received' | 'sent' | 'accepted' | 'completed'>('all');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [completionModalExchange, setCompletionModalExchange] = useState<SkillExchange | null>(
    null
  );
  const [completionNotes, setCompletionNotes] = useState('');

  if (!currentUserProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
        <Repeat className="w-8 h-8 text-teal-700 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Bilateral Skill Exchanges
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Sign in or launch the Interactive Sandbox to send, accept, message, and complete
          peer-to-peer skill exchanges.
        </p>
        <button
          type="button"
          onClick={() => startSandboxSession()}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
        >
          Launch Interactive Workspace
        </button>
      </div>
    );
  }

  const uid = currentUserProfile.uid;

  const filteredExchanges = exchanges.filter((ex) => {
    if (tab === 'received') return ex.receiverId === uid;
    if (tab === 'sent') return ex.requesterId === uid;
    if (tab === 'accepted') return ex.status === 'Accepted';
    if (tab === 'completed') return ex.status === 'Completed';
    return true;
  });

  const handleOpenThread = (exchangeId: string) => {
    if (activeThreadId === exchangeId) {
      setActiveThreadId(null);
      return;
    }
    setActiveThreadId(exchangeId);
    loadExchangeMessages(exchangeId);
  };

  const handleSendMessage = async (e: React.FormEvent, exchangeId: string) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const ok = await sendExchangeMessage(exchangeId, messageInput);
    if (ok) {
      setMessageInput('');
    }
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionModalExchange) return;
    const ok = await updateExchangeStatus(
      completionModalExchange.id,
      'Completed',
      completionNotes
    );
    if (ok) {
      setCompletionModalExchange(null);
      setCompletionNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Skill Exchanges
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage incoming and outgoing exchange requests, coordinate sessions, and record
            completed swaps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('discover')}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl whitespace-nowrap shrink-0"
        >
          + Find New Exchange Partner
        </button>
      </div>

      {/* Interactive Filter Tabs */}
      <div
        role="group"
        aria-label="Filter exchanges by status or direction"
        className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit overflow-x-auto max-w-full"
      >
        {(
          [
            { id: 'all', label: `All (${exchanges.length})` },
            {
              id: 'received',
              label: `Received (${exchanges.filter((e) => e.receiverId === uid).length})`,
            },
            {
              id: 'sent',
              label: `Sent (${exchanges.filter((e) => e.requesterId === uid).length})`,
            },
            {
              id: 'accepted',
              label: `Accepted (${exchanges.filter((e) => e.status === 'Accepted').length})`,
            },
            {
              id: 'completed',
              label: `Completed (${exchanges.filter((e) => e.status === 'Completed').length})`,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              tab === item.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Exchange Cards */}
      {filteredExchanges.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="font-display text-lg font-bold text-slate-900">
            No exchanges in this view
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Browse the Skill Directory to propose a skill swap with another learner or mentor.
          </p>
          <button
            type="button"
            onClick={() => navigate('discover')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
          >
            Discover Skills
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExchanges.map((ex) => {
            const isRequester = ex.requesterId === uid;
            const partnerName = isRequester ? ex.receiverName : ex.requesterName;
            const canAccept = canTransitionExchangeStatus(ex, uid, 'Accepted').allowed;
            const canDecline = canTransitionExchangeStatus(ex, uid, 'Declined').allowed;
            const canCancel = canTransitionExchangeStatus(ex, uid, 'Cancelled').allowed;
            const canComplete = canTransitionExchangeStatus(ex, uid, 'Completed').allowed;
            const threadMessages = messagesByExchange[ex.id] || [];
            const isThreadOpen = activeThreadId === ex.id;

            return (
              <article
                key={ex.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={partnerName} size="md" />
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {isRequester ? 'Sent Request to' : 'Received Request from'} {partnerName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{ex.createdAt.slice(0, 10)}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            ex.status === 'Completed' || ex.status === 'Accepted'
                              ? 'text-emerald-700'
                              : ex.status === 'Pending'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          Status: {ex.status}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                        {ex.skillOfferedTitle} <span className="text-teal-700">⇄</span>{' '}
                        {ex.skillRequestedTitle}
                      </h2>
                    </div>
                  </div>

                  {/* Authorized Status Transition Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canAccept && (
                      <button
                        type="button"
                        onClick={() => updateExchangeStatus(ex.id, 'Accepted')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                      >
                        Accept Request
                      </button>
                    )}
                    {canDecline && (
                      <button
                        type="button"
                        onClick={() => updateExchangeStatus(ex.id, 'Declined')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                      >
                        Decline
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => updateExchangeStatus(ex.id, 'Cancelled')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg whitespace-nowrap"
                      >
                        Cancel Request
                      </button>
                    )}
                    {canComplete && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompletionModalExchange(ex);
                          setCompletionNotes(
                            'Completed our agreed skill-sharing sessions with great outcomes!'
                          );
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenThread(ex.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {isThreadOpen ? 'Hide Messages' : `Messages (${threadMessages.length})`}
                      </span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  "{ex.introMessage}"
                </p>

                {ex.status === 'Completed' && ex.completionNotes && (
                  <p className="text-xs text-emerald-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <span className="font-semibold">Completion Reflection:</span>{' '}
                    {ex.completionNotes}
                  </p>
                )}

                {/* Embedded Conversation Thread */}
                {isThreadOpen && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-700">
                      Exchange Coordination Messages (Authorized Participants Only)
                    </h3>

                    {threadMessages.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No messages yet. Send a note below to coordinate session times.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {threadMessages.map((msg) => {
                          const isMe = msg.senderId === uid;
                          return (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl text-xs space-y-1 ${
                                isMe
                                  ? 'bg-teal-50 text-slate-900 ml-6 border border-teal-100'
                                  : 'bg-slate-100 text-slate-800 mr-6'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700">
                                  {msg.senderName}
                                </span>
                                <span className="font-mono">{msg.createdAt.slice(0, 16).replace('T', ' ')}</span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => handleSendMessage(e, ex.id)}
                      className="flex items-center gap-2"
                    >
                      <label htmlFor={`msg-input-${ex.id}`} className="sr-only">
                        Write a message
                      </label>
                      <input
                        id={`msg-input-${ex.id}`}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Write a message about scheduling or learning topics..."
                        className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Complete Exchange Workflow Modal */}
      {completionModalExchange && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-exchange-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <h2
                id="complete-exchange-title"
                className="font-display text-xl font-bold text-slate-900"
              >
                Complete Skill Exchange
              </h2>
              <button
                type="button"
                onClick={() => setCompletionModalExchange(null)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm that you have completed your agreed sessions for{' '}
              <span className="font-semibold text-slate-900">
                {completionModalExchange.skillOfferedTitle} ⇄{' '}
                {completionModalExchange.skillRequestedTitle}
              </span>
              . Once completed, this exchange is locked and counts toward your achievements.
            </p>
            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="completion-notes-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Summary / Key Takeaways
                </label>
                <textarea
                  id="completion-notes-input"
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletionModalExchange(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const CommunityView: React.FC = () => {
  const {
    allProfiles,
    currentUserProfile,
    connections,
    togglePeerConnection,
    joinedCircleIds,
    toggleCommunityCircle,
    includeSampleData,
    setIncludeSampleData,
    addToast,
    navigate,
  } = useApp();

  const [shareCopied, setShareCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://skill-learner.app';
  const shareText = `Join me on Skill Learner — Teach. Learn. Connect. Grow. Let's exchange skills together: ${shareUrl}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyInviteLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      addToast('success', 'Invitation link copied', shareUrl);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const visiblePeers = allProfiles.filter(
    (p) =>
      p.uid !== currentUserProfile?.uid &&
      p.isPublic &&
      (includeSampleData || !p.isDemoRecord)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Community & Connections
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Connect with peers who share your learning interests, join collaborative study circles,
            or invite friends via WhatsApp.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-white border border-slate-200 px-3 py-2 rounded-xl">
          <input
            type="checkbox"
            checked={includeSampleData}
            onChange={(e) => setIncludeSampleData(e.target.checked)}
            className="rounded text-teal-700"
          />
          <span>Show Sample Community Members</span>
        </label>
      </div>

      {/* Invite Friends via WhatsApp & Share Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-xs font-semibold text-teal-800">Grow Your Learning Circle</p>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Invite Friends to Skill Learner via WhatsApp
          </h2>
          <p className="text-sm text-slate-600">
            Share the active application URL (<span className="font-mono text-xs">{shareUrl}</span>)
            directly on WhatsApp or copy the invite link. We never access your contacts without
            your action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            <span>{shareCopied ? 'Link Copied!' : 'Copy Invite URL'}</span>
          </button>
        </div>
      </section>

      {/* Recommended Peers by Shared Interests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Recommended Learners & Mentors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matched based on complementary skill categories and shared interests. Sample profiles
              are clearly labeled.
            </p>
          </div>
        </div>

        {visiblePeers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
            No public community profiles match the current view. Enable "Show Sample Community
            Members" to preview sample mentors.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visiblePeers.map((peer) => {
              const isConnected = connections.some((c) => c.peerId === peer.uid);
              return (
                <div
                  key={peer.uid}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={peer.displayName}
                          color={peer.avatarColor}
                          size="md"
                        />
                        <div>
                          <h3 className="font-display text-base font-bold text-slate-900">
                            {peer.displayName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {peer.experienceLevel} · {peer.learningMode} · {peer.preferredLanguage}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{peer.bio}</p>

                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Interests:</span>{' '}
                      {peer.interests.join(' · ')}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-mono">{peer.availability}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('discover')}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                      >
                        View Skills
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          togglePeerConnection(peer, peer.interests[0] || 'Skill Sharing')
                        }
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-teal-700 text-white hover:bg-teal-800'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Community Learning Circles */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Community Study Circles & Peer Labs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Join group practice sessions to learn alongside other members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMMUNITY_CIRCLES.map((circle) => {
            const isJoined = joinedCircleIds.includes(circle.id);
            return (
              <div
                key={circle.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    {circle.category} · {circle.format}
                  </p>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {circle.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{circle.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-mono text-slate-500">{circle.schedule}</p>
                  <button
                    type="button"
                    onClick={() => toggleCommunityCircle(circle.id, circle.title)}
                    className={`w-full py-2 px-4 text-xs font-semibold rounded-xl transition-colors ${
                      isJoined
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isJoined ? 'Joined Circle (Click to Leave)' : 'Join Learning Circle'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
