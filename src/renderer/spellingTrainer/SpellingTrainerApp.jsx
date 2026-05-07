import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  BadgeDollarSign,
  Download,
  FileScan,
  Flame,
  Headphones,
  Keyboard,
  PartyPopper,
  QrCode,
  RotateCcw,
  RefreshCw,
  Shuffle,
  Sparkles,
  Star,
  Upload,
  Volume2,
  Wifi
} from "lucide-react";
import {
  buildAccountForWords,
  buildInitialAccount,
  createPracticedWordRecord,
  createWordRecord,
  exportAccount,
  loadAccount,
  saveAccount
} from "./account.js";
import { requestAiWorksheetOcr } from "./aiOcrClient.js";
import { chooseWorksheetOcrAction } from "./ocrActions.js";
import { getUploadServerBase } from "./uploadServer.js";
import { defaultWorksheetText, extractWorksheetData, formatMoney, scrambleWord, starterWords } from "./wordTools.js";
import { loadLearningProfile, recordEducationEarning, saveLearningProfile } from "../services/education/PlayerLearningProfile.ts";
import AccessibleText from "../components/accessibility/AccessibleText.jsx";
import DyslexiaSettingsPanel from "../components/accessibility/DyslexiaSettingsPanel.jsx";
import LetterTile from "../components/accessibility/LetterTile.jsx";
import { useAccessibility } from "../accessibility/accessibilityHooks.js";
import HandwritingCanvas from "../handwriting/components/HandwritingCanvas.jsx";
import WritingRewardCard from "../handwriting/components/WritingRewardCard.jsx";
import { resetHandwritingProgress } from "../handwriting/engine/adaptiveHandwritingEngine.js";
import { evaluateHandwritingAttempt } from "../handwriting/engine/handwritingEngine.js";
import {
  buildSharedProfile,
  buildSpellingContentFromList,
  getActiveSpellingList,
  getProfileSyncKey,
  pullSharedProfile,
  pushSharedProfile,
  setProfileSyncKey as saveProfileSyncKey
} from "../services/profileSyncClient.js";
import "./styles.css";

const letterReward = 0.02;
const wordReward = 0.5;
const audioWordReward = 1;
const strictTypingMode = false;
const spellingStatsStorageKey = "bikebrowser.spellingReadingStats";

function loadSpellingReadingStats() {
  const defaults = {
    accuracy: { attempts: 0, correct: 0 },
    speed: { correctUnderThreshold: 0, avgMs: 0 },
    streak: 0,
    bestStreak: 0,
    confusableLetterSuccess: { b: 0, d: 0, p: 0, q: 0 }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(spellingStatsStorageKey) || "{}");
    return {
      ...defaults,
      ...stored,
      accuracy: { ...defaults.accuracy, ...(stored.accuracy || {}) },
      speed: { ...defaults.speed, ...(stored.speed || {}) },
      confusableLetterSuccess: { ...defaults.confusableLetterSuccess, ...(stored.confusableLetterSuccess || {}) }
    };
  } catch {
    return defaults;
  }
}

function saveSpellingReadingStats(stats) {
  localStorage.setItem(spellingStatsStorageKey, JSON.stringify(stats));
  return stats;
}

function explainOcrError(error) {
  if (!error) return "OCR stopped without returning an error. Try rotating the photo or uploading a clearer image.";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.error) return String(error.error);

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to the generic message.
  }

  return "OCR could not read this file. Try rotating it, retaking the photo with better lighting, or pasting the words manually.";
}

