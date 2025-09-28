const { GoogleGenerativeAI } = require("@google/generative-ai");

const openaiKey = process.env.OPENAI_API_KEY || "";
const geminiKey = process.env.GEMINI_API_KEY || "";
const model = process.env.OPENAI_MODEL || "gpt-4o";

let openaiClient = null;
let geminiClient = null;

if (openaiKey) {
  const OpenAI = require("openai");
  openaiClient = new OpenAI({ apiKey: openaiKey });
  console.log("OpenAI client initialized for scoring service");
}

if (geminiKey) {
  geminiClient = new GoogleGenerativeAI(geminiKey);
  console.log("Gemini client initialized for scoring service");
}

if (!openaiKey && !geminiKey) {
  console.warn("No API keys found - using basic heuristic scoring only");
}

/**
 * scoreAnswer(answer, question, difficulty)
 * Returns object: { score: number (0-100), reason: string, method: string }
 * Fallback: simple heuristic based on length and presence of keywords.
 */
const scoreAnswer = async ({
  answer = "",
  question = "",
  difficulty = "easy",
}) => {
  const cleanAnswer = (answer || "").trim();
  const cleanQuestion = (question || "").trim();

  // Enhanced heuristic scoring function with content relevance
  const getHeuristicScore = () => {
    if (!cleanAnswer) {
      return {
        score: 0,
        reason: "No answer provided",
        method: "heuristic",
      };
    }

    const len = cleanAnswer.length;
    let base = 10; // Lower base score

    // Adjust base score by difficulty
    switch (difficulty.toLowerCase()) {
      case "easy":
        base = 15;
        break;
      case "medium":
        base = 20;
        break;
      case "hard":
        base = 25;
        break;
      default:
        base = 15;
    }

    // Length-based scoring (reduced weight)
    let lengthScore = 0;
    if (len < 10) {
      lengthScore = 0; // Very short answers get no length points
    } else if (len < 50) {
      lengthScore = 5;
    } else if (len < 150) {
      lengthScore = 10;
    } else if (len < 300) {
      lengthScore = 15;
    } else {
      lengthScore = 20; // Max length points reduced
    }

    let score = base + lengthScore;

    // Bonus for code-like patterns
    const codePatterns = [
      /```[\s\S]*?```/, // Code blocks
      /function\s+\w+\s*\(/i, // Function declarations
      /const\s+\w+\s*=/, // Variable declarations
      /class\s+\w+/i, // Class declarations
      /[{}();]/, // Basic code syntax
      /\.then\s*\(/, // Promise chains
      /async\s+function/i, // Async functions
      /=>\s*{/, // Arrow functions
    ];

    const hasCode = codePatterns.some((pattern) => pattern.test(cleanAnswer));
    if (hasCode) {
      score += 15;
    }

    // Enhanced keyword detection with categories
    const keywordCategories = {
      javascript: [
        "async",
        "promise",
        "callback",
        "closure",
        "prototype",
        "hoisting",
        "scope",
      ],
      frontend: [
        "react",
        "jsx",
        "component",
        "hook",
        "state",
        "props",
        "virtual dom",
        "redux",
        "context",
      ],
      backend: [
        "node",
        "express",
        "middleware",
        "router",
        "api",
        "rest",
        "endpoint",
      ],
      database: [
        "mongodb",
        "sql",
        "query",
        "index",
        "schema",
        "collection",
        "document",
      ],
      performance: [
        "optimization",
        "caching",
        "lazy loading",
        "debounce",
        "throttle",
        "memoization",
      ],
      concepts: [
        "algorithm",
        "data structure",
        "complexity",
        "scalability",
        "architecture",
      ],
    };

    let keywordScore = 0;
    let matchedCategories = new Set();

    Object.entries(keywordCategories).forEach(([category, keywords]) => {
      const matches = keywords.filter((keyword) =>
        cleanAnswer.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        matchedCategories.add(category);
        keywordScore += Math.min(5, matches.length * 2); // Max 5 points per category
      }
    });

    // Bonus for covering multiple technical areas
    if (matchedCategories.size >= 2) {
      score += 10;
    }

    // Penalty for very generic answers
    const genericPhrases = [
      "i think",
      "maybe",
      "probably",
      "not sure",
      "don't know",
      "i don't know",
      "not sure about this",
      "maybe this",
      "probably this",
    ];
    const genericCount = genericPhrases.reduce(
      (count, phrase) =>
        count + (cleanAnswer.toLowerCase().includes(phrase) ? 1 : 0),
      0
    );

    if (genericCount >= 2) {
      score -= 15; // Increased penalty
    }

    // Content relevance analysis (basic)
    const questionWords = cleanQuestion.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Get meaningful words from question
    
    const answerWords = cleanAnswer.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Get meaningful words from answer
    
    // Check for relevant technical terms in answer
    const relevantTerms = questionWords.filter(qWord => 
      answerWords.some(aWord => 
        aWord.includes(qWord) || qWord.includes(aWord) ||
        // Check for related terms
        (qWord.includes('react') && aWord.includes('component')) ||
        (qWord.includes('javascript') && (aWord.includes('js') || aWord.includes('script'))) ||
        (qWord.includes('node') && aWord.includes('server')) ||
        (qWord.includes('api') && aWord.includes('endpoint'))
      )
    );
    
    const relevanceScore = Math.min(30, relevantTerms.length * 5); // Max 30 points for relevance
    score += relevanceScore;
    
    // Penalty for completely irrelevant answers
    if (relevantTerms.length === 0 && len > 20) {
      score -= 20; // Heavy penalty for long but irrelevant answers
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, Math.round(score)));

    let reason = `Heuristic scoring: length (${len} chars), `;
    if (hasCode) reason += "code examples, ";
    if (matchedCategories.size > 0) {
      reason += `technical keywords (${Array.from(matchedCategories).join(
        ", "
      )}), `;
    }
    reason += `relevance (${relevantTerms.length} terms), difficulty: ${difficulty}`;

    return {
      score,
      reason: reason.replace(/, $/, ""), // Remove trailing comma
      method: "heuristic",
    };
  };

  // Get heuristic score first (fallback)
  const heuristicResult = getHeuristicScore();

  // Try Gemini first (preferred)
  if (geminiClient) {
    try {
      console.log(`🤖 Scoring answer with Gemini for difficulty: ${difficulty}`);
      const geminiResult = await scoreWithGemini(cleanQuestion, cleanAnswer, difficulty);
      if (geminiResult) {
        console.log("✅ Gemini scoring successful:", geminiResult.score);
        return geminiResult;
      } else {
        console.log("❌ Gemini returned invalid result:", geminiResult);
      }
    } catch (err) {
      console.error("❌ Gemini scoring failed:", err.message);
      console.log("Falling back to OpenAI or heuristic scoring");
    }
  } else {
    console.log("❌ No Gemini client available for scoring");
  }

  // Try OpenAI if Gemini fails
  if (openaiClient) {
    try {
      console.log(`Scoring answer with OpenAI for difficulty: ${difficulty}`);
      const openaiResult = await scoreWithOpenAI(cleanQuestion, cleanAnswer, difficulty);
      if (openaiResult) {
        return openaiResult;
      }
    } catch (err) {
      console.error("OpenAI scoring failed:", err.message);
      console.log("Falling back to heuristic scoring");
    }
  }

  // Fallback to heuristic
  console.log("Using heuristic scoring as fallback");
  return heuristicResult;
};

/**
 * Score answer using Gemini AI
 */
const scoreWithGemini = async (question, answer, difficulty) => {
  if (!geminiClient) return null;

   const model = geminiClient.getGenerativeModel({ model: "gemini-1.0-pro" });
  // const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

QUESTION: ${question}
DIFFICULTY: ${difficulty}
CANDIDATE'S ANSWER: ${answer}

CRITICAL: Focus on CONTENT RELEVANCE and TECHNICAL ACCURACY, not just length.

Evaluate this answer based on:
1. **RELEVANCE**: Does the answer actually address the question asked? (Most important)
2. **TECHNICAL ACCURACY**: Are the technical details correct?
3. **COMPLETENESS**: Does it cover the main aspects of the question?
4. **UNDERSTANDING**: Does it show genuine understanding vs. just keywords?
5. **PRACTICAL KNOWLEDGE**: Does it demonstrate real-world application?

SCORING GUIDELINES (be strict about relevance):
- 0-20: Completely irrelevant or wrong answer (including copying the question)
- 21-40: Partially relevant but major gaps or inaccuracies
- 41-60: Somewhat relevant with some correct points
- 61-80: Mostly relevant and technically sound
- 81-100: Highly relevant, accurate, and comprehensive

PENALIZE HEAVILY for:
- Answers that don't address the question
- Copying the question as an answer (should get 0-10 points)
- Generic responses with no specific content
- Technical inaccuracies
- "I don't know" or "no idea" responses (should get 0-15 points)

Provide your evaluation in this exact JSON format:
{
  "score": [number between 0-100],
  "reason": "[2-3 sentence explanation focusing on relevance and accuracy]"
}

Return ONLY the JSON object, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Raw Gemini scoring response:", text);

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

    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) {
      throw new Error(`Invalid score: ${parsed.score}`);
    }

    if (!parsed.reason || typeof parsed.reason !== "string" || !parsed.reason.trim()) {
      throw new Error("Invalid or missing reason");
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(parsed.score)));

    console.log(`Gemini scoring successful: ${finalScore}/100`);

    return {
      score: finalScore,
      reason: parsed.reason.trim(),
      method: "gemini",
    };
  } catch (err) {
    console.error("Gemini scoring error:", err.message);
    throw err;
  }
};

