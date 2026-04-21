/**
 * Fallback Dialogue Templates — deterministic NPC dialogue per difficulty band.
 *
 * These templates are used when:
 *   - AI/backend is unavailable
 *   - AI call fails or times out
 *   - Player is offline
 *
 * Structure: questId → stepId → band → { spokenLine, captionLine, hintLine,
 *   questionPrompt, explanationLine, encouragementLine }
 *
 * The canonical quest steps, correct answers, and progression logic remain
 * in quests.js and questSystem.js. These templates only provide the
 * language wrapper around them.
 */

const TEMPLATES = {
  flat_tire_repair: {
    talk: {
      starter: {
        spokenLine: "Oh hi Zuzu! My bike tire is flat. Can you help?",
        captionLine: "Oh hi Zuzu! My bike tire is flat. Can you help?",
        hintLine: "Mrs. Ramirez needs help with her tire.",
        encouragementLine: "You can do it!",
      },
      guided: {
        spokenLine: "Hi Zuzu! My bike tire went completely flat overnight. I don't know what happened — could you take a look?",
        captionLine: "Hi Zuzu! My bike tire went completely flat overnight. Could you take a look?",
        hintLine: "Something made the tire lose all its air.",
        encouragementLine: "You're great at figuring things out!",
      },
      builder: {
        spokenLine: "Hello Zuzu! I woke up this morning and found my bike tire completely deflated. It was fine yesterday evening. I'm wondering if something punctured it during the night.",
        captionLine: "My bike tire deflated overnight. Something might have punctured it.",
        hintLine: "Inspect the tire carefully for foreign objects.",
        encouragementLine: "Your detective skills are getting sharp!",
      },
      advanced: {
        spokenLine: "Good morning Zuzu! I have a mystery for you. My tire held pressure all week, but this morning it's completely flat. The valve cap is still on, so I suspect a puncture rather than a slow leak from the valve stem.",
        captionLine: "Tire was fine all week but flat this morning. Valve cap still on — likely a puncture.",
        hintLine: "Consider what could cause sudden pressure loss versus a slow leak.",
        encouragementLine: "Excellent diagnostic thinking!",
      },
    },

    inspect: {
      starter: {
        spokenLine: "Look! There's a nail in the tire!",
        captionLine: "Look! A nail in the tire!",
        hintLine: "The nail made a hole.",
        explanationLine: "A nail poked through the tire and let the air out.",
        encouragementLine: "Good eyes!",
      },
      guided: {
        spokenLine: "Look closely at the tire. You can see a small nail stuck in it! That's what caused the flat.",
        captionLine: "A small nail is stuck in the tire. That caused the flat.",
        hintLine: "The nail went through the outer tire and into the inner tube.",
        explanationLine: "When something sharp pokes through the tire, it makes a hole in the inner tube where the air lives.",
        encouragementLine: "Great inspection!",
      },
      builder: {
        spokenLine: "There's a nail embedded in the tire tread. It penetrated through the outer tire and punctured the inner tube, causing all the air pressure to escape.",
        captionLine: "Nail in the tread → punctured inner tube → air escaped.",
        hintLine: "The inner tube holds the air. The outer tire protects it, but sharp objects can get through.",
        explanationLine: "The outer tire is tough rubber that grips the road. Inside it, the softer inner tube holds air under pressure. When the nail pierced both layers, the pressurized air escaped through the hole.",
        encouragementLine: "Solid diagnosis!",
      },
      advanced: {
        spokenLine: "I can see a roofing nail embedded about two millimeters into the tread. It's gone through the outer casing and definitely punctured the butyl rubber inner tube. The flat profile of the nail head suggests it was lying flat on the road before being picked up by the tire rotation.",
        captionLine: "Roofing nail through the casing into the butyl inner tube. Picked up from road surface.",
        hintLine: "Think about why butyl rubber is used for inner tubes versus the harder rubber of the outer tire.",
        explanationLine: "Inner tubes use butyl rubber because it's excellent at holding air pressure, but it's softer than the outer tire's rubber compound. The outer tire is reinforced with fabric or kevlar layers to resist punctures, but a sharp nail can still get through.",
        encouragementLine: "That's professional-level analysis!",
      },
    },

    reading: {
      starter: {
        spokenLine: "A bike tire has two parts. The hard outside part and the soft air tube inside.",
        captionLine: "Tire = hard outside + soft air tube inside.",
        hintLine: "The inside tube holds the air.",
        explanationLine: "When the nail pokes the tube, air comes out and the tire goes flat!",
        encouragementLine: "Now you know!",
      },
      guided: {
        spokenLine: "Quick tip: A bicycle tire has two parts — the outer tire that touches the road, and the inner tube filled with air. When a nail pokes through both layers, the air leaks out.",
        captionLine: "Outer tire (tough, touches road) + inner tube (soft, holds air). Nail = air leak.",
        hintLine: "We need to fix the hole in the inner tube.",
        explanationLine: "The outer tire protects against most things, but sharp objects like nails can get through to the inner tube.",
        encouragementLine: "Good learning!",
      },
      builder: {
        spokenLine: "A bicycle tire is a two-layer system. The outer tire — also called the casing — provides grip and protection. The inner tube is a sealed rubber chamber that holds compressed air. Punctures compromise the tube's seal, and air pressure differential forces the air out through the hole.",
        captionLine: "Two-layer system: outer casing (grip + protection) → inner tube (sealed air chamber). Puncture breaks the seal.",
        hintLine: "Air moves from high pressure inside the tube to low pressure outside — that's why it goes flat.",
        explanationLine: "The air inside the tube is at higher pressure than the atmosphere. Physics tells us gases flow from high to low pressure. A puncture creates a path for that flow.",
        encouragementLine: "You're thinking like an engineer!",
      },
      advanced: {
        spokenLine: "A bicycle tire is a pneumatic system. The outer casing provides structural integrity and road grip through its tread pattern and rubber compound. The inner tube, typically made of butyl rubber for its low gas permeability, maintains air pressure. Standard road tire pressure is 80 to 130 PSI — significantly above atmospheric pressure. A puncture creates a pressure differential path, and air escapes until equilibrium is reached.",
        captionLine: "Pneumatic system: casing (structure + grip) → butyl tube (low gas permeability, 80-130 PSI). Puncture → pressure equalization → flat.",
        hintLine: "Consider why tire pressure is measured in PSI and what that unit tells you about the forces involved.",
        explanationLine: "PSI means pounds per square inch — the force the compressed air exerts on every square inch of the tube's inner wall. At 100 PSI, that's significant force pushing outward, which is why a small hole can drain a tire quickly.",
        encouragementLine: "You're understanding the physics behind the mechanics!",
      },
    },

    use_lever: {
      starter: {
        spokenLine: "Use the tire lever to pull the tire off!",
        captionLine: "Use tire lever → pull tire off rim.",
        hintLine: "The tire lever helps you pry it off.",
        encouragementLine: "You got this!",
      },
      guided: {
        spokenLine: "Use the tire lever to carefully remove the tire from the rim. Hook it under the bead of the tire and push down.",
        captionLine: "Hook tire lever under the bead, push down to remove tire from rim.",
        hintLine: "The 'bead' is the edge of the tire that sits in the rim.",
        encouragementLine: "Nice technique!",
      },
      builder: {
        spokenLine: "Insert the tire lever between the tire bead and the rim. The lever gives you mechanical advantage to unseat the bead. Work your way around the rim until one side of the tire is free, then pull out the inner tube.",
        captionLine: "Lever under bead → mechanical advantage → unseat bead → work around rim → free tube.",
        hintLine: "Mechanical advantage means the lever multiplies your force. A small push becomes enough to unseat a tight bead.",
        encouragementLine: "Great mechanical reasoning!",
      },
      advanced: {
        spokenLine: "The tire lever provides a class-two lever mechanism — the fulcrum is the rim edge, the load is the tire bead tension, and your hand applies the effort. Insert two levers about 10 centimeters apart for better control. This approach distributes the unseating force and reduces the risk of pinching the inner tube during removal.",
        captionLine: "Class-two lever: rim = fulcrum, bead = load, hand = effort. Two levers 10cm apart for controlled unseating.",
        hintLine: "Think about which class of lever this is and where the fulcrum, load, and effort points are.",
        encouragementLine: "Textbook lever technique!",
      },
    },

    quiz: {
      starter: {
        questionPrompt: "Why does a tire go flat?",
        hintLine: "Think about what happens when air gets out.",
        explanationLine: "A hole lets the air out! That's why the tire goes flat.",
        encouragementLine: "You got it right!",
      },
      guided: {
        questionPrompt: "Why does a tire go flat when it gets a hole?",
        hintLine: "Air is under pressure inside the tube. What happens when there's a way out?",
        explanationLine: "The air inside the tube is under pressure. When a hole appears, the pressurized air escapes through it until the tire is flat.",
        encouragementLine: "Excellent reasoning!",
      },
      builder: {
        questionPrompt: "What physical process causes a punctured tire to lose air?",
        hintLine: "Consider the pressure difference between inside the tube and outside.",
        explanationLine: "Air flows from high pressure (inside the tube) to low pressure (outside). The puncture creates a path for this flow, and the tire deflates until pressures equalize.",
        encouragementLine: "Strong scientific thinking!",
      },
      advanced: {
        questionPrompt: "Explain the physics of why a small puncture can fully deflate a tire that was holding 100 PSI.",
        hintLine: "Think about pressure differential, flow rate, and how molecular kinetics relates to gas escape.",
        explanationLine: "At 100 PSI, every square inch of the tube wall experiences 100 pounds of outward force. A puncture creates an opening where this force drives gas molecules through. The flow rate depends on the hole size and pressure differential. As air escapes, pressure drops, slowing the flow — but it continues until internal and external pressures equalize at roughly 14.7 PSI (atmospheric).",
        encouragementLine: "That's advanced physics — well done!",
      },
    },

    use_patch: {
      starter: {
        spokenLine: "Put the patch on the hole to fix it!",
        captionLine: "Put patch on hole → fixed!",
        hintLine: "The patch covers the hole so air can't get out.",
        encouragementLine: "Almost done!",
      },
      guided: {
        spokenLine: "Use the patch kit to seal the hole in the inner tube. Clean the area first, then apply glue and press the patch firmly.",
        captionLine: "Clean area → apply glue → press patch firmly → seal the hole.",
        hintLine: "The glue helps the patch bond to the rubber for an airtight seal.",
        encouragementLine: "Perfect patching!",
      },
      builder: {
        spokenLine: "Before applying the patch, rough up the area around the puncture with the sandpaper from the kit. This creates a better bonding surface. Apply a thin layer of vulcanizing cement, wait until it's tacky, then press the patch firmly and hold for 30 seconds.",
        captionLine: "Sand area → apply vulcanizing cement → wait until tacky → press patch 30 seconds.",
        hintLine: "Vulcanizing cement chemically bonds the patch rubber to the tube rubber — it's not just glue.",
        encouragementLine: "Professional repair technique!",
      },
      advanced: {
        spokenLine: "The patching process uses vulcanization — a chemical process where sulfur in the cement cross-links the polymer chains of both the patch and tube rubber, creating a molecular bond stronger than adhesive alone. Roughing the surface increases the contact area for this reaction. The bond is actually stronger than the surrounding rubber.",
        captionLine: "Vulcanization: sulfur cross-links polymer chains between patch and tube. Roughing increases contact area. Bond > surrounding rubber.",
        hintLine: "Research Charles Goodyear and the discovery of vulcanization — it revolutionized rubber technology.",
        encouragementLine: "You understand materials science!",
      },
    },

    complete: {
      starter: {
        spokenLine: "You fixed it! Great job, Zuzu!",
        captionLine: "Tire fixed! Great job!",
        encouragementLine: "You're a bike hero!",
      },
      guided: {
        spokenLine: "The tire is fixed! Mrs. Ramirez is so happy. You earned a Basic Pump!",
        captionLine: "Tire fixed! Mrs. Ramirez is happy. You earned: Basic Pump!",
        encouragementLine: "You're becoming a real mechanic!",
      },
      builder: {
        spokenLine: "Excellent work! You've successfully diagnosed a puncture, removed the tire, patched the tube, and restored the tire to working condition. Mrs. Ramirez is impressed by your systematic approach.",
        captionLine: "Diagnosis → removal → patch → restore. Systematic repair complete!",
        encouragementLine: "Your repair skills are really developing!",
      },
      advanced: {
        spokenLine: "Outstanding repair, Zuzu! You demonstrated the complete flat tire repair workflow: visual inspection, root cause identification, proper tool selection, tire removal technique, surface preparation, vulcanizing patch application, and reassembly. Mrs. Ramirez couldn't have gotten a better job at a bike shop.",
        captionLine: "Complete workflow: inspect → diagnose → tool select → remove → prep → vulcanize → reassemble. Shop-quality repair!",
        encouragementLine: "You're operating at professional mechanic level!",
      },
    },
  },
};

/**
 * Get fallback dialogue for a quest step at a given difficulty band.
 *
 * @param {string} questId
 * @param {string} stepId
 * @param {string} bandId — 'starter' | 'guided' | 'builder' | 'advanced'
 * @returns {object|null} — { spokenLine, captionLine, hintLine, questionPrompt, explanationLine, encouragementLine }
 */
export function getFallbackDialogue(questId, stepId, bandId = 'starter') {
  const quest = TEMPLATES[questId];
  if (!quest) return null;

  const step = quest[stepId];
  if (!step) return null;

  return step[bandId] || step.starter || null;
}

/**
 * Get all available template keys for a quest.
 */
export function getTemplateSteps(questId) {
  const quest = TEMPLATES[questId];
  if (!quest) return [];
  return Object.keys(quest);
}

export default TEMPLATES;
