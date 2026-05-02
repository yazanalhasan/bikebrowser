const instructionWords = new Set([
  "write",
  "unscramble",
  "sentence",
  "sentences",
  "fill",
  "circle",
  "trace",
  "name",
  "date",
  "worksheet",
  "spelling",
  "vocabulary",
  "bank",
  "challenge",
  "content",
  "including",
  "words",
  "word",
  "read",
  "choose",
  "answer",
  "answers",
  "complete",
  "practice",
  "directions",
  "instructions",
  "below",
  "above",
  "each",
  "then",
  "with",
  "your",
  "the",
  "and"
]);

const instructionSignals = [
  "directions",
  "instructions",
  "write",
  "sentence",
  "sentences",
  "unscramble",
  "fill",
  "circle",
  "trace",
  "match",
  "choose",
  "complete",
  "alphabetical",
  "vowels",
  "consonants",
  "practice",
  "use each",
  "use the",
  "include",
  "including",
  "listed",
  "student",
  "reader",
  "week",
  "read"
];

const wordSectionSignals = [
  "spelling words",
  "word bank",
  "words to know",
  "vocabulary words",
  "list words",
  "weekly words",
  "challenge words",
  "high frequency words",
  "sight words"
];

export const starterWords = [
  "astounding",
  "announcement",
  "trowel",
  "boundaries",
  "counselor",
  "allowance",
  "download",
  "foundation",
  "accountable",
  "towering",
  "dismount",
  "empowered",
  "background",
  "cowardly",
  "bloodhound",
  "mouthwash",
  "drowned",
  "growled",
  "believe",
  "favorite",
  "pennsylvania"
];

export const defaultWorksheetText = `astounding
announcement
trowel
boundaries
counselor
allowance
download
foundation
accountable
towering
dismount
empowered
background
cowardly
bloodhound
mouthwash
drowned
growled

Challenge Word: believe
Challenge Word: favorite
Content Word: Pennsylvania`;

export function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "").trim();
}

function cleanLine(line) {
  return line
    .replace(/<\/(?:td|th|tr|p|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[|_[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWorksheetText(rawText) {
  return rawText
    .replace(/<\/(?:td|th|tr|p|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
}

function tokensFromLine(line) {
  return line
    .split(/[\s,;:/]+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function isCandidateWord(word) {
  if (word.length < 3 || word.length > 14) return false;
  if (!/^[a-z]+$/.test(word)) return false;
  if (instructionWords.has(word)) return false;
  return true;
}

function lineHasSignal(line, signals) {
  const lower = line.toLowerCase();
  return signals.some((signal) => lower.includes(signal));
}

function isInstructionLine(line) {
  const lower = line.toLowerCase();
  const tokens = tokensFromLine(line);
  const signalCount = instructionSignals.filter((signal) => lower.includes(signal)).length;
  const hasSentencePunctuation = /[.!?]/.test(line);

  return signalCount > 0 && (tokens.length > 2 || hasSentencePunctuation);
}

function parseNumberedWords(line) {
  const pairPattern = /\b(\d{1,2})\.\s*([A-Za-z-]{3,18})\b/g;
  const pairs = [];
  let match = pairPattern.exec(line);

  while (match) {
    const word = normalizeWord(match[2]);
    if (isCandidateWord(word)) {
      pairs.push({ number: Number(match[1]), word });
    }
    match = pairPattern.exec(line);
  }

  if (!pairs.length) return [];

  const stripped = line
    .replace(pairPattern, " ")
    .replace(/[\d\s.():-]/g, "")
    .trim();
  return stripped ? [] : pairs;
}

function parseLabeledWords(line) {
  const words = [];
  const labelPattern = /\b(?:challenge|content|bonus|review)\s+word\s*:\s*([A-Za-z-]{3,18})/gi;
  let match = labelPattern.exec(line);

  while (match) {
    const word = normalizeWord(match[1]);
    if (isCandidateWord(word)) words.push(word);
    match = labelPattern.exec(line);
  }

  return words;
}

function candidateWordsFromLine(line) {
  return tokensFromLine(line).filter(isCandidateWord);
}

function removeSectionSignalText(line) {
  return wordSectionSignals.reduce(
    (current, signal) => current.replace(new RegExp(signal, "ig"), " "),
    line
  );
}

function startsWithWordSectionSignal(line) {
  const lower = line.toLowerCase().trim();
  return wordSectionSignals.some((signal) => lower.startsWith(signal));
}

function unique(words) {
  return [...new Set(words)];
}

function scoreLine(line, context = {}) {
  const numberedWords = parseNumberedWords(line);
  const labeledWords = parseLabeledWords(line);
  const lineCandidates = candidateWordsFromLine(line);
  const tokenCount = tokensFromLine(line).length;
  const instructionLine = isInstructionLine(line);
  const containsInstructionSignal = lineHasSignal(line, instructionSignals);
  const hasExtraPunctuation = /[,;!?]/.test(line) || (/\./.test(line) && !numberedWords.length);

  let score = 0;
  const reasons = [];
  const words = [];

  if (numberedWords.length) {
    score += 3;
    reasons.push("numbered word pattern");
    words.push(...numberedWords.map((item) => item.word));
  }

  if (labeledWords.length) {
    score += 3;
    reasons.push("labeled challenge/content word");
    words.push(...labeledWords);
  }

  if (lineCandidates.length === 1 && tokenCount === 1) {
    score += 2;
    reasons.push("single word line");
    words.push(lineCandidates[0]);
  }

  if (context.inWordSection && lineCandidates.length > 0 && lineCandidates.length <= 10) {
    score += 2;
    reasons.push("inside word section");
    words.push(...lineCandidates);
  }

  if (context.tableLike && lineCandidates.length >= 2 && lineCandidates.length <= 8) {
    score += 3;
    reasons.push("table-like word row");
    words.push(...lineCandidates);
  }

  if (tokenCount > 3) {
    score -= 3;
    reasons.push("sentence-like length");
  }

  if (instructionLine || containsInstructionSignal) {
    score -= 2;
    reasons.push("instruction keywords");
  }

  if (hasExtraPunctuation) {
    score -= 2;
    reasons.push("sentence punctuation");
  }

  return {
    line,
    score,
    words: unique(words.filter(isCandidateWord)),
    reasons
  };
}

export function extractWorksheetData(rawText) {
  const lines = normalizeWorksheetText(rawText)
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const instructions = [];
  const chosenLines = [];
  const rejectedLines = [];
  let inWordSection = false;
  let usedStrategy = "general word detection";
  const candidates = [];
  const numberedEntries = [];
  const labeledEntries = [];

  for (const line of lines) {
    const hasWordSectionHeading = lineHasSignal(line, wordSectionSignals);
    const instructionLine = isInstructionLine(line);
    const numberedWords = parseNumberedWords(line);
    const labeledWords = parseLabeledWords(line);
    const lineCandidates = candidateWordsFromLine(line);
    const lower = line.toLowerCase();
    const tableLike =
      lineCandidates.length >= 2 &&
      lineCandidates.length <= 8 &&
      lineCandidates.length === tokensFromLine(line).length &&
      !/[.!?]/.test(line) &&
      !lineHasSignal(line, instructionSignals);
    const scored = scoreLine(line, { inWordSection, tableLike });

    if (instructionLine || lineHasSignal(line, instructionSignals)) {
      instructions.push(line);
    }

    if (hasWordSectionHeading && (!instructionLine || startsWithWordSectionSignal(line))) {
      inWordSection = true;
      usedStrategy = "word bank / spelling section";
      const inlineWords = candidateWordsFromLine(removeSectionSignalText(line));
      if (inlineWords.length > 0) {
        candidates.push(...inlineWords);
        chosenLines.push(line);
      }
      continue;
    }

    if (inWordSection && instructionLine && !numberedWords.length && !labeledWords.length) {
      inWordSection = false;
      rejectedLines.push(line);
      continue;
    }

    if (scored.score >= 3 && scored.words.length) {
      candidates.push(...scored.words);
      if (numberedWords.length) {
        numberedEntries.push(...numberedWords);
      }
      if (labeledWords.length) {
        labeledEntries.push(...labeledWords);
      }
      chosenLines.push(line);
      if (numberedWords.length && usedStrategy === "general word detection") usedStrategy = "numbered spelling list";
      if (labeledWords.length) usedStrategy = usedStrategy === "general word detection" ? "labeled challenge/content words" : usedStrategy;
      continue;
    }

    if (lower.length > 0) {
      rejectedLines.push(line);
    }
  }

  const orderedWords = numberedEntries.length
    ? unique([
      ...numberedEntries.sort((a, b) => a.number - b.number).map((item) => item.word),
      ...labeledEntries,
      ...candidates
    ])
    : unique(candidates);

  return {
    words: orderedWords,
    instructions: unique(instructions),
    chosenLines: unique(chosenLines),
    scoredLines: lines.map((line) => {
      const lineCandidates = candidateWordsFromLine(line);
      return scoreLine(line, {
        inWordSection: false,
        tableLike:
          lineCandidates.length >= 2 &&
          lineCandidates.length <= 8 &&
          lineCandidates.length === tokensFromLine(line).length &&
          !/[.!?]/.test(line) &&
          !lineHasSignal(line, instructionSignals)
      });
    }),
    rejectedLines: rejectedLines.slice(0, 12),
    strategy: usedStrategy
  };
}

export function extractWords(rawText) {
  const worksheetData = extractWorksheetData(rawText);
  if (worksheetData.words.length) return worksheetData.words;

  const candidates = rawText
    .split(/\r?\n|,|;|\t/g)
    .flatMap((line) => line.split(/\s+/))
    .map(normalizeWord)
    .filter(isCandidateWord);

  return unique(candidates);
}

export function scrambleWord(word) {
  if (word.length <= 1) return word;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const letters = word.split("");
    for (let index = letters.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]];
    }
    const scrambled = letters.join("");
    if (scrambled !== word) {
      return scrambled;
    }
  }
  return word.split("").reverse().join("");
}

export function formatMoney(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