/**
 * Score answer using OpenAI
 */
const scoreWithOpenAI = async (question, answer, difficulty) => {
  if (!openaiClient) return null;

  const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

QUESTION: ${question}
DIFFICULTY: ${difficulty}
CANDIDATE'S ANSWER: ${answer}

CRITICAL: Focus on CONTENT RELEVANCE and TECHNICAL ACCURACY, not just length.

Evaluate this answer based on:
1. **RELEVANCE**: Does the answer actually address the question asked? (Most important)
2. **TECHNICAL ACCURACY**: Are the technical details correct?
3. **COMPLETENESS**: Does it cover the main aspects of the question?
4. **UNDERSTANDING**: Does it show genuine understanding vs. just keywords?
5. **PRACTICAL KNOWLEDGE**: Does it demonstrate real-world application?

SCORING GUIDELINES (be strict about relevance):
- 0-20: Completely irrelevant or wrong answer (including copying the question)
- 21-40: Partially relevant but major gaps or inaccuracies
- 41-60: Somewhat relevant with some correct points
- 61-80: Mostly relevant and technically sound
- 81-100: Highly relevant, accurate, and comprehensive

PENALIZE HEAVILY for:
- Answers that don't address the question
- Copying the question as an answer (should get 0-10 points)
- Generic responses with no specific content
- Technical inaccuracies
- "I don't know" or "no idea" responses (should get 0-15 points)

Provide your evaluation in this exact JSON format:
{
  "score": [number between 0-100],
  "reason": "[2-3 sentence explanation focusing on relevance and accuracy]"
}

Return ONLY the JSON object, no other text.`;

  try {
    const resp = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.1,
    });

    const text = resp.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    console.log("Raw OpenAI scoring response:", text);

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

    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) {
      throw new Error(`Invalid score: ${parsed.score}`);
    }

    if (!parsed.reason || typeof parsed.reason !== "string" || !parsed.reason.trim()) {
      throw new Error("Invalid or missing reason");
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(parsed.score)));

    console.log(`OpenAI scoring successful: ${finalScore}/100`);

    return {
      score: finalScore,
      reason: parsed.reason.trim(),
      method: "openai",
    };
  } catch (err) {
    console.error("OpenAI scoring error:", err.message);
    throw err;
  }
};

/**
 * Batch score multiple answers
 */
const scoreMultipleAnswers = async (questionAnswerPairs) => {
  const results = [];

  for (let i = 0; i < questionAnswerPairs.length; i++) {
    const pair = questionAnswerPairs[i];
    console.log(`Scoring answer ${i + 1}/${questionAnswerPairs.length}`);

    try {
      const result = await scoreAnswer({
        answer: pair.answer,
        question: pair.question,
        difficulty: pair.difficulty,
      });

      results.push({
        ...pair,
        ...result,
      });

      // Small delay to avoid rate limiting
      if ((geminiClient || openaiClient) && i < questionAnswerPairs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error scoring answer ${i + 1}:`, error.message);
      results.push({
        ...pair,
        score: 0,
        reason: `Scoring failed: ${error.message}`,
        method: "error",
      });
    }
  }

  return results;
};

module.exports = {
  scoreAnswer,
  scoreMultipleAnswers,
};