export default function SpellingTrainerApp() {
  const initialAccount = useMemo(() => loadAccount(), []);
  const initialEducationProfile = useMemo(() => {
    const profile = loadLearningProfile();
    const spellingDollars = Math.max(profile.earnings?.spellingDollars || 0, Number(initialAccount.balance || 0));
    const earnings = {
      ...profile.earnings,
      spellingDollars,
      totalDollars: Number((spellingDollars + (profile.earnings?.multiplicationDollars || 0)).toFixed(2))
    };
    const nextProfile = { ...profile, earnings };
    saveLearningProfile(nextProfile);
    return nextProfile;
  }, [initialAccount.balance]);
  const [account, setAccount] = useState(initialAccount);
  const [educationProfile, setEducationProfile] = useState(initialEducationProfile);
  const [wordList, setWordList] = useState(() => Object.keys(initialAccount.words));
  const [mode, setMode] = useState("scramble");
  const [wordIndex, setWordIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [letterBank, setLetterBank] = useState([]);
  const [selectedBankIndex, setSelectedBankIndex] = useState(null);
  const [feedback, setFeedback] = useState("Choose a tile, then place it into the matching slot.");
  const [lastEarned, setLastEarned] = useState(null);
  const [handwritingResult, setHandwritingResult] = useState(null);
  const [handwritingMode, setHandwritingMode] = useState("trace-word");
  const { profile: accessibilityProfile, updateProfile: updateAccessibilityProfile } = useAccessibility();
  const [readingStats, setReadingStats] = useState(() => loadSpellingReadingStats());
  const [typedWord, setTypedWord] = useState("");
  const [rawInput, setRawInput] = useState(defaultWorksheetText);
  const [extractionInfo, setExtractionInfo] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [wifiUpload, setWifiUpload] = useState({ status: "Checking Wi-Fi upload server..." });
  const [pendingWorksheet, setPendingWorksheet] = useState(null);
  const [syncKey, setSyncKey] = useState(() => getProfileSyncKey());
  const [syncStatus, setSyncStatus] = useState(() => syncKey ? "Cloud sync ready." : "Cloud sync is off on this device.");
  const processedUploadId = useRef(null);
  const syncHydratedRef = useRef(false);
  const syncPushTimerRef = useRef(null);
  const dictationInputRef = useRef({
    previousValue: "",
    lastInputAt: 0,
    firstInputAt: 0,
    suspiciousCount: 0,
    assistSuspected: false
  });
  const uploadServerBase = useMemo(() => getUploadServerBase(), []);

  const currentWord = wordList[wordIndex] || "";
  const currentRecord = account.words[currentWord] || createWordRecord();
  const isMastered = currentRecord.correct >= 3 || currentRecord.mastered;
  const masteredCount = Object.values(account.words).filter((record) => record.mastered || record.correct >= 3).length;
  const practicedDictionary = Object.values(account.practicedWords || {})
    .sort((a, b) => (b.lastPracticedAt || "").localeCompare(a.lastPracticedAt || ""));
  const practicedDictionaryCount = practicedDictionary.length;
  const accuracy = account.wordsAttempted ? Math.round((account.correctAnswers / account.wordsAttempted) * 100) : 100;
  const confusableSuccessCount = Object.values(readingStats.confusableLetterSuccess || {}).reduce((sum, value) => sum + value, 0);
  const sessionProgress = Math.round(((wordIndex + 1) / Math.max(wordList.length, 1)) * 100);

  useEffect(() => {
    saveAccount(account);
  }, [account]);

  useEffect(() => {
    saveSpellingReadingStats(readingStats);
  }, [readingStats]);

  useEffect(() => {
    return () => {
      if (syncPushTimerRef.current) window.clearTimeout(syncPushTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromCloud() {
      if (!syncKey) {
        syncHydratedRef.current = false;
        setSyncStatus("Cloud sync is off on this device.");
        return;
      }

      setSyncStatus("Checking shared Zaydan profile...");
      try {
        const result = await pullSharedProfile({ syncKey });
        if (cancelled) return;

        if (result.ok && result.profile) {
          applySharedProfile(result.profile);
          syncHydratedRef.current = true;
          setSyncStatus(`Synced from cloud ${formatSyncTime(result.profile.updatedAt)}.`);
          return;
        }

        if (result.status === "missing") {
          const profile = buildSharedProfile({ spellingAccount: account, educationProfile, wordList, rawInput });
          const saved = await pushSharedProfile(profile, { syncKey });
          if (!cancelled) {
            syncHydratedRef.current = true;
            setSyncStatus(saved.ok ? "Created shared Zaydan profile in cloud." : saved.error);
          }
          return;
        }

        syncHydratedRef.current = true;
        setSyncStatus(result.error || "Cloud sync could not load; using this device cache.");
      } catch (error) {
        if (!cancelled) {
          syncHydratedRef.current = true;
          setSyncStatus(`Cloud sync unavailable; using this device. ${error.message || ""}`.trim());
        }
      }
    }

    hydrateFromCloud();
    return () => {
      cancelled = true;
    };
  }, [syncKey]);

  useEffect(() => {
    if (!syncKey || !syncHydratedRef.current) return;
    if (syncPushTimerRef.current) window.clearTimeout(syncPushTimerRef.current);

    syncPushTimerRef.current = window.setTimeout(async () => {
      const profile = buildSharedProfile({ spellingAccount: account, educationProfile, wordList, rawInput });
      try {
        const result = await pushSharedProfile(profile, { syncKey });
        setSyncStatus(result.ok ? `Saved to cloud ${formatSyncTime(result.profile.updatedAt)}.` : result.error);
      } catch (error) {
        setSyncStatus(`Cloud save failed; local progress is safe. ${error.message || ""}`.trim());
      }
    }, 700);
  }, [account, educationProfile, wordList, rawInput, syncKey]);

  useEffect(() => {
    resetPuzzle(currentWord);
  }, [currentWord]);

  useEffect(() => {
    return () => {
      if (pendingWorksheet?.previewUrl) URL.revokeObjectURL(pendingWorksheet.previewUrl);
    };
  }, [pendingWorksheet?.previewUrl]);

  useEffect(() => {
    let stopped = false;

    async function loadUploadInfo() {
      if (!uploadServerBase) {
        setWifiUpload({
          connected: false,
          status: "Use OCR File on this device, or paste words below."
        });
        return;
      }

      try {
        const response = await fetch(`${uploadServerBase}/api/info`);
        const info = await response.json();
        if (!stopped) {
          setWifiUpload({
            connected: true,
            status: "Scan the QR code with your iPhone.",
            ...info
          });
        }
      } catch {
        if (!stopped) {
          setWifiUpload({
            connected: false,
            status: "Start the upload server to enable iPhone worksheet uploads."
          });
        }
      }
    }

    loadUploadInfo();
    const interval = window.setInterval(loadUploadInfo, 5000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [uploadServerBase]);

  useEffect(() => {
    if (!wifiUpload.latestUpload?.id || processedUploadId.current === wifiUpload.latestUpload.id) return;

    processedUploadId.current = wifiUpload.latestUpload.id;
    importUploadedWorksheet(wifiUpload.latestUpload);
  }, [wifiUpload.latestUpload]);

  function resetPuzzle(word = currentWord) {
    if (!word) {
      setSlots([]);
      setLetterBank([]);
      return;
    }
    const scrambled = scrambleWord(word);
    setSlots(Array.from({ length: word.length }, () => null));
    setLetterBank(scrambled.split("").map((letter, index) => ({ id: `${letter}-${index}-${Date.now()}`, letter, used: false })));
    setSelectedBankIndex(null);
    setTypedWord("");
    resetDictationIntegrity();
    setFeedback(isMastered ? "Mastery mode: finish the word for the big reward." : "Early learning: correct letters earn 2 cents.");
  }

  function updateAccountForResult(word, isCorrect, reward, letterRewarded = 0, options = {}) {
    recordSharedSpellingReward(reward);
    setAccount((current) => {
      const record = current.words[word] || createWordRecord();
      const nextCorrect = record.correct + (isCorrect ? 1 : 0);
      const nextStreak = isCorrect && !options.disableStreak ? current.currentStreak + 1 : 0;
      const practicedRecord = current.practicedWords?.[word] || createPracticedWordRecord(word);
      const practicedAt = new Date().toISOString();
      return {
        ...current,
        balance: Number((current.balance + reward).toFixed(2)),
        wordsAttempted: current.wordsAttempted + 1,
        correctAnswers: current.correctAnswers + (isCorrect ? 1 : 0),
        currentStreak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        words: {
          ...current.words,
          [word]: {
            ...record,
            attempts: record.attempts + 1,
            correct: nextCorrect,
            letterRewards: record.letterRewards + letterRewarded,
            mastered: nextCorrect >= 3,
            lastSeenAt: new Date().toISOString()
          }
        },
        practicedWords: {
          ...(current.practicedWords || {}),
          [word]: {
            ...practicedRecord,
            word,
            attempts: practicedRecord.attempts + 1,
            correct: practicedRecord.correct + (isCorrect ? 1 : 0),
            firstPracticedAt: practicedRecord.firstPracticedAt || practicedAt,
            lastPracticedAt: practicedAt
          }
        }
      };
    });
  }

  function recordSharedSpellingReward(reward) {
    if (!reward) return;
    setEducationProfile((current) => {
      const updated = recordEducationEarning(current, "spelling", reward);
      saveLearningProfile(updated);
      return updated;
    });
  }

  function awardSpellingHandwriting(result) {
    const reward = Number((result.scoring.finalRewardScore * 0.05).toFixed(2));
    recordSharedSpellingReward(reward);
    setAccount((current) => ({
      ...current,
      balance: Number((current.balance + reward).toFixed(2))
    }));
    setHandwritingResult(result);
    setLastEarned(`${formatMoney(reward)} handwriting reward`);
    setFeedback(`${result.feedback} Handwriting practice strengthens spelling memory.`);
  }

  function handleSpellingHandwritingSubmit(strokes) {
    awardSpellingHandwriting(evaluateHandwritingAttempt({
      strokes,
      target: currentWord[0] || "b",
      mode: handwritingMode,
    }));
  }

  function handleResetHandwritingProgress() {
    resetHandwritingProgress();
    setHandwritingResult(null);
    setFeedback("Handwriting progress reset.");
  }

  function updateReadingStats({ correct, letter = "", elapsedMs = 0 }) {
    const normalizedLetter = letter.toLowerCase();
    setReadingStats((current) => {
      const nextAttempts = current.accuracy.attempts + 1;
      const nextCorrect = current.accuracy.correct + (correct ? 1 : 0);
      const nextStreak = correct ? current.streak + 1 : 0;
      const nextSpeedCount = correct && elapsedMs > 0 && elapsedMs < 2500
        ? current.speed.correctUnderThreshold + 1
        : current.speed.correctUnderThreshold;
      const nextSpeedAvg = elapsedMs > 0
        ? Math.round(((current.speed.avgMs || 0) * current.accuracy.attempts + elapsedMs) / nextAttempts)
        : current.speed.avgMs;
      const nextConfusable = { ...current.confusableLetterSuccess };

      if (correct && Object.prototype.hasOwnProperty.call(nextConfusable, normalizedLetter)) {
        nextConfusable[normalizedLetter] += 1;
      }

      return {
        ...current,
        accuracy: { attempts: nextAttempts, correct: nextCorrect },
        speed: { correctUnderThreshold: nextSpeedCount, avgMs: nextSpeedAvg },
        streak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        confusableLetterSuccess: nextConfusable
      };
    });
  }

  function handlePreserveCapitalBDChange(event) {
    updateAccessibilityProfile({ preserveCapitalBD: event.target.checked });
  }

  function applySharedProfile(profile) {
    const activeSpellingList = getActiveSpellingList(profile);

    if (profile.spellingAccount?.profileName) {
      setAccount(profile.spellingAccount);
      saveAccount(profile.spellingAccount);
      const nextWords = activeSpellingList?.words?.length
        ? activeSpellingList.words
        : Object.keys(profile.spellingAccount.words || {});
      setWordList(nextWords);
      setWordIndex(0);
    } else if (activeSpellingList?.words?.length) {
      setWordList(activeSpellingList.words);
      setWordIndex(0);
    }

    if (profile.educationProfile?.profileName) {
      setEducationProfile(profile.educationProfile);
      saveLearningProfile(profile.educationProfile);
    }

    if (activeSpellingList?.rawInput) {
      setRawInput(activeSpellingList.rawInput);
    } else if (typeof profile.rawInput === "string" && profile.rawInput) {
      setRawInput(profile.rawInput);
    }
  }

  function formatSyncTime(value) {
    if (!value) return "now";
    try {
      return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "now";
    }
  }

  async function handleSyncKeySave(nextKey) {
    const normalized = saveProfileSyncKey(nextKey);
    setSyncKey(normalized);
    setSyncStatus(normalized ? "Connecting this device to shared profile..." : "Cloud sync is off on this device.");
  }

  async function handleManualSync() {
    if (!syncKey) {
      setSyncStatus("Enter the parent sync key first.");
      return;
    }

    setSyncStatus("Refreshing shared profile...");
    try {
      const result = await pullSharedProfile({ syncKey });
      if (result.ok && result.profile) {
        applySharedProfile(result.profile);
        setSyncStatus(`Synced from cloud ${formatSyncTime(result.profile.updatedAt)}.`);
      } else {
        setSyncStatus(result.error || "No cloud profile found yet.");
      }
    } catch (error) {
      setSyncStatus(`Cloud sync failed. ${error.message || ""}`.trim());
    }
  }

  async function sendCurrentListToCloud() {
    if (!wordList.length) {
      setOcrStatus("Load words first, then send them to the tablet.");
      return;
    }

    if (!syncKey) {
      setSyncStatus("Enter the parent sync key first.");
      setOcrStatus("Cloud sync is off. Save the parent sync key before sending words to the tablet.");
      return;
    }

    const spellingContent = buildSpellingContentFromList({
      words: wordList,
      rawInput,
      title: `${account.profileName || "Zaydan"} spelling list`,
    });
    const profile = buildSharedProfile({
      spellingAccount: account,
      educationProfile,
      wordList,
      rawInput,
      spellingContent,
      updatedBy: "parent-spelling-control",
    });

    setSyncStatus(`Sending ${wordList.length} words to shared profile...`);
    try {
      const result = await pushSharedProfile(profile, { syncKey });
      if (result.ok) {
        setSyncStatus(`Sent ${wordList.length} words to cloud ${formatSyncTime(result.profile.updatedAt)}.`);
        setOcrStatus(`Sent ${wordList.length} spelling words to Zaydan's tablet. Tap Sync Now on the tablet if it is already open.`);
      } else {
        setSyncStatus(result.error);
        setOcrStatus(result.error || "Could not send this spelling list yet.");
      }
    } catch (error) {
      setSyncStatus(`Cloud send failed. ${error.message || ""}`.trim());
      setOcrStatus(`Cloud send failed. ${error.message || ""}`.trim());
    }
  }

  function addWords(words) {
    const cleanWords = [...new Set(words.map((word) => word.toLowerCase()).filter(Boolean))];
    if (!cleanWords.length) return;
    setWordList(cleanWords);
    setWordIndex(0);
    setAccount((current) => {
      const nextWords = { ...current.words };
      cleanWords.forEach((word) => {
        nextWords[word] ||= createWordRecord();
      });
      return { ...current, words: nextWords };
    });
    setFeedback(`Loaded ${cleanWords.length} spelling words.`);
  }

  function removeWord(wordToRemove) {
    setWordList((current) => {
      const nextWords = current.filter((word) => word !== wordToRemove);
      if (!nextWords.length) {
        setFeedback("Keep at least one word in the practice list.");
        return current;
      }

      setWordIndex((currentIndex) => Math.min(currentIndex, nextWords.length - 1));
      setFeedback(`Removed ${wordToRemove} from this practice list.`);
      return nextWords;
    });
  }

  function clearPracticeWords() {
    setWordList([]);
    setWordIndex(0);
    setSlots([]);
    setLetterBank([]);
    setFeedback("Cleared the practice list. Load words from OCR or text to start again.");
  }

  function loadTextWords() {
    const extraction = extractWorksheetData(rawInput);
    setExtractionInfo(extraction);
    addWords(extraction.words);
    setOcrStatus(`Detected ${extraction.words.length} words using ${extraction.strategy}.`);
  }

  async function handleFile(file) {
    if (!file) return;
    prepareWorksheet(file, "File picker");
  }

  function prepareWorksheet(file, source) {
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    const worksheet = {
      file,
      source,
      rotation: 0,
      previewUrl,
      name: file.name
    };
    setPendingWorksheet((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return worksheet;
    });
    setMode("words");
    setOcrProgress(0);
    setOcrStatus(`${file.name} is ready. Rotate it if needed, then run OCR.`);
    return worksheet;
  }

  async function processPendingWorksheet() {
    if (!pendingWorksheet?.file) return false;
    setOcrStatus(`Reading ${pendingWorksheet.name}...`);
    setOcrProgress(0);
    try {
      const result = await extractWithRotationFallback(pendingWorksheet);
      setRawInput(result.rawText);
      setExtractionInfo(result.extraction);
      addWords(result.words);
      if (result.words.length === 0) {
        setOcrStatus("OCR ran, but no spelling words matched the worksheet patterns. Check the extracted text below, rotate/retake the photo, or paste the word list.");
      } else if (result.words.length < 6) {
        setOcrStatus(`OCR ran in ${result.ocrMode} mode, but only found ${result.words.length} likely spelling words. Check the extracted text below before starting.`);
      } else {
        setOcrStatus(`Found ${result.words.length} spelling words using ${result.extraction.strategy} (${result.ocrMode} mode).`);
      }
      return result.words.length > 0;
    } catch (error) {
      setOcrStatus(`OCR needs a clearer file or text paste. ${explainOcrError(error)}`);
      return false;
    }
  }

  async function processPendingWorksheetWithChandra(worksheet = pendingWorksheet) {
    if (!worksheet?.file) return false;
    setOcrStatus(`Running local Chandra OCR on ${worksheet.name}...`);
    setOcrProgress(8);

    try {
      if (!uploadServerBase) {
        throw new Error("Advanced OCR is available only from the local BikeBrowser upload server.");
      }

      const fileForUpload = await prepareFileForAdvancedOcr(worksheet);
      const body = new FormData();
      body.append("file", fileForUpload, fileForUpload.name || worksheet.name);
      body.append("rotation", String(worksheet.rotation));

      const response = await fetch(`${uploadServerBase}/api/chandra-ocr`, {
        method: "POST",
        body
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Chandra OCR request failed.");
      }

      const extraction = extractWorksheetData(payload.text || "");
      setRawInput(payload.text || "");
      setExtractionInfo(extraction);
      addWords(extraction.words);
      setOcrProgress(100);

      if (extraction.words.length) {
        const provider = payload.provider === "local" ? "local Chandra" : "Chandra fallback";
        setOcrStatus(`${provider} found ${extraction.words.length} spelling words using ${extraction.strategy}.`);
      } else {
        setOcrStatus("Chandra OCR returned text, but no spelling words matched yet. Check the extracted text below.");
      }
      return extraction.words.length > 0;
    } catch (error) {
      setOcrProgress(0);
      setOcrStatus(`Advanced OCR is not ready. ${explainOcrError(error)}`);
      return false;
    }
  }

  async function processPendingWorksheetWithAi(worksheet = pendingWorksheet) {
    if (!worksheet?.file) return false;
    if (!worksheet.file.type.startsWith("image/")) return false;

    setOcrStatus(`Trying AI OCR on ${worksheet.name}...`);
    setOcrProgress(12);

    try {
      const payload = await requestAiWorksheetOcr({ worksheet });
      if (!payload.success || !payload.words.length) {
        setOcrStatus("AI OCR is not available yet. Falling back to local OCR on this device...");
        setOcrProgress(0);
        return false;
      }

      const rawText = payload.rawText || payload.words.join("\n");
      const extraction = extractWorksheetData(rawText);
      const words = extraction.words.length ? extraction.words : payload.words;
      const displayExtraction = extraction.words.length ? extraction : { ...extraction, words, chosenLines: words };
      const provider = payload.provider === "openai"
        ? "OpenAI"
        : payload.provider === "deepseek"
          ? "DeepSeek"
          : payload.provider === "thaura"
            ? "Thaura"
            : "AI OCR";

      setRawInput(rawText);
      setExtractionInfo(displayExtraction);
      addWords(words);
      setOcrProgress(100);
      setOcrStatus(`${provider} found ${words.length} spelling words. Review the extracted text below before starting.`);
      return true;
    } catch (error) {
      setOcrProgress(0);
      setOcrStatus(`AI OCR is not available yet. ${explainOcrError(error)} Falling back to local OCR...`);
      return false;
    }
  }

  async function runBestAvailableWorksheetOcr() {
    if (await processPendingWorksheetWithAi()) {
      return;
    }

    const action = chooseWorksheetOcrAction({ advancedConnected: Boolean(wifiUpload.connected) });
    if (action === "advanced") {
      if (await processPendingWorksheetWithChandra()) {
        return;
      }
      setOcrStatus("Advanced OCR did not find enough words. Falling back to basic OCR on this device...");
    }

    await processPendingWorksheet();
  }

  async function prepareFileForAdvancedOcr(worksheet) {
    if (!worksheet.file.type.startsWith("image/") || worksheet.rotation === 0) {
      return worksheet.file;
    }

    const image = await createImageBitmap(worksheet.file);
    const normalized = ((worksheet.rotation % 360) + 360) % 360;
    const sideways = normalized === 90 || normalized === 270;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = sideways ? image.height : image.width;
    canvas.height = sideways ? image.width : image.height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((normalized * Math.PI) / 180);
    context.drawImage(image, -image.width / 2, -image.height / 2);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
    return new File([blob], worksheet.name.replace(/\.[^.]+$/, "-rotated.jpg"), { type: "image/jpeg" });
  }

  async function extractWithRotationFallback(worksheet) {
    const { extractWordsFromFile } = await import("./ocr.js");
    const rotations = [
      worksheet.rotation,
      ...[0, 90, 180, 270].filter((rotation) => rotation !== worksheet.rotation)
    ];
    let bestResult = null;

    for (let index = 0; index < rotations.length; index += 1) {
      const rotation = rotations[index];
      setOcrStatus(`Reading ${worksheet.name} at ${rotation} degrees...`);
      const result = await extractWordsFromFile(
        worksheet.file,
        (progress) => {
          const rotationOffset = index * 25;
          setOcrProgress(Math.min(99, rotationOffset + Math.round(progress / 4)));
        },
        { rotation }
      );

      result.rotation = rotation;
      if (!bestResult || scoreExtraction(result) > scoreExtraction(bestResult)) {
        bestResult = result;
      }

      if (result.words.length >= 12) break;
    }

    setPendingWorksheet((current) => current ? { ...current, rotation: bestResult.rotation } : current);
    setOcrProgress(100);
    return bestResult;
  }

  function scoreExtraction(result) {
    const confidence = result.extraction.scoredLines
      ?.filter((line) => line.score >= 3)
      .reduce((total, line) => total + line.score + line.words.length, 0) || 0;

    return result.words.length * 10 + confidence;
  }

  function rotatePendingWorksheet(delta) {
    setPendingWorksheet((current) => {
      if (!current) return current;
      return {
        ...current,
        rotation: (current.rotation + delta + 360) % 360
      };
    });
  }

  async function importUploadedWorksheet(upload) {
    setMode("words");
    setOcrStatus(`Received ${upload.originalName}. Running local Chandra OCR...`);
    setOcrProgress(0);
    try {
      const response = await fetch(upload.url);
      const blob = await response.blob();
      const file = new File([blob], upload.originalName, { type: upload.mimeType || blob.type });
      const worksheet = prepareWorksheet(file, "iPhone upload");
      await processPendingWorksheetWithChandra(worksheet);
    } catch (error) {
      setOcrStatus(`Phone upload arrived, but the app could not open it. ${explainOcrError(error)}`);
    }
  }

  function placeLetter(slotIndex, bankIndex = selectedBankIndex) {
    if (bankIndex === null || letterBank[bankIndex]?.used) return;
    const tile = letterBank[bankIndex];
    const wasCorrect = tile.letter === currentWord[slotIndex];
    const nextSlots = [...slots];
    const nextBank = [...letterBank];
    const replacedTile = nextSlots[slotIndex];

    if (replacedTile) {
      const replacedBankIndex = nextBank.findIndex((bankTile) => bankTile.id === replacedTile.id);
      if (replacedBankIndex >= 0) {
        nextBank[replacedBankIndex] = { ...nextBank[replacedBankIndex], used: false };
      }
    }

    nextSlots[slotIndex] = { ...tile, correct: wasCorrect };
    nextBank[bankIndex] = { ...tile, used: true };
    setSlots(nextSlots);
    setLetterBank(nextBank);
    setSelectedBankIndex(null);

    if (wasCorrect && !isMastered) {
      setLastEarned("+2 cents");
      setFeedback("Correct letter. Nice placement.");
      updateAccountForLetter(currentWord);
      updateReadingStats({ correct: true, letter: tile.letter });
    } else if (wasCorrect) {
      setFeedback("Correct letter. Finish the whole word for the reward.");
      updateReadingStats({ correct: true, letter: tile.letter });
    } else {
      setFeedback("Close. That letter belongs somewhere else.");
      updateReadingStats({ correct: false, letter: currentWord[slotIndex] });
    }

    const completed = nextSlots.every(Boolean);
    if (completed) {
      const solved = nextSlots.map((slot) => slot.letter).join("");
      window.setTimeout(() => finishScramble(solved === currentWord), 250);
    }
  }

  function updateAccountForLetter(word) {
    recordSharedSpellingReward(letterReward);
    setAccount((current) => ({
      ...current,
      balance: Number((current.balance + letterReward).toFixed(2)),
      words: {
        ...current.words,
        [word]: {
          ...(current.words[word] || createWordRecord()),
          letterRewards: ((current.words[word] || createWordRecord()).letterRewards || 0) + 1
        }
      }
    }));
  }

  function removeSlot(slotIndex) {
    const slot = slots[slotIndex];
    if (!slot) return;
    setSlots((current) => current.map((item, index) => (index === slotIndex ? null : item)));
    setLetterBank((current) => current.map((tile) => (tile.id === slot.id ? { ...tile, used: false } : tile)));
  }

  function finishScramble(isCorrect) {
    if (isCorrect) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.62 } });
      setLastEarned("+50 cents");
      setFeedback(`${currentWord} is correct. Big word reward earned.`);
      updateAccountForResult(currentWord, true, wordReward, 0);
      window.setTimeout(nextWord, 900);
    } else {
      setFeedback("Good try. Some letters need to move.");
      updateAccountForResult(currentWord, false, 0, 0);
    }
  }

  function nextWord() {
    if (!wordList.length) return;
    setWordIndex((current) => (current + 1) % wordList.length);
  }

  function speakWord(word = currentWord) {
    if (!window.speechSynthesis) {
      setFeedback("This browser does not support speech yet.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = buildUtterance(word, { rate: 0.78, pitch: 1.04 });
    window.speechSynthesis.speak(utterance);
  }

  function speakSpelling(word = currentWord) {
    if (!window.speechSynthesis) {
      setFeedback("This browser does not support speech yet.");
      return;
    }

    const letters = word
      .split("")
      .map((letter) => (letter === "-" ? "hyphen" : letter.toUpperCase()));

    window.speechSynthesis.cancel();
    [
      buildUtterance(`The word is ${word}.`, { rate: 0.72, pitch: 1.03 }),
      buildUtterance(`${word} is spelled.`, { rate: 0.72, pitch: 1.03 }),
      ...letters.map((letter) => buildUtterance(letter, { rate: 0.52, pitch: 1.08 })),
      buildUtterance(word, { rate: 0.74, pitch: 1.04 })
    ].forEach((utterance) => window.speechSynthesis.speak(utterance));
  }

  function buildUtterance(text, options = {}) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.voice = getPreferredVoice();
    utterance.rate = 0.78;
    utterance.pitch = 1.04;
    utterance.volume = 1;
    Object.assign(utterance, options);
    return utterance;
  }

  function getPreferredVoice() {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return voices.find((voice) => /aria|jenny|guy|zira|david|google us english/i.test(voice.name))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-us"))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"))
      || null;
  }

  function checkDictation() {
    const guess = normalizeDictationAnswer(typedWord);
    const isCorrect = guess === currentWord;
    const scoring = scoreDictationAttempt(isCorrect);
    if (isCorrect) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      setLastEarned(`+$${scoring.reward.toFixed(2)}`);
      setFeedback(scoring.feedback || `Correct. ${currentWord} is spelled perfectly.`);
      updateReadingStats({ correct: true, elapsedMs: scoring.elapsedMs });
      updateAccountForResult(currentWord, true, scoring.reward, 0, { disableStreak: scoring.disableStreak });
      window.setTimeout(nextWord, 900);
    } else {
      setFeedback("Not quite. Replay the word and try again.");
      updateReadingStats({ correct: false });
      updateAccountForResult(currentWord, false, 0, 0);
    }
  }

  function normalizeDictationAnswer(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z-]/g, "");
  }

  function handleDictationChange(event) {
    const after = event.target.value;
    const before = dictationInputRef.current.previousValue;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsed = dictationInputRef.current.lastInputAt ? now - dictationInputRef.current.lastInputAt : Infinity;
    const insertedLength = Math.max(0, after.length - before.length);
    const insertedText = getInsertedText(before, after);
    const normalizedAfter = normalizeDictationAnswer(after);
    const fullWordInstantly = !before && normalizedAfter === currentWord && currentWord.length > 2;
    const hasUnexpectedCharacters = /[\s.,!?;:"()[\]{}]/.test(insertedText);
    const suspicious = insertedLength > 2 || fullWordInstantly || hasUnexpectedCharacters;

    if (suspicious) {
      dictationInputRef.current.assistSuspected = true;
      dictationInputRef.current.suspiciousCount += 1;
      setFeedback(strictTypingMode ? "Try typing it one letter at a time." : "Please type the word yourself.");

      if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        console.debug("Suspicious dictation insertion", {
          insertedLength,
          elapsed,
          before,
          after,
          insertedText
        });
      }
    }

    dictationInputRef.current.previousValue = after;
    if (!dictationInputRef.current.firstInputAt && after) {
      dictationInputRef.current.firstInputAt = now;
    }
    dictationInputRef.current.lastInputAt = now;
    setTypedWord(after);
  }

  function getInsertedText(before, after) {
    let prefix = 0;
    while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;

    let suffix = 0;
    while (
      suffix < before.length - prefix
      && suffix < after.length - prefix
      && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
    ) {
      suffix += 1;
    }

    return after.slice(prefix, after.length - suffix);
  }

  function resetDictationIntegrity() {
    dictationInputRef.current = {
      previousValue: "",
      lastInputAt: 0,
      firstInputAt: 0,
      suspiciousCount: 0,
      assistSuspected: false
    };
  }

  function scoreDictationAttempt(isCorrect) {
    if (!isCorrect) {
      return { reward: 0, accuracyScore: 0, speedScore: 0, integrityBonus: 0 };
    }

    const { assistSuspected, suspiciousCount, firstInputAt } = dictationInputRef.current;
    const elapsedMs = firstInputAt ? Date.now() - firstInputAt : 0;
    const accuracyScore = 1;
    const speedScore = elapsedMs > 0 && elapsedMs < 2500 ? 1 : 0;
    const integrityBonus = assistSuspected ? 0 : 1;
    const rewardMultiplier = strictTypingMode && assistSuspected
      ? 0
      : assistSuspected
        ? Math.max(0.25, 0.65 - Math.max(0, suspiciousCount - 1) * 0.15)
        : 1;
    const reward = Number((audioWordReward * accuracyScore * rewardMultiplier).toFixed(2));

    return {
      reward,
      accuracyScore,
      speedScore,
      elapsedMs,
      integrityBonus,
      disableStreak: strictTypingMode ? assistSuspected : suspiciousCount > 1,
      feedback: assistSuspected
        ? strictTypingMode
          ? "Correct word, but rewards need one-letter-at-a-time typing."
          : `Correct word. Reduced reward this time; type ${currentWord} one letter at a time for full credit.`
        : ""
    };
  }

  function downloadAccount() {
    const blob = new Blob([exportAccount(account)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zaydan-account.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetAccount() {
    const next = buildInitialAccount();
    setAccount((current) => ({ ...next, practicedWords: current.practicedWords || {} }));
    setWordList(starterWords);
    setWordIndex(0);
    setRawInput(defaultWorksheetText);
    setFeedback("Account reset. Default worksheet words are ready.");
  }

  function resetSessionProgress() {
    const resetWords = wordList.length ? wordList : starterWords;
    const next = buildAccountForWords(resetWords, account.profileName, account.practicedWords || {});
    setAccount(next);
    setWordList(resetWords);
    setWordIndex(0);
    setSlots([]);
    setLetterBank([]);
    setSelectedBankIndex(null);
    setTypedWord("");
    resetDictationIntegrity();
    setLastEarned(null);
    setFeedback(`Reset progress and balance for ${resetWords.length} loaded words.`);
  }

  const weakWords = useMemo(
    () =>
      Object.entries(account.words)
        .filter(([, record]) => record.attempts > record.correct)
        .sort((a, b) => b[1].attempts - b[1].correct - (a[1].attempts - a[1].correct))
        .slice(0, 5),
    [account.words]
  );

  return (
    <div className="spelling-trainer-scope">
    <main className="app-shell">
      <header className="topbar">
        <div className="profile-chip">
          <div className="avatar">Z</div>
          <div>
            <p>Profile</p>
            <strong>{account.profileName}</strong>
          </div>
        </div>
        <div className="stat-row">
          <StatusCard icon={<BadgeDollarSign />} label="Balance" value={formatMoney(account.balance)} />
          <StatusCard icon={<Flame />} label="Streak" value={`${account.currentStreak} correct`} />
          <StatusCard icon={<Star />} label="Mastered" value={`${masteredCount} words`} />
          <StatusCard icon={<Sparkles />} label="b/d/p/q wins" value={`${confusableSuccessCount}`} />
          <StatusCard icon={<BadgeDollarSign />} label="All earned" value={formatMoney(educationProfile.earnings?.totalDollars || account.balance)} />
          <StatusCard icon={<Keyboard />} label="Dictionary" value={`${practicedDictionaryCount} words`} />
        </div>
      </header>

      <section className="progress-wrap">
        <span>Session progress</span>
        <div className="progress-track">
          <div style={{ width: `${sessionProgress}%` }} />
        </div>
        <strong>{sessionProgress}%</strong>
        <button type="button" onClick={resetSessionProgress} disabled={!wordList.length}>
          <RotateCcw size={16} /> Reset Session
        </button>
      </section>

      <nav className="mode-tabs">
        <button type="button" className={mode === "scramble" ? "active" : ""} onClick={() => setMode("scramble")}>
          <Shuffle size={18} /> Scramble
        </button>
        <button type="button" className={mode === "audio" ? "active" : ""} onClick={() => { setMode("audio"); speakWord(); }}>
          <Headphones size={18} /> Audio
        </button>
        <button type="button" className={mode === "write" ? "active" : ""} onClick={() => setMode("write")}>
          <Keyboard size={18} /> Write
        </button>
        <button type="button" className={mode === "words" ? "active" : ""} onClick={() => setMode("words")}>
          <FileScan size={18} /> Words
        </button>
        <button type="button" className={mode === "dashboard" ? "active" : ""} onClick={() => setMode("dashboard")}>
          <Sparkles size={18} /> Dashboard
        </button>
      </nav>

      <section className="content-grid">
        <section className="game-panel">
          {mode === "scramble" && (
            wordList.length ? (
              <ScrambleMode
                word={currentWord}
                record={currentRecord}
                isMastered={isMastered}
                slots={slots}
                letterBank={letterBank}
                selectedBankIndex={selectedBankIndex}
                setSelectedBankIndex={setSelectedBankIndex}
                placeLetter={placeLetter}
                removeSlot={removeSlot}
                resetPuzzle={() => resetPuzzle()}
                nextWord={nextWord}
                preserveCapitalBD={accessibilityProfile.preserveCapitalBD}
              />
            ) : (
              <EmptyWordsNotice setMode={setMode} />
            )
          )}

          {mode === "audio" && (
            wordList.length ? (
              <AudioMode
                typedWord={typedWord}
                onTypedWordChange={handleDictationChange}
                speakWord={speakWord}
                speakSpelling={speakSpelling}
                checkDictation={checkDictation}
                nextWord={nextWord}
              />
            ) : (
              <EmptyWordsNotice setMode={setMode} />
            )
          )}

          {mode === "write" && (
            wordList.length ? (
              <WritingMode
                word={currentWord}
                handwritingMode={handwritingMode}
                setHandwritingMode={setHandwritingMode}
                handwritingResult={handwritingResult}
                onSubmit={handleSpellingHandwritingSubmit}
                onResetProgress={handleResetHandwritingProgress}
                speakWord={speakWord}
                nextWord={nextWord}
              />
            ) : (
              <EmptyWordsNotice setMode={setMode} />
            )
          )}

          {mode === "words" && (
            <WordsMode
              rawInput={rawInput}
              setRawInput={setRawInput}
              loadTextWords={loadTextWords}
              handleFile={handleFile}
              ocrStatus={ocrStatus}
              ocrProgress={ocrProgress}
              wordList={wordList}
              wifiUpload={wifiUpload}
              pendingWorksheet={pendingWorksheet}
              rotatePendingWorksheet={rotatePendingWorksheet}
              processPendingWorksheet={processPendingWorksheet}
              runBestAvailableWorksheetOcr={runBestAvailableWorksheetOcr}
              extractionInfo={extractionInfo}
              removeWord={removeWord}
              clearPracticeWords={clearPracticeWords}
              resetSessionProgress={resetSessionProgress}
              sendCurrentListToCloud={sendCurrentListToCloud}
              canSendToCloud={Boolean(syncKey && wordList.length)}
            />
          )}

          {mode === "dashboard" && (
            <Dashboard
              account={account}
              accuracy={accuracy}
              weakWords={weakWords}
              practicedDictionary={practicedDictionary}
              downloadAccount={downloadAccount}
              resetAccount={resetAccount}
              resetSessionProgress={resetSessionProgress}
            />
          )}
        </section>

        <aside className="side-panel">
          <SyncPanel
            syncKey={syncKey}
            syncStatus={syncStatus}
            onSaveKey={handleSyncKeySave}
            onManualSync={handleManualSync}
          />
          <div className="feedback-card">
            <PartyPopper size={22} />
            <p>{feedback}</p>
            {lastEarned && <strong>{lastEarned}</strong>}
          </div>
          <div className="word-card">
            <span>Current word</span>
            <strong>{mode === "audio" ? "Listen first" : currentWord}</strong>
            <p>{isMastered ? "Mastered: word rewards only" : "Learning: letter rewards active"}</p>
          </div>
          <label className="reading-toggle">
            <input
              type="checkbox"
              checked={accessibilityProfile.preserveCapitalBD}
              onChange={handlePreserveCapitalBDChange}
            />
            <span>Use capital B/D for easier distinction</span>
          </label>
          <DyslexiaSettingsPanel compact />
          <div className="rules-card">
            <h2>Rewards</h2>
            <p>Correct letter: $0.02 before mastery.</p>
            <p>Scramble word: $0.50.</p>
            <p>Typed audio word: $1.00.</p>
            <p>Speed bonuses only count after a correct answer.</p>
            <p>b/d/p/q success is tracked separately.</p>
            <p>Mastered: 3 correct completions.</p>
          </div>
        </aside>
      </section>
    </main>
    </div>
  );
}

function SyncPanel({ syncKey, syncStatus, onSaveKey, onManualSync }) {
  const [draftKey, setDraftKey] = useState(syncKey || "");

  useEffect(() => {
    setDraftKey(syncKey || "");
  }, [syncKey]);

  return (
    <div className="sync-card">
      <div>
        <span>Shared profile</span>
        <strong>{syncKey ? "Cloud sync on" : "Cloud sync off"}</strong>
        <p>{syncStatus}</p>
      </div>
      <input
        value={draftKey}
        onChange={(event) => setDraftKey(event.target.value)}
        placeholder="Parent sync key"
        aria-label="Parent sync key"
      />
      <div className="control-row">
        <button type="button" onClick={() => onSaveKey(draftKey)}>
          <Wifi size={18} /> Save Key
        </button>
        <button type="button" className="quiet" onClick={onManualSync} disabled={!syncKey}>
          Sync Now
        </button>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value }) {
  return (
    <div className="status-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyWordsNotice({ setMode }) {
  return (
    <section className="empty-words">
      <FileScan size={48} />
      <h1>No words loaded</h1>
      <p>Load a worksheet, run OCR, or paste a spelling list to start practicing.</p>
      <button type="button" onClick={() => setMode("words")}>
        <Upload size={18} /> Load Words
      </button>
    </section>
  );
}

function ScrambleMode({ word, record, isMastered, slots, letterBank, selectedBankIndex, setSelectedBankIndex, placeLetter, removeSlot, resetPuzzle, nextWord, preserveCapitalBD }) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Word scramble</p>
          <h1>{isMastered ? "Mastery round" : "Build the word"}</h1>
        </div>
        <div className="stars" aria-label={`${record.correct} correct completions`}>
          {[0, 1, 2].map((index) => (
            <Star key={index} size={22} className={record.correct > index ? "filled" : ""} />
          ))}
        </div>
      </div>

      <div className="slots" style={{ gridTemplateColumns: `repeat(${word.length}, minmax(36px, 1fr))` }}>
        {slots.map((slot, index) => (
          <button
            type="button"
            key={`${word}-${index}`}
            className={`slot ${slot?.correct ? "correct" : slot ? "wrong" : ""}`}
            onClick={() => (slot ? removeSlot(index) : placeLetter(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const bankIndex = Number(event.dataTransfer.getData("text/plain"));
              placeLetter(index, bankIndex);
            }}
          >
            {slot?.letter ? <AccessibleText text={slot.letter} isolatedTile preserveCapitalBD={preserveCapitalBD} /> : ""}
          </button>
        ))}
      </div>

      <div className="letter-bank">
        {letterBank.map((tile, index) => (
          <LetterTile
            key={tile.id}
            draggable={!tile.used}
            letter={tile.letter}
            selected={selectedBankIndex === index}
            disabled={tile.used}
            onClick={() => setSelectedBankIndex(index)}
            onDragStart={(event) => {
              setSelectedBankIndex(index);
              event.dataTransfer.setData("text/plain", String(index));
            }}
          />
        ))}
      </div>

      <div className="control-row">
        <button type="button" onClick={resetPuzzle}><RefreshCw size={18} /> Reshuffle</button>
        <button type="button" onClick={nextWord}>Skip</button>
      </div>
    </>
  );
}

function AudioMode({ typedWord, onTypedWordChange, speakWord, speakSpelling, checkDictation, nextWord }) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Audio spelling</p>
          <h1>Listen, then type</h1>
        </div>
        <button type="button" className="speak-button" onClick={() => speakWord()}>
          <Headphones size={22} /> Play Word
        </button>
      </div>
      <div className="audio-actions">
        <button type="button" onClick={() => speakWord()}>
          <Volume2 size={18} /> Say Word
        </button>
        <button type="button" onClick={() => speakSpelling()}>
          <Sparkles size={18} /> Spell It
        </button>
      </div>
      <input
        className="dictation-input"
        value={typedWord}
        onChange={onTypedWordChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") checkDictation();
        }}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="text"
        placeholder="Type the word you hear"
      />
      <p className="dictation-helper"><Keyboard size={16} /> Hear it {"->"} think it {"->"} type it</p>
      <div className="control-row">
        <button type="button" onClick={checkDictation}><Keyboard size={18} /> Check</button>
        <button type="button" onClick={() => speakWord()}><Headphones size={18} /> Repeat</button>
        <button type="button" onClick={() => speakSpelling()}><Sparkles size={18} /> Spell</button>
        <button type="button" onClick={nextWord}>Skip</button>
      </div>
    </>
  );
}

