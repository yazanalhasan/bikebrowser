export const act1Characters = [
  { id: 'zuzu', displayName: 'Zuzu', role: 'player', location: 'home', languageProfile: ['English'], trustState: 'self', dialogueSets: [], notebookHooks: [], questHooks: [] },
  { id: 'garage_mentor', displayName: 'Mr. Chen', role: 'garage mentor', location: 'garage', languageProfile: ['English'], trustState: 'mentor', dialogueSets: ['garage_intro'], notebookHooks: ['bike_check'], questHooks: ['bike_check'] },
  { id: 'neighbor', displayName: 'Mrs. Ramirez', role: 'neighbor', location: 'street', languageProfile: ['English', 'Spanish'], trustState: 'building', dialogueSets: ['wash_neighbor', 'spanish_trust'], notebookHooks: ['spanish_interaction'], questHooks: ['wash_problem', 'neighborhood_trust'] },
  { id: 'arabic_mentor', displayName: 'Auntie Mariam', role: 'family mentor', location: 'npc_area', languageProfile: ['English', 'Arabic'], trustState: 'building', dialogueSets: ['arabic_welcome'], notebookHooks: ['arabic_interaction'], questHooks: ['neighborhood_trust'] },
  { id: 'ecology_sign', displayName: 'Desert Helper Sign', role: 'ecology mentor/sign system', location: 'ecology_patch', languageProfile: ['English'], trustState: 'system', dialogueSets: ['ecology_helper'], notebookHooks: ['desert_plant'], questHooks: ['desert_helper'] },
  { id: 'trader', displayName: 'Local Trader', role: 'shopkeeper', location: 'trader_area', languageProfile: ['English', 'Spanish'], trustState: 'neutral', dialogueSets: ['material_trade'], notebookHooks: ['copper_brace'], questHooks: ['find_materials'] },
];
