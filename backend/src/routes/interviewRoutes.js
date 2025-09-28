const express = require("express");
const router = express.Router();
const {
  startInterview,
  submitAnswer,
  setPauseResume,
} = require("../controllers/interviewController");

// POST /api/interview/start
router.post("/start", startInterview);

// POST /api/interview/answer
router.post("/answer", submitAnswer);

// POST /api/interview/pause-resume
router.post("/pause-resume", setPauseResume);

module.exports = router;
