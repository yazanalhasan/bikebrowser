/**
 * NPC Dialogue Templates — deterministic fallback content.
 *
 * Provides structured dialogue per quest/step/band so the game works
 * fully without AI. Also serves as the baseline that AI enriches.
 *
 * Schema per entry:
 *   spokenLine       - short line for TTS
 *   captionLine      - visible text (can be slightly longer)
 *   hintLine         - help text if player is stuck
 *   questionPrompt   - (quiz steps) question text
 *   answerChoices    - (quiz steps) array of { label, correct }
 *   explanationLine  - feedback after answering
 *   encouragementLine - positive reinforcement
 */

const TEMPLATES = {
  flat_tire_repair: {
    talk: {
      starter: {
        spokenLine: "Hi Zuzu! My bike tire is flat. Can you help me fix it?",
        captionLine: "Hi Zuzu! My bike tire is flat. Can you help me fix it?",
        hintLine: "Mrs. Ramirez needs help with her bike!",
        encouragementLine: "You're so kind to help!",
      },
      guided: {
        spokenLine: "Oh hi Zuzu! My bike tire went completely flat overnight. I don't know what happened — could you take a look?",
        captionLine: "Oh hi Zuzu! My bike tire went completely flat overnight. I don't know what happened — could you take a look?",
        hintLine: "Something might be stuck in the tire.",
        encouragementLine: "I knew I could count on you!",
      },
      builder: {
        spokenLine: "Hey Zuzu! My tire lost all its air overnight. I checked the valve but it seems fine. I think something punctured the tire — want to investigate?",
        captionLine: "Hey Zuzu! My tire lost all its air overnight. I checked the valve but it seems fine. I think something punctured the tire — want to investigate?",
        hintLine: "Look carefully at the tire surface for anything stuck in it.",
        encouragementLine: "Great detective work, Zuzu!",
      },
      advanced: {
        spokenLine: "Hi Zuzu! My tire pressure dropped to zero overnight, which usually means a puncture rather than a slow leak from the valve. Could you inspect the tire and figure out the cause?",
        captionLine: "Hi Zuzu! My tire pressure dropped to zero overnight, which usually means a puncture rather than a slow leak from the valve. Could you inspect the tire and figure out the cause?",
        hintLine: "Consider: what could cause a sudden vs gradual loss of pressure?",
        encouragementLine: "Excellent diagnostic thinking!",
      },
    },
    inspect: {
      starter: {
        spokenLine: "Look! There's a nail in the tire. That's why it's flat!",
        captionLine: "Look! There's a nail in the tire. That's why it's flat!",
        hintLine: "The nail made a hole. Air leaked out.",
        encouragementLine: "Good eyes!",
      },
      guided: {
        spokenLine: "Look closely at the tire. You can see a small nail stuck in it! That's what caused the flat. We need to remove the tire first.",
        captionLine: "Look closely at the tire. You can see a small nail stuck in it! That's what caused the flat. We need to remove the tire first.",
        hintLine: "The nail poked through and let the air escape.",
        encouragementLine: "Nice find!",
      },
      builder: {
        spokenLine: "There's a nail embedded in the tire tread. When it punctured through to the inner tube, the air escaped through the hole. Let's remove the tire to access the tube.",
        captionLine: "There's a nail embedded in the tire tread. When it punctured through to the inner tube, the air escaped through the hole. Let's remove the tire to access the tube.",
        hintLine: "The nail penetrated both the outer tire and the inner tube.",
        encouragementLine: "Sharp observation!",
      },
      advanced: {
        spokenLine: "I can see a nail has penetrated the tire casing and punctured the inner tube underneath. This is a classic penetration flat — the nail created a pathway for air to escape from the pressurized tube.",
        captionLine: "I can see a nail has penetrated the tire casing and punctured the inner tube underneath. This is a classic penetration flat — the nail created a pathway for air to escape from the pressurized tube.",
        hintLine: "Think about the two layers: outer tire (protection) and inner tube (holds air).",
        encouragementLine: "Excellent analysis of the failure mode!",
      },
    },
    reading: {
      starter: {
        spokenLine: "A bike tire has two parts. The outside rubber and an air tube inside. When the nail poked through, the air came out!",
        captionLine: "A bike tire has two parts:\n- The outer tire (tough rubber)\n- The inner tube (holds the air)\n\nThe nail poked through both!",
        hintLine: "The inner tube is like a balloon inside the tire.",
        encouragementLine: "Now you know how tires work!",
      },
      guided: {
        spokenLine: "Quick tip: A bicycle tire has two parts — the outer tire that touches the road, and the inner tube filled with air inside. When a nail pokes through both, the air leaks out.",
        captionLine: "Quick tip: A bicycle tire has two parts — the outer tire (the tough rubber that touches the road) and the inner tube (a softer tube filled with air inside the tire). When a nail pokes through both layers, the air leaks out of the inner tube and the tire goes flat.",
        hintLine: "The outer tire protects the inner tube from most things on the road.",
        encouragementLine: "Understanding the parts helps you fix them!",
      },
      builder: {
        spokenLine: "The outer tire is made of tough rubber that grips the road and protects the inner tube. The inner tube is a flexible rubber tube that holds pressurized air. A puncture in both layers causes a flat.",
        captionLine: "The outer tire is made of tough rubber that grips the road and protects the inner tube. The inner tube is a flexible rubber tube that holds pressurized air. When something sharp penetrates both layers, air escapes from the inner tube — causing a flat.",
        hintLine: "Think of it like a balloon inside a shoe — the shoe protects, the balloon holds air.",
        encouragementLine: "You're building real mechanical understanding!",
      },
      advanced: {
        spokenLine: "The tire system has two components working together: the outer tire provides structural protection and road grip, while the inner tube maintains air pressure. Puncture resistance depends on tire thickness and material. Most road flats are penetration flats from sharp debris.",
        captionLine: "The tire system has two components:\n- Outer tire: structural protection + road grip\n- Inner tube: maintains air pressure\n\nPuncture resistance depends on tire thickness and material. Most road flats come from sharp debris penetrating both layers.",
        hintLine: "Consider why some tires are more puncture-resistant than others.",
        encouragementLine: "Great mechanical reasoning!",
      },
    },
    use_lever: {
      starter: {
        spokenLine: "Use your tire lever to take the tire off!",
        captionLine: "Use the tire lever to carefully remove the tire from the rim.",
        hintLine: "Check your toolbox — you have a tire lever.",
        encouragementLine: "Perfect tool choice!",
      },
      guided: {
        spokenLine: "Now use the tire lever to carefully remove the tire from the rim so we can get to the inner tube.",
        captionLine: "Use the tire lever to carefully remove the tire from the rim. Hook the lever under the tire bead and push it off the rim.",
        hintLine: "A tire lever hooks under the edge of the tire to pry it off.",
        encouragementLine: "Nicely done!",
      },
      builder: {
        spokenLine: "Insert the tire lever under the tire bead — that's the edge that hooks onto the rim — and lever it off. This gives us access to the punctured inner tube inside.",
        captionLine: "Insert the tire lever under the tire bead (the edge that hooks onto the rim) and lever it off. This gives us access to the punctured inner tube inside.",
        hintLine: "The tire bead is the reinforced edge that sits in the rim channel.",
        encouragementLine: "Great technique!",
      },
      advanced: {
        spokenLine: "Hook the tire lever under the tire bead opposite the valve stem, and work it around the rim to unseat one side. This technique minimizes the risk of pinching the tube during removal.",
        captionLine: "Hook the tire lever under the tire bead opposite the valve stem, and work it around the rim to unseat one side. Starting opposite the valve minimizes the risk of pinching the tube during removal.",
        hintLine: "Starting opposite the valve prevents damage to the valve stem.",
        encouragementLine: "Professional technique!",
      },
    },
    quiz: {
      starter: {
        spokenLine: "Quick question! Why does a tire go flat?",
        captionLine: "Why does a tire go flat?",
        questionPrompt: "Why does a tire go flat?",
        answerChoices: [
          { label: 'A hole lets the air out', correct: true },
          { label: 'The wheel is too heavy', correct: false },
          { label: 'The sun made the tire sleepy', correct: false },
        ],
        hintLine: "Think about what happens when air has a way to escape.",
        explanationLine: "Right! A hole lets the air escape from the inner tube.",
        encouragementLine: "You got it!",
      },
      guided: {
        spokenLine: "Before we patch the tube, let me ask you something. Why does a tire go flat?",
        captionLine: "Before we patch the tube, quiz time!\n\nWhy does a tire go flat?",
        questionPrompt: "Why does a tire go flat?",
        answerChoices: [
          { label: 'A hole lets the air out', correct: true },
          { label: 'The wheel is too heavy', correct: false },
          { label: 'The sun made the tire sleepy', correct: false },
        ],
        hintLine: "The inner tube is like a balloon — what happens when a balloon gets a hole?",
        explanationLine: "Exactly! When the inner tube gets a hole, the pressurized air escapes, and the tire can't support the bike's weight anymore.",
        encouragementLine: "Great thinking!",
      },
      builder: {
        spokenLine: "Think about what we just learned. Why does a tire go flat when something punctures it?",
        captionLine: "Think about what we just learned.\n\nWhy does a tire go flat when something punctures it?",
        questionPrompt: "Why does a tire go flat when something punctures it?",
        answerChoices: [
          { label: 'A hole lets the pressurized air escape from the inner tube', correct: true },
          { label: 'The wheel becomes too heavy to turn', correct: false },
          { label: 'The rubber melts from friction', correct: false },
        ],
        hintLine: "What role does air pressure play in keeping the tire firm?",
        explanationLine: "The inner tube holds air under pressure. A puncture creates an exit path, and the pressure forces air out through the hole until the tube deflates.",
        encouragementLine: "Solid reasoning!",
      },
      advanced: {
        spokenLine: "Here's a question that connects what we've observed. Why does a puncture cause a tire to go flat?",
        captionLine: "Why does a puncture cause a tire to go flat?",
        questionPrompt: "Why does a puncture cause a tire to go flat?",
        answerChoices: [
          { label: 'The puncture allows pressurized air to escape from the inner tube', correct: true },
          { label: 'The nail blocks the valve from letting air in', correct: false },
          { label: 'The rubber degrades when exposed to metal', correct: false },
        ],
        hintLine: "Think about the pressure differential between inside the tube and the outside air.",
        explanationLine: "The inner tube is pressurized well above atmospheric pressure. A puncture creates an opening, and the pressure difference drives air out until the pressures equalize — leaving the tire flat.",
        encouragementLine: "Excellent understanding of pressure dynamics!",
      },
    },
    use_patch: {
      starter: {
        spokenLine: "Now use your patch kit to fix the hole!",
        captionLine: "Use the patch kit to seal the hole in the inner tube.",
        hintLine: "You have a patch kit in your toolbox.",
        encouragementLine: "Nice patching!",
      },
      guided: {
        spokenLine: "Great job! Now use the patch kit to seal the hole in the inner tube. Clean the area first, then apply the patch firmly.",
        captionLine: "Great job! Now use the patch kit to seal the hole in the inner tube.",
        hintLine: "Clean the area around the hole before applying the patch for a better seal.",
        encouragementLine: "Well done!",
      },
      builder: {
        spokenLine: "Apply the patch kit. First roughen the area around the puncture with the sandpaper, apply cement, wait for it to get tacky, then press the patch on firmly.",
        captionLine: "Apply the patch kit:\n1. Roughen the area around the puncture\n2. Apply rubber cement\n3. Wait until tacky\n4. Press patch on firmly",
        hintLine: "Roughening the surface helps the cement bond better.",
        encouragementLine: "Textbook patch job!",
      },
      advanced: {
        spokenLine: "Use the patch kit following the proper procedure: abrade the surface for adhesion, apply vulcanizing cement, let it cure until tacky, then apply firm pressure to the patch. The vulcanization process chemically bonds the patch to the tube.",
        captionLine: "Patch procedure:\n1. Abrade surface (improves adhesion)\n2. Apply vulcanizing cement\n3. Cure until tacky (~30 seconds)\n4. Apply patch with firm pressure\n\nThe vulcanization process chemically bonds the patch to the tube.",
        hintLine: "Vulcanizing cement works differently from regular glue — it bonds rubber at a molecular level.",
        encouragementLine: "Professional-grade repair!",
      },
    },
    complete: {
      starter: {
        spokenLine: "You fixed it! Thank you Zuzu! Here, take this pump!",
        captionLine: "The tire is fixed! Mrs. Ramirez is so happy.\n\n\"Thank you Zuzu! You're a real bike mechanic! Here, take this pump!\"\n\nYou earned: Basic Pump!",
        hintLine: null,
        encouragementLine: "You're amazing!",
      },
      guided: {
        spokenLine: "The tire is fixed! Thank you so much, Zuzu! You're a real bike mechanic! Here, take this pump — every mechanic needs one.",
        captionLine: "The tire is fixed! Mrs. Ramirez is so happy.\n\n\"Thank you so much, Zuzu! You're a real bike mechanic! Here, take this pump — every mechanic needs one.\"\n\nYou earned: Basic Pump!",
        hintLine: null,
        encouragementLine: "You did an amazing job!",
      },
      builder: {
        spokenLine: "Perfect repair! The tire holds air and the wheel spins true. Thank you Zuzu — you really understand how tires work. Take this pump, you've earned it!",
        captionLine: "The tire is fixed! Mrs. Ramirez is so happy.\n\n\"Perfect repair! The tire holds air and the wheel spins true. You really understand how tires work. Take this pump — you've earned it!\"\n\nYou earned: Basic Pump!",
        hintLine: null,
        encouragementLine: "You're becoming a real mechanic!",
      },
      advanced: {
        spokenLine: "Excellent work! The patch is holding, the tire is properly seated on the rim, and the pressure is right. You diagnosed the problem and executed a proper repair. Here's a pump — essential equipment for any mechanic.",
        captionLine: "The tire is fixed! Mrs. Ramirez is impressed.\n\n\"Excellent work! The patch is holding, the tire is seated properly, and the pressure is spot-on. You diagnosed the problem and executed a professional repair. Here's a pump — essential equipment.\"\n\nYou earned: Basic Pump!",
        hintLine: null,
        encouragementLine: "Outstanding work from start to finish!",
      },
    },
  },

  chain_repair: {
    talk: {
      starter: {
        spokenLine: "Hi Zuzu! My bike chain fell off. Can you help?",
        captionLine: "Hi Zuzu! My bike chain fell off. Can you help?",
        hintLine: "Mr. Chen needs help with his chain!",
        encouragementLine: "Thanks for coming to help!",
      },
      guided: {
        spokenLine: "Hey there, young mechanic! My bike chain jumped right off while I was riding. Think you can help me too?",
        captionLine: "Hey there, young mechanic! My bike chain jumped right off while I was riding. I heard you fixed Mrs. Ramirez's tire — think you can help me too?",
        hintLine: "The chain connects the pedals to the wheel.",
        encouragementLine: "I knew you'd come help!",
      },
      builder: {
        spokenLine: "Hey Zuzu! My chain derailed while I was shifting gears going uphill. The chain is dangling loose. I think the derailleur might be out of alignment.",
        captionLine: "Hey Zuzu! My chain derailed while I was shifting gears going uphill. The chain is dangling loose — I think the derailleur might be out of alignment. Can you take a look?",
        hintLine: "A misaligned derailleur can cause chain drops during gear changes.",
        encouragementLine: "Good to have a mechanic in the neighborhood!",
      },
      advanced: {
        spokenLine: "Zuzu! My chain dropped during a gear shift under load. It's been happening more often, which suggests the derailleur hanger might be bent, throwing off the chain line. Could you diagnose and fix it?",
        captionLine: "Zuzu! My chain dropped during a gear shift under load. It's been happening more frequently, which suggests the derailleur hanger might be bent — throwing off the chain line. Could you diagnose and fix it?",
        hintLine: "Repeated chain drops often point to a systemic issue rather than a one-time mishap.",
        encouragementLine: "I trust your diagnostic skills!",
      },
    },
    inspect: {
      starter: {
        spokenLine: "Look! The chain is hanging loose. And the metal piece is bent. Let's fix it!",
        captionLine: "The chain is hanging loose off the gears. The derailleur (the metal piece) is bent. Let's fix it!",
        hintLine: "We need to straighten the bent part first.",
        encouragementLine: "Good eyes!",
      },
      guided: {
        spokenLine: "Look at the chain. It's dangling loose off the chainring. The derailleur looks bent slightly inward — that's probably why it slipped.",
        captionLine: "Look at the chain. It's dangling loose off the chainring. The derailleur looks bent slightly inward — that's probably why it slipped. First, let's get the chain back on.",
        hintLine: "The derailleur guides the chain between gears.",
        encouragementLine: "Good observation!",
      },
      builder: {
        spokenLine: "The chain has come off the chainring and is resting on the bottom bracket shell. The rear derailleur is visibly bent inward, which caused the chain to over-shift past the smallest cog.",
        captionLine: "The chain has come off the chainring. The rear derailleur is visibly bent inward — this caused the chain to over-shift past the smallest cog and drop off. We need to realign the derailleur first.",
        hintLine: "The derailleur limits how far the chain can move laterally across the cassette.",
        encouragementLine: "Thorough inspection!",
      },
      advanced: {
        spokenLine: "The chain has dropped off the inner chainring. Examining the rear derailleur, the hanger is bent approximately 5 degrees inward, which would cause the low-limit adjustment to fail — allowing the chain to over-shift inward and derail.",
        captionLine: "The chain has dropped off the inner chainring. The rear derailleur hanger is bent ~5 degrees inward, causing the low-limit adjustment to fail. This allows the chain to over-shift inward past the largest cog and derail. We need to straighten the hanger first.",
        hintLine: "The limit screws on a derailleur control the maximum lateral movement of the chain.",
        encouragementLine: "Precise diagnosis!",
      },
    },
    reading: {
      starter: {
        spokenLine: "A bike chain connects the pedals to the back wheel. When you pedal, the chain makes the wheel spin!",
        captionLine: "A bike chain connects the pedals to the back wheel.\n\nWhen you pedal, the chain pulls the wheel and makes it spin!",
        hintLine: "The chain is like a loop that carries your pedaling power to the wheel.",
        encouragementLine: "Now you know how bikes move!",
      },
      guided: {
        spokenLine: "Quick tip: A bike chain connects the pedals to the rear wheel. When you pedal, the chain pulls the rear sprocket and makes the wheel spin. If the chain is too loose or the derailleur is bent, the chain can jump off.",
        captionLine: "Quick tip: A bike chain connects the pedals to the rear wheel. When you pedal, the chain pulls the rear sprocket and makes the wheel spin. If the chain is too loose or the derailleur is bent, the chain can jump off the gears.",
        hintLine: "The derailleur keeps the chain aligned with the correct gear.",
        encouragementLine: "Understanding the system helps you fix it!",
      },
      builder: {
        spokenLine: "The drivetrain transfers your pedaling force through the chain to the rear wheel. The derailleur moves the chain between different-sized sprockets to change gears. When the derailleur is bent, it can't guide the chain properly, causing it to derail.",
        captionLine: "The drivetrain transfers your pedaling force through the chain to the rear wheel. The derailleur moves the chain between different-sized sprockets to change gears. A bent derailleur can't guide the chain properly, causing derailment.",
        hintLine: "Each gear ratio gives you a different balance of speed vs. pedaling effort.",
        encouragementLine: "You're understanding the whole system!",
      },
      advanced: {
        spokenLine: "The drivetrain converts rotational energy from the cranks into forward motion via the chain and cassette. The derailleur parallelogram mechanism shifts the chain laterally across sprockets, with limit screws preventing over-travel. Derailleur hanger misalignment is the most common cause of repeated chain drops.",
        captionLine: "The drivetrain converts rotational energy from the cranks into forward motion via chain and cassette. The derailleur's parallelogram mechanism shifts the chain laterally, with limit screws preventing over-travel. Hanger misalignment is the most common cause of repeated chain drops.",
        hintLine: "The parallelogram linkage allows the derailleur to move laterally while maintaining consistent chain tension.",
        encouragementLine: "Impressive mechanical understanding!",
      },
    },
    use_wrench: {
      starter: {
        spokenLine: "Use your wrench to fix the bent piece!",
        captionLine: "Use your wrench to straighten the derailleur.",
        hintLine: "You have a wrench in your toolbox.",
        encouragementLine: "Nice work!",
      },
      guided: {
        spokenLine: "Use your wrench to carefully straighten the derailleur back into alignment.",
        captionLine: "Use your wrench to carefully straighten the derailleur back into alignment. Be gentle — too much force could break it.",
        hintLine: "Check your toolbox — you should have a wrench.",
        encouragementLine: "Smooth adjustment!",
      },
      builder: {
        spokenLine: "Use the wrench to carefully bend the derailleur hanger back to its proper alignment. The derailleur cage should hang straight down, parallel to the rear cogs.",
        captionLine: "Use the wrench to carefully bend the derailleur hanger back to alignment. The derailleur cage should hang straight down, parallel to the rear cogs.",
        hintLine: "Align the derailleur cage so it's perfectly vertical when viewed from behind.",
        encouragementLine: "Precise adjustment!",
      },
      advanced: {
        spokenLine: "Use the wrench to realign the derailleur hanger. The goal is to get the jockey wheels perfectly vertical and parallel to the cassette plane. Apply gradual force — aluminum hangers can fatigue-fracture if over-bent.",
        captionLine: "Realign the derailleur hanger:\n- Jockey wheels should be perfectly vertical\n- Parallel to the cassette plane\n- Apply gradual force (aluminum hangers can fracture)\n\nCheck alignment from directly behind the wheel.",
        hintLine: "Aluminum hangers are designed to bend (rather than the frame) — they're a sacrificial component.",
        encouragementLine: "Expert-level alignment!",
      },
    },
    quiz: {
      starter: {
        spokenLine: "Quick question! What does the chain do on a bicycle?",
        captionLine: "What does the chain do on a bicycle?",
        questionPrompt: "What does the chain do on a bicycle?",
        answerChoices: [
          { label: 'It connects the pedals to the rear wheel to make it spin', correct: true },
          { label: 'It holds the handlebars in place', correct: false },
          { label: 'It makes the brakes work', correct: false },
        ],
        hintLine: "Think about what happens when you pedal.",
        explanationLine: "Yes! The chain carries your pedaling power to the back wheel!",
        encouragementLine: "You got it!",
      },
      guided: {
        spokenLine: "Quick question before we finish. What does the chain do on a bicycle?",
        captionLine: "Quick question before we finish!\n\nWhat does the chain do on a bicycle?",
        questionPrompt: "What does the chain do on a bicycle?",
        answerChoices: [
          { label: 'It connects the pedals to the rear wheel to make it spin', correct: true },
          { label: 'It holds the handlebars in place', correct: false },
          { label: 'It makes the brakes work', correct: false },
        ],
        hintLine: "When you push the pedals, what moves next?",
        explanationLine: "Exactly! The chain transfers your pedaling energy from the crankset to the rear wheel, making the bike move forward.",
        encouragementLine: "Great answer!",
      },
      builder: {
        spokenLine: "Let's test your understanding. What is the chain's role in the bicycle drivetrain?",
        captionLine: "What is the chain's role in the bicycle drivetrain?",
        questionPrompt: "What is the chain's role in the bicycle drivetrain?",
        answerChoices: [
          { label: 'It transfers pedaling force from the cranks to the rear wheel', correct: true },
          { label: 'It provides tension for the braking system', correct: false },
          { label: 'It keeps the frame rigid during turns', correct: false },
        ],
        hintLine: "Think about force transfer — how does your leg power reach the wheel?",
        explanationLine: "The chain is the mechanical link that transfers rotational force from the crankset (pedals) to the rear cassette, which drives the wheel.",
        encouragementLine: "Solid understanding of the drivetrain!",
      },
      advanced: {
        spokenLine: "Here's a question about the drivetrain system. What role does the chain play and why is it essential?",
        captionLine: "What role does the chain play in the drivetrain, and why is it essential for the bicycle to function?",
        questionPrompt: "What role does the chain play in the drivetrain?",
        answerChoices: [
          { label: 'It transfers rotational energy from cranks to rear wheel via the sprockets', correct: true },
          { label: 'It regulates the speed by controlling friction with the ground', correct: false },
          { label: 'It absorbs shock from bumps to protect the frame', correct: false },
        ],
        hintLine: "Consider the entire path of force: legs → pedals → ? → rear wheel.",
        explanationLine: "The chain meshes with teeth on both the chainring and cassette sprockets, creating a positive mechanical link. This roller chain design is over 98% efficient at transferring power — making it one of the most effective drive mechanisms ever designed.",
        encouragementLine: "Outstanding grasp of mechanical engineering!",
      },
    },
    use_lube: {
      starter: {
        spokenLine: "Now put some oil on the chain to keep it smooth!",
        captionLine: "Apply chain lube to keep the chain running smoothly.",
        hintLine: "You have chain lube in your inventory.",
        encouragementLine: "Nice job!",
      },
      guided: {
        spokenLine: "Great! Now apply some chain lube to keep the chain running smoothly. A well-lubed chain is a happy chain!",
        captionLine: "Great! Now apply some chain lube to keep the chain running smoothly.",
        hintLine: "You need chain lube — check your inventory.",
        encouragementLine: "Perfect finishing touch!",
      },
      builder: {
        spokenLine: "Apply chain lube to each link while slowly turning the pedals backward. This reduces friction and prevents rust, keeping the drivetrain running efficiently.",
        captionLine: "Apply chain lube to each link while slowly turning the pedals backward. This reduces friction and prevents rust.",
        hintLine: "Lubricate the chain rollers where they pivot — that's where friction occurs.",
        encouragementLine: "Professional maintenance!",
      },
      advanced: {
        spokenLine: "Apply lube to the chain rollers while back-pedaling slowly. Focus on the inner roller surfaces where metal-on-metal contact creates friction. After application, wipe excess from the outer plates — excess lube attracts dirt which accelerates wear.",
        captionLine: "Apply lube to chain rollers while back-pedaling:\n1. Target inner roller surfaces (friction points)\n2. One drop per link\n3. Wipe excess from outer plates\n\nExcess lube attracts dirt, accelerating chain wear.",
        hintLine: "Over-lubrication is almost as bad as under-lubrication — excess attracts abrasive grit.",
        encouragementLine: "Perfect maintenance technique!",
      },
    },
    complete: {
      starter: {
        spokenLine: "You fixed it! Thank you Zuzu! Here, take this multi-tool!",
        captionLine: "The chain is fixed! Mr. Chen is happy.\n\n\"Thank you Zuzu! Take this multi-tool!\"\n\nYou earned: Multi-Tool!",
        hintLine: null,
        encouragementLine: "You're the best!",
      },
      guided: {
        spokenLine: "The chain is back on and running perfectly! Wonderful work! Here, take this multi-tool — every serious mechanic needs one.",
        captionLine: "The chain is back on and running perfectly!\n\n\"Wonderful work! You really know your way around a bike. Here — take this multi-tool. Every serious mechanic needs one.\"\n\nYou earned: Multi-Tool!",
        hintLine: null,
        encouragementLine: "Impressive work!",
      },
      builder: {
        spokenLine: "Excellent! The chain runs smooth, the shifts are crisp, and the derailleur is perfectly aligned. You understood the whole system and fixed it methodically. This multi-tool is yours — you've earned it.",
        captionLine: "The chain is back on and running perfectly!\n\n\"Excellent! Smooth chain, crisp shifts, perfect alignment. You understood the whole system. This multi-tool is yours — you've earned it.\"\n\nYou earned: Multi-Tool!",
        hintLine: null,
        encouragementLine: "Real mechanic skills!",
      },
      advanced: {
        spokenLine: "Outstanding repair! The drivetrain is running efficiently — chain tension is correct, shifts are precise, and the derailleur limits are properly set. You diagnosed the root cause and executed a systematic repair. Take this multi-tool — you'll need it for bigger challenges.",
        captionLine: "The chain is back on and running perfectly!\n\n\"Outstanding! Correct chain tension, precise shifts, proper limit settings. You diagnosed the root cause and executed a systematic repair. Take this multi-tool — you'll need it for bigger challenges.\"\n\nYou earned: Multi-Tool!",
        hintLine: null,
        encouragementLine: "Master mechanic in the making!",
      },
    },
  },
};

/**
 * Get fallback dialogue for a quest step at a given difficulty band.
 *
 * @param {string} questId
 * @param {string} stepId
 * @param {string} band - 'starter'|'guided'|'builder'|'advanced'
 * @returns {object|null} structured dialogue template
 */
export function getFallbackDialogue(questId, stepId, band = 'starter') {
  const quest = TEMPLATES[questId];
  if (!quest) return null;
  const step = quest[stepId];
  if (!step) return null;
  return step[band] || step.starter || null;
}

/**
 * Get all available step ids for a quest.
 */
export function getTemplateStepIds(questId) {
  const quest = TEMPLATES[questId];
  return quest ? Object.keys(quest) : [];
}

export default TEMPLATES;
