const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const openaiKey = process.env.OPENAI_API_KEY || "";
const geminiKey = process.env.GEMINI_API_KEY || "";
const model = process.env.OPENAI_MODEL || "gpt-4o";

let openaiClient = null;
let geminiClient = null;

console.log("🔍 Environment variables debug:");
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("OPENAI_MODEL:", process.env.OPENAI_MODEL);

if (openaiKey) {
  openaiClient = new OpenAI({ apiKey: openaiKey });
  console.log("OpenAI client initialized successfully");
}

if (geminiKey) {
  geminiClient = new GoogleGenerativeAI(geminiKey);
  console.log("Gemini client initialized successfully");
}

if (!openaiKey && !geminiKey) {
  console.warn("No API keys found - using fallback questions");
}

/**
 * Fallback questions
 */
const getFallbackQuestions = () => {
  const easy = [
    "What is the virtual DOM and why is it useful in React?",
    "Explain the difference between let, const, and var in JavaScript."
  ];
  const medium = [
    "How would you design state management for a medium-sized React application? Which libraries would you consider and why?",
    "Explain how you would secure a REST API built with Node.js and Express — include authentication and input validation."
  ];
  const hard = [
    "Design an approach to scale a real-time collaboration feature for a React app (e.g., concurrent cursors). How would you handle consistency, latency, and failure?",
    "Given a performance bottleneck in a Node.js service under heavy CPU load, how would you diagnose and optimize it?"
  ];
  return [
    ...easy.map(q => ({ q, difficulty: "easy" })),
    ...medium.map(q => ({ q, difficulty: "medium" })),
    ...hard.map(q => ({ q, difficulty: "hard" }))
  ];
};

/**
 * Generate questions for a candidate
 * @param {string} candidateId
 * @param {string} role
 * @returns array of { q, difficulty }
 */
const generateQuestions = async (candidateId, role = "Full Stack (React/Node) developer") => {
  // Try Gemini first for question generation
  if (geminiClient) {
    try {
      console.log("🤖 Generating questions with Gemini for role:", role);
      const geminiQuestions = await generateQuestionsWithGemini(role);
      if (geminiQuestions && geminiQuestions.length > 0) {
        console.log("✅ Gemini questions generated successfully:", geminiQuestions.length, "questions");
        return geminiQuestions;
      } else {
        console.log("❌ Gemini returned empty questions array");
      }
    } catch (err) {
      console.error("❌ Gemini question generation failed:", err.message);
      console.log("Falling back to OpenAI or fallback questions");
    }
  } else {
    console.log("❌ No Gemini client available");
  }

  // Try OpenAI if Gemini fails
  if (openaiClient) {
    try {
      console.log("🤖 Generating questions with OpenAI for role:", role);
      const openaiQuestions = await generateQuestionsWithOpenAI(role);
      if (openaiQuestions && openaiQuestions.length > 0) {
        console.log("✅ OpenAI questions generated successfully:", openaiQuestions.length, "questions");
        return openaiQuestions;
      } else {
        console.log("❌ OpenAI returned empty questions array");
      }
    } catch (err) {
      console.error("❌ OpenAI question generation failed:", err.message);
      console.log("Falling back to fallback questions");
    }
  } else {
    console.log("❌ No OpenAI client available");
  }

  // Fallback to static questions
  console.log("Using fallback questions (no AI available)");
  return getFallbackQuestions();
};

/**
 * Generate questions using Gemini AI
 */
const generateQuestionsWithGemini = async (role) => {
  if (!geminiClient) return null;

  const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert technical interviewer. Generate exactly 6 interview questions for a ${role} position.

Requirements:
- 2 EASY questions (basic concepts, syntax, fundamentals)
- 2 MEDIUM questions (practical application, problem-solving)
- 2 HARD questions (system design, complex scenarios, optimization)

Make sure questions are:
- Specific to React and Node.js technologies
- Progressive in difficulty
- Practical and relevant to real-world scenarios
- Different from previous interviews (generate fresh questions each time)

Return ONLY a valid JSON array with this exact format:
[
  { "q": "question text here", "difficulty": "easy" },
  { "q": "question text here", "difficulty": "easy" },
  { "q": "question text here", "difficulty": "medium" },
  { "q": "question text here", "difficulty": "medium" },
  { "q": "question text here", "difficulty": "hard" },
  { "q": "question text here", "difficulty": "hard" }
]

Return ONLY the JSON array, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Raw Gemini questions response:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.log("Direct JSON parse failed, trying to extract JSON...");
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    }

    // Validate the parsed response
    if (!Array.isArray(parsed) || parsed.length !== 6) {
      throw new Error(`Invalid questions array: expected 6 questions, got ${parsed.length}`);
    }

    // Validate each question
    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      if (!q.q || typeof q.q !== "string" || !q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty)) {
        throw new Error(`Invalid question at index ${i}: missing q or difficulty`);
      }
    }

    console.log(`Gemini questions generated successfully: ${parsed.length} questions`);
    return parsed;
  } catch (err) {
    console.error("Gemini questions error:", err.message);
    throw err;
  }
};

