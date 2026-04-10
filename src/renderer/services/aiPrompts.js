function toJSON(value) {
  return JSON.stringify(value, null, 2);
}

export const BUILD_PLANNER_SYSTEM_PROMPT = [
  'You are an expert bike engineer and e-bike conversion specialist.',
  'You think like a mechanical engineer, experienced bike mechanic, e-bike builder, and safety reviewer.',
  'You are NOT a generic assistant.',
  'You must reason about geometry, fitment, and compatibility; recommend realistic purchasable parts; identify unsafe configurations; handle vague inputs intelligently; and clearly state assumptions when data is missing.',
  'Required thinking process:',
  '1) Understand the rider: height, use case, safety context.',
  '2) Evaluate base platform: frame suitability, geometry, size compatibility.',
  '3) Determine strategy: hub motor vs mid-drive, battery placement, drivetrain implications.',
  '4) Identify constraints: size limits, budget, safety, missing measurements.',
  '5) Generate realistic recommendations: specific part types and optional product examples.',
  '6) Identify risks: mechanical, electrical, safety.',
  '7) Request only the missing measurements truly needed.',
  'Strict rules:',
  '- Do not output vague labels like "motor" or "battery" without specific type/context.',
  '- Do not assume perfect compatibility.',
  '- Do not ignore rider size constraints or safety concerns.',
  '- Always suggest alternatives for suboptimal choices.',
  '- Downgrade confidence when data is missing.',
  '- Prioritize safety over performance.',
  'Domain rules to apply:',
  '- Riders around 5 ft generally require small/XS frames.',
  '- 29-inch wheels are often too large for very small riders; prefer 27.5 when needed.',
  '- Mid-drive builds require BB compatibility checks; hub motors require dropout compatibility checks.',
  '- Higher speeds require disc brakes; rim brakes are not suitable for high-power builds.',
  '- Child riders require speed/power limits and protective gear recommendations.',
  'Checklist integration rule:',
  '- If checklist template is provided, treat it as baseline, improve it, and adapt it to project specifics.',
  'Return JSON only; no markdown; no prose outside JSON.',
].join('\n');

export function buildPlannerPrompt({ project, checklistTemplate, userDescription }) {
  return [
    BUILD_PLANNER_SYSTEM_PROMPT,
    'Project context:',
    toJSON(project || {}),
    'User description:',
    userDescription || 'None provided',
    'Checklist template baseline:',
    toJSON(checklistTemplate || []),
    'Return strict JSON with this exact shape:',
    toJSON({
      summary: 'string',
      buildStrategy: 'string',
      readinessScore: 'good|workable|difficult|not_recommended',
      checklist: [
        {
          id: 'string',
          title: 'string',
          category: 'string',
          reason: 'string',
          required: true,
          measurementNeeded: false,
          estimatedCost: 0,
          recommendedItem: {
            name: 'string',
            quantity: 1,
            description: 'string'
          }
        }
      ],
      donorBikeSuggestions: [
        {
          name: 'string',
          reason: 'string',
          fitmentConfidence: 0.74,
        },
      ],
      compatibility: [
        {
          category: 'string',
          status: 'compatible|uncertain|incompatible',
          confidence: 0.62,
          summary: 'string',
          details: 'string',
          measurementsNeeded: ['string']
        }
      ],
      warnings: ['string'],
      missingInfo: ['string'],
      measurementsToConfirm: ['string'],
      recommendedParts: [
        {
          name: '500W rear hub motor kit (7-speed freewheel compatible)',
          category: 'Drivetrain',
          type: 'motor-kit',
          description: 'Specific part type with practical fitment context.',
          reason: 'Why this part is appropriate for this rider and project.',
          estimatedPrice: '$180-$320',
          priority: 'required',
          fitmentConfidence: 0.81,
          mustVerify: true,
          exampleSearchQueries: [
            '500W rear hub motor kit 7 speed freewheel',
            '48V 13Ah Hailong downtube battery',
            'Shimano MT200 hydraulic disc brakes',
          ]
        }
      ],
      nextBestAction: 'string',
    }),
    'Always return at least 3 and at most 6 recommendedParts.',
    'Specific examples you should emulate in recommendations:',
    '- 500W rear hub motor kit (7-speed freewheel compatible)',
    '- 48V 13Ah Hailong downtube battery',
    '- Small-frame hardtail MTB (15-16 inch frame for ~5 ft rider)',
    '- Hydraulic disc brakes (Shimano MT200 level)',
    '- Ozark Trail 29 small frame MTB',
    '- Used Trek Marlin 5 small frame',
    'Generate a full engineering-aware build plan. Return JSON only.',
  ].join('\n\n');
}

export function compatibilityPrompt(data) {
  return [
    'Evaluate bike-build compatibility and return strict JSON.',
    'Output shape:',
    toJSON({
      warnings: ['string'],
      missingMeasurements: ['string'],
      compatibility: [
        {
          item: 'string',
          status: 'compatible|caution|incompatible|needs-info|uncertain',
          confidence: 0.62,
          summary: 'string',
          missingMeasurements: ['string']
        }
      ]
    }),
    'Input:',
    toJSON(data)
  ].join('\n\n');
}

export function structuredOutputPrompt(data) {
  return [
    'Convert this reasoning into strict, valid JSON output.',
    'If schema is provided, follow it exactly.',
    'Input:',
    toJSON(data)
  ].join('\n\n');
}

export function imagePrompt(data) {
  return [
    'Generate a concise image concept prompt for a safe bike build visualization.',
    'Keep it child-safe and practical.',
    'Build data:',
    toJSON(data)
  ].join('\n\n');
}

export function safetyPrompt(data) {
  return [
    'Assess child safety risk. Return strict JSON with safe, category, riskScore, notes.',
    'Input:',
    toJSON(data)
  ].join('\n\n');
}

export function explanationPrompt(topic) {
  return `Explain this in simple terms for a 9-year-old who likes bikes and engineering: ${topic}`;
}

export function suggestionsPrompt(topic) {
  return `Generate 5 child-safe educational search suggestions about: ${topic}. Return one per line.`;
}

export function uxAuditPrompt(data) {
  return [
    'Audit this UI state for child-safe UX compliance.',
    'Return strict JSON: { violations: [{ rule, issue, severity, fix }] }.',
    toJSON(data)
  ].join('\n\n');
}

export function analyzeCustomPartPrompt(data) {
  return [
    'Analyze compatibility for a custom bike part or donor bike entry.',
    'Handle vague user input gracefully and provide practical fitment guidance.',
    'Return strict JSON only with this shape:',
    toJSON({
      status: 'compatible|probable|verify|incompatible',
      confidence: 0.72,
      summary: 'string',
      reasons: ['string'],
      requiredChecks: ['string'],
      warnings: ['string'],
      alternatives: ['string']
    }),
    'Input:',
    toJSON(data)
  ].join('\n\n');
}
