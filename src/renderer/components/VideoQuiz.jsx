import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { getVideoQuiz, VIDEO_QUIZ_PASSING_SCORE, VIDEO_QUIZ_REWARD_AMOUNT } from "../data/videoQuizzes.js";
import { awardVideoQuizReward, getVideoRewardStatus } from "../spellingTrainer/videoRewards.js";

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function VideoQuiz({ videoId, videoTitle }) {
  const quiz = useMemo(() => getVideoQuiz(videoId), [videoId]);
  const initialRewardStatus = useMemo(() => getVideoRewardStatus(videoId), [videoId]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [rewardStatus, setRewardStatus] = useState(initialRewardStatus);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setRewardStatus(initialRewardStatus);
    setMessage("");
  }, [initialRewardStatus, videoId]);

  const score = quiz.questions.reduce((total, question, index) => (
    answers[index] === question.correctIndex ? total + 1 : total
  ), 0);
  const answeredCount = Object.keys(answers).length;
  const passed = score >= VIDEO_QUIZ_PASSING_SCORE;

  function chooseAnswer(questionIndex, choiceIndex) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: choiceIndex
    }));
    setSubmitted(false);
    setMessage("");
  }

  function submitQuiz() {
    setSubmitted(true);

    if (answeredCount < quiz.questions.length) {
      setMessage("Answer each question, then check your quiz.");
      return;
    }

    if (!passed) {
      setMessage("Good try. Watch that part again, then fix your answers.");
      return;
    }

    if (rewardStatus.alreadyEarned) {
      setMessage(`You already earned the video reward. Balance: ${formatMoney(rewardStatus.balance)}.`);
      return;
    }

    const result = awardVideoQuizReward({
      videoId,
      title: videoTitle || quiz.title,
      score,
      totalQuestions: quiz.questions.length
    });

    setRewardStatus({
      balance: result.balance,
      reward: result.reward,
      alreadyEarned: true
    });
    setMessage(`Nice work. You earned ${formatMoney(result.amount)}. New balance: ${formatMoney(result.balance)}.`);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.78 } });
  }

  return (
    <section className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6 shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">After-video quiz</p>
          <h3 className="text-2xl font-bold text-slate-900">{quiz.title}</h3>
          <p className="mt-1 text-sm text-emerald-900">
            Pass with {VIDEO_QUIZ_PASSING_SCORE} out of {quiz.questions.length} correct to earn {formatMoney(VIDEO_QUIZ_REWARD_AMOUNT)} once for this video.
          </p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Zaydan balance</p>
          <strong className="text-xl text-emerald-700">{formatMoney(rewardStatus.balance)}</strong>
        </div>
      </div>

      {rewardStatus.alreadyEarned && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Reward already earned for this video. He can still retake the quiz for practice.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {quiz.questions.map((question, questionIndex) => (
          <fieldset key={question.prompt} className="rounded-xl border border-emerald-200 bg-white p-4">
            <legend className="px-1 text-base font-bold text-slate-900">
              {questionIndex + 1}. {question.prompt}
            </legend>
            <div className="mt-3 grid gap-2">
              {question.choices.map((choice, choiceIndex) => {
                const selected = answers[questionIndex] === choiceIndex;
                const correct = question.correctIndex === choiceIndex;
                const revealCorrect = submitted && correct;
                const revealWrong = submitted && selected && !correct;

                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => chooseAnswer(questionIndex, choiceIndex)}
                    className={[
                      "rounded-lg border px-4 py-3 text-left text-sm font-semibold transition",
                      selected ? "border-blue-500 bg-blue-50 text-blue-950" : "border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-300",
                      revealCorrect ? "border-emerald-500 bg-emerald-100 text-emerald-950" : "",
                      revealWrong ? "border-rose-400 bg-rose-100 text-rose-950" : ""
                    ].join(" ")}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {submitted ? `Score: ${score}/${quiz.questions.length}` : "Choose the best answer for each question."}
        </p>
        <button
          type="button"
          onClick={submitQuiz}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Check Quiz
        </button>
      </div>

      {message && (
        <p className={`mt-4 rounded-lg px-4 py-3 text-sm font-bold ${passed && submitted ? "bg-white text-emerald-800" : "bg-white text-slate-800"}`}>
          {message}
        </p>
      )}
    </section>
  );
}

export default VideoQuiz;
