const express = require("express");
const cors = require("cors");
const path = require("path");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const errorHandler = require("./utils/errorHandler");
const {
  generateSummary,
  testOpenAIConnection,
  generateQuestions,
} = require("./services/aiService");

const app = express();
app.use(cors()); // allows everything

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")
  )
);

// Routes
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/candidates", candidateRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// Test endpoint
// Replace your existing test endpoint in app.js with this:

app.get("/api/test-openai", async (req, res) => {
  try {
    const role = req.query.role || "React Developer";

    // Test OpenAI connection
    const connectionTest = await testOpenAIConnection();
    console.log("Connection test:", connectionTest);

    // Always try to generate questions (will use fallback if OpenAI fails)
    console.log("Attempting to generate questions...");
    const questions = await generateQuestions(role);

    console.log(`Generated ${questions.length} questions`);

    // Determine which method was used
    const usingOpenAI = connectionTest.success && questions.length > 0;
    const method = usingOpenAI ? "OpenAI" : "Fallback";

    res.json({
      success: true,
      connection: connectionTest,
      role: role,
      method: method,
      totalQuestions: questions.length,
      sampleQuestions: questions,
      note: usingOpenAI
        ? "Questions generated using OpenAI"
        : `Using fallback questions due to: ${connectionTest.message}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
