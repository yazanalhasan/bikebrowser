import MultiplicationArrayIllustration from './illustrations/MultiplicationArrayIllustration.jsx';
import GearMultiplicationIllustration from './illustrations/GearMultiplicationIllustration.jsx';
import SpokePatternIllustration from './illustrations/SpokePatternIllustration.jsx';
import BridgeBeamIllustration from './illustrations/BridgeBeamIllustration.jsx';
import DoublingVisualizer from './illustrations/DoublingVisualizer.jsx';
import CommutativeMirrorIllustration from './illustrations/CommutativeMirrorIllustration.jsx';
import DecompositionIllustration from './illustrations/DecompositionIllustration.jsx';
import FingerMathIllustration from './illustrations/FingerMathIllustration.jsx';
import PatternHeatmap from './illustrations/PatternHeatmap.jsx';
import RotationalClockIllustration from './illustrations/RotationalClockIllustration.jsx';

export default function MultiplicationVisualizer({ question, mode = 'mechanic' }) {
  if (!question) return null;
  const props = {
    factorA: question.factorA,
    factorB: question.factorB,
    decomposition: question.decomposition,
  };

  if (mode === 'array') return <MultiplicationArrayIllustration {...props} />;
  if (mode === 'mirror') return <CommutativeMirrorIllustration {...props} />;
  if (mode === 'decompose') return <DecompositionIllustration {...props} />;
  if (question.primaryType === 'doubling') return <DoublingVisualizer {...props} />;
  if (question.visualModel === 'digit-heatmap') return mode === 'finger' ? <FingerMathIllustration factorB={question.factorA === 9 ? question.factorB : question.factorA} /> : <PatternHeatmap />;
  if (question.visualModel === 'clock-rotation') return <RotationalClockIllustration {...props} />;
  if (question.visualModel === 'split-and-merge') return <DecompositionIllustration {...props} />;
  if (question.factorA === 12 || question.factorB === 12) return <SpokePatternIllustration {...props} />;
  if (question.factorA >= 7 || question.factorB >= 7) return <BridgeBeamIllustration {...props} />;
  if (mode === 'mechanic') return <GearMultiplicationIllustration {...props} />;
  return <MultiplicationArrayIllustration {...props} />;
}
