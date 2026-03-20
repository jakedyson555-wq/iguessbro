// src/pages/not-approved/
// banDataService.js

// ----------------------------------------------------------------------

// Responsible solely for reading and normalising the raw ban payload
// from localStorage into a clean, typed internal shape consumed by
// useBanData. This is the stand-in for what will eventually be an
// API call. Swap loadBanPayload() for a fetch when the time comes —
// nothing else should need to change.

// INTERNAL SHAPE (NormalisedBanPayload):
// {
//   punishedUserId:            number | null
//   interventionId:            string
//   punishmentTypeDescription: string        // raw value e.g. 'Warn' | 'Delete' | 'Ban 1 Day'
//   beginDate:                 number | null  // ms timestamp
//   endDate:                   number | null  // ms timestamp
//   reviewDate:                string         // formatted display string
//   reasonKeys:                string[]       // deduplicated Label.Reason.* keys (no Other when others exist)
//   moderatorNote:             string
//   educationalStepsEnabled:   boolean
//   utterances:                string[]       // plain text offensive items (empty when unifiedViolation present)
//   unifiedViolation:          NormalisedUnifiedViolation | null
// }
//
// NormalisedUnifiedViolation:
// {
//   evidenceType:    'voice' | 'image' | 'chat' | 'unknown'
//   reasonKeys:      string[]
//   location:        string | null  // voice only
//   image:           string | null  // image only — base64
//   assetId:         string | null  // image only
//   chatEvidenceId:  string | null  // chat only — UUID
// }

// ----------------------------------------------------------------------

const LS_KEY = 'not_approved_state';

const CT_TYPES = new Set(['automated_detection', 'automated_review', 'full_automated']);

function normaliseCtType(raw) {
  const s = safeStr(raw);
  return s && CT_TYPES.has(s) ? s : null;
}

// ── String helpers ─────────────────────────────────────────────────────────

