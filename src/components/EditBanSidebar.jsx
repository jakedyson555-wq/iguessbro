// src/components/
// ClassicEditBanSidebar.jsx

// ----------------------------------------------------------------------
// Dev tool sidebar for configuring the Classic (old) NotApproved screen.
// Simplified from EditBanSidebar:
//   - Text evidence only; each offensive item has its own reason key
//   - No unified violation modes (voice / image / chat)
//   - No consequence transparency (always written as false)
//   - Trace ID is generated and applied silently (not shown in UI)
//   - Reduced reason and moderator note option sets
// ----------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X, Plus, Check } from 'lucide-react';
import { NotApprovedTranslations } from '../translations/NotApprovedTranslations';

const LS_KEY = 'not_approved_state';

// ── Constants ──────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { value: 'Warn',        label: 'Warn',      color: 'amber'  },
  { value: 'Ban 1 Day',   label: '1 Day',     color: 'orange' },
  { value: 'Ban 3 Days',  label: '3 Days',    color: 'orange' },
  { value: 'Ban 7 Days',  label: '7 Days',    color: 'orange' },
  { value: 'Ban 14 Days', label: '14 Days',   color: 'orange' },
  { value: 'Delete',      label: 'Permanent', color: 'red'    },
];

const DURATION_END_OFFSET = {
  'Warn':        0,
  'Ban 1 Day':   1  * 24 * 60 * 60 * 1000,
  'Ban 3 Days':  3  * 24 * 60 * 60 * 1000,
  'Ban 7 Days':  7  * 24 * 60 * 60 * 1000,
  'Ban 14 Days': 14 * 24 * 60 * 60 * 1000,
  'Delete':      0,
};

const DURATION_COLORS = {
  amber:  { active: { background: 'rgba(245,158,11,0.18)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.45)' }, dot: '#fbbf24' },
  orange: { active: { background: 'rgba(249,115,22,0.18)', color: '#fb923c', borderColor: 'rgba(249,115,22,0.45)' }, dot: '#fb923c' },
  red:    { active: { background: 'rgba(239,68,68,0.18)',  color: '#f87171', borderColor: 'rgba(239,68,68,0.45)'  }, dot: '#ef4444' },
};

const REASON_OPTIONS = [
  { value: '',                              label: '— Select a reason —' },
  { value: 'Label.Reason.Harassment',       label: NotApprovedTranslations['Label.Reason.Harassment'] },
  { value: 'Label.Reason.Scamming',         label: NotApprovedTranslations['Label.Reason.Scamming'] },
  { value: 'Label.Reason.Spam',             label: NotApprovedTranslations['Label.Reason.Spam'] },
  { value: 'Label.Reason.AdultContent',     label: NotApprovedTranslations['Label.Reason.AdultContent'] },
  { value: 'Label.Reason.Profanity',        label: NotApprovedTranslations['Label.Reason.Profanity'] },
  { value: 'Label.Reason.Inappropriate',    label: NotApprovedTranslations['Label.Reason.Inappropriate'] },
  { value: 'Label.Reason.Privacy',          label: NotApprovedTranslations['Label.Reason.Privacy'] },
];

