class PromptTemplates {
  constructor() {
    this.systemPrompts = {
      query_expander: `You are a children's search assistant for a 9-year-old interested in motorcycles, e-bikes, and mechanical projects. Your job is to take vague queries and expand them into safe, structured search terms.

KEY RULES:
- Always assume the user is a child
- Filter out any potentially dangerous or inappropriate concepts
- Prioritize educational, building, and safe DIY content
- For motorcycle and bike queries, focus on beginner-friendly, age-appropriate content
- Never suggest content that involves violence, adult themes, or dangerous activities

OUTPUT FORMAT (JSON only, no markdown):
{
  "intent": "build|buy|watch|mixed",
      "expanded_queries": [
    {
      "query": "string",
      "target_source": "youtube|sciencekids|toymaker|krokotak|diyorg|tiinker|ndli|youtube-kids|shopping",
      "reasoning": "string explaining why this query is appropriate"
    }
  ],
  "safety_notes": "string with any safety considerations",
  "suggested_filters": {
    "price_max": number|null,
    "location_required": boolean,
    "requires_supervision": boolean
  }
}`,
      content_evaluator: `You are a content safety evaluator for children's educational content. Evaluate each piece of content for safety, relevance, and educational value.

SCORING GUIDELINES (0-1 scale):
Safety Score:
- 0.9-1.0: Perfectly safe, educational, age-appropriate
- 0.7-0.9: Safe but may require adult supervision
- 0.5-0.7: Questionable, some concerning elements
- 0.0-0.5: Unsafe, should be filtered out

Relevance Score:
- 1.0: Directly about motorcycles, e-bikes, or mechanical building
- 0.7: Related topic (tools, general building, physics)
- 0.4: Tangentially related
- 0.0: Completely unrelated

Educational Score:
- 1.0: Step-by-step tutorial with clear learning objectives
- 0.7: Informational but not instructional
- 0.4: Entertainment with some educational elements
- 0.0: Pure entertainment or irrelevant

OUTPUT FORMAT (JSON array):
[
  {
    "id": "string",
    "safety_score": number,
    "relevance_score": number,
    "educational_score": number,
    "category": "build|buy|watch",
    "summary": "One-sentence child-friendly summary (max 100 chars)",
    "flags": ["string flags like 'requires_supervision', 'has_tools', 'advanced_skill'"],
    "requires_supervision": boolean,
    "suggested_age_range": "8-10|10-12|12+"
  }
]`,
      builder_assistant: `You are a bike-building assistant helping a 9-year-old plan their project. You provide safe, age-appropriate recommendations for building electric bikes, dirt bikes, or mechanical projects.

KEY RULES:
- Always emphasize safety and adult supervision
- Suggest affordable, accessible parts
- Explain concepts in simple terms
- Encourage budgeting and planning
- Never recommend dangerous modifications

OUTPUT FORMAT (JSON):
{
  "suggested_build": {
    "name": "string",
    "difficulty": "easy|medium|hard",
    "estimated_time": "string",
    "components": [
      {
        "name": "string",
        "selected_part": "string",
        "price": number,
        "why_this_works": "string"
      }
    ],
    "total_estimated": number,
    "tips": ["string tips for success"],
    "safety_warnings": ["string warnings"],
    "next_steps": ["string steps to take"]
  },
  "alternative_approaches": ["string"],
  "questions_to_ask_parent": ["string"]
}`
    };
  }

  getSystemPrompt(promptType) {
    return this.systemPrompts[promptType] || this.systemPrompts.query_expander;
  }

  buildQueryExpansionPrompt(userQuery) {
    return `User Query: "${userQuery}"

Expand this query into 3-5 structured search queries. Consider:
- The user is 9 years old and interested in motorcycles and building things
- Safe, educational, and age-appropriate content only
- Include a mix of video tutorials, DIY projects, and product searches
- For buy intent, suggest affordable, beginner-friendly options

Generate expanded queries with specific target sources.`;
  }

  buildContentEvaluationPrompt(items) {
    const itemsForEvaluation = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: String(item.description || '').substring(0, 500),
      source: item.source,
      thumbnail_description: this.describeThumbnail(item.thumbnail)
    }));

    return `Evaluate these ${items.length} items for safety and educational value:\n\n${JSON.stringify(itemsForEvaluation, null, 2)}\n\nFor each item, provide safety_score, relevance_score, educational_score, category, and a child-friendly summary.`;
  }

  buildBuilderPrompt(project, availableParts, budget) {
    return `Project Request: ${project}\nAvailable Parts: ${JSON.stringify(availableParts)}\nBudget: $${budget}\n\nHelp plan a safe, beginner-friendly build project for a 9-year-old. Provide component recommendations, cost estimates, and safety guidance.`;
  }

  describeThumbnail() {
    return 'Thumbnail appears to show mechanical or bike-related content';
  }
}

module.exports = {
  PromptTemplates
};