import { starterWords } from "./wordTools.js";

const storageKey = "zaydan-spelling-account-v1";
const defaultWordSetVersion = "colonial-america-worksheet-v1";
const startingBalance = 8;
const accountAdjustments = [
  {
    id: "parent-debit-2026-05-03-64-79",
    amount: -64.79,
    reason: "Parent account adjustment"
  }
];
const legacyStarterWords = [
  "planet",
  "garden",
  "window",
  "bright",
  "pencil",
  "rocket",
  "silver",
  "castle",
  "button",
  "thunder"
];

export const emptyAccount = {
  profileName: "Zaydan",
  balance: startingBalance,
  wordsAttempted: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  defaultWordSetVersion,
  words: {}
};

export function buildInitialAccount() {
  return starterWords.reduce(
    (account, word) => {
      account.words[word] = createWordRecord();
      return account;
    },
    {
      ...emptyAccount,
      accountAdjustments: accountAdjustments.map((adjustment) => ({
        ...adjustment,
        appliedAt: null,
        markedAppliedOnNewAccount: true
      })),
      words: {}
    }
  );
}

export function createWordRecord() {
  return {
    attempts: 0,
    correct: 0,
    letterRewards: 0,
    mastered: false,
    lastSeenAt: null
  };
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeAccount(saved, words) {
  return {
    ...emptyAccount,
    ...saved,
    balance: money(saved.balance),
    words
  };
}

function applyAccountAdjustments(account) {
  const appliedAdjustments = Array.isArray(account.accountAdjustments)
    ? account.accountAdjustments
    : [];
  const appliedIds = new Set(appliedAdjustments.map((adjustment) => adjustment.id));
  const missingAdjustments = accountAdjustments.filter((adjustment) => !appliedIds.has(adjustment.id));

  if (!missingAdjustments.length) return account;

  const appliedAt = new Date().toISOString();
  const balanceDelta = missingAdjustments.reduce((total, adjustment) => total + adjustment.amount, 0);

  return {
    ...account,
    balance: money(account.balance + balanceDelta),
    accountAdjustments: [
      ...appliedAdjustments,
      ...missingAdjustments.map((adjustment) => ({
        ...adjustment,
        appliedAt
      }))
    ]
  };
}

function persistIfAdjusted(before, after) {
  if (before !== after) {
    saveAccount(after);
  }
  return after;
}

export function loadAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved?.profileName) return buildInitialAccount();
    const savedWords = saved.words || {};
    const savedWordList = Object.keys(savedWords);
    const hasNoWords = savedWordList.length === 0;
    const onlyHasLegacyStarterWords =
      savedWordList.length === legacyStarterWords.length
      && savedWordList.every((word) => legacyStarterWords.includes(word));
    const needsCurrentDefaults =
      saved.defaultWordSetVersion !== defaultWordSetVersion
      || hasNoWords
      || onlyHasLegacyStarterWords;

    if (needsCurrentDefaults) {
      const account = {
        ...normalizeAccount(saved, buildInitialAccount().words),
        defaultWordSetVersion,
      };
      return persistIfAdjusted(account, applyAccountAdjustments(account));
    }

    const normalizedAccount = normalizeAccount(saved, savedWords);
    const account = applyAccountAdjustments(normalizedAccount);
    persistIfAdjusted(normalizedAccount, account);

    return account;
  } catch {
    return buildInitialAccount();
  }
}

export function saveAccount(account) {
  localStorage.setItem(storageKey, JSON.stringify(account, null, 2));
}

export function exportAccount(account) {
  return JSON.stringify(account, null, 2);
}
