const Candidate = require("../models/Candidate");
const { generateQuestions, generateSummary } = require("../services/aiService");
const { scoreAnswer } = require("../services/scoringService");

/**
 * startInterview: given candidateId, generate or fetch questions and set interview.startedAt etc.
 */
const startInterview = async (req, res, next) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId)
      return res.status(400).json({ error: "candidateId required" });

    const candidate = await Candidate.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    // If interview already has questions, return them
    if (
      candidate.interview &&
      candidate.interview.questions &&
      candidate.interview.questions.length === 6
    ) {
      candidate.interview.status = "ongoing";
      candidate.interview.startedAt =
        candidate.interview.startedAt || new Date();
      await candidate.save();
      return res.json({ interview: candidate.interview });
    }

    // Generate questions
    const qlist = await generateQuestions(candidateId, candidate.role || "Full Stack (React/Node) developer");
    console.log("Generated questions:", qlist);
    
    // Attach startedAt for first question when frontend starts; here we store questions skeleton
    candidate.interview = {
      status: "ongoing",
      currentQuestionIndex: 0,
      questions: qlist.map((q) => ({
        q: q.q,
        difficulty: q.difficulty,
        a: "",
        score: null,
        startedAt: null,
        answeredAt: null,
        timeTakenSec: null,
      })),
      startedAt: new Date(),
    };
    
    console.log("Saving candidate with interview:", candidate.interview);
    await candidate.save();
    console.log("Candidate saved successfully");
    
    res.json({ interview: candidate.interview });
  } catch (err) {
    next(err);
  }
};

/**
 * submitAnswer: save answer to a specific question index, score it (sync or via AI)
 * Expected body: { candidateId, questionIndex, answer, timeTakenSec }
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { candidateId, questionIndex, answer, timeTakenSec } = req.body;
    console.log("Submit answer request:", { candidateId, questionIndex, answer, timeTakenSec });
    
    if (!candidateId || typeof questionIndex !== "number")
      return res
        .status(400)
        .json({ error: "candidateId and questionIndex required" });

    const candidate = await Candidate.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    console.log("Candidate found:", candidate.name);
    console.log("Interview object:", candidate.interview);
    
    if (!candidate.interview || !candidate.interview.questions) {
      return res.status(400).json({ error: "Interview not initialized" });
    }

    const q = candidate.interview.questions[questionIndex];
    if (!q) return res.status(400).json({ error: "Invalid question index" });

    // Save answer and timestamps
    q.a = answer || "";
    q.answeredAt = new Date();
    q.timeTakenSec =
      typeof timeTakenSec === "number" ? timeTakenSec : q.timeTakenSec;

    // Score (could be async)
    console.log("Scoring answer:", { answer: q.a, question: q.q, difficulty: q.difficulty });
    const scoringResult = await scoreAnswer({
      answer: q.a,
      question: q.q,
      difficulty: q.difficulty,
    });
    console.log("Scoring result:", scoringResult);
    q.score = scoringResult.score; // Only save the numeric score

    // update currentQuestionIndex
    candidate.interview.currentQuestionIndex = Math.min(
      candidate.interview.questions.length,
      questionIndex + 1
    );

    // If finished all questions, finalize
    const allAnswered = candidate.interview.questions.every(
      (qq) => typeof qq.score === "number" && qq.score !== null
    );
    if (allAnswered) {
      candidate.interview.status = "completed";
      candidate.interview.completedAt = new Date();
      // calculate finalScore and summary
      const qaPairs = candidate.interview.questions.map(
        ({ q, a, score, difficulty }) => ({ q, a, score, difficulty })
      );
      const summaryResult = await generateSummary(
        {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
        },
        qaPairs
      );
      candidate.interview.finalScore = summaryResult.finalScore;
      candidate.interview.summary = summaryResult.summary;
      candidate.interview.hiringRecommendation = summaryResult.hiringRecommendation;
      candidate.interview.strengths = summaryResult.strengths;
      candidate.interview.areasForImprovement = summaryResult.areasForImprovement;
    }

    console.log("Saving candidate with updated interview...");
    await candidate.save();
    console.log("Candidate saved successfully with score:", q.score);
    res.json({ interview: candidate.interview });
  } catch (err) {
    next(err);
  }
};

/**
 * pause/resume: set status to paused or ongoing
 * body: { candidateId, action: 'pause' | 'resume' }
 */
const setPauseResume = async (req, res, next) => {
  try {
    const { candidateId, action } = req.body;
    if (!candidateId || !["pause", "resume"].includes(action))
      return res.status(400).json({ error: "Invalid request" });
    const candidate = await Candidate.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });
    candidate.interview.status = action === "pause" ? "paused" : "ongoing";
    await candidate.save();
    res.json({ interview: candidate.interview });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startInterview,
  submitAnswer,
  setPauseResume,
};
