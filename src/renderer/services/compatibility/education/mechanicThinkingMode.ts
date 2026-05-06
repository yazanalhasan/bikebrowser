import type { BikeProfile, ProductSpecs } from '../bikeProfiles/schema';

export type MechanicThinkingStep = {
  id: string;
  question: string;
  observed: string;
  expected: string;
  principle: string;
};

export function buildMechanicThinkingSteps(bike: BikeProfile, product: ProductSpecs): MechanicThinkingStep[] {
  if (product.category === 'rear-derailleur') {
    return [
      {
        id: 'standard',
        question: 'What drivetrain standard does this use?',
        observed: product.family || 'Unknown listing family',
        expected: bike.drivetrain.family,
        principle: 'Start by matching ecosystem before comparing price or brand.',
      },
      {
        id: 'pull-ratio',
        question: 'What pull ratio is required?',
        observed: product.pullRatio || 'Unknown pull ratio',
        expected: bike.drivetrain.family.includes('LINKGLIDE') ? 'LINKGLIDE' : bike.drivetrain.family,
        principle: 'Cable pull ratio controls how far the derailleur moves per click.',
      },
      {
        id: 'speed',
        question: 'What cassette spacing must it index?',
        observed: product.speeds ? `${product.speeds}-speed` : 'Unknown speed',
        expected: `${bike.drivetrain.speeds}-speed`,
        principle: 'Indexed drivetrains need the shifter, derailleur, chain, and cassette spacing to agree.',
      },
      {
        id: 'capacity',
        question: 'Does chain capacity exceed the requirement?',
        observed: product.maxCogTeeth ? `${product.maxCogTeeth}T max cog` : 'Unknown max cog',
        expected: bike.drivetrain.cassetteRange,
        principle: 'Wide-range cassettes need derailleur cage capacity and pulley clearance.',
      },
      {
        id: 'hanger',
        question: 'Does the hanger interface match?',
        observed: product.extractedSpecs?.hanger ? String(product.extractedSpecs.hanger) : 'Standard derailleur mount not confirmed',
        expected: bike.frame.derailleurHanger,
        principle: 'The frame hanger is the mechanical interface between frame and derailleur.',
      },
    ];
  }

  return [
    {
      id: 'category',
      question: 'What standard controls this part?',
      observed: product.category || 'Unknown category',
      expected: 'A named bike standard from the active build profile',
      principle: 'Mechanic thinking starts by identifying the interface, not the product name.',
    },
  ];
}

export default {
  buildMechanicThinkingSteps,
};
