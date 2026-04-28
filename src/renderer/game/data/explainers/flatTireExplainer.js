const flatTireExplainer = {
  id: 'flat_tire',
  title: 'Fixing a Flat Tire',
  speaker: 'Mrs. Ramirez',
  cognitiveQuestId: 'flat_tire_reasoning',
  layoutKey: 'flatTireExplainerLayout',
  layoutPath: 'layouts/flat-tire-explainer.layout.json',
  elements: [
    {
      id: 'tire',
      label: 'Outer Tire',
      description: 'The tough rubber outside touches the road and protects the tube.',
      highlightColor: 0xffcc00,
      layoutKey: 'zone_tire',
      labelLayoutKey: 'label_tire',
    },
    {
      id: 'tube',
      label: 'Inner Tube',
      description: 'The soft tube inside holds air pressure.',
      highlightColor: 0x00ccff,
      layoutKey: 'zone_tube',
      labelLayoutKey: 'label_tube',
    },
    {
      id: 'hole',
      label: 'Puncture',
      description: 'Air escapes here when something pokes through the tire and tube.',
      highlightColor: 0xff4444,
      layoutKey: 'zone_hole',
      labelLayoutKey: 'label_hole',
    },
  ],
  steps: [
    {
      instruction: 'Click where the air is escaping.',
      target: 'hole',
      success: 'Yes. The puncture is where the air leaks out.',
      hint: 'Look for the red leak near the tire.',
    },
    {
      instruction: 'Now identify the inner tube.',
      target: 'tube',
      success: 'Right. The inner tube is the part that holds the air.',
      hint: 'The tube sits inside the tire.',
    },
    {
      instruction: 'Drag the patch onto the puncture.',
      action: 'drag_patch',
      success: 'Nice repair. The patch seals the hole so the tube can hold air again.',
      hint: 'Drag the patch over the red puncture mark.',
    },
  ],
};

export default flatTireExplainer;
