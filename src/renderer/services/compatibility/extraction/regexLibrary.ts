export const REGEX_LIBRARY = {
  speeds: /\b(\d{1,2})\s*(?:-| )?\s*speed\b/i,
  cassetteRange: /\b(\d{2})\s*[-–]\s*(\d{2})\s*t\b/i,
  maxCog: /\b(?:max(?:imum)?\s*)?(?:cog|sprocket|cassette).*?(\d{2})\s*t\b/i,
  longCage: /\b(long|sgs)\s*cage\b/i,
  mediumCage: /\b(medium|gs)\s*cage\b/i,
  rearDerailleur: /\b(rear\s*)?derailleur\b/i,
  cues: /\b(cues|linkglide|rd-u40(?:00|09)|rd-u60(?:00|20))\b/i,
  hyperglide: /\b(hyperglide|deore\s*m\d+|alivio|acera|altus)\b/i,
  boostRear: /\b(12\s*x\s*148|148\s*boost|boost\s*rear)\b/i,
  boostFront: /\b(15\s*x\s*110|110\s*boost|boost\s*front)\b/i,
  seatpost: /\b(27\.2|30\.9|31\.6|34\.9)\s*mm\s*(?:seatpost|post)?\b/i,
  clamp318: /\b31\.8\s*mm\b/i,
  rotor: /\b(140|160|180|203|220)\s*mm\s*(?:rotor|disc)?\b/i,
  postMount: /\bpost\s*mount\b/i,
  external73: /\b(?:external\s*)?73\s*mm\b/i,
};

export default REGEX_LIBRARY;
