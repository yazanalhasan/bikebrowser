export const HANDWRITING_PROMPTS = {
  spelling: [
    { id: 'trace-word', label: 'Trace word', mode: 'trace-word' },
    { id: 'copy-word', label: 'Copy word', mode: 'copy-word' },
    { id: 'memory-word', label: 'Write from memory', mode: 'memory-word' },
    { id: 'hear-word', label: 'Hear word, write word', mode: 'hear-word' },
  ],
  letterDetective: [
    { id: 'trace-letter', label: 'Trace letter', prompt: 'Trace the letter' },
    { id: 'write-lowercase-match', label: 'Write lowercase match', prompt: 'Write lowercase b' },
    { id: 'write-capital-match', label: 'Write capital match', prompt: 'Write uppercase D' },
    { id: 'mirror-orientation', label: 'Mirror orientation', prompt: 'Write the matching letter' },
  ],
};
