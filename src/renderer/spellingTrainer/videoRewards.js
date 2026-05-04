import { loadAccount, saveAccount } from "./account.js";
import { VIDEO_QUIZ_REWARD_AMOUNT } from "../data/videoQuizzes.js";

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function getVideoRewardStatus(videoId) {
  const account = loadAccount();
  const videoRewards = account.videoRewards || {};
  const reward = videoRewards[videoId] || null;

  return {
    balance: money(account.balance),
    reward,
    alreadyEarned: Boolean(reward?.earned)
  };
}

export function awardVideoQuizReward({ videoId, title, score, totalQuestions }) {
  const account = loadAccount();
  const videoRewards = account.videoRewards || {};
  const existingReward = videoRewards[videoId];

  if (existingReward?.earned) {
    return {
      awarded: false,
      amount: 0,
      balance: money(account.balance),
      reward: existingReward
    };
  }

  const reward = {
    earned: true,
    amount: VIDEO_QUIZ_REWARD_AMOUNT,
    title: title || "Bike learning video",
    score,
    totalQuestions,
    completedAt: new Date().toISOString()
  };

  const nextAccount = {
    ...account,
    balance: money(account.balance + VIDEO_QUIZ_REWARD_AMOUNT),
    videoRewards: {
      ...videoRewards,
      [videoId]: reward
    }
  };

  saveAccount(nextAccount);

  window.dispatchEvent(new CustomEvent("zaydan-account-updated", {
    detail: {
      balance: nextAccount.balance,
      source: "video-quiz",
      reward
    }
  }));

  return {
    awarded: true,
    amount: VIDEO_QUIZ_REWARD_AMOUNT,
    balance: nextAccount.balance,
    reward
  };
}