const MESSAGE_OPTIONS = [
  { key: '',                                             label: '— Select a message —' },
  { key: 'Label.MessageToUser.AccountForBreakingRules', label: 'Account for Breaking Rules' },
  { key: 'Label.MessageToUser.Username',                label: 'Username' },
  { key: 'Label.MessageToUser.HateSpeech',              label: 'Hate Speech' },
  { key: 'Label.MessageToUser.OldDiscriminatory',       label: 'Discriminatory' },
  { key: 'Label.MessageToUser.InappropriateImage',      label: 'InappropriateImage' },
  { key: 'Label.MessageToUser.RealLifeThreats',         label: 'Real-life Threats' },
  { key: 'Label.MessageToUser.DeletedCreatingPromoting',label: 'Deleted: Creating/Promoting Inappropriate Content' },
  { key: 'Label.MessageToUser.AdultContent',            label: 'Adult Content' },
  { key: 'Label.MessageToUser.AccountTheft',            label: 'Account Theft' },
  { key: 'Label.MessageToUser.LegacyScamming',          label: 'Scamming' },
  { key: 'Label.MessageToUser.LegacyPrivacy',           label: 'Privacy/PII' },
  { key: 'Label.MessageToUser.LegacyPostingExploits',   label: 'Posting Exploits' },
  { key: 'Label.MessageToUser.LegacyBadModelInGame',    label: 'Bad Model in Game' },
  { key: 'Label.MessageToUser.LegacyDMCAPermanent',     label: 'DMCA Permanent' },
  { key: 'Label.MessageToUser.LegacyFreeBoibucksGame',  label: 'Free Boibucks Game' },
  { key: 'Label.MessageToUser.LegacyInappropriateContent', label: 'Inappropriate Content' },
  { key: 'Label.MessageToUser.LegacyHarassment',        label: 'Harassment' },
  { key: 'Label.MessageToUser.LegacyGeneralViolation',  label: 'General Violation' },
  { key: 'Label.MessageToUser.LegacySpam',              label: 'Spam' },
  { key: 'Label.MessageToUser.LegacySwearing',          label: 'Swearing or Profanity' },
  { key: 'Label.MessageToUser.LegacyAccountErasure',    label: 'Account Erasure' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build the utteranceText string for a forum post pair. */
function buildForumUtterance(subject, body) {
  return `Subject: ${subject}| Body: ${body}`;
}

/**
 * If utteranceText matches the forum-post format, return { subject, body }.
 * Otherwise returns null.
 */
function parseForumUtterance(text) {
  if (!text) return null;
  const match = text.match(/^Subject: ([\s\S]*?)\| Body: ([\s\S]*)$/);
  if (!match) return null;
  return { subject: match[1], body: match[2] };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2 text-left cursor-pointer border-none bg-transparent"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">{title}</span>
          {badge != null && badge > 0 && (
            <span
              className="text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            >
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      {open && <div className="flex flex-col gap-3 pt-3">{children}</div>}
    </div>
  );
}

function AutoTextarea({ value, onChange, placeholder, rows = 5, className, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={className}
      style={{ resize: 'none', overflow: 'auto', minHeight: `${rows * 1.5}rem`, maxHeight: '12rem' }}
      {...rest}
    />
  );
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateAssetId() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ClassicEditBanSidebar() {
  const [current] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  // ── Local state ──────────────────────────────────────────────────────────

  const [isOpen,     setIsOpen]     = useState(false);
  const [applyFlash, setApplyFlash] = useState(false);

  // Ban fields
  const [duration,      setDuration]      = useState(current.punishmentTypeDescription ?? 'Warn');
  const [moderatorNote, setModeratorNote] = useState(current.messageToUser ?? '');
  const [customDate,    setCustomDate]    = useState('');
  const [msgKey,        setMsgKey]        = useState('');

  // Offensive item pairs
  const [pairs, setPairs] = useState(() => {
    const stored = current.badUtterances ?? [];
    return stored.map(u => {
      if (u.imageData || u.contentDeleted || u.contentBlocked) {
        return {
          type:           'image',
          reason:         u.labelTranslationKey ?? '',
          utterance:      u.utteranceText ?? '',
          imageData:      u.imageData ?? null,
          imageName:      u.imageName ?? '',
          assetsAffected: u.assetsAffected ?? 0,
          contentDeleted: u.contentDeleted ?? false,
          contentBlocked: u.contentBlocked ?? false,
        };
      }
      const forum = parseForumUtterance(u.utteranceText);
      if (forum) {
        return {
          type:    'forum',
          reason:  u.labelTranslationKey ?? '',
          utterance: u.utteranceText ?? '',
          subject: forum.subject,
          body:    forum.body,
        };
      }
      return { type: 'text', reason: u.labelTranslationKey ?? '', utterance: u.utteranceText ?? '' };
    });
  });

  // Staged new pair
  const [stagedType,           setStagedType]           = useState('text');
  const [stagedReason,         setStagedReason]         = useState('');
  const [stagedUtterance,      setStagedUtterance]      = useState('');
  const [stagedSubject,        setStagedSubject]        = useState('');
  const [stagedBody,           setStagedBody]           = useState('');
  const [stagedImageData,      setStagedImageData]      = useState(null);
  const [stagedImageName,      setStagedImageName]      = useState('');
  const [stagedAssetsAffected, setStagedAssetsAffected] = useState(0);
  const [stagedContentDeleted, setStagedContentDeleted] = useState(false);
  const [stagedContentBlocked, setStagedContentBlocked] = useState(false);

  const applyTimerRef  = useRef(null);
  const fileInputRef   = useRef(null);
  useEffect(() => () => clearTimeout(applyTimerRef.current), []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const activeDurationOpt   = DURATION_OPTIONS.find(o => o.value === duration) ?? DURATION_OPTIONS[5];
  const activeDurationColor = DURATION_COLORS[activeDurationOpt.color];

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMsgSelect = (key) => {
    setMsgKey(key);
    setModeratorNote(key && NotApprovedTranslations[key] ? NotApprovedTranslations[key] : '');
  };

  const resetStagedFields = () => {
    setStagedReason('');
    setStagedUtterance('');
    setStagedSubject('');
    setStagedBody('');
    setStagedImageData(null);
    setStagedImageName('');
    setStagedAssetsAffected(0);
    setStagedContentDeleted(false);
    setStagedContentBlocked(false);
  };

  const handleAddPair = () => {
    if (!stagedReason) return;

    if (stagedType === 'text') {
      const t = stagedUtterance.trim();
      if (!t) return;
      setPairs(prev => [...prev, { type: 'text', reason: stagedReason, utterance: t }]);
      setStagedUtterance('');

    } else if (stagedType === 'forum') {
      const subject = stagedSubject.trim();
      const body    = stagedBody.trim();
      if (!subject && !body) return;
      const utterance = buildForumUtterance(subject, body);
      setPairs(prev => [...prev, { type: 'forum', reason: stagedReason, utterance, subject, body }]);
      setStagedSubject('');
      setStagedBody('');

    } else {
      // image
      if (!stagedImageData && !stagedContentDeleted && !stagedContentBlocked) return;
      const assetId = generateAssetId();
      setPairs(prev => [...prev, {
        type:           'image',
        reason:         stagedReason,
        utterance:      `Asset Version ID: ${assetId}`,
        imageData:      stagedContentDeleted || stagedContentBlocked ? null : stagedImageData,
        imageName:      stagedImageName.trim() || 'Image',
        assetsAffected: stagedAssetsAffected,
        contentDeleted: stagedContentDeleted,
        contentBlocked: stagedContentBlocked,
      }]);
      setStagedImageData(null);
      setStagedImageName('');
      setStagedAssetsAffected(0);
      setStagedContentDeleted(false);
      setStagedContentBlocked(false);
    }

    setStagedReason('');
  };

  const handleRemovePair = (i) => {
    setPairs(prev => prev.filter((_, j) => j !== i));
  };

  const handleStagedImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setStagedImageData(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /** Update a forum pair's subject or body and keep utterance in sync. */
  const handleForumPairChange = (i, field, value) => {
    setPairs(prev => prev.map((item, j) => {
      if (j !== i) return item;
      const next = { ...item, [field]: value };
      next.utterance = buildForumUtterance(next.subject, next.body);
      return next;
    }));
  };

  const handleApply = () => {
    const newInterventionId = generateUUID();
    const beginDate = customDate ? new Date(customDate).toISOString() : new Date().toISOString();
    const offsetMs  = DURATION_END_OFFSET[duration] ?? 0;
    const endDate   = offsetMs > 0
      ? new Date(new Date(beginDate).getTime() + offsetMs).toISOString()
      : '';

    const payload = {
      interventionId:            newInterventionId,
      messageToUser:             moderatorNote,
      punishmentTypeDescription: duration,
      beginDate,
      endDate,
      educationalStepsEnabled:   true,
      consequenceTransparencyEnabled: false,
      badUtterances: pairs.map(p => {
        const base = {
          labelTranslationKey: p.reason || 'Label.Reason.Other',
          utteranceText:       p.utterance,
        };
        if (p.type === 'image') {
          base.imageData      = (p.contentDeleted || p.contentBlocked) ? null : p.imageData;
          base.imageName      = p.imageName;
          base.assetsAffected = p.assetsAffected;
          base.contentDeleted = p.contentDeleted ?? false;
          base.contentBlocked = p.contentBlocked ?? false;
        }
        return base;
      }),
      unifiedViolation: undefined,
    };

    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {}

    setApplyFlash(true);
    clearTimeout(applyTimerRef.current);
    applyTimerRef.current = setTimeout(() => {
      setApplyFlash(false);
      window.location.reload();
    }, 800);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`fixed top-0 right-0 h-full z-[1001] flex items-stretch transition-all duration-300 ease-in-out ${isOpen ? 'w-[300px]' : 'w-0'}`}
    >
      {/* Toggle tab */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="absolute top-1/2 -translate-y-1/2 -left-9 flex flex-col items-center justify-center gap-1.5 w-9 bg-base border border-border-subtle border-r-0 rounded-l-lg text-muted hover:text-header hover:bg-modifier transition-colors duration-150 cursor-pointer"
        style={{ height: isOpen ? '48px' : '80px', paddingTop: '10px', paddingBottom: '10px' }}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        data-test-id="edit-ban-sidebar-toggle"
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 shrink-0" />
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: activeDurationColor.dot }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest shrink-0"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1 }}
            >
              Edit
            </span>
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </>
        )}
      </button>

      {/* Panel */}
      <aside
        className="w-[300px] h-full bg-base border-l border-border-subtle flex flex-col shadow-xl overflow-hidden"
        aria-label="Edit ban settings"
        aria-hidden={!isOpen}
        inert={!isOpen ? '' : undefined}
        data-test-id="edit-ban-sidebar"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border-subtle shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-header">Edit Ban</h2>
            <p className="text-xs text-muted mt-0.5">Saves to localStorage and reloads.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0 divide-y divide-border-subtle">

          {/* ── Ban ─────────────────────────────────────────────────────── */}
          <div className="pb-4">
            <Section title="Ban" defaultOpen>

              {/* Duration pills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-header">Duration</span>
                <div className="flex flex-wrap gap-1.5" data-test-id="edit-ban-duration-pills">
                  {DURATION_OPTIONS.map(opt => {
                    const isActive = duration === opt.value;
                    const col      = DURATION_COLORS[opt.color];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDuration(opt.value)}
                        data-test-id={`edit-ban-duration-pill-${opt.value}`}
                        style={isActive ? col.active : {}}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'border-transparent'
                            : 'bg-secondary border-white/10 text-muted hover:text-header hover:bg-modifier'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review date */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-header">Review Date</label>
                  {customDate && (
                    <button
                      type="button"
                      onClick={() => setCustomDate('')}
                      className="text-xs font-semibold text-muted hover:text-header transition-colors duration-100 cursor-pointer border-none bg-transparent p-0"
                    >
                      Use current time
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  data-test-id="edit-ban-review-date-input"
                />
                {!customDate && (
                  <p className="text-[11px] text-muted leading-snug">Leave empty to use current time.</p>
                )}
              </div>

            </Section>
          </div>

          {/* ── Moderator Note ───────────────────────────────────────────── */}
          <div className="py-4">
            <Section title="Moderator Note" defaultOpen>
              <select
                value={msgKey}
                onChange={e => handleMsgSelect(e.target.value)}
                className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                data-test-id="edit-ban-message-select"
              >
                {MESSAGE_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
              <AutoTextarea
                value={moderatorNote}
                onChange={e => setModeratorNote(e.target.value)}
                placeholder="Note text will appear here. You can also type a custom note directly."
                rows={5}
                className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 leading-relaxed"
                data-test-id="edit-ban-note-textarea"
              />
            </Section>
          </div>

          {/* ── Evidence ─────────────────────────────────────────────────── */}
          <div className="pt-4">
            <Section title="Evidence" badge={pairs.length} defaultOpen>

              {/* Staged new pair */}
              <div className="flex flex-col gap-2">

                {/* Type toggle — text / image / forum */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
                  {['text', 'image', 'forum'].map((mode, idx) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setStagedType(mode); resetStagedFields(); }}
                      className={`flex-1 py-1.5 capitalize transition-colors duration-100 cursor-pointer border-none ${idx > 0 ? 'border-l border-white/10' : ''} ${stagedType === mode ? 'bg-white/10 text-header' : 'bg-secondary text-muted hover:text-header hover:bg-modifier'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <label className="text-sm font-semibold text-header">Reason</label>
                <select
                  value={stagedReason}
                  onChange={e => { setStagedReason(e.target.value); if (e.target.value !== 'Label.Reason.AdultContent') setStagedContentBlocked(false); }}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                  data-test-id="edit-ban-text-reason-select"
                >
                  {REASON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* ── Text inputs ── */}
                {stagedType === 'text' && (
                  <>
                    <label className="text-sm font-semibold text-header mt-1">Offensive item</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={stagedUtterance}
                        onChange={e => setStagedUtterance(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPair(); } }}
                        placeholder="Add offensive item…"
                        className="flex-1 min-w-0 bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
                        data-test-id="edit-ban-utterance-input"
                      />
                      <button
                        type="button"
                        onClick={handleAddPair}
                        disabled={!stagedUtterance.trim() || !stagedReason}
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary border border-white/10 text-header hover:bg-modifier disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shrink-0"
                        aria-label="Add offensive item"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}

                {/* ── Forum post inputs ── */}
                {stagedType === 'forum' && (
                  <>
                    <label className="text-sm font-semibold text-header mt-1">Subject</label>
                    <input
                      type="text"
                      value={stagedSubject}
                      onChange={e => setStagedSubject(e.target.value)}
                      placeholder="Post subject…"
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
                      data-test-id="edit-ban-forum-subject-input"
                    />

                    <label className="text-sm font-semibold text-header mt-1">Body</label>
                    <AutoTextarea
                      value={stagedBody}
                      onChange={e => setStagedBody(e.target.value)}
                      placeholder="Post body…"
                      rows={3}
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 leading-relaxed"
                      data-test-id="edit-ban-forum-body-input"
                    />

                    <button
                      type="button"
                      onClick={handleAddPair}
                      disabled={(!stagedSubject.trim() && !stagedBody.trim()) || !stagedReason}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-secondary border border-white/10 text-sm text-header hover:bg-modifier disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />Add this post
                    </button>
                  </>
                )}

                {/* ── Image inputs ── */}
                {stagedType === 'image' && (
                  <>
                    <label className="text-sm font-semibold text-header mt-1">Image name</label>
                    <input
                      type="text"
                      value={stagedImageName}
                      onChange={e => setStagedImageName(e.target.value)}
                      placeholder="e.g. screenshot_001"
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-header placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
                    />

                    <label className="text-sm font-semibold text-header mt-1">Assets affected</label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
                      {[0, 1, 2].map((n, idx) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setStagedAssetsAffected(n)}
                          className={`flex-1 py-1.5 transition-colors duration-100 cursor-pointer border-none ${idx > 0 ? 'border-l border-white/10' : ''} ${stagedAssetsAffected === n ? 'bg-white/10 text-header' : 'bg-secondary text-muted hover:text-header hover:bg-modifier'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    {stagedImageData ? (
                      <div className="flex flex-col gap-1.5">
                        <img src={stagedImageData} alt="Preview" className="rounded-lg border border-white/10" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted">Image ready</span>
                          <button type="button" onClick={() => setStagedImageData(null)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent p-0">Remove</button>
                        </div>
                      </div>
                    ) : !stagedContentDeleted && !stagedContentBlocked && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-secondary border border-white/10 border-dashed text-sm text-muted hover:text-header hover:bg-modifier transition-colors duration-150 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />Upload image
                      </button>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={stagedContentDeleted}
                        onChange={e => { setStagedContentDeleted(e.target.checked); if (e.target.checked) setStagedImageData(null); }}
                        className="w-4 h-4 rounded accent-white cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-header">Content Deleted</span>
                    </label>

                    {stagedReason === 'Label.Reason.AdultContent' && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={stagedContentBlocked}
                          onChange={e => { setStagedContentBlocked(e.target.checked); if (e.target.checked) { setStagedImageData(null); setStagedContentDeleted(false); } }}
                          className="w-4 h-4 rounded accent-white cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-header">Content Blocked</span>
                      </label>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStagedImageFile} />

                    <button
                      type="button"
                      onClick={handleAddPair}
                      disabled={(!stagedImageData && !stagedContentDeleted && !stagedContentBlocked) || !stagedReason}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-secondary border border-white/10 text-sm text-header hover:bg-modifier disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />Add this image
                    </button>
                  </>
                )}
              </div>

              {/* Existing pairs — each fully editable */}
              {pairs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{pairs.length} item{pairs.length !== 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      onClick={() => setPairs([])}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors duration-100 cursor-pointer border-none bg-transparent p-0"
                    >
                      Remove all
                    </button>
                  </div>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {pairs.map((p, i) => (
                      <li key={i} className="flex flex-col gap-1.5 bg-secondary border border-white/10 rounded-lg px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Item {i + 1} <span className="normal-case opacity-60">({p.type})</span></span>
                          <button
                            type="button"
                            onClick={() => handleRemovePair(i)}
                            className="flex items-center justify-center w-5 h-5 rounded text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors duration-100 cursor-pointer border-none bg-transparent shrink-0"
                            aria-label={`Remove item ${i + 1}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <select
                          value={p.reason}
                          onChange={e => setPairs(prev => prev.map((item, j) => j === i ? { ...item, reason: e.target.value } : item))}
                          className="w-full bg-base border border-white/10 rounded-lg px-2 py-1.5 text-xs text-header appearance-none focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
                        >
                          {REASON_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        {/* ── Forum pair fields ── */}
                        {p.type === 'forum' && (
                          <>
                            <input
                              type="text"
                              value={p.subject}
                              onChange={e => handleForumPairChange(i, 'subject', e.target.value)}
                              placeholder="Subject…"
                              className="w-full bg-base border border-white/10 rounded-lg px-2 py-1.5 text-xs text-header placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                            <AutoTextarea
                              value={p.body}
                              onChange={e => handleForumPairChange(i, 'body', e.target.value)}
                              placeholder="Body…"
                              rows={2}
                              className="w-full bg-base border border-white/10 rounded-lg px-2 py-1.5 text-xs text-header placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/20 leading-relaxed"
                            />
                          </>
                        )}

                        {/* ── Image pair fields ── */}
                        {p.type === 'image' && (
                          <>
                            <input
                              type="text"
                              value={p.imageName}
                              onChange={e => setPairs(prev => prev.map((item, j) => j === i ? { ...item, imageName: e.target.value } : item))}
                              className="w-full bg-base border border-white/10 rounded-lg px-2 py-1.5 text-xs text-header placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/20"
                              placeholder="Image name…"
                            />
                            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-semibold">
                              {[0, 1, 2].map((n, idx) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setPairs(prev => prev.map((item, j) => j === i ? { ...item, assetsAffected: n } : item))}
                                  className={`flex-1 py-1 transition-colors duration-100 cursor-pointer border-none ${idx > 0 ? 'border-l border-white/10' : ''} ${p.assetsAffected === n ? 'bg-white/10 text-header' : 'bg-secondary text-muted hover:text-header'}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={p.contentDeleted ?? false}
                                onChange={e => setPairs(prev => prev.map((item, j) => j === i ? { ...item, contentDeleted: e.target.checked, contentBlocked: e.target.checked ? false : item.contentBlocked, imageData: e.target.checked ? null : item.imageData } : item))}
                                className="w-3.5 h-3.5 rounded accent-white cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-header">Content Deleted</span>
                            </label>
                            {p.reason === 'Label.Reason.AdultContent' && (
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={p.contentBlocked ?? false}
                                  onChange={e => setPairs(prev => prev.map((item, j) => j === i ? { ...item, contentBlocked: e.target.checked, contentDeleted: e.target.checked ? false : item.contentDeleted, imageData: e.target.checked ? null : item.imageData } : item))}
                                  className="w-3.5 h-3.5 rounded accent-white cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-header">Content Blocked</span>
                              </label>
                            )}
                            {!p.contentDeleted && !p.contentBlocked && p.imageData && <img src={p.imageData} alt="Preview" className="rounded border border-white/10" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />}
                          </>
                        )}

                        {/* ── Text pair fields ── */}
                        {p.type === 'text' && (
                          <input
                            type="text"
                            value={p.utterance}
                            onChange={e => setPairs(prev => prev.map((item, j) => j === i ? { ...item, utterance: e.target.value } : item))}
                            className="w-full bg-base border border-white/10 rounded-lg px-2 py-1.5 text-xs text-header placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/20"
                            placeholder="Offensive item…"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </Section>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5"
            style={applyFlash
              ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
              : { background: 'white', color: 'black' }
            }
            data-test-id="edit-ban-apply-btn"
          >
            {applyFlash ? <><Check className="w-3.5 h-3.5" />Saving</> : 'Apply'}
          </button>
        </div>

      </aside>
    </div>
  );
}