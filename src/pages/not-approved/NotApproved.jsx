// OldNotApproved.jsx

// This is the original legacy/classic Not Approved page (ban screen)
// It's enabled via an experiment and then routed via NotApproved.jsx.
// Unlike the new not approved page, this is simpler and more text-heavy,
// and is a single card on a page rather than a modal.
//
// Data is loaded via banDataService.loadBanPayload() which normalises
// the new API payload shape from localStorage. The page reloads on
// sidebar Apply so no staged/applied separation is needed here.
//
// ERROR HANDLING:
//   - Null/missing payload: same placeholder logic as new page (Delete ban, 'Placeholder' note)
//   - Malformed endDate on suspension: renders without the date, reactivation blocked
//   - Unknown reason keys: falls back to Other, suppresses reason field display
//   - Null/missing moderatorNote: renders label with empty value safely
//   - Error boundary: wraps card content, renders nothing on crash

// TODO: hide re-activation date on expired bans
// TODO: poison bans?
// TODO: membership notice
// TODO: other asset bans
// TODO: fat content deleted box glitch thing
// TODO: audio bans

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StrictMode, useState, useEffect, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../App';
import ClassicEditBanSidebar from '../../components/EditBanSidebar';
import { NotApprovedTranslations } from '../../translations/NotApprovedTranslations';
import { loadBanPayload } from '../../pages/not-approved/services/banDataService';
import '../../index.css';

// ── Translation helper ─────────────────────────────────────────────────────

function tr(key) {
  return NotApprovedTranslations[key] ?? key;
}

const rawUtteranceKeys = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('not_approved_state') ?? '{}');
    return (raw.badUtterances ?? []).map(i => i?.labelTranslationKey ?? 'Label.Reason.Other');
  } catch {
    return [];
  }
})();

const rawBadUtterances = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('not_approved_state') ?? '{}');
    return raw.badUtterances ?? [];
  } catch {
    return [];
  }
})();

// ── Duration helpers ───────────────────────────────────────────────────────

const SUSPENSION_TYPES = new Set(['Ban 1 Day', 'Ban 3 Days', 'Ban 7 Days', 'Ban 14 Days']);

function isSuspensionType(t) { return SUSPENSION_TYPES.has(t); }
function isPermanentBanType(t) { return t === 'Delete'; }
function isWarnType(t) { return t === 'Warn'; }

function getTitleKey(t) {
  const map = {
    'Warn':        'Title.Warn',
    'Ban 1 Day':   'Title.Ban1Day',
    'Ban 3 Days':  'Title.Ban3Days',
    'Ban 7 Days':  'Title.Ban7Days',
    'Ban 14 Days': 'Title.Ban14Days',
    'Delete':      'Title.Delete',
  };
  return map[t];
}

// ── Date helpers ───────────────────────────────────────────────────────────

// Format: M/D/YYYY H:MM:SS AM/PM — e.g. 3/19/2026 12:16:04 PM
function formatClassicDate(ts) {
  if (!ts || !Number.isFinite(ts)) return null;
  try {
    const d       = new Date(ts);
    const month   = d.getMonth() + 1;
    const day     = d.getDate();
    const yyyy    = d.getFullYear();
    const hours24 = d.getHours();
    const hours12 = hours24 % 12 || 12;
    const min     = String(d.getMinutes()).padStart(2, '0');
    const sec     = String(d.getSeconds()).padStart(2, '0');
    const ampm    = hours24 >= 12 ? 'PM' : 'AM';
    return `${month}/${day}/${yyyy} ${hours12}:${min}:${sec} ${ampm}`;
  } catch {
    return null;
  }
}

// ── Font injection ─────────────────────────────────────────────────────────
// index.css forces Inter via !important on *, so we inject a <style> tag at
// runtime which is always last in the document and wins the cascade.

