/**
 * Physics Education System — teaches distance, speed, time, acceleration
 * through gameplay movement and vehicle mechanics.
 *
 * Reads real physics data from MCP (via physicsbridge.js).
 * Tracks player movement to compute actual d/s/t/a values.
 * Generates contextual questions after movement events.
 * Scales difficulty based on mastery.
 *
 * Integration: MCP registers this as 'physics_education' system.
 * The system observes player movement every tick and accumulates data.
 */

import { pickFallbackQuestion } from './quizQuestionGenerator.js';

// ── Constants ────────────────────────────────────────────────────────────────

const PIXELS_PER_METER = 32; // game pixels to "meters" conversion
const HISTORY_MAX = 120;     // ~2 seconds at 60fps
const TIER_THRESHOLDS = [0, 20, 50, 100, 180, 300]; // XP thresholds per tier

// ── System Class ─────────────────────────────────────────────────────────────

export default class PhysicsEducationSystem {
  constructor() {
    this.mcp = null;

    // Player physics tracking
    this.tracking = {
      totalDistance: 0,      // meters traveled (session)
      currentSpeed: 0,       // m/s
      currentAcceleration: 0,// m/s²
      maxSpeed: 0,
      avgSpeed: 0,
      elapsed: 0,            // seconds
      isMoving: false,
      prevSpeed: 0,
      speedSamples: 0,
      speedSum: 0,
    };

    // History for graphs (ring buffer)
    this.history = [];

    // Education progression
    this.progression = {
      xp: 0,
      tier: 1,              // 1=Distance, 2=Speed, 3=Time, 4=Acceleration, 5=Combined, 6=Applied
      mastery: {
        distance: 0,         // 0–100
        speed: 0,
        time: 0,
        acceleration: 0,
      },
      questionsAnswered: 0,
      correctAnswers: 0,
      challengesCompleted: 0,
    };

    // Current active question
    this.activeQuestion = null;
    this.lastQuestionTime = 0;
    this.questionCooldown = 60000; // 60s minimum between questions (arbiter adds additional gating)
  }

  setMCP(mcp) {
    this.mcp = mcp;
  }

  getSnapshot() {
    return {
      tracking: { ...this.tracking },
      tier: this.progression.tier,
      xp: this.progression.xp,
      mastery: { ...this.progression.mastery },
      hasActiveQuestion: !!this.activeQuestion,
    };
  }

  // ── Per-Frame Update (called by MCP or scene) ──────────────────────────────

  /**
   * Update physics tracking from real player movement data.
   * @param {number} deltaSec - seconds since last frame
   * @param {object} physicsState - from MCP state.physics
   */
  tick(deltaSec, physicsState) {
    if (!physicsState || deltaSec <= 0 || deltaSec > 1) return;

    const speedPx = physicsState.playerSpeed || 0;
    const speed = speedPx / PIXELS_PER_METER; // convert to m/s

    // Distance
    const distanceThisFrame = speed * deltaSec;
    this.tracking.totalDistance += distanceThisFrame;

    // Speed
    this.tracking.prevSpeed = this.tracking.currentSpeed;
    this.tracking.currentSpeed = Math.round(speed * 100) / 100;
    this.tracking.isMoving = speed > 0.3;

    // Max speed
    if (speed > this.tracking.maxSpeed) {
      this.tracking.maxSpeed = Math.round(speed * 100) / 100;
    }

    // Average speed
    if (this.tracking.isMoving) {
      this.tracking.speedSamples++;
      this.tracking.speedSum += speed;
      this.tracking.avgSpeed = Math.round((this.tracking.speedSum / this.tracking.speedSamples) * 100) / 100;
    }

    // Acceleration
    if (deltaSec > 0.001) {
      this.tracking.currentAcceleration = Math.round(((speed - (this.tracking.prevSpeed || 0)) / deltaSec) * 100) / 100;
    }

    // Time
    this.tracking.elapsed += deltaSec;

    // History (for graphs)
    this.history.push({
      t: Math.round(this.tracking.elapsed * 10) / 10,
      speed: this.tracking.currentSpeed,
      distance: Math.round(this.tracking.totalDistance * 10) / 10,
      acceleration: this.tracking.currentAcceleration,
    });
    if (this.history.length > HISTORY_MAX) this.history.shift();
  }

  // ── Question Generation ────────────────────────────────────────────────────

