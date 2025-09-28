const express = require("express");
const router = express.Router();
const {
  getCandidates,
  getCandidateById,
  updateCandidate,
} = require("../controllers/candidateController");

// GET /api/candidates
router.get("/", getCandidates);

// GET /api/candidates/:id
router.get("/:id", getCandidateById);

// PUT /api/candidates/:id
router.put("/:id", updateCandidate);

module.exports = router;