function WritingMode({
  word,
  handwritingMode,
  setHandwritingMode,
  handwritingResult,
  onSubmit,
  onResetProgress,
  speakWord,
  nextWord,
}) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Write it</p>
          <h1>Handwriting practice</h1>
        </div>
        <button type="button" className="speak-button" onClick={() => speakWord()}>
          <Headphones size={22} /> Hear word
        </button>
      </div>
      <div className="handwriting-mode-tabs">
        {[
          ["trace-word", "Trace word"],
          ["copy-word", "Copy word"],
          ["memory-word", "Write from memory"],
          ["hear-word", "Hear word"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={handwritingMode === id ? "active" : ""}
            onClick={() => setHandwritingMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <HandwritingCanvas
        target={word}
        mode={handwritingMode}
        title="Spelling handwriting"
        onSubmit={onSubmit}
      />
      <WritingRewardCard result={handwritingResult} onResetProgress={onResetProgress} />
      <div className="control-row">
        <button type="button" onClick={() => speakWord()}><Headphones size={18} /> Repeat word</button>
        <button type="button" className="quiet" onClick={nextWord}>Next word</button>
      </div>
    </>
  );
}

function WordsMode({
  rawInput,
  setRawInput,
  loadTextWords,
  handleFile,
  ocrStatus,
  ocrProgress,
  wordList,
  wifiUpload,
  pendingWorksheet,
  rotatePendingWorksheet,
  processPendingWorksheet,
  runBestAvailableWorksheetOcr,
  extractionInfo,
  removeWord,
  clearPracticeWords,
  resetSessionProgress,
  sendCurrentListToCloud,
  canSendToCloud
}) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Worksheet to game</p>
          <h1>Load spelling words</h1>
        </div>
      </div>
      <section className="wifi-card">
        <div>
          <p><Wifi size={18} /> Wi-Fi upload</p>
          <h2>Scan from iPhone</h2>
          <span>{wifiUpload.status}</span>
          {wifiUpload.uploadUrl && <a href={wifiUpload.uploadUrl} target="_blank" rel="noreferrer">{wifiUpload.uploadUrl}</a>}
          {wifiUpload.latestUpload && (
            <strong>Latest: {wifiUpload.latestUpload.originalName}</strong>
          )}
        </div>
        <div className="qr-frame">
          {wifiUpload.qrDataUrl ? (
            <img src={wifiUpload.qrDataUrl} alt="QR code for worksheet upload" />
          ) : (
            <QrCode size={76} />
          )}
        </div>
      </section>
      <textarea value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
      <div className="control-row">
        <button type="button" onClick={loadTextWords}><Upload size={18} /> Use Text</button>
        <button type="button" className="quiet" onClick={sendCurrentListToCloud} disabled={!canSendToCloud}>
          <Wifi size={18} /> Send to Tablet
        </button>
        <label className="file-button">
          <FileScan size={18} /> OCR File
          <input type="file" accept="image/*,.pdf,application/pdf" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
      </div>
      {pendingWorksheet && (
        <section className="review-card">
          <div className="review-preview">
            {pendingWorksheet.previewUrl ? (
              <img
                src={pendingWorksheet.previewUrl}
                alt="Worksheet preview"
                style={{ transform: `rotate(${pendingWorksheet.rotation}deg)` }}
              />
            ) : (
              <FileScan size={72} />
            )}
          </div>
          <div className="review-actions">
            <p>{pendingWorksheet.source}</p>
            <h2>{pendingWorksheet.name}</h2>
            <span>Rotation: {pendingWorksheet.rotation} degrees</span>
            <div className="control-row">
              <button type="button" className="quiet" onClick={() => rotatePendingWorksheet(270)}>
                <RotateCcw size={18} /> Left
              </button>
              <button type="button" className="quiet" onClick={() => rotatePendingWorksheet(90)}>
                <RefreshCw size={18} /> Right
              </button>
              <button type="button" onClick={runBestAvailableWorksheetOcr}>
                <Sparkles size={18} /> Run OCR
              </button>
              <button type="button" className="quiet" onClick={processPendingWorksheet}>
                <FileScan size={18} /> Basic OCR
              </button>
            </div>
          </div>
        </section>
      )}
      {ocrStatus && (
        <div className="ocr-status">
          <span>{ocrStatus}</span>
          <div><i style={{ width: `${ocrProgress}%` }} /></div>
        </div>
      )}
      {extractionInfo && (
        <section className="extraction-card">
          <div>
            <p>Detected instructions</p>
            {extractionInfo.instructions.length ? (
              extractionInfo.instructions.slice(0, 4).map((line) => <span key={line}>{line}</span>)
            ) : (
              <span>No instruction line detected.</span>
            )}
          </div>
          <div>
            <p>Word source</p>
            <strong>{extractionInfo.strategy}</strong>
            {extractionInfo.chosenLines.slice(0, 5).map((line) => <span key={line}>{line}</span>)}
          </div>
          <div>
            <p>Detected words</p>
            <strong>{extractionInfo.words.length} words</strong>
            {extractionInfo.words.slice(0, 12).map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </section>
      )}
      <div className="word-list-toolbar">
        <strong>{wordList.length} loaded words</strong>
        <button type="button" className="quiet" onClick={sendCurrentListToCloud} disabled={!canSendToCloud}>
          <Wifi size={18} /> Send to Tablet
        </button>
        <button type="button" className="quiet" onClick={resetSessionProgress} disabled={!wordList.length}>
          <RotateCcw size={18} /> Reset Progress
        </button>
        <button type="button" className="quiet danger" onClick={clearPracticeWords} disabled={!wordList.length}>
          Delete All
        </button>
      </div>
      <div className="loaded-words">
        {wordList.map((word) => (
          <button
            type="button"
            className="word-chip removable"
            key={word}
            onClick={() => removeWord(word)}
            title={`Remove ${word}`}
          >
            <span>{word}</span>
            <b aria-hidden="true">x</b>
          </button>
        ))}
      </div>
    </>
  );
}

function Dashboard({ account, accuracy, weakWords, practicedDictionary, downloadAccount, resetAccount, resetSessionProgress }) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Progress dashboard</p>
          <h1>{account.profileName}&apos;s account</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <div><span>Total earned</span><strong>{formatMoney(account.balance)}</strong></div>
        <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
        <div><span>Best streak</span><strong>{account.bestStreak}</strong></div>
        <div><span>Attempts</span><strong>{account.wordsAttempted}</strong></div>
      </div>
      <h2>Words to practice</h2>
      <div className="loaded-words">
        {(weakWords.length ? weakWords : Object.entries(account.words).slice(0, 8)).map(([word, record]) => (
          <span key={word}>{word}: {record.correct}/3</span>
        ))}
      </div>
      <h2>Practice dictionary</h2>
      <div className="loaded-words dictionary-list">
        {practicedDictionary.length ? (
          practicedDictionary.slice(0, 40).map((record) => (
            <span key={record.word}>
              {record.word}: {record.correct}/{record.attempts}
            </span>
          ))
        ) : (
          <span>No practiced words yet.</span>
        )}
      </div>
      <div className="control-row">
        <button type="button" onClick={downloadAccount}><Download size={18} /> Export JSON</button>
        <button type="button" className="quiet" onClick={resetSessionProgress}>Reset Current List</button>
        <button type="button" className="quiet" onClick={resetAccount}>Reset Default Words</button>
      </div>
    </>
  );
}