  /**
   * Check if a question should be asked based on current gameplay.
   * Called periodically (not every frame).
   */
  shouldAskQuestion() {
    if (this.activeQuestion) return false;
    if (Date.now() - this.lastQuestionTime < this.questionCooldown) return false;
    if (this.tracking.totalDistance < 5) return false; // need some movement data
    return true;
  }

  /**
   * Generate a question from the standards-aligned question bank.
   * Uses real gameplay data to pick contextual questions at the right tier.
   * Falls back to AI-generated questions when the MCP adapter is available.
   */
  generateQuestion() {
    const tier = this.progression.tier;
    const t = this.tracking;

    // Try AI-generated question first (async, non-blocking)
    this._tryAIQuestion(tier);

    // Pick from the curated AASA-aligned question bank
    const bankQuestion = pickFallbackQuestion({ tier: Math.min(tier, 4) });

    const question = {
      id: `quiz_${Date.now()}`,
      topic: bankQuestion.topic,
      difficulty: bankQuestion.tier,
      question: bankQuestion.question,
      choices: bankQuestion.choices,
      explanation: bankQuestion.explanation,
      concept: bankQuestion.concept,
      standard: bankQuestion.standard,
    };

    this.activeQuestion = question;
    this.lastQuestionTime = Date.now();
    return question;
  }

  /**
   * Attempt to generate an AI question for the next round.
   * If successful, it replaces the current question before the player answers.
   */
  async _tryAIQuestion(tier) {
    try {
      const aiAdapter = this.mcp?.getSystem('ai');
      if (!aiAdapter?.generateQuizQuestion) return;

      const state = this.mcp?.getState() || {};
      const result = await aiAdapter.generateQuizQuestion({
        tier: Math.min(tier, 4),
        gameContext: {
          questTitle: state.quest?.activeQuestId,
          biome: state.environment?.biome,
          recentActivity: `riding bike, traveled ${Math.round(this.tracking.totalDistance)}m`,
        },
      });

      // Only replace if player hasn't answered yet
      if (this.activeQuestion && result?.question && result.source === 'ai') {
        this.activeQuestion = {
          id: `ai_${Date.now()}`,
          topic: result.topic,
          difficulty: result.tier || tier,
          question: result.question,
          choices: result.choices,
          explanation: result.explanation,
          concept: result.concept,
          standard: result.standard || '',
        };
      }
    } catch {
      // AI failed — keep the bank question, no interruption
    }
  }

  /**
   * Submit answer to current question.
   * @param {number} choiceIndex
   * @returns {{ correct, explanation, xpGained }}
   */
  answerQuestion(choiceIndex) {
    if (!this.activeQuestion) return null;

    const q = this.activeQuestion;
    const correct = q.choices[choiceIndex]?.correct || false;

    this.progression.questionsAnswered++;
    if (correct) {
      this.progression.correctAnswers++;
      const xp = q.difficulty * 5;
      this.progression.xp += xp;

      // Update mastery
      if (q.topic in this.progression.mastery) {
        this.progression.mastery[q.topic] = Math.min(100,
          this.progression.mastery[q.topic] + 10 + q.difficulty * 3
        );
      }

      // Check tier advancement
      const newTier = TIER_THRESHOLDS.findIndex((t, i) =>
        this.progression.xp >= t && (i === TIER_THRESHOLDS.length - 1 || this.progression.xp < TIER_THRESHOLDS[i + 1])
      ) + 1;
      if (newTier > this.progression.tier) {
        this.progression.tier = newTier;
        this.mcp?.emit('PHYSICS_TIER_UP', { tier: newTier });
      }

      this.activeQuestion = null;
      return { correct: true, explanation: q.explanation, xpGained: xp, concept: q.concept };
    }

    this.activeQuestion = null;
    return { correct: false, explanation: q.explanation, xpGained: 0, concept: q.concept };
  }

  /** Get formatted tracking data for HUD display. */
  getHUDData() {
    return {
      speed: `${this.tracking.currentSpeed} m/s`,
      distance: `${Math.round(this.tracking.totalDistance)} m`,
      acceleration: `${this.tracking.currentAcceleration} m/s²`,
      time: `${Math.round(this.tracking.elapsed)}s`,
      maxSpeed: `${this.tracking.maxSpeed} m/s`,
      tier: this.progression.tier,
      tierLabel: ['', 'Distance', 'Speed', 'Time', 'Acceleration', 'Combined', 'Applied'][this.progression.tier] || '',
      xp: this.progression.xp,
    };
  }

  /** Get graph data points. */
  getGraphData() {
    return this.history.slice(-60); // last 60 points
  }
}
