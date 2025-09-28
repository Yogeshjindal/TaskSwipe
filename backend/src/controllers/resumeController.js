const path = require("path");
const Candidate = require("../models/Candidate");
const { parseResume } = require("../services/resumeParser");

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    // Parse resume safely
    let parsed = {};
    try {
      parsed = await parseResume(filePath, mimetype);
    } catch (err) {
      console.error("Resume parsing failed:", err);
      return res.status(500).json({ error: "Failed to parse resume" });
    }

    // Create candidate safely
    const candidate = new Candidate({
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      resumeUrl: `/${path.relative(path.join(__dirname, "..", ".."), filePath)}`,
      metadata: parsed,
      interview: {
        status: "not-started",
        currentQuestionIndex: 0,
        questions: [],
      },
    });

    try {
      await candidate.save();
    } catch (err) {
      console.error("Candidate save failed:", err);
      return res.status(500).json({ error: "Failed to save candidate" });
    }

    console.log("Candidate created successfully:", candidate._id);
    return res.json(candidate);

  } catch (err) {
    console.error("Unexpected error in uploadResume:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { uploadResume };
