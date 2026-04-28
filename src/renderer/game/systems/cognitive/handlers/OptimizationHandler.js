import { hasCorrectOption, hasCorrectSet } from './shared.js';

export default {
  type: 'optimization',
  evaluate(quest, input) {
    if (quest?.evaluation?.correctSet) return hasCorrectSet(quest, input);
    return hasCorrectOption(quest, input);
  },
};
