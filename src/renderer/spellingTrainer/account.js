import { starterWords } from "./wordTools.js";

const storageKey = "zaydan-spelling-account-v1";
const defaultWordSetVersion = "colonial-america-worksheet-v1";
export const startingBalance = 8;
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
  words: {},
  practicedWords: {}
};

export function buildInitialAccount() {
  return starterWords.reduce(
    (account, word) => {
      account.words[word] = createWordRecord();
      return account;
    },
    { ...emptyAccount, words: {} }
  );
}

export function buildAccountForWords(words, profileName = emptyAccount.profileName, practicedWords = {}) {
  const cleanWords = [...new Set(words.map((word) => word.toLowerCase()).filter(Boolean))];
  return cleanWords.reduce(
    (account, word) => {
      account.words[word] = createWordRecord();
      return account;
    },
    { ...emptyAccount, profileName, balance: startingBalance, words: {}, practicedWords }
  );
}

export function createPracticedWordRecord(word) {
  return {
    word,
    attempts: 0,
    correct: 0,
    firstPracticedAt: null,
    lastPracticedAt: null
  };
}

export function buildPracticedWordsFromAccount(account) {
  const practicedWords = { ...(account.practicedWords || {}) };
  Object.entries(account.words || {}).forEach(([word, record]) => {
    if (!record.attempts && !record.correct && !record.lastSeenAt) return;
    practicedWords[word] = {
      ...createPracticedWordRecord(word),
      ...practicedWords[word],
      word,
      attempts: Math.max(practicedWords[word]?.attempts || 0, record.attempts || 0),
      correct: Math.max(practicedWords[word]?.correct || 0, record.correct || 0),
      firstPracticedAt: practicedWords[word]?.firstPracticedAt || record.lastSeenAt || null,
      lastPracticedAt: practicedWords[word]?.lastPracticedAt || record.lastSeenAt || null
    };
  });
  return practicedWords;
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
      const practicedWords = buildPracticedWordsFromAccount({ ...saved, words: savedWords });
      return {
        ...emptyAccount,
        ...saved,
        balance: Math.max(Number(saved.balance || 0), startingBalance),
        defaultWordSetVersion,
        words: buildInitialAccount().words,
        practicedWords
      };
    }

    const account = {
      ...emptyAccount,
      ...saved,
      balance: Math.max(Number(saved.balance || 0), startingBalance),
      words: savedWords,
      practicedWords: buildPracticedWordsFromAccount({ ...saved, words: savedWords })
    };

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