const FONT_STYLE_ID = 'classic-nap-font-override';
if (!document.getElementById(FONT_STYLE_ID)) {

  // Inject the Google Fonts <link> directly so the bundler can't drop it
  if (!document.getElementById('classic-nap-font-link')) {
    const link = document.createElement('link');
    link.id   = 'classic-nap-font-link';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }

  const style = document.createElement('style');
  style.id = FONT_STYLE_ID;
  style.textContent = `
    [data-test-id="classic-not-approved-card"],
    [data-test-id="classic-not-approved-card"] * {
      font-family: 'Source Sans Pro', sans-serif !important;
      line-height: 1.4em !important;
    }
    [data-test-id="classic-not-approved-title"] {
      letter-spacing: -1px !important;
      display: inline-block !important;
      transform-origin: left center !important;
    }
    [data-test-id="not-approved-reactivate-button"],
    [data-test-id="not-approved-logout-button"] {
      font-family: 'Source Sans Pro', sans-serif !important;
      font-size: 13.3px !important;
      color: #000000 !important;
      background-color: #ececec !important;
      border: 1px solid #a0a0a0 !important;
      border-radius: 3px !important;
      padding: 1px 8px !important;
      min-width: 60px !important;
      text-align: center !important;
      display: inline-block !important;
    }
    [data-test-id="not-approved-reactivate-button"]:hover,
    [data-test-id="not-approved-logout-button"]:hover {
      background-color: #e0e0e0 !important;
    }
    [data-test-id="not-approved-reactivate-button"]:active,
    [data-test-id="not-approved-logout-button"]:active {
      background-color: #d0d0d0 !important;
    }
    [data-test-id="classic-not-approved-agree-checkbox"] {
      appearance: checkbox !important;
      -webkit-appearance: checkbox !important;
      width: 13px !important;
      height: 13px !important;
      border: 1px solid #a0a0a0 !important;
      background-color: #ffffff !important;
      color-scheme: light !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
    }
    main#main-content {
      background-color: #ffffff !important;
    }
    footer[data-test-id="footer"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

// ── Error boundary ─────────────────────────────────────────────────────────

class CardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { caught: false };
  }

  static getDerivedStateFromError() {
    return { caught: true };
  }

  componentDidCatch(error, info) {
    console.error('[ClassicNotApproved] Card error caught by boundary:', error, info);
  }

  render() {
    if (this.state.caught) return null;
    return this.props.children;
  }
}

// ── Main card component ────────────────────────────────────────────────────

function ClassicNotApprovedCard({
  onLogout = () => { window.location.href = '/login'; },
}) {
  const payload = loadBanPayload();

  const pType        = payload?.punishmentTypeDescription ?? null;
  const endDate      = payload?.endDate ?? null;
  const beginDate    = payload?.beginDate ?? null;
  const reasonKeys   = payload?.reasonKeys ?? [];
  const moderatorNote = payload?.moderatorNote ?? null;
  const utterances   = payload?.utterances ?? [];

  const reviewDate       = formatClassicDate(beginDate) ?? 'Unknown date';
  const endDateValid     = Number.isFinite(endDate);
  const reactivationDate = endDateValid ? formatClassicDate(endDate) : null;

  const meaningful = reasonKeys.filter(k => k !== 'Label.Reason.Other');
  const allOther   = meaningful.length === 0;
  const safeNote   = typeof moderatorNote === 'string' ? moderatorNote : '';

  // ── All hooks above any early return ─────────────────────────────────────

  const [remaining, setRemaining] = useState(
    () => (isSuspensionType(pType) && endDateValid) ? Math.max(0, endDate - Date.now()) : 0
  );

  useEffect(() => {
    if (!isSuspensionType(pType) || !endDateValid) return;
    const id = setInterval(() => {
      const next = endDate - Date.now();
      if (next <= 0) { clearInterval(id); setRemaining(0); return; }
      setRemaining(next);
    }, 1000);
    return () => clearInterval(id);
  }, [pType, endDate, endDateValid]);

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(id);
  }, []);

  const [agreed,            setAgreed]            = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [logoutLoading,     setLogoutLoading]     = useState(false);

  // ── Early return after all hooks ──────────────────────────────────────────
  if (!payload) return null;

  const suspensionExpired  = isSuspensionType(pType) && endDateValid && remaining <= 0;
  const showReactivationUI = isWarnType(pType) || suspensionExpired;
  const showActiveBanLine  = isSuspensionType(pType);
  const showAppealLine     = !isWarnType(pType) && !suspensionExpired;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleReactivate = () => {
    if (!agreed || reactivateLoading) return;
    setReactivateLoading(true);
    setTimeout(() => { window.location.href = '/'; }, 1200);
  };

  const handleLogout = () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setTimeout(() => { onLogout(); }, 1500);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const ts = { fontSize: '14px', fontWeight: 500, color: '#343434' };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: '562px',
        backgroundColor: '#ffffff',
        border: '1px solid #000000',
        padding: '30px',
        color: '#343434',
        fontFamily: "'Source Sans Pro', sans-serif",
      }}
      className="mx-auto mt-10 mb-10 flex flex-col gap-3"
      data-test-id="classic-not-approved-card"
    >
      {/* Title */}
      <div
        style={{ fontSize: '30px', fontWeight: 500, color: '#343434' }}
        data-test-id="classic-not-approved-title"
      >
        {tr(getTitleKey(pType))}
      </div>

      {/* Intro — varies by ban type */}
      <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-description">
        {isPermanentBanType(pType) ? tr('Description.IntroTerminate') : tr('Description.IntroStandard')}
      </div>

      {/* Review date */}
      <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-description">
        {tr('Label.Reviewed')}{' '}
        <span style={{ fontWeight: 600, color: '#222222' }}>{revealed ? reviewDate : ''}</span>
      </div>

      {/* Moderator note — label always shown, value may be empty */}
      {revealed && safeNote.length > 0 && (
      <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-description">
        {tr('Label.ModeratorNote')}{' '}
        <span style={{ fontWeight: 600, color: '#222222' }}>
          {safeNote.split('\n').map((line, i) =>
            line === '' ? <br key={i} /> : <span key={i}>{line}</span>
          )}
        </span>
      </div>
    )}

      {/* Classic text/image offensive items — each pair in its own box, no horizontal margin */}
      {utterances.length > 0 && (() => {
        const KNOWN_REASON_KEYS = new Set([
          'Label.Reason.Harassment',
          'Label.Reason.Scamming',
          'Label.Reason.Spam',
          'Label.Reason.AdultContent',
          'Label.Reason.Profanity',
          'Label.Reason.Inappropriate',
          'Label.Reason.Privacy',
        ]);
        return (
          <div className="flex flex-col gap-[6px]">
            {utterances.map((item, i) => {
              const rawItem    = rawBadUtterances[i] ?? {};
              const isImage    = !!rawItem.imageData || rawItem.contentDeleted || rawItem.contentBlocked;
              const itemKey    = rawUtteranceKeys[i] ?? '';
              const itemReason = (itemKey && KNOWN_REASON_KEYS.has(itemKey) && NotApprovedTranslations[itemKey])
                ? NotApprovedTranslations[itemKey]
                : tr('Label.Reason.Other');

              return (
                <div
                  key={i}
                  className="border border-color-muted flex flex-col"
                  style={{ fontSize: '14px', fontWeight: 500, padding: '10px', color: '#343434', boxSizing: 'content-box' }}
                  data-test-id="classic-not-approved-bad-utterances-section"
                >
                  <div data-test-id="classic-not-approved-bad-utterance-pair" className="flex flex-col gap-0.75">
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#222222' }} data-test-id="classic-not-approved-reason-item">
                      {tr('Label.Reason')}{' '}
                      <span style={{ fontWeight: 500, color: '#343434' }}>{revealed ? itemReason : ''}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#222222' }} data-test-id="classic-not-approved-reason-item">
                      {tr('Label.OffensiveItem')}
                    </div>
                    {isImage ? (
                      rawItem.contentBlocked ? (
                        <div style={{ display: 'flex', justifyContent: 'center',  padding: '12px' }}>
                          <img
                            src="/assets/Content_Blocked.png"
                            alt="[ Content Blocked ]"
                            style={{ width: '150px', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '10px 30px' }} className="flex flex-col">
                          <span style={{ fontWeight: 600, textAlign: 'center', color: '#343434' }}>{rawItem.imageName || 'Image'}</span>
                          <span style={{ fontWeight: 500, color: '#343434' }}>
                            If moderated, {rawItem.assetsAffected ?? 0} assets will be affected
                          </span>
                          <img
                            src={rawItem.contentDeleted ? '/assets/Content_Deleted.png' : rawItem.imageData}
                            alt="Image"
                            className="object-contain object-left"
                            style={{ marginTop: '16px', maxWidth: rawItem.contentDeleted ? '250px' : '400px', maxHeight: rawItem.contentDeleted ? '250px' : '300px', fontWeight: 500, color: '#343434' }}
                          />
                        </div>
                      )
                    ) : (
                      <span style={{ fontWeight: 500, color: '#343434', padding: '8px 30px 10px 30px' }}>{revealed ? item : ''}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Community guidelines, suppressed on permanent ban */}
      {!isPermanentBanType(pType) && (
        <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-description">
          {tr('Description.GuidelinesInfo.Before')}{' '}
          <a href="/community-standards" className="text-link-classic">
            {tr('Label.CommunityGuidelines')}
          </a>
          {' '}{tr('Description.GuidelinesInfo.After')}
        </div>
      )}

      {/* Active suspension line, omit date if endDate is malformed */}
      {showActiveBanLine && (() => {
        const banDescKey = {
          'Ban 1 Day':   'Description.Ban1Day',
          'Ban 3 Days':  'Description.Ban3Days',
          'Ban 7 Days':  'Description.Ban7Days',
          'Ban 14 Days': 'Description.Ban14Days',
        }[pType] ?? 'Description.Ban1Day';
        return (
          <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-ban-description">
            {tr(banDescKey)}
            {reactivationDate && revealed ? ` ${reactivationDate}.` : '.'}
          </div>
        );
      })()}

      {/* Permanent ban line */}
      {isPermanentBanType(pType) && (
        <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-ban-description">
          {tr('Description.Delete')}
        </div>
      )}

      
      {showAppealLine && (
        <div style={{ ...ts, paddingLeft: '10px', paddingRight: '10px' }} data-test-id="classic-not-approved-appeal-item">
          If you wish to appeal, please send an email to{' '} 
          <a href="mailto:appeals@boiby.dev" className="text-link-classic">
             appeals@boiby.dev
          </a>
          .
        </div>
      )}
 
      {/* Appeal line — hidden on warns and expired temp bans 
      {showAppealLine && (
        <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-appeal-item">
          {tr('Description.Appeal')}{' '}
          <a href="/support" className="text-link-classic">
            {tr('Label.SupportForm')}
          </a>
          .
        </div> 
      )}*/}

      {/* Reactivation UI */}
      {showReactivationUI && (
        <>
          <div style={{ ...ts, paddingLeft: '12px', paddingRight: '12px' }} data-test-id="classic-not-approved-description">
            {tr('Description.Reactivate')}{' '}
            <a href="/terms" className="text-link-classic">
              {tr('Label.TermsOfService')}
            </a>
            .
          </div>

          <div
            style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', marginTop: '12px' }}
            data-test-id="classic-not-approved-agree-label"
          >
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', fontWeight: 500, color: '#343434' }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                data-test-id="classic-not-approved-agree-checkbox"
                style={{ cursor: 'pointer' }}
              />
              {tr('Label.IAgree')}
            </label>
          </div>

          <button
            type="button"
            onClick={handleReactivate}
            disabled={!agreed || reactivateLoading}
            data-test-id="not-approved-reactivate-button"
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              cursor: agreed && !reactivateLoading ? 'pointer' : 'not-allowed',
              opacity: agreed ? 1 : 0.45,
            }}
          >
            {reactivateLoading ? <ThreeDee /> : tr('Action.ReactivateAccount')}
          </button>
        </>
      )}

      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutLoading}
        data-test-id="not-approved-logout-button"
        style={{
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: showReactivationUI ? '0px' : '4px',
          marginBottom: '6px',
          cursor: logoutLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {logoutLoading ? <ThreeDee /> : tr('Action.Logout')}
      </button>

    </div>
  );
}

// ── Page wrapper with error boundary ──────────────────────────────────────

function ClassicNotApprovedContent({ onLogout }) {
  return (
    <>
      <ClassicEditBanSidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none pb-4 transition-all duration-200 min-w-0"
        style={{ backgroundColor: '#ffffff' }}
      >
        <CardErrorBoundary>
          <ClassicNotApprovedCard onLogout={onLogout} />
        </CardErrorBoundary>
      </main>
    </>
  );
}

// ─── Entry ────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('not-approved-root')).render(
  <StrictMode>
    <App>
      <BrowserRouter>
        <Routes>
          <Route path="/not-approved" element={<ClassicNotApprovedContent />} />
        </Routes>
      </BrowserRouter>
    </App>
  </StrictMode>
);