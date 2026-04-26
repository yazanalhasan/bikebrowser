/**
 * Quest definitions for the bike adventure game.
 *
 * Quest schema (versioned — add fields freely, never remove):
 *   id          - unique key, referenced in save data
 *   title       - short name shown in HUD and journal
 *   description - journal-style summary
 *   giver       - NPC id who starts the quest
 *   steps       - ordered array of step objects (see below)
 *   reward      - { items: string[], xp: number } granted on completion
 *
 * Step schema:
 *   id          - unique within the quest
 *   type        - 'dialogue' | 'inspect' | 'use_item' | 'quiz' | 'complete'
 *   text        - dialogue or instruction shown to the player
 *   choices     - (quiz only) array of { label, correct: boolean }
 *   requiredItem - (use_item only) item id that must be in inventory
 *   hint        - optional helper text if the player is stuck
 */

const QUESTS = {
  flat_tire_repair: {
    id: 'flat_tire_repair',
    title: 'Fix Mrs. Ramirez\'s Flat Tire',
    description:
      'Mrs. Ramirez from down the street has a flat tire on her bike. ' +
      'Help her figure out what happened and fix it!',
    giver: 'mrs_ramirez',
    steps: [
      {
        id: 'talk',
        type: 'dialogue',
        text:
          'Oh hi Zuzu! My bike tire went completely flat overnight. ' +
          'I don\'t know what happened — could you take a look?',
      },
      {
        id: 'inspect',
        type: 'inspect',
        text:
          'Look closely at the tire. You can see a small nail stuck in it! ' +
          'That\'s what caused the flat. We need to remove the tire first.',
      },
      {
        id: 'reading',
        type: 'dialogue',
        text:
          '📖 Quick tip: A bicycle tire has two parts — the outer tire ' +
          '(the tough rubber that touches the road) and the inner tube ' +
          '(a softer tube filled with air inside the tire). When a nail ' +
          'pokes through both layers, the air leaks out of the inner tube ' +
          'and the tire goes flat.',
      },
      {
        id: 'use_lever',
        type: 'use_item',
        text: 'Use the tire lever to carefully remove the tire from the rim.',
        requiredItem: 'tire_lever',
        hint: 'Check your toolbox in the garage — you should have a tire lever.',
      },
      {
        id: 'quiz',
        type: 'quiz',
        text:
          'Before we patch the tube, quiz time!\n\n' +
          'Why does a tire go flat?',
        choices: [
          { label: 'A hole lets the air out', correct: true },
          { label: 'The wheel is too heavy', correct: false },
          { label: 'The sun made the tire sleepy 😴', correct: false },
        ],
      },
      {
        id: 'use_patch',
        type: 'use_item',
        text: 'Great job! Now use the patch kit to seal the hole in the inner tube.',
        requiredItem: 'patch_kit',
        hint: 'You have a patch kit in your toolbox.',
      },
      {
        id: 'complete',
        type: 'complete',
        text:
          'The tire is fixed! Mrs. Ramirez is so happy.\n\n' +
          '"Thank you so much, Zuzu! You\'re a real bike mechanic! ' +
          'Here, take this pump — every mechanic needs one."\n\n' +
          '🎉 You earned: Basic Pump!',
      },
    ],
    reward: {
      items: ['basic_pump'],
      xp: 50,
      zuzubucks: 25,
      reputation: 10,
    },
  },
  chain_repair: {
    id: 'chain_repair',
    title: "Fix Mr. Chen's Slipped Chain",
    description:
      'Mr. Chen\'s chain slipped off while he was riding to the store. ' +
      'Help him get it back on and running smoothly!',
    giver: 'mr_chen',
    steps: [
      {
        id: 'talk',
        type: 'dialogue',
        text:
          'Hey there, young mechanic! My bike chain jumped right off ' +
          'while I was riding. I heard you fixed Mrs. Ramirez\'s tire — ' +
          'think you can help me too?',
      },
      {
        id: 'inspect',
        type: 'inspect',
        text:
          'Look at the chain. It\'s dangling loose off the chainring. ' +
          'The derailleur looks bent slightly inward — that\'s probably ' +
          'why it slipped. First, let\'s get the chain back on.',
      },
      {
        id: 'reading',
        type: 'dialogue',
        text:
          '📖 Quick tip: A bike chain connects the pedals to the rear wheel. ' +
          'When you pedal, the chain pulls the rear sprocket and makes the ' +
          'wheel spin. If the chain is too loose or the derailleur is bent, ' +
          'the chain can jump off the gears.',
      },
      {
        id: 'use_wrench',
        type: 'use_item',
        text: 'Use your wrench to carefully straighten the derailleur back into alignment.',
        requiredItem: 'wrench',
        hint: 'Check your toolbox — you should have a wrench.',
      },
      {
        id: 'quiz',
        type: 'quiz',
        text:
          'Quick question before we finish!\n\n' +
          'What does the chain do on a bicycle?',
        choices: [
          { label: 'It connects the pedals to the rear wheel to make it spin', correct: true },
          { label: 'It holds the handlebars in place', correct: false },
          { label: 'It makes the brakes work', correct: false },
        ],
      },
      {
        id: 'use_lube',
        type: 'use_item',
        text: 'Great! Now apply some chain lube to keep the chain running smoothly.',
        requiredItem: 'chain_lube',
        hint: 'You need chain lube — check your inventory or ask around.',
      },
      {
        id: 'complete',
        type: 'complete',
        text:
          'The chain is back on and running perfectly!\n\n' +
          '"Wonderful work! You really know your way around a bike. ' +
          'Here — take this multi-tool. Every serious mechanic needs one."\n\n' +
          '🎉 You earned: Multi-Tool!',
      },
    ],
    reward: {
      items: ['multi_tool'],
      xp: 75,
      zuzubucks: 35,
      reputation: 15,
    },
  },

  // ── Ecology / Foraging / Crafting Quests ─────────────────────────────────

  desert_healer: {
    id: 'desert_healer',
    title: 'Desert Healer',
    description:
      'Mrs. Ramirez scraped her arm fixing her bike. ' +
      'Learn about desert plants that can help with wounds!',
    giver: 'mrs_ramirez',
    category: 'ecology',
    steps: [
      {
        id: 'talk_healer',
        type: 'dialogue',
        text:
          'Ouch! I scraped my arm on a spoke while adjusting the wheel. ' +
          'Zuzu, I heard creosote bushes have healing properties. ' +
          'Could you find some nearby?',
      },
      {
        id: 'find_creosote',
        type: 'forage',
        text: 'Find a creosote bush in the desert and harvest some leaves.',
        requiredItem: 'creosote_leaves',
        hint: 'Creosote bushes grow in dry, low-elevation areas. Look for small green bushes.',
      },
      {
        id: 'learn_creosote',
        type: 'dialogue',
        text:
          '📖 Creosote is one of the oldest plants in the desert — some bushes are thousands of years old! ' +
          'The resin in the leaves fights inflammation and infection. ' +
          'But be careful: too much can be hard on the liver.',
      },
      {
        id: 'find_agave',
        type: 'forage',
        text: 'Now find some agave fiber to make a proper bandage.',
        requiredItem: 'agave_fiber',
        hint: 'Agave plants grow in drier areas. Their fibers make strong bandages.',
      },
      {
        id: 'craft_salve',
        type: 'craft',
        text: 'Combine the creosote leaves and agave fiber to craft a Healing Salve!',
        requiredRecipe: 'healing_salve',
        hint: 'You need both creosote leaves and agave fiber in your inventory.',
      },
      {
        id: 'use_salve',
        type: 'use_item',
        text: 'Apply the healing salve to help Mrs. Ramirez\'s arm.',
        requiredItem: 'healing_salve',
        hint: 'Use the salve you just crafted.',
      },
      {
        id: 'quiz_healer',
        type: 'quiz',
        text: 'What risk comes with using too much creosote?',
        choices: [
          { label: 'It can be toxic to the liver', correct: true },
          { label: 'It makes you sneeze', correct: false },
          { label: 'It turns your skin green', correct: false },
        ],
      },
      {
        id: 'complete_healer',
        type: 'complete',
        text:
          'Mrs. Ramirez\'s arm feels much better!\n\n' +
          '"You\'re not just a bike mechanic — you\'re a desert healer too! ' +
          'Here, take some Zuzubucks for your help."\n\n' +
          '🌿 You learned: Creosote healing (with caution!)',
      },
    ],
    reward: {
      items: [],
      xp: 60,
      zuzubucks: 30,
      reputation: 15,
      unlocks: ['healing_salve'], // unlocks recipe
    },
  },

  food_chain_tracker: {
    id: 'food_chain_tracker',
    title: 'Follow the Food Chain',
    description:
      'Mr. Chen wants to understand the desert ecosystem near his house. ' +
      'Track the connections between plants, prey, and predators!',
    giver: 'mr_chen',
    category: 'ecology',
    steps: [
      {
        id: 'talk_tracker',
        type: 'dialogue',
        text:
          'Zuzu! I\'ve been noticing animals in the neighborhood. ' +
          'There must be a food chain connecting them to the plants. ' +
          'Can you help me figure it out? Start by finding mesquite trees.',
      },
      {
        id: 'find_mesquite',
        type: 'observe',
        text: 'Find a mesquite tree and observe what animals are nearby.',
        requiredObservation: 'mesquite',
        hint: 'Mesquite trees grow in the desert scrub areas. Look for medium green trees.',
      },
      {
        id: 'learn_mesquite_ecology',
        type: 'dialogue',
        text:
          '📖 Mesquite pods are a food source for javelinas, rabbits, and quail. ' +
          'Where herbivores gather, predators follow. ' +
          'This is the desert food web in action!',
      },
      {
        id: 'observe_prey',
        type: 'observe',
        text: 'Look for javelina or rabbits near the mesquite trees.',
        requiredObservation: 'javelina',
        hint: 'Herbivores feed near their food plants. Check areas with mesquite and prickly pear.',
      },
      {
        id: 'learn_predator',
        type: 'dialogue',
        text:
          '📖 Javelinas are prey for coyotes. In the desert, every animal is part of a chain: ' +
          'plants feed herbivores, herbivores feed predators. ' +
          'Remove one link and the whole system changes.',
      },
      {
        id: 'quiz_chain',
        type: 'quiz',
        text: 'In the desert food chain: mesquite → javelina → ???\n\nWhat comes next?',
        choices: [
          { label: 'Coyote (predator)', correct: true },
          { label: 'Saguaro (plant)', correct: false },
          { label: 'Roadrunner (bird)', correct: false },
        ],
      },
      {
        id: 'harvest_mesquite',
        type: 'forage',
        text: 'Harvest some mesquite pods — they\'re edible for humans too!',
        requiredItem: 'mesquite_pods',
        hint: 'You can forage mesquite pods from mesquite trees.',
      },
      {
        id: 'complete_tracker',
        type: 'complete',
        text:
          'Mr. Chen is impressed with your ecology knowledge!\n\n' +
          '"You followed the food chain from plant to predator. ' +
          'That\'s real science! Here — you\'ve earned this."\n\n' +
          '🔬 You learned: Desert food web tracking',
      },
    ],
    reward: {
      items: [],
      xp: 80,
      zuzubucks: 40,
      reputation: 20,
    },
  },

  desert_survival: {
    id: 'desert_survival',
    title: 'Desert Survival Basics',
    description:
      'Learn how to find water and energy from desert plants — ' +
      'essential knowledge for any desert adventurer!',
    giver: 'mr_chen',
    category: 'ecology',
    steps: [
      {
        id: 'talk_survival',
        type: 'dialogue',
        text:
          'Zuzu, the desert is beautiful but dangerous. ' +
          'Do you know how to find water and food from plants? ' +
          'Let me teach you the basics!',
      },
      {
        id: 'find_prickly_pear',
        type: 'forage',
        text: 'Find and harvest prickly pear fruit — it\'s full of water and sugar.',
        requiredItem: 'prickly_pear_fruit',
        hint: 'Prickly pear grows in low, dry areas. Look for flat cactus pads with fruits.',
      },
      {
        id: 'learn_hydration',
        type: 'dialogue',
        text:
          '📖 Prickly pear fruit contains water and natural sugars. ' +
          'Desert peoples have used it for hydration for thousands of years. ' +
          'The pads (nopalitos) can be cooked and eaten too!',
      },
      {
        id: 'find_barrel',
        type: 'forage',
        text: 'Find a barrel cactus and carefully extract some pulp.',
        requiredItem: 'barrel_cactus_pulp',
        hint: 'Barrel cacti are round and grow in dry areas. Be careful — the pulp is bitter!',
      },
      {
        id: 'learn_risk',
        type: 'dialogue',
        text:
          '📖 Barrel cactus pulp has moisture but it\'s acidic and can cause stomach cramps. ' +
          'Only use it in a real emergency! The prickly pear is much safer.',
      },
      {
        id: 'craft_jelly',
        type: 'craft',
        text: 'Craft Cactus Water Jelly from prickly pear and barrel cactus.',
        requiredRecipe: 'hydration_jelly',
        hint: 'Combine prickly pear fruit and barrel cactus pulp.',
      },
      {
        id: 'quiz_survival',
        type: 'quiz',
        text: 'Which desert plant is the SAFEST source of hydration?',
        choices: [
          { label: 'Prickly pear fruit', correct: true },
          { label: 'Barrel cactus pulp (risky — causes cramps)', correct: false },
          { label: 'Creosote leaves (not for drinking)', correct: false },
        ],
      },
      {
        id: 'complete_survival',
        type: 'complete',
        text:
          'You now know desert survival basics!\n\n' +
          '"Knowing which plants help and which are risky — ' +
          'that\'s the difference between an adventurer and a tourist!"\n\n' +
          '🏜️ You learned: Desert hydration and plant safety',
      },
    ],
    reward: {
      items: [],
      xp: 70,
      zuzubucks: 35,
      reputation: 15,
      unlocks: ['hydration_jelly', 'energy_cake'],
    },
  },

  medicine_balance: {
    id: 'medicine_balance',
    title: 'Balance the Medicine',
    description:
      'Learn the art of desert pharmacology — powerful effects come with risks. ' +
      'Can you use plant medicine wisely without overdoing it?',
    giver: 'mrs_ramirez',
    category: 'ecology',
    prerequisite: 'desert_healer',
    steps: [
      {
        id: 'talk_balance',
        type: 'dialogue',
        text:
          'Zuzu, remember how creosote can help but also hurt? ' +
          'The same is true for many desert medicines. ' +
          'Let\'s learn about balance.',
      },
      {
        id: 'find_ephedra',
        type: 'forage',
        text: 'Find ephedra (Mormon Tea) — a powerful but risky stimulant plant.',
        requiredItem: 'ephedra_stems',
        hint: 'Ephedra is rare. Look in dry, elevated areas.',
      },
      {
        id: 'learn_ephedra',
        type: 'dialogue',
        text:
          '📖 Ephedra contains natural stimulants. ' +
          'It was used for energy and as a decongestant. ' +
          'But it can stress the heart — modern medicine even restricts it. ' +
          'Dose matters: a little helps, too much hurts.',
      },
      {
        id: 'craft_tea',
        type: 'craft',
        text: 'Brew Mormon Tea from the ephedra stems.',
        requiredRecipe: 'stimulant_tea',
        hint: 'Brew the ephedra stems into tea.',
      },
      {
        id: 'find_lavender',
        type: 'forage',
        text: 'Now find desert lavender — a calming counterbalance.',
        requiredItem: 'desert_lavender_flowers',
        hint: 'Desert lavender has purple flowers. Look near moderate-moisture areas.',
      },
      {
        id: 'craft_calm',
        type: 'craft',
        text: 'Brew a Lavender Focus Tea — the gentle opposite of stimulant tea.',
        requiredRecipe: 'calming_tea',
        hint: 'Brew the desert lavender flowers.',
      },
      {
        id: 'quiz_balance',
        type: 'quiz',
        text: 'What\'s the most important principle of plant medicine?',
        choices: [
          { label: 'Dose matters — a little helps, too much hurts', correct: true },
          { label: 'More medicine is always better', correct: false },
          { label: 'Only use one plant at a time', correct: false },
        ],
      },
      {
        id: 'complete_balance',
        type: 'complete',
        text:
          'You understand the balance of desert medicine!\n\n' +
          '"Stimulant AND calming. Healing AND risk. ' +
          'Real knowledge means knowing both sides."\n\n' +
          '⚗️ You learned: Pharmacology — effects AND risks',
      },
    ],
    reward: {
      items: [],
      xp: 100,
      zuzubucks: 50,
      reputation: 25,
      unlocks: ['stimulant_tea', 'calming_tea'],
    },
  },

  // ── Biology Quest Arc ───────────────────────────────────────────────────────

  extract_dna: {
    id: 'extract_dna',
    title: 'The Blueprint of Life',
    description:
      'Learn to extract DNA from desert plants. ' +
      'Discover the molecular instructions inside every living cell!',
    giver: 'mr_chen',
    category: 'biology',
    steps: [
      {
        id: 'talk_dna',
        type: 'dialogue',
        text:
          'Zuzu, every living thing has a blueprint inside it — DNA. ' +
          'We\'ve been using plants for their chemistry, but what if we could ' +
          'read and use their genetic instructions? Let\'s start by extracting DNA!',
      },
      {
        id: 'collect_sample',
        type: 'forage',
        text: 'Collect a tissue sample from an agave plant.',
        requiredItem: 'bio_sample_agave',
        hint: 'Find an agave plant and carefully collect a piece of living tissue.',
      },
      {
        id: 'learn_dna',
        type: 'dialogue',
        text:
          '📖 DNA is a double-stranded molecule shaped like a twisted ladder. ' +
          'Each "rung" is a pair of chemical bases — A pairs with T, G pairs with C. ' +
          'The sequence of these bases is the code — like binary is the code for computers.',
      },
      {
        id: 'extract_dna_step',
        type: 'observe',
        text: 'Extract DNA from your sample. Work quickly — biological molecules degrade!',
        requiredObservation: 'dna_extracted',
        hint: 'Use the biology workbench to run the extraction protocol.',
      },
      {
        id: 'quiz_dna',
        type: 'quiz',
        text: 'What does DNA store?',
        choices: [
          { label: 'Instructions for building proteins', correct: true },
          { label: 'Energy for the cell', correct: false },
          { label: 'Water for the plant', correct: false },
        ],
      },
      {
        id: 'complete_dna',
        type: 'complete',
        text:
          'You extracted DNA from a living plant!\n\n' +
          '"Now you can read nature\'s source code. Every gene is an instruction ' +
          'for building a protein — and proteins do everything."\n\n' +
          '🧬 You learned: DNA — The Blueprint',
      },
    ],
    reward: {
      items: [],
      xp: 80,
      zuzubucks: 40,
      reputation: 20,
    },
  },

  understand_expression: {
    id: 'understand_expression',
    title: 'From Code to Machine',
    description:
      'Simulate gene expression: DNA → RNA → Protein. ' +
      'Understand how genetic information becomes function.',
    giver: 'mr_chen',
    category: 'biology',
    prerequisite: 'extract_dna',
    steps: [
      {
        id: 'talk_expression',
        type: 'dialogue',
        text:
          'Now that you have DNA, let\'s see how cells read it. ' +
          'The cell copies DNA into RNA (transcription), then RNA is read ' +
          'to build a protein (translation). DNA → RNA → Protein!',
      },
      {
        id: 'extract_rna_step',
        type: 'observe',
        text: 'Extract RNA from a fresh sample. RNA degrades fast — hurry!',
        requiredObservation: 'rna_extracted',
        hint: 'RNA is fragile! Use a fresh sample and extract immediately.',
      },
      {
        id: 'learn_rna',
        type: 'dialogue',
        text:
          '📖 RNA is the messenger. It carries a copy of one gene\'s instructions ' +
          'from the DNA to the ribosome — the cell\'s protein factory. ' +
          'RNA is single-stranded and degrades within minutes. ' +
          'That\'s why it\'s harder to extract than DNA!',
      },
      {
        id: 'simulate_expression',
        type: 'observe',
        text: 'Run a gene expression simulation: pick a gene and watch DNA → RNA → Protein.',
        requiredObservation: 'expression_simulated',
        hint: 'Use the biology workbench to simulate expression of a gene from your DNA.',
      },
      {
        id: 'quiz_expression',
        type: 'quiz',
        text: 'What is the correct order of gene expression?',
        choices: [
          { label: 'DNA → RNA → Protein', correct: true },
          { label: 'RNA → DNA → Protein', correct: false },
          { label: 'Protein → RNA → DNA', correct: false },
        ],
      },
      {
        id: 'complete_expression',
        type: 'complete',
        text:
          'You simulated gene expression!\n\n' +
          '"DNA → RNA → Protein. That\'s the central dogma of biology. ' +
          'Now you understand how cells turn code into function."\n\n' +
          '🔬 You learned: Gene Expression',
      },
    ],
    reward: {
      items: [],
      xp: 90,
      zuzubucks: 45,
      reputation: 25,
    },
  },

  engineer_bacteria: {
    id: 'engineer_bacteria',
    title: 'Engineer a Living Factory',
    description:
      'Insert a gene into bacteria and make them produce useful materials. ' +
      'This is real genetic engineering!',
    giver: 'mrs_ramirez',
    category: 'biology',
    prerequisite: 'understand_expression',
    steps: [
      {
        id: 'talk_engineering',
        type: 'dialogue',
        text:
          'Zuzu, what if we could make bacteria produce the chemicals we need ' +
          'for batteries? Instead of extracting from tons of plants, ' +
          'we could grow tiny factories that multiply on their own!',
      },
      {
        id: 'collect_bacteria',
        type: 'forage',
        text: 'Collect desert soil bacteria. They grow fast and are easy to engineer.',
        requiredItem: 'bio_sample_bacteria',
        hint: 'Scoop soil near mesquite roots — it\'s full of bacteria.',
      },
      {
        id: 'learn_engineering',
        type: 'dialogue',
        text:
          '📖 Genetic engineering: cut DNA at a precise location and paste in a new gene. ' +
          'The host organism reads the new gene and produces the new protein. ' +
          'Bacteria are ideal first hosts — they double every 20 minutes. ' +
          'One cell becomes billions overnight!',
      },
      {
        id: 'insert_gene',
        type: 'observe',
        text: 'Create a DNA construct and insert the acid production gene into bacteria.',
        requiredObservation: 'gene_inserted',
        hint: 'Use the biology workbench to build a construct, insert a gene, then create an organism.',
      },
      {
        id: 'run_production',
        type: 'observe',
        text: 'Run a production cycle and see what your engineered bacteria produce!',
        requiredObservation: 'bio_production_complete',
        hint: 'Start a production cycle. The bacteria will grow and produce the target protein.',
      },
      {
        id: 'quiz_engineering',
        type: 'quiz',
        text: 'Why are bacteria good for genetic engineering?',
        choices: [
          { label: 'They grow fast and have simple genetics', correct: true },
          { label: 'They are the largest organisms', correct: false },
          { label: 'They don\'t need food', correct: false },
        ],
      },
      {
        id: 'complete_engineering',
        type: 'complete',
        text:
          'You engineered living bacteria!\n\n' +
          '"You just created a biological factory. These bacteria will multiply ' +
          'and produce materials — feeding into our chemistry pipeline!"\n\n' +
          '🦠 You learned: Genetic Engineering + Organism Design',
      },
    ],
    reward: {
      items: [],
      xp: 120,
      zuzubucks: 60,
      reputation: 30,
    },
  },

  bio_battery_integration: {
    id: 'bio_battery_integration',
    title: 'Biology Meets Engineering',
    description:
      'Use bio-produced materials to enhance your battery system. ' +
      'The ultimate integration: biology → chemistry → energy!',
    giver: 'mr_chen',
    category: 'biology',
    prerequisite: 'engineer_bacteria',
    steps: [
      {
        id: 'talk_integration',
        type: 'dialogue',
        text:
          'Zuzu, your engineered organisms are producing chemicals. ' +
          'Let\'s feed those bio-outputs into the battery chemistry pipeline ' +
          'and see if biology can improve our energy systems!',
      },
      {
        id: 'produce_bio_electrolyte',
        type: 'observe',
        text: 'Use bio-produced ionic compounds to create an enhanced electrolyte.',
        requiredObservation: 'bio_electrolyte_created',
        hint: 'Convert bio-production outputs to chemistry chemicals, then create an electrolyte with higher conductivity.',
      },
      {
        id: 'learn_integration',
        type: 'dialogue',
        text:
          '📖 Engineered bacteria with ion transport genes produce proteins ' +
          'that create channels for ion movement — like tiny tunnels in the electrolyte. ' +
          'This can boost conductivity beyond what plant chemistry alone achieves. ' +
          'Biology + chemistry + engineering = the full pipeline.',
      },
      {
        id: 'quiz_integration',
        type: 'quiz',
        text: 'How does biology improve battery performance?',
        choices: [
          { label: 'Engineered proteins enhance electrolyte conductivity', correct: true },
          { label: 'Bacteria eat the battery to make it lighter', correct: false },
          { label: 'DNA stores electrical charge', correct: false },
        ],
      },
      {
        id: 'complete_integration',
        type: 'complete',
        text:
          'You connected biology to engineering!\n\n' +
          '"Plants → biology → chemistry → battery → e-bike. ' +
          'You\'ve built the full pipeline from desert plants to electric power. ' +
          'That\'s real systems thinking!"\n\n' +
          '⚡ You mastered: The Full Pipeline',
      },
    ],
    reward: {
      items: [],
      xp: 150,
      zuzubucks: 75,
      reputation: 40,
    },
  },

  // ── Science + Ecology Fusion Quests ─────────────────────────────────────────

  the_living_fluid: {
    id: 'the_living_fluid',
    title: 'The Living Basin',
    description:
      'Cross a strange patch of ground near the lake where organic plant secretions ' +
      'create a non-Newtonian fluid surface. Sprint to survive!',
    giver: 'mr_chen',
    category: 'science',
    steps: [
      {
        id: 'talk_fluid',
        type: 'dialogue',
        text:
          'Zuzu, there\'s a strange patch near the lake edge where the ground ' +
          'behaves differently. When you walk slowly, you sink. When you run, ' +
          'it\'s solid! It\'s like oobleck — a non-Newtonian fluid!',
      },
      {
        id: 'learn_fluid',
        type: 'dialogue',
        text:
          '📖 Non-Newtonian fluids change viscosity based on force. ' +
          'Oobleck (cornstarch + water) becomes solid when you hit it hard, ' +
          'but flows like liquid when you\'re gentle. Desert clay mixed with ' +
          'plant secretions creates the same effect naturally!',
      },
      {
        id: 'find_basin',
        type: 'observe',
        text: 'Find the non-Newtonian zone near the lake edge. Look for shimmering ground.',
        requiredObservation: 'fluid_zone_found',
        hint: 'Check the area between the lake shore and dry land — where organic sediment meets clay.',
      },
      {
        id: 'cross_basin',
        type: 'observe',
        text: 'Sprint across the living basin! Slow down and you\'ll sink.',
        requiredObservation: 'basin_crossed',
        hint: 'Hold sprint and run straight across. Don\'t stop!',
      },
      {
        id: 'quiz_fluid',
        type: 'quiz',
        text: 'Why does the ground become solid when you sprint across it?',
        choices: [
          { label: 'High-speed force makes the fluid resist flow (shear thickening)', correct: true },
          { label: 'Running heats the ground and dries it', correct: false },
          { label: 'Your shoes have special grip', correct: false },
        ],
      },
      {
        id: 'complete_fluid',
        type: 'complete',
        text:
          'You crossed the Living Basin!\n\n' +
          '"Shear-thickening fluids resist deformation under force. ' +
          'The faster you push, the harder they resist. ' +
          'That\'s why running works but walking doesn\'t!"\n\n' +
          '💧 You learned: Non-Newtonian Fluid Physics',
      },
    ],
    reward: { items: [], xp: 70, zuzubucks: 35, reputation: 20 },
  },

  desert_infection: {
    id: 'desert_infection',
    title: 'Desert Infection',
    description:
      'An NPC ate contaminated food. Use the right antimicrobial plant ' +
      'to treat the infection — but the wrong choice makes it worse!',
    giver: 'mrs_ramirez',
    category: 'science',
    steps: [
      {
        id: 'talk_infection',
        type: 'dialogue',
        text:
          'Zuzu! I ate some berries I found on the ground and now I feel terrible. ' +
          'My stomach hurts and I have a fever. I think they were contaminated!',
      },
      {
        id: 'learn_contamination',
        type: 'dialogue',
        text:
          '📖 Food contamination happens when bacteria multiply on food. ' +
          'Ground contact, moisture, and heat accelerate bacterial growth. ' +
          'The "5-second rule" is a myth — bacteria transfer instantly! ' +
          'Treatment: antimicrobial plants that kill bacteria.',
      },
      {
        id: 'find_antimicrobial',
        type: 'forage',
        text: 'Find a plant with strong antimicrobial properties to treat the infection.',
        requiredItem: 'creosote_leaves',
        hint: 'Creosote has 50% antimicrobial strength. Its resin kills bacteria on contact.',
      },
      {
        id: 'quiz_contamination',
        type: 'quiz',
        text: 'What factor does NOT increase food contamination?',
        choices: [
          { label: 'Storing food in a dry, cool place', correct: true },
          { label: 'Leaving food on moist ground', correct: false },
          { label: 'Exposing food to heat', correct: false },
        ],
      },
      {
        id: 'treat_infection',
        type: 'use_item',
        text: 'Apply creosote\'s antimicrobial compounds to treat the infection.',
        requiredItem: 'creosote_leaves',
        hint: 'Use the creosote leaves you harvested.',
      },
      {
        id: 'complete_infection',
        type: 'complete',
        text:
          'Mrs. Ramirez is feeling better!\n\n' +
          '"The antimicrobial compounds in creosote killed the bacteria. ' +
          'But remember — creosote is toxic in high doses. ' +
          'The dose makes the poison!"\n\n' +
          '🦠 You learned: Contamination + Antimicrobial Treatment',
      },
    ],
    reward: { items: [], xp: 80, zuzubucks: 40, reputation: 25 },
  },

  one_sided_forest: {
    id: 'one_sided_forest',
    title: 'The One-Sided Forest',
    description:
      'Navigate a cave where space behaves strangely — like a Möbius strip. ' +
      'A rare medicinal plant grows only on these impossible surfaces.',
    giver: 'mr_chen',
    category: 'science',
    steps: [
      {
        id: 'talk_topology',
        type: 'dialogue',
        text:
          'Zuzu, there\'s a cave system in the mountain where the passages ' +
          'loop back on themselves in impossible ways. Explorers say you can ' +
          'walk forward and end up behind where you started — like a Möbius strip!',
      },
      {
        id: 'learn_topology',
        type: 'dialogue',
        text:
          '📖 A Möbius strip is a surface with only ONE side. ' +
          'Take a strip of paper, twist one end 180°, and tape the ends together. ' +
          'Now trace a line along the surface — you\'ll cover "both sides" ' +
          'without lifting your pen! This cave has similar geometry.',
      },
      {
        id: 'enter_cave',
        type: 'observe',
        text: 'Enter the Möbius Cave zone in the mountain area.',
        requiredObservation: 'topology_zone_entered',
        hint: 'The cave entrance is in the upper-right mountain area. Watch for the 🔄 marker.',
      },
      {
        id: 'navigate_loop',
        type: 'observe',
        text: 'Walk through the cave and experience the spatial inversion.',
        requiredObservation: 'topology_loop_completed',
        hint: 'Keep walking forward. After a while, you\'ll notice you\'re inverted!',
      },
      {
        id: 'quiz_topology',
        type: 'quiz',
        text: 'What makes a Möbius strip special?',
        choices: [
          { label: 'It has only one side and one edge', correct: true },
          { label: 'It\'s the strongest shape in nature', correct: false },
          { label: 'It can hold water on both sides', correct: false },
        ],
      },
      {
        id: 'complete_topology',
        type: 'complete',
        text:
          'You navigated the Möbius Cave!\n\n' +
          '"Topology studies shapes and how they connect — ' +
          'not size or angle, but structure. A Möbius strip, a donut, ' +
          'and a coffee mug are all \'the same\' to a topologist!"\n\n' +
          '🔄 You learned: Topology — The Math of Shape',
      },
    ],
    reward: { items: [], xp: 90, zuzubucks: 45, reputation: 30 },
  },

  toxic_knowledge: {
    id: 'toxic_knowledge',
    title: 'Toxic Knowledge',
    description:
      'Learn the most important principle of pharmacology: ' +
      'the dose makes the poison. Misuse a plant, experience the ' +
      'consequences, then find the right balance.',
    giver: 'mrs_ramirez',
    category: 'science',
    prerequisite: 'desert_healer',
    steps: [
      {
        id: 'talk_dose',
        type: 'dialogue',
        text:
          'Zuzu, I\'ve been studying desert medicine. ' +
          'Everything has a dose curve — too little does nothing, ' +
          'the right amount heals, too much harms. Let\'s experiment carefully.',
      },
      {
        id: 'forage_ephedra',
        type: 'forage',
        text: 'Find ephedra (Mormon Tea) — a powerful stimulant plant.',
        requiredItem: 'ephedra_stems',
        hint: 'Ephedra is rare. Look in dry, elevated areas.',
      },
      {
        id: 'learn_dose',
        type: 'dialogue',
        text:
          '📖 Paracelsus (1493–1541) said: "The dose makes the poison." ' +
          'Water can kill you if you drink too much (hyponatremia). ' +
          'Snake venom can heal in tiny amounts (anticoagulants). ' +
          'Every substance has a therapeutic window — the range where ' +
          'benefit outweighs risk.',
      },
      {
        id: 'quiz_dose',
        type: 'quiz',
        text: 'What is the "therapeutic window"?',
        choices: [
          { label: 'The dose range where medicine helps more than it hurts', correct: true },
          { label: 'The time of day when medicine works best', correct: false },
          { label: 'A window you open to let fresh air heal you', correct: false },
        ],
      },
      {
        id: 'learn_overdose',
        type: 'dialogue',
        text:
          '📖 At high doses of ephedra: heart rate spikes, blood pressure rises, ' +
          'the body overheats. The same compounds that give energy at low doses ' +
          'become dangerous stimulants at high doses. ' +
          'This is why pharmacology is a science, not guesswork.',
      },
      {
        id: 'complete_dose',
        type: 'complete',
        text:
          'You understand dose-response relationships!\n\n' +
          '"Low dose = mild effect. Medium = therapeutic. High = toxic. ' +
          'The curve applies to everything — medicine, food, even exercise. ' +
          'Knowing the curve is what separates a healer from a poisoner."\n\n' +
          '⚗️ You learned: Pharmacology — The Dose Makes the Poison',
      },
    ],
    reward: { items: [], xp: 100, zuzubucks: 50, reputation: 30 },
  },

  invisible_map: {
    id: 'invisible_map',
    title: 'The Invisible Map',
    description:
      'Navigate without UI — your map, markers, and HUD fade away. ' +
      'Only your memory of the desert\'s ecology can guide you.',
    giver: 'mr_chen',
    category: 'science',
    prerequisite: 'food_chain_tracker',
    steps: [
      {
        id: 'talk_memory',
        type: 'dialogue',
        text:
          'Zuzu, what if your phone died in the desert? ' +
          'No map, no markers, no compass. Could you find water? ' +
          'Could you find food? Let\'s find out — I\'m going to challenge ' +
          'your ecological memory.',
      },
      {
        id: 'learn_memory',
        type: 'dialogue',
        text:
          '📖 "Digital amnesia" is when we forget things because we rely ' +
          'on devices to remember for us. GPS replaced our sense of direction. ' +
          'Contacts replaced phone numbers. Search replaced knowledge. ' +
          'But in the desert, only what\'s in your head can save you.',
      },
      {
        id: 'enter_dead_zone',
        type: 'observe',
        text: 'Enter the signal dead zone where your UI fades. Find water using only memory.',
        requiredObservation: 'memory_zone_entered',
        hint: 'Head toward areas with high signal noise — near the road corridors or mountain. Your HUD will fade.',
      },
      {
        id: 'find_water_blind',
        type: 'observe',
        text: 'Navigate to a water source without your map or markers.',
        requiredObservation: 'water_found_blind',
        hint: 'Remember where the lake and pool are. Use landmarks you\'ve memorized.',
      },
      {
        id: 'quiz_memory',
        type: 'quiz',
        text: 'What is "digital amnesia"?',
        choices: [
          { label: 'Forgetting information because devices remember it for us', correct: true },
          { label: 'When your phone\'s memory is full', correct: false },
          { label: 'A computer virus that deletes files', correct: false },
        ],
      },
      {
        id: 'complete_memory',
        type: 'complete',
        text:
          'You navigated the desert from memory!\n\n' +
          '"Your brain built a map from exploration — mesquite near water, ' +
          'creosote in dry zones, the lake to the northeast. ' +
          'That knowledge can\'t be deleted or run out of battery."\n\n' +
          '🧠 You learned: Cognitive Ecology — Memory vs. Technology',
      },
    ],
    reward: { items: [], xp: 110, zuzubucks: 55, reputation: 35 },
  },

  // ── Material Science Quests ─────────────────────────────────────────────────

  bridge_collapse: {
    id: 'bridge_collapse',
    title: 'The Bridge That Broke',
    description:
      'Collect, weigh, and test real materials to build a bridge. ' +
      'Choose the wrong one and it collapses — choose wisely!',
    giver: 'mr_chen',
    category: 'materials',
    learningGoal: 'Material selection through hands-on testing and comparison.',
    systemsUsed: ['materials', 'mining', 'simulation'],
    steps: [
      // --- Act 1: The Problem ---
      {
        id: 'talk_bridge',
        type: 'dialogue',
        text:
          'Zuzu, there\'s a dry wash that floods during monsoon. ' +
          'We need a bridge strong enough to hold a bike and rider — ' +
          'about 100 kg of load. Let\'s find the right material.',
      },
      {
        id: 'learn_stress',
        type: 'dialogue',
        text:
          '📖 Stress = Force ÷ Area. It tells you how hard the material is working. ' +
          'Strain = how much it stretches. Below the yield point, it springs back. ' +
          'Above it — permanent damage. Beyond the fracture point — snap!',
      },
      {
        id: 'quiz_stress',
        type: 'quiz',
        text: 'What happens when force exceeds a material\'s yield strength?',
        choices: [
          { label: 'The material deforms permanently and doesn\'t spring back', correct: true },
          { label: 'The material becomes stronger from the pressure', correct: false },
          { label: 'The material absorbs the force with no change', correct: false },
        ],
      },

      // --- Act 2: Collect Materials ---
      {
        id: 'collect_instruction',
        type: 'dialogue',
        text:
          '"A real engineer doesn\'t guess — they test. ' +
          'Go collect three different materials so we can compare them. ' +
          'Try the mine for copper ore, forage for mesquite wood, ' +
          'and check the garage for steel scraps."',
      },
      {
        id: 'forage_wood',
        type: 'forage',
        text: 'Collect mesquite wood — a dense desert hardwood. Find it near mesquite trees.',
        requiredItem: 'mesquite_wood_sample',
        hint: 'Mesquite grows in dry, low areas. Look for the twisted trunks.',
      },
      {
        id: 'collect_copper',
        type: 'forage',
        text: 'Mine copper ore from an exposed rock face. Arizona is copper country!',
        requiredItem: 'copper_ore_sample',
        hint: 'Ride to the Abandoned Copper Mine — surface or deep veins both yield ore. The mountain trail also has copper if you have been there.',
      },
      {
        id: 'collect_steel',
        type: 'use_item',
        text: 'Grab a steel bracket from the garage toolbox.',
        requiredItem: 'steel_sample',
        hint: 'Check the garage workbench — Mr. Chen keeps spare brackets.',
      },

      // --- Act 3: Weigh and Measure ---
      {
        id: 'weigh_instruction',
        type: 'dialogue',
        text:
          '"Good — three materials collected. Now let\'s weigh them. ' +
          'Weight matters for a bridge — too heavy and the supports can\'t hold it up."',
      },
      {
        id: 'quiz_weight',
        type: 'quiz',
        text:
          'You weighed each sample. Results:\n' +
          '  Mesquite: 0.83 g/cm³\n' +
          '  Copper: 8.9 g/cm³\n' +
          '  Steel: 7.8 g/cm³\n\n' +
          'Which is lightest per unit volume?',
        choices: [
          { label: 'Mesquite wood (0.83 g/cm³)', correct: true },
          { label: 'Copper (8.9 g/cm³)', correct: false },
          { label: 'Steel (7.8 g/cm³)', correct: false },
          { label: 'They all weigh the same', correct: false },
        ],
      },

      // --- Act 4: Strength Testing ---
      {
        id: 'strength_intro',
        type: 'dialogue',
        text:
          '"Light is good, but only if it\'s also strong enough. ' +
          'Let\'s test each material\'s strength. I\'ll apply increasing load ' +
          'until each one breaks."',
      },
      {
        id: 'test_material',
        type: 'observe',
        text: 'Watch Mr. Chen run load tests on all three materials. Note when each one fails.',
        requiredObservation: 'load_test_completed',
        hint: 'Use the material testing bench to stress each sample.',
        scene: 'MaterialLabScene',
      },
      {
        id: 'quiz_strength',
        type: 'quiz',
        text:
          'Load test results (strength rating 0–100%):\n' +
          '  Mesquite: 55% — fractures under moderate load\n' +
          '  Copper: 35% — bends and deforms easily\n' +
          '  Steel: 85% — holds until very high force\n\n' +
          'Which material is strongest?',
        choices: [
          { label: 'Steel (85% strength)', correct: true },
          { label: 'Mesquite wood (55% strength)', correct: false },
          { label: 'Copper (35% strength)', correct: false },
          { label: 'They\'re all the same under load', correct: false },
        ],
      },

      // --- Act 5: The Tradeoff ---
      {
        id: 'tradeoff_lesson',
        type: 'dialogue',
        text:
          '📖 Here\'s the engineer\'s dilemma:\n' +
          '  Steel: strongest (85%) but very heavy (7.8 g/cm³)\n' +
          '  Mesquite: medium strength (55%) and light (0.83 g/cm³)\n' +
          '  Copper: weakest (35%) and heavy (8.9 g/cm³) — worst of both!\n\n' +
          'Strength-to-weight ratio tells the real story.',
      },
      {
        id: 'quiz_choice',
        type: 'quiz',
        text:
          'Your bridge must hold 100 kg but span 2 meters. ' +
          'A heavy bridge needs stronger supports. ' +
          'Given the data, which is the BEST choice for this bridge?',
        choices: [
          { label: 'Mesquite — strong enough (55%) and 10× lighter than steel', correct: true },
          { label: 'Steel — strongest, weight doesn\'t matter', correct: false },
          { label: 'Copper — good conductor so it must be strong', correct: false },
          { label: 'Mix all three together', correct: false },
        ],
      },

      // --- Act 6: Build and Validate ---
      {
        id: 'build_bridge',
        type: 'observe',
        text: 'Build the bridge with your chosen material and test it with a loaded bike!',
        requiredObservation: 'bridge_built',
        hint: 'Place the mesquite beams across the wash and secure them.',
      },
      {
        id: 'complete_bridge',
        type: 'complete',
        text:
          'The mesquite bridge holds!\n\n' +
          '"You didn\'t pick the strongest material — you picked the RIGHT one. ' +
          'You collected, weighed, tested, and compared. ' +
          'That\'s materials engineering."\n\n' +
          '🔩 You learned: Stress, Strain, Density, and Material Selection\n' +
          '⛏️ Mining unlocked — explore Arizona\'s resources!',
      },
    ],
    reward: {
      items: ['pickaxe'],
      xp: 120,
      zuzubucks: 60,
      reputation: 25,
    },
  },

  heat_failure: {
    id: 'heat_failure',
    title: 'When Heat Wins',
    description:
      'Your e-bike motor overheats in the desert sun. ' +
      'Learn why temperature weakens materials and how expansion causes failure.',
    giver: 'mrs_ramirez',
    category: 'materials',
    prerequisite: 'bridge_collapse',
    steps: [
      {
        id: 'talk_heat',
        type: 'dialogue',
        text:
          'Zuzu! My e-bike controller stopped working after riding in 110°F heat. ' +
          'The plastic casing warped and the solder joints cracked. Why?',
      },
      {
        id: 'learn_thermal',
        type: 'dialogue',
        text:
          '📖 Heat gives atoms energy to vibrate. More vibration = weaker bonds. ' +
          'Materials expand when heated — different materials expand at different rates. ' +
          'When steel bolts hold a plastic case, heat makes the plastic grow ' +
          'faster than the steel → cracks at the joint.',
      },
      {
        id: 'quiz_thermal',
        type: 'quiz',
        text: 'Why do joints fail when two different materials are heated together?',
        choices: [
          { label: 'They expand at different rates, creating stress at the connection', correct: true },
          { label: 'Heat makes both materials shrink equally', correct: false },
          { label: 'Temperature has no effect on solid materials', correct: false },
        ],
      },
      {
        id: 'observe_expansion',
        type: 'observe',
        text: 'Visit the thermal lab and run the heating test on all three rods. Watch how each material expands.',
        requiredObservation: 'thermal_expansion_observed',
        hint: "Mrs. Ramirez's thermal lab is in Zuzu's garage — there's a doorway near the workbench. Test all three rods.",
        scene: 'ThermalRigScene',
      },
      {
        id: 'learn_solution',
        type: 'dialogue',
        text:
          '📖 Solutions: (1) Use materials with similar expansion rates. ' +
          '(2) Add thermal insulation between dissimilar materials. ' +
          '(3) Use flexible joints that allow movement. ' +
          '(4) Choose materials with high melting/char points for hot environments.',
      },
      {
        id: 'complete_heat',
        type: 'complete',
        text:
          'You understand thermal material failure!\n\n' +
          '"In the desert, heat isn\'t just uncomfortable — ' +
          'it\'s an engineering constraint. Every material has a temperature limit."\n\n' +
          '🌡️ You learned: Thermal Expansion and Material Limits',
      },
    ],
    reward: { items: [], xp: 85, zuzubucks: 40, reputation: 20 },
  },

  perfect_composite: {
    id: 'perfect_composite',
    title: 'The Perfect Composite',
    description:
      'Combine plant-derived materials to create a composite stronger ' +
      'than either component alone. Discover the principle behind carbon fiber.',
    giver: 'mr_chen',
    category: 'materials',
    prerequisite: 'bridge_collapse',
    steps: [
      {
        id: 'talk_composite',
        type: 'dialogue',
        text:
          'Zuzu, have you heard of carbon fiber? It\'s stronger than steel ' +
          'but 5× lighter. The secret: it\'s a COMPOSITE — ' +
          'carbon fibers embedded in a polymer matrix. ' +
          'We can make something similar from desert plants!',
      },
      {
        id: 'learn_composite',
        type: 'dialogue',
        text:
          '📖 A composite combines two materials to get properties ' +
          'neither has alone. Fiberglass = glass fiber (strong, brittle) + ' +
          'resin (flexible, weak). Together: strong AND flexible. ' +
          'The fiber carries load, the matrix holds the fibers in place.',
      },
      {
        id: 'gather_fiber',
        type: 'forage',
        text: 'Harvest agave fiber — the "strong, stiff" component.',
        requiredItem: 'agave_fiber',
        hint: 'Find agave plants in the desert.',
      },
      {
        id: 'gather_resin',
        type: 'forage',
        text: 'Harvest creosote resin — the "flexible, binding" component.',
        requiredItem: 'creosote_leaves',
        hint: 'Find creosote bushes. The resin coats the leaves.',
      },
      {
        id: 'combine_materials',
        type: 'observe',
        text: 'Combine agave fiber + creosote resin to create a plant-based composite.',
        requiredObservation: 'composite_created',
        hint: 'Use the material workbench to combine them. Watch for the synergy bonus!',
      },
      {
        id: 'quiz_composite',
        type: 'quiz',
        text: 'Why is a fiber + resin composite stronger than either material alone?',
        choices: [
          { label: 'Fiber carries load while resin holds fibers together and distributes stress', correct: true },
          { label: 'Mixing any two materials always doubles strength', correct: false },
          { label: 'The resin melts the fiber into a single material', correct: false },
        ],
      },
      {
        id: 'complete_composite',
        type: 'complete',
        text:
          'You created a plant-based composite!\n\n' +
          '"Fiber + resin = the same principle as carbon fiber, fiberglass, ' +
          'and reinforced concrete. Nature figured this out long ago: ' +
          'bone is a composite of collagen fiber + mineral matrix!"\n\n' +
          '🔀 You learned: Composite Materials — Stronger Together',
      },
    ],
    reward: { items: [], xp: 100, zuzubucks: 50, reputation: 30 },
  },

  // ── Unified Material Science Quests ─────────────────────────────────────────

  boat_puzzle: {
    id: 'boat_puzzle',
    title: 'The Floating Challenge',
    description:
      'Build a raft to cross the lake. Choose wrong materials → sink. ' +
      'Load cargo unevenly → capsize. Learn buoyancy, density, and stability.',
    giver: 'mr_chen',
    category: 'materials',
    steps: [
      {
        id: 'talk_boat',
        type: 'dialogue',
        text:
          'Zuzu, I need to get supplies across the lake. ' +
          'We need to build a raft — but not everything floats! ' +
          'The material has to be less dense than water.',
      },
      {
        id: 'learn_buoyancy',
        type: 'dialogue',
        text:
          '📖 Archimedes\' Principle: an object floats if it displaces enough water ' +
          'to equal its own weight. Density is the key — materials denser than water sink. ' +
          'Steel (7.8 g/cm³) sinks. Wood (0.83 g/cm³) floats. ' +
          'But a steel SHIP floats because its hollow shape displaces more water than its weight!',
      },
      {
        id: 'quiz_buoyancy',
        type: 'quiz',
        text: 'Why does wood float but steel sinks?',
        choices: [
          { label: 'Wood is less dense than water, steel is more dense', correct: true },
          { label: 'Wood is lighter because it has air holes', correct: false },
          { label: 'Steel is magnetic and water repels it', correct: false },
        ],
      },
      {
        id: 'test_raft',
        type: 'observe',
        text: 'Test your raft design in the simulation. Make sure it floats AND stays stable with cargo!',
        requiredObservation: 'buoyancy_test_passed',
        hint: 'Use mesquite wood for the hull. Load cargo evenly — offset cargo causes tilt!',
      },
      {
        id: 'learn_stability',
        type: 'dialogue',
        text:
          '📖 Stability: even if a boat floats, uneven cargo shifts the center of gravity ' +
          'away from the center of buoyancy. Result: tilt → capsize. ' +
          'Wider hulls and lower cargo = more stable.',
      },
      {
        id: 'complete_boat',
        type: 'complete',
        text:
          'Your raft crossed the lake!\n\n' +
          '"Density, displacement, and stability — three concepts that kept sailors ' +
          'alive for 10,000 years. And you just learned them by building a raft!"\n\n' +
          '🚣 You learned: Buoyancy & Stability',
      },
    ],
    reward: { items: [], xp: 90, zuzubucks: 45, reputation: 25 },
  },

  engine_cleaning: {
    id: 'engine_cleaning',
    title: 'The Clogged Engine',
    description:
      'Mr. Chen\'s motor is clogged with oil and grime. ' +
      'Use surfactant chemistry to clean it — and learn about interfacial science.',
    giver: 'mr_chen',
    category: 'materials',
    steps: [
      {
        id: 'talk_clean',
        type: 'dialogue',
        text:
          'My e-bike motor is running rough — oily buildup on the windings. ' +
          'Water alone won\'t remove oil. We need something that works ' +
          'at the interface between oil and water.',
      },
      {
        id: 'learn_surfactant',
        type: 'dialogue',
        text:
          '📖 Surfactants are molecules with two personalities: one end loves water, ' +
          'the other loves oil. At the oil-water boundary, they wedge in between, ' +
          'breaking the oil into tiny droplets that wash away. ' +
          'This is why soap works — and yucca root has been used as soap for millennia.',
      },
      {
        id: 'gather_yucca',
        type: 'forage',
        text: 'Harvest yucca root — a natural source of saponins (surfactants).',
        requiredItem: 'yucca_root',
        hint: 'Find yucca plants. The root contains natural soap compounds.',
      },
      {
        id: 'quiz_surfactant',
        type: 'quiz',
        text: 'How do surfactants remove oil from surfaces?',
        choices: [
          { label: 'They wedge between oil and water, breaking oil into washable droplets', correct: true },
          { label: 'They dissolve the metal surface under the oil', correct: false },
          { label: 'They heat up the oil until it evaporates', correct: false },
        ],
      },
      {
        id: 'clean_motor',
        type: 'observe',
        text: 'Apply the yucca surfactant to the motor to reduce contamination.',
        requiredObservation: 'motor_cleaned',
        hint: 'Use the surfactant on the clogged motor. Watch the contamination drop.',
      },
      {
        id: 'complete_clean',
        type: 'complete',
        text:
          'The motor runs smooth again!\n\n' +
          '"Interfacial chemistry — the science of boundaries between phases. ' +
          'Surfactants, capillary action, wetting — all happen at interfaces. ' +
          'The desert provides natural surfactants that work as well as synthetic soap!"\n\n' +
          '🧴 You learned: Surfactants & Interfacial Chemistry',
      },
    ],
    reward: { items: [], xp: 85, zuzubucks: 40, reputation: 20 },
  },

  desert_coating: {
    id: 'desert_coating',
    title: 'Surviving the Desert Sun',
    description:
      'Protect your e-bike components from extreme desert heat and UV. ' +
      'Craft a protective coating from plant materials.',
    giver: 'mrs_ramirez',
    category: 'materials',
    steps: [
      {
        id: 'talk_coating',
        type: 'dialogue',
        text:
          'Zuzu, the desert sun is destroying my bike\'s plastic parts. ' +
          'They\'re cracking and fading. We need a protective coating ' +
          'that reflects heat and blocks UV.',
      },
      {
        id: 'learn_coating',
        type: 'dialogue',
        text:
          '📖 Coatings protect by creating a barrier between a material and its environment. ' +
          'Reflective coatings bounce heat. Hydrophobic coatings repel water. ' +
          'Antimicrobial coatings prevent biological fouling. ' +
          'Coverage must be complete — even a small gap lets damage in.',
      },
      {
        id: 'gather_resin',
        type: 'forage',
        text: 'Harvest creosote resin — a natural UV-resistant, waterproof coating.',
        requiredItem: 'creosote_leaves',
        hint: 'Creosote resin has 85% coverage and excellent contamination resistance.',
      },
      {
        id: 'gather_wax',
        type: 'forage',
        text: 'Harvest jojoba wax — a stable moisture barrier.',
        requiredItem: 'jojoba_seeds',
        hint: 'Jojoba seeds produce liquid wax that doesn\'t go rancid.',
      },
      {
        id: 'apply_coating',
        type: 'observe',
        text: 'Combine and apply the resin-wax coating to the bike components.',
        requiredObservation: 'coating_applied',
        hint: 'Use the material workbench to combine resin + wax into a protective coating.',
      },
      {
        id: 'quiz_coating',
        type: 'quiz',
        text: 'Why does even a small gap in coating coverage cause problems?',
        choices: [
          { label: 'Damage concentrates at the gap — corrosion and heat attack the exposed spot', correct: true },
          { label: 'The coating is stronger at the edges of the gap', correct: false },
          { label: 'Small gaps let the material breathe, which is good', correct: false },
        ],
      },
      {
        id: 'complete_coating',
        type: 'complete',
        text:
          'The bike is protected!\n\n' +
          '"A coating doesn\'t add strength — it adds protection. ' +
          'Like sunscreen for materials: blocks UV, reflects heat, repels water. ' +
          'Nature has been doing this for millions of years — every leaf has a coating."\n\n' +
          '🛡️ You learned: Protective Coatings',
      },
    ],
    reward: { items: [], xp: 80, zuzubucks: 40, reputation: 20 },
  },
};

export default QUESTS;
