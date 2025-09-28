const Candidate = require("../models/Candidate");

/**
 * getCandidates: list all with finalScore and summary; support query params for search & sort
 * query: q (search), sort (finalScore|-finalScore|createdAt|-createdAt)
 */
const getCandidates = async (req, res, next) => {
  try {
    const { q, sort = "-updatedAt", page = 1, limit = 50 } = req.query;
    const filter = {};
    if (q) {
      // search by name/email/phone
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { phone: new RegExp(q, "i") },
      ];
    }
    const skip = (Math.max(1, page) - 1) * limit;
    const candidates = await Candidate.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    const total = await Candidate.countDocuments(filter);
    res.json({ candidates, total });
  } catch (err) {
    next(err);
  }
};

/**
 * getCandidateById: full detail for dashboard view
 */
const getCandidateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });
    res.json({ candidate });
  } catch (err) {
    next(err);
  }
};

/**
 * updateCandidate: update candidate details (name, email, phone)
 */
const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true, runValidators: true }
    );
    
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    
    res.json({ candidate });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  updateCandidate,
};
