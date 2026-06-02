// Phase 1.8 — Dry Wash: the first true investigation region.
// Each mystery runs Observation -> Hypothesis -> Investigation -> Evidence ->
// Conclusion. Every mystery offers a *misleading* hypothesis that the gathered
// evidence disproves, plus the better explanation — so the region teaches a new
// style of thinking, not just a new place.
export const act1DryWash = {
  region: 'dry_wash',
  unlockedBy: 'dry_wash', // already discoverable from Act 1
  investigations: [
    {
      id: 'wash_out_cause',
      kind: 'engineering',
      title: 'Why did the crossing wash out?',
      observation: 'The old footings are exposed and the gravel around them is scooped into a hollow.',
      hypotheses: [
        { id: 'weak_materials', text: 'The planks were just too weak.', misleading: true },
        { id: 'scour', text: 'Fast flood water dug out the support footings (scour).', misleading: false },
      ],
      evidence: [
        { id: 'high_water_mark', text: 'A mud line sits well above the channel — water ran deep and fast.', disproves: 'weak_materials', supports: 'scour' },
        { id: 'scoured_footings', text: 'The gravel beneath the footings is scooped into a scour hole.', disproves: 'weak_materials', supports: 'scour' },
      ],
      conclusion: { id: 'scour', text: 'The crossing failed because flash-flood water scoured out the footings — it needs deeper, protected footings, not just stronger planks.' },
      notebookEntry: 'wash_scour',
    },
    {
      id: 'green_strip',
      kind: 'ecology',
      title: 'Why do plants grow down a "dry" wash?',
      observation: 'A line of mesquite and creosote follows the channel, greener than the dusty slopes.',
      hypotheses: [
        { id: 'recent_rain', text: 'It must have rained here recently.', misleading: true },
        { id: 'subsurface_water', text: 'The wash holds underground water the deep roots reach.', misleading: false },
      ],
      evidence: [
        { id: 'dry_surface', text: 'The surface gravel is bone dry and dusty — no sign of recent rain.', disproves: 'recent_rain', supports: 'subsurface_water' },
        { id: 'deep_roots', text: 'Mesquite roots run deep toward damp subsurface sand in the channel.', disproves: 'recent_rain', supports: 'subsurface_water' },
      ],
      conclusion: { id: 'subsurface_water', text: 'The wash is a hidden water highway — floods leave subsurface moisture and deep-rooted plants line the channel to reach it.' },
      notebookEntry: 'wash_water',
    },
  ],
};