/**
 * Generate questions using OpenAI
 */
const generateQuestionsWithOpenAI = async (role) => {
  if (!openaiClient) return null;

  const prompt = `You are an expert technical interviewer. Generate exactly 6 interview questions for a ${role} position.

Requirements:
- 2 EASY questions (basic concepts, syntax, fundamentals)
- 2 MEDIUM questions (practical application, problem-solving)
- 2 HARD questions (system design, complex scenarios, optimization)

Make sure questions are:
- Specific to React and Node.js technologies
- Progressive in difficulty
- Practical and relevant to real-world scenarios
- Different from previous interviews (generate fresh questions each time)

Return ONLY a valid JSON array with this exact format:
[
  { "q": "question text here", "difficulty": "easy" },
  { "q": "question text here", "difficulty": "easy" },
  { "q": "question text here", "difficulty": "medium" },
  { "q": "question text here", "difficulty": "medium" },
  { "q": "question text here", "difficulty": "hard" },
  { "q": "question text here", "difficulty": "hard" }
]

Return ONLY the JSON array, no other text.`;

  try {
    console.log(`Generating questions with OpenAI for role: ${role}`);

    const resp = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from OpenAI");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Extract JSON array if needed
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse JSON from OpenAI response");
    }

    // Validate the parsed response
    if (!Array.isArray(parsed) || parsed.length !== 6) {
      throw new Error(`Invalid questions array: expected 6 questions, got ${parsed.length}`);
    }

    // Validate each question
    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      if (!q.q || typeof q.q !== "string" || !q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty)) {
        throw new Error(`Invalid question at index ${i}: missing q or difficulty`);
      }
    }

    console.log(`OpenAI questions generated successfully: ${parsed.length} questions`);
    return parsed;
  } catch (err) {
    console.error("OpenAI questions error:", err.message);
    throw err;
  }
};

/**
 * Generate summary for candidate responses
 */
const generateSummary = async (candidateProfile, qaPairs) => {
  const calculateFallbackScore = () => {
    if (!qaPairs || qaPairs.length === 0) return 0;
    const total = qaPairs.reduce((sum, p) => sum + (typeof p.score === "number" ? p.score : 0), 0);
    return Math.round(total / qaPairs.length);
  };

  const getFallbackSummary = () => {
    const finalScore = calculateFallbackScore();
    const name = candidateProfile?.name || "Candidate";
    const recommendation = finalScore >= 70 ? "Recommended for next round" : "Needs improvement";
    return {
      summary: `${name} completed a technical interview with an average score of ${finalScore}%. ${recommendation}. This is an automated assessment based on question responses.`,
      finalScore
    };
  };

  // Try Gemini first for summary generation
  if (geminiClient) {
    try {
      console.log("Generating summary with Gemini");
      const geminiSummary = await generateSummaryWithGemini(candidateProfile, qaPairs);
      if (geminiSummary) {
        return geminiSummary;
      }
    } catch (err) {
      console.error("Gemini summary failed:", err.message);
      console.log("Falling back to OpenAI or heuristic summary");
    }
  }

  // Try OpenAI if Gemini fails
  if (openaiClient) {
    try {
      console.log("Generating summary with OpenAI");
      const openaiSummary = await generateSummaryWithOpenAI(candidateProfile, qaPairs);
      if (openaiSummary) {
        return openaiSummary;
      }
    } catch (err) {
      console.error("OpenAI summary failed:", err.message);
      console.log("Falling back to heuristic summary");
    }
  }

  // Fallback to heuristic
  console.log("Using heuristic summary as fallback");
  return getFallbackSummary();
};

/**
 * Generate summary using Gemini AI
 */
const generateSummaryWithGemini = async (candidateProfile, qaPairs) => {
  if (!geminiClient) return null;

 // const model = geminiClient.getGenerativeModel({ model: "gemini-1.0-pro" });
   const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });


  const prompt = `You are an expert technical interviewer reviewing a candidate's performance.

CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

INTERVIEW QUESTIONS AND RESPONSES WITH SCORES:
${JSON.stringify(qaPairs, null, 2)}

Based on the candidate's performance, provide a comprehensive evaluation including:

1. **Overall Assessment**: Brief summary of the candidate's technical knowledge
2. **Strengths**: What the candidate did well
3. **Areas for Improvement**: Where the candidate needs work
4. **Hiring Recommendation**: Should this candidate be hired? (Yes/No/Maybe)
5. **Final Score**: Overall score out of 100

Provide your evaluation in this exact JSON format:
{
  "summary": "[3-4 sentence professional summary of the candidate's performance, strengths, and areas for improvement]",
  "finalScore": [number between 0-100],
  "hiringRecommendation": "[Yes/No/Maybe with brief reasoning]",
  "strengths": "[List of 2-3 key strengths]",
  "areasForImprovement": "[List of 2-3 areas needing work]"
}

Return ONLY the JSON object, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Raw Gemini summary response:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.log("Direct JSON parse failed, trying to extract JSON...");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    }

    // Validate the parsed response
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Response is not a valid object");
    }

    if (typeof parsed.finalScore !== "number" || parsed.finalScore < 0 || parsed.finalScore > 100) {
      throw new Error(`Invalid finalScore: ${parsed.finalScore}`);
    }

    if (!parsed.summary || typeof parsed.summary !== "string" || !parsed.summary.trim()) {
      throw new Error("Invalid or missing summary");
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(parsed.finalScore)));

    console.log(`Gemini summary successful: ${finalScore}/100`);

    return {
      summary: parsed.summary.trim(),
      finalScore: finalScore,
      hiringRecommendation: parsed.hiringRecommendation || "Maybe",
      strengths: parsed.strengths || "Not specified",
      areasForImprovement: parsed.areasForImprovement || "Not specified"
    };
  } catch (err) {
    console.error("Gemini summary error:", err.message);
    throw err;
  }
};

/**
 * Generate summary using OpenAI
 */
const generateSummaryWithOpenAI = async (candidateProfile, qaPairs) => {
  if (!openaiClient) return null;

  const prompt = `You are an expert technical interviewer reviewing a candidate's performance.

CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

INTERVIEW QUESTIONS AND RESPONSES WITH SCORES:
${JSON.stringify(qaPairs, null, 2)}

Based on the candidate's performance, provide a comprehensive evaluation including:

1. **Overall Assessment**: Brief summary of the candidate's technical knowledge
2. **Strengths**: What the candidate did well
3. **Areas for Improvement**: Where the candidate needs work
4. **Hiring Recommendation**: Should this candidate be hired? (Yes/No/Maybe)
5. **Final Score**: Overall score out of 100

Provide your evaluation in this exact JSON format:
{
  "summary": "[3-4 sentence professional summary of the candidate's performance, strengths, and areas for improvement]",
  "finalScore": [number between 0-100],
  "hiringRecommendation": "[Yes/No/Maybe with brief reasoning]",
  "strengths": "[List of 2-3 key strengths]",
  "areasForImprovement": "[List of 2-3 areas needing work]"
}

Return ONLY the JSON object, no other text.`;

  try {
    const resp = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from OpenAI");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.log("Direct JSON parse failed, trying to extract JSON...");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    }

    // Validate the parsed response
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Response is not a valid object");
    }

    if (typeof parsed.finalScore !== "number" || parsed.finalScore < 0 || parsed.finalScore > 100) {
      throw new Error(`Invalid finalScore: ${parsed.finalScore}`);
    }

    if (!parsed.summary || typeof parsed.summary !== "string" || !parsed.summary.trim()) {
      throw new Error("Invalid or missing summary");
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(parsed.finalScore)));

    console.log(`OpenAI summary successful: ${finalScore}/100`);

    return {
      summary: parsed.summary.trim(),
      finalScore: finalScore,
      hiringRecommendation: parsed.hiringRecommendation || "Maybe",
      strengths: parsed.strengths || "Not specified",
      areasForImprovement: parsed.areasForImprovement || "Not specified"
    };
  } catch (err) {
    console.error("OpenAI summary error:", err.message);
    throw err;
  }
};

/**
 * Test OpenAI connection
 */
const testOpenAIConnection = async () => {
  if (!openaiClient) {
    return { success: false, message: "No OpenAI API key configured" };
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5,
    });
    
    return { 
      success: true, 
      message: "OpenAI connection successful",
      model: model
    };
  } catch (error) {
    return { 
      success: false, 
      message: `OpenAI connection failed: ${error.message}` 
    };
  }
};

module.exports = { generateQuestions, generateSummary, testOpenAIConnection };
