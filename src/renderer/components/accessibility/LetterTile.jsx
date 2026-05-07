import React from 'react';
import AccessibleText from './AccessibleText';
import { speakLetter } from '../../accessibility/speechEngine';

const SIZE_CLASS = {
  sm: 'bb-letter-tile-sm',
  md: 'bb-letter-tile-md',
  lg: 'bb-letter-tile-lg',
};

export default function LetterTile({
  letter,
  selected = false,
  correct = false,
  incorrect = false,
  isolatedTile = true,
  preserveCapitalBD = true,
  playAudio = false,
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const stateClass = [
    selected ? 'is-selected' : '',
    correct ? 'is-correct' : '',
    incorrect ? 'is-incorrect' : '',
    SIZE_CLASS[size] || SIZE_CLASS.md,
    className,
  ].filter(Boolean).join(' ');

  function handleClick(event) {
    if (playAudio) speakLetter(letter);
    onClick?.(event);
  }

  return (
    <button
      type="button"
      aria-label={String(letter)}
      className={`letter-tile bb-letter-tile ${stateClass}`}
      disabled={disabled}
      draggable={draggable && !disabled}
      onClick={handleClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <AccessibleText
        text={letter}
        isolatedTile={isolatedTile}
        preserveCapitalBD={preserveCapitalBD}
      />
    </button>
  );
}
