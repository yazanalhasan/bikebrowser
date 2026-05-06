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
import { buildInitialAccount, createWordRecord, exportAccount, loadAccount, saveAccount } from "./account.js";
import { chooseWorksheetOcrAction } from "./ocrActions.js";
import { getUploadServerBase } from "./uploadServer.js";
import { defaultWorksheetText, extractWorksheetData, formatMoney, scrambleWord, starterWords } from "./wordTools.js";
import "./styles.css";

const letterReward = 0.02;
const wordReward = 0.5;
const audioWordReward = 1;

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
  const [account, setAccount] = useState(initialAccount);
  const [wordList, setWordList] = useState(() => Object.keys(initialAccount.words));
  const [mode, setMode] = useState("scramble");
  const [wordIndex, setWordIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [letterBank, setLetterBank] = useState([]);
  const [selectedBankIndex, setSelectedBankIndex] = useState(null);
  const [feedback, setFeedback] = useState("Choose a tile, then place it into the matching slot.");
  const [lastEarned, setLastEarned] = useState(null);
  const [typedWord, setTypedWord] = useState("");
  const [rawInput, setRawInput] = useState(defaultWorksheetText);
  const [extractionInfo, setExtractionInfo] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [wifiUpload, setWifiUpload] = useState({ status: "Checking Wi-Fi upload server..." });
  const [pendingWorksheet, setPendingWorksheet] = useState(null);
  const processedUploadId = useRef(null);
  const balanceRef = useRef(null);
  const uploadServerBase = useMemo(() => getUploadServerBase(), []);

  const currentWord = wordList[wordIndex] || "";
  const currentRecord = account.words[currentWord] || createWordRecord();
  const isMastered = currentRecord.correct >= 3 || currentRecord.mastered;
  const masteredCount = Object.values(account.words).filter((record) => record.mastered || record.correct >= 3).length;
  const accuracy = account.wordsAttempted ? Math.round((account.correctAnswers / account.wordsAttempted) * 100) : 100;
  const sessionProgress = Math.round(((wordIndex + 1) / Math.max(wordList.length, 1)) * 100);

  useEffect(() => {
    saveAccount(account);
  }, [account]);

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
    setFeedback(isMastered ? "Mastery mode: finish the word for the big reward." : "Early learning: correct letters earn 2 cents.");
  }

  function updateAccountForResult(word, isCorrect, reward, letterRewarded = 0) {
    setAccount((current) => {
      const record = current.words[word] || createWordRecord();
      const nextCorrect = record.correct + (isCorrect ? 1 : 0);
      const nextStreak = isCorrect ? current.currentStreak + 1 : 0;
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
        }
      };
    });
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
    if (!pendingWorksheet?.file) return;
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
    } catch (error) {
      setOcrStatus(`OCR needs a clearer file or text paste. ${explainOcrError(error)}`);
    }
  }

  async function processPendingWorksheetWithChandra(worksheet = pendingWorksheet) {
    if (!worksheet?.file) return;
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
    } catch (error) {
      setOcrProgress(0);
      setOcrStatus(`Advanced OCR is not ready. ${explainOcrError(error)}`);
    }
  }

  async function runBestAvailableWorksheetOcr() {
    const action = chooseWorksheetOcrAction({ advancedConnected: Boolean(wifiUpload.connected) });
    if (action === "advanced") {
      await processPendingWorksheetWithChandra();
      return;
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
    } else if (wasCorrect) {
      setFeedback("Correct letter. Finish the whole word for the reward.");
    } else {
      setFeedback("Close. That letter belongs somewhere else.");
    }

    const completed = nextSlots.every(Boolean);
    if (completed) {
      const solved = nextSlots.map((slot) => slot.letter).join("");
      window.setTimeout(() => finishScramble(solved === currentWord), 250);
    }
  }

  function updateAccountForLetter(word) {
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
    const guess = typedWord.trim().toLowerCase();
    const isCorrect = guess === currentWord;
    if (isCorrect) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      setLastEarned("+$1.00");
      setFeedback(`Correct. ${currentWord} is spelled perfectly.`);
      updateAccountForResult(currentWord, true, audioWordReward, 0);
      window.setTimeout(nextWord, 900);
    } else {
      setFeedback("Not quite. Replay the word and try again.");
      updateAccountForResult(currentWord, false, 0, 0);
    }
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
    setAccount(next);
    setWordList(starterWords);
    setWordIndex(0);
    setRawInput(defaultWorksheetText);
    setFeedback("Account reset. Default worksheet words are ready.");
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
        </div>
      </header>

      <section className="progress-wrap">
        <span>Session progress</span>
        <div className="progress-track">
          <div style={{ width: `${sessionProgress}%` }} />
        </div>
        <strong>{sessionProgress}%</strong>
      </section>

      <nav className="mode-tabs">
        <button type="button" className={mode === "scramble" ? "active" : ""} onClick={() => setMode("scramble")}>
          <Shuffle size={18} /> Scramble
        </button>
        <button type="button" className={mode === "audio" ? "active" : ""} onClick={() => { setMode("audio"); speakWord(); }}>
          <Headphones size={18} /> Audio
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
              />
            ) : (
              <EmptyWordsNotice setMode={setMode} />
            )
          )}

          {mode === "audio" && (
            wordList.length ? (
              <AudioMode
                typedWord={typedWord}
                setTypedWord={setTypedWord}
                speakWord={speakWord}
                speakSpelling={speakSpelling}
                checkDictation={checkDictation}
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
              processPendingWorksheetWithChandra={processPendingWorksheetWithChandra}
              extractionInfo={extractionInfo}
              removeWord={removeWord}
              clearPracticeWords={clearPracticeWords}
            />
          )}

          {mode === "dashboard" && (
            <Dashboard
              account={account}
              accuracy={accuracy}
              weakWords={weakWords}
              downloadAccount={downloadAccount}
              resetAccount={resetAccount}
            />
          )}
        </section>

        <aside className="side-panel">
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
          <div className="rules-card">
            <h2>Rewards</h2>
            <p>Correct letter: $0.02 before mastery.</p>
            <p>Scramble word: $0.50.</p>
            <p>Typed audio word: $1.00.</p>
            <p>Mastered: 3 correct completions.</p>
          </div>
        </aside>
      </section>
    </main>
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

function ScrambleMode({ word, record, isMastered, slots, letterBank, selectedBankIndex, setSelectedBankIndex, placeLetter, removeSlot, resetPuzzle, nextWord }) {
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
            {slot?.letter || ""}
          </button>
        ))}
      </div>

      <div className="letter-bank">
        {letterBank.map((tile, index) => (
          <button
            type="button"
            key={tile.id}
            draggable={!tile.used}
            className={`letter-tile ${selectedBankIndex === index ? "selected" : ""}`}
            disabled={tile.used}
            onClick={() => setSelectedBankIndex(index)}
            onDragStart={(event) => {
              setSelectedBankIndex(index);
              event.dataTransfer.setData("text/plain", String(index));
            }}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      <div className="control-row">
        <button type="button" onClick={resetPuzzle}><RefreshCw size={18} /> Reshuffle</button>
        <button type="button" onClick={nextWord}>Skip</button>
      </div>
    </>
  );
}

function AudioMode({ typedWord, setTypedWord, speakWord, speakSpelling, checkDictation, nextWord }) {
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
        onChange={(event) => setTypedWord(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") checkDictation();
        }}
        autoComplete="off"
        spellCheck="false"
        placeholder="Type the word you hear"
      />
      <div className="control-row">
        <button type="button" onClick={checkDictation}><Keyboard size={18} /> Check</button>
        <button type="button" onClick={() => speakWord()}><Headphones size={18} /> Repeat</button>
        <button type="button" onClick={() => speakSpelling()}><Sparkles size={18} /> Spell</button>
        <button type="button" onClick={nextWord}>Skip</button>
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
  processPendingWorksheetWithChandra,
  extractionInfo,
  removeWord,
  clearPracticeWords
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
            <p>Confidence picks</p>
            {extractionInfo.scoredLines
              ?.filter((line) => line.score >= 3 && line.words.length)
              .slice(0, 5)
              .map((line) => (
                <span key={`${line.line}-${line.score}`}>
                  +{line.score}: {line.words.join(", ")}
                </span>
              ))}
          </div>
        </section>
      )}
      <div className="word-list-toolbar">
        <strong>{wordList.length} loaded words</strong>
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

function Dashboard({ account, accuracy, weakWords, downloadAccount, resetAccount }) {
  return (
    <>
      <div className="mode-heading">
        <div>
          <p>Progress dashboard</p>
          <h1>{account.profileName}'s account</h1>
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
      <div className="control-row">
        <button type="button" onClick={downloadAccount}><Download size={18} /> Export JSON</button>
        <button type="button" className="quiet" onClick={resetAccount}>Reset</button>
      </div>
    </>
  );
}

