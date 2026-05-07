import React from 'react';
import { useAccessibility } from '../../accessibility/accessibilityHooks';
import { getReadableChar, normalizeReadableText } from '../../accessibility/typographyEngine';
import { isConfusableLetter } from '../../accessibility/confusableLetters';
import { speak } from '../../accessibility/speechEngine';

export default function AccessibleText({
  text,
  isolatedTile = false,
  preserveCapitalBD = true,
  className = '',
  speakOnHover = false,
  highlightConfusables = true,
}) {
  const { profile } = useAccessibility();
  const readableText = normalizeReadableText(text, {
    isolatedTile,
    preserveCapitalBD: preserveCapitalBD && profile.preserveCapitalBD,
    lowercasePriority: profile.lowercasePriority,
  });
  const shouldMarkConfusables = highlightConfusables
    && profile.dyslexiaMode
    && profile.enhancedConfusableLetters;

  return (
    <span
      className={className}
      onMouseEnter={speakOnHover ? () => speak(readableText) : undefined}
      onFocus={speakOnHover ? () => speak(readableText) : undefined}
    >
      {Array.from(readableText).map((char, index) => {
        const renderedChar = getReadableChar(char, {
          isolatedTile,
          preserveCapitalBD: preserveCapitalBD && profile.preserveCapitalBD,
        });
        const isConfusable = shouldMarkConfusables && isConfusableLetter(renderedChar);

        return (
          <span
            key={`${char}-${index}`}
            className={isConfusable ? 'bb-confusable-letter' : undefined}
          >
            {renderedChar}
          </span>
        );
      })}
    </span>
  );
}
