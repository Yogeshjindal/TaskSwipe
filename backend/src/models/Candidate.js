const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  q: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
  a: { type: String, default: "" },
  score: { type: Number, default: null }, // per-question score (0-100)
  startedAt: { type: Date, default: null },
  answeredAt: { type: Date, default: null },
  timeTakenSec: { type: Number, default: null },
});

const InterviewSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "not-started","ongoing", "paused", "completed"],
    default: "pending",
  },
  currentQuestionIndex: { type: Number, default: 0 },
  questions: [QuestionSchema],
  finalScore: { type: Number, default: null },
  summary: { type: String, default: "" },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
});

const CandidateSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    metadata: { type: Object, default: {} }, // raw parsed resume metadata if needed
    interview: { type: InterviewSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", CandidateSchema);
module.exports = Candidate;