// Coerce any value to a trimmed string, returning null if empty.
function safeStr(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

// Parse an ISO date string or numeric timestamp to a ms integer, or null.
function safeDate(val) {
  if (val == null || val === '') return null;
  try {
    const ms = typeof val === 'number' ? val : Date.parse(String(val));
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

// Deduplicate an array, preserving insertion order.
function dedup(arr) {
  return [...new Set(arr)];
}

// ── Reason key normalisation ───────────────────────────────────────────────

// Accept keys already in the Label.Reason.* namespace; treat anything
// else — including null / undefined / malformed — as Other.
function normaliseReasonKey(raw) {
  const s = safeStr(raw);
  if (s && s.startsWith('Label.Reason.')) return s;
  return 'Label.Reason.Other';
}

// Extract deduplicated reason keys from an array of objects with a
// labelTranslationKey field (badUtterances or unifiedViolation items).
function extractReasonKeys(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return dedup(items.map(i => normaliseReasonKey(i?.labelTranslationKey)));
}

// Given a raw set of reason keys, return the final deduplicated list.
// 'Label.Reason.Other' is suppressed whenever at least one meaningful
// key is present; otherwise it is kept as the sole fallback.
function resolveReasonKeys(rawKeys) {
  const deduped      = dedup(rawKeys.map(normaliseReasonKey));
  const meaningful   = deduped.filter(k => k !== 'Label.Reason.Other');
  return meaningful.length > 0 ? meaningful : ['Label.Reason.Other'];
}

// ── unifiedViolation normaliser ────────────────────────────────────────────

function normaliseUnifiedViolation(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const evidenceType = safeStr(raw.evidenceType) ?? 'unknown';

  const rawKeys = Array.isArray(raw.labelTranslationKey)
    ? raw.labelTranslationKey
    : raw.labelTranslationKey != null
      ? [raw.labelTranslationKey]
      : [];

  const reasonKeys = resolveReasonKeys(rawKeys);

  const location       = evidenceType === 'voice' ? (safeStr(raw.location)                          ?? null) : null;
  const image          = evidenceType === 'image' ? (safeStr(raw.image)                             ?? null) : null;
  const assetId        = evidenceType === 'image' ? (safeStr(raw.assetId ?? raw.assetID)            ?? null) : null;
  const chatEvidenceId = evidenceType === 'chat'  ? (safeStr(raw.chatEvidenceId)                    ?? null) : null;

  return { evidenceType, reasonKeys, location, image, assetId, chatEvidenceId };
}

// ── Review date formatter ──────────────────────────────────────────────────

function formatReviewDate(ms) {
  if (ms == null) return 'Unknown date';
  try {
    const d    = new Date(ms);
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${date} at ${time}`;
  } catch {
    return 'Unknown date';
  }
}

// ── Main normaliser ────────────────────────────────────────────────────────

function normalisePayload(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // ── unifiedViolation ────────────────────────────────────────────────────
  const rawUV = Array.isArray(raw.unifiedViolation)
    ? (raw.unifiedViolation[0] ?? null)
    : (raw.unifiedViolation    ?? null);

  const unifiedViolation = normaliseUnifiedViolation(rawUV);

  const consequenceTransparencyEnabled = raw.consequenceTransparencyEnabled === true;
  const consequenceTransparencyType    = consequenceTransparencyEnabled
    ? (normaliseCtType(raw.consequenceTransparencyType) ?? null)
    : null;

  // ── Reason keys ─────────────────────────────────────────────────────────
  let rawReasonKeys;
  if (unifiedViolation && unifiedViolation.reasonKeys.length > 0) {
    rawReasonKeys = unifiedViolation.reasonKeys;
  } else if (Array.isArray(raw.badUtterances) && raw.badUtterances.length > 0) {
    rawReasonKeys = extractReasonKeys(raw.badUtterances);
  } else {
    rawReasonKeys = [];
  }

  const reasonKeys = resolveReasonKeys(rawReasonKeys);

  // ── Utterances ──────────────────────────────────────────────────────────
  // Show badUtterances when:
  //   1. No unifiedViolation in the raw payload at all, OR
  //   2. A unifiedViolation was present but failed normalisation (malformed)
  const hadRawUV    = rawUV != null;
  const uvMalformed = hadRawUV && !unifiedViolation;
  const utterances  = (!hadRawUV || uvMalformed) && Array.isArray(raw.badUtterances)
    ? raw.badUtterances.map(i => safeStr(i?.utteranceText)).filter(Boolean)
    : [];

  // ── Dates ───────────────────────────────────────────────────────────────
  const beginDate = safeDate(raw.beginDate);
  const endDate   = safeDate(raw.endDate);

  return {
    punishedUserId:            raw.punishedUserId ?? null,
    interventionId:            safeStr(raw.interventionId) ?? '',
    punishmentTypeDescription: safeStr(raw.punishmentTypeDescription) || 'Warn',
    beginDate,
    endDate,
    reviewDate:                formatReviewDate(beginDate),
    reasonKeys,
    moderatorNote:             safeStr(raw.messageToUser) ?? '',
    educationalStepsEnabled:   raw.educationalStepsEnabled === true,
    utterances,
    unifiedViolation,
    consequenceTransparencyEnabled,
    consequenceTransparencyType,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

function makePlaceholder() {
  return {
    punishedUserId:            1,
    interventionId:            crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    messageToUser:             'Placeholder',
    punishmentTypeDescription: 'Delete',
    beginDate:                 new Date().toISOString(),
    endDate:                   '',
    educationalStepsEnabled:   true,
    badUtterances:             [],
  };
}

/**
 * Load and normalise the ban payload from localStorage.
 * Returns null if nothing is stored or the payload cannot be parsed.
 * Intentionally never throws — callers treat null as "no data".
 */
export function loadBanPayload() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return normalisePayload(parsed);
      }
    }
  } catch {}

  // Nothing valid in storage — write placeholder so sidebar and modal both see it
  const placeholder = makePlaceholder();
  try { localStorage.setItem(LS_KEY, JSON.stringify(placeholder)); } catch {}
  return normalisePayload(placeholder);
}

/**
 * Persist a raw (un-normalised) ban payload to localStorage.
 * Called by EditBanSidebar's apply handler.
 */
export function saveBanPayload(raw) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(raw));
  } catch {
    // Silently swallow write errors.
  }
}