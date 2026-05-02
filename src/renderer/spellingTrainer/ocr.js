import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { createWorker, PSM } from "tesseract.js";
import { extractWorksheetData } from "./wordTools.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function imageToRotatedCanvas(file, rotation) {
  const dataUrl = await fileToDataUrl(file);

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const normalized = ((rotation % 360) + 360) % 360;
  const sideways = normalized === 90 || normalized === 270;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = sideways ? image.naturalHeight : image.naturalWidth;
  canvas.height = sideways ? image.naturalWidth : image.naturalHeight;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((normalized * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  improveWorksheetContrast(canvas);
  return canvas;
}

function improveWorksheetContrast(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
    const cleaned = contrasted > 210 ? 255 : contrasted < 80 ? 0 : contrasted;
    data[index] = cleaned;
    data[index + 1] = cleaned;
    data[index + 2] = cleaned;
  }

  context.putImageData(imageData, 0, 0);
}

async function pdfPageToCanvas(file, rotation) {
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const canvases = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 3); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2, rotation });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    improveWorksheetContrast(canvas);
    canvases.push(canvas);
  }

  return canvases;
}

const psmModes = [
  { id: PSM.SINGLE_BLOCK, label: "single block" },
  { id: PSM.SPARSE_TEXT, label: "sparse text" },
  { id: PSM.SINGLE_COLUMN, label: "single column" },
  { id: PSM.AUTO, label: "auto layout" },
  { id: PSM.SINGLE_BLOCK_VERT_TEXT, label: "vertical block" }
];

function scoreExtraction(extraction) {
  const lineConfidence = extraction.scoredLines
    ?.filter((line) => line.score >= 3)
    .reduce((total, line) => total + line.score + line.words.length, 0) || 0;

  return extraction.words.length * 10 + lineConfidence;
}

async function recognizeTargets(targets, onProgress, pageSegMode) {
  let worker = null;

  try {
    worker = await createWorker("eng", 1, {
      logger: (message) => {
        if (message.status === "recognizing text") onProgress?.(Math.round(message.progress * 100));
      }
    });

    await worker.setParameters({
      tessedit_pageseg_mode: pageSegMode
    });

    const chunks = [];
    for (const target of targets) {
      const result = await worker.recognize(target);
      chunks.push(result.data.text);
    }

    return chunks.join("\n");
  } finally {
    await worker?.terminate();
  }
}

export function explainOcrError(error) {
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

export async function extractWordsFromFile(file, onProgress, options = {}) {
  const rotation = options.rotation || 0;
  const targets = file.type === "application/pdf"
    ? await pdfPageToCanvas(file, rotation)
    : [await imageToRotatedCanvas(file, rotation)];

  let bestResult = null;
  for (let index = 0; index < psmModes.length; index += 1) {
    const mode = psmModes[index];
    const rawText = await recognizeTargets(
      targets,
      (progress) => {
        const offset = index * (100 / psmModes.length);
        onProgress?.(Math.min(99, Math.round(offset + progress / psmModes.length)));
      },
      mode.id
    );
    const extraction = extractWorksheetData(rawText);
    const result = {
      rawText,
      words: extraction.words,
      extraction,
      ocrMode: mode.label,
      ocrScore: scoreExtraction(extraction)
    };

    if (!bestResult || result.ocrScore > bestResult.ocrScore) {
      bestResult = result;
    }

    if (result.words.length >= 12) break;
  }

  onProgress?.(100);
  return bestResult;
}
