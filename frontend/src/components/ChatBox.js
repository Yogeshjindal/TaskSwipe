import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input, Button, Card, message, Spin } from "antd";
import { addAnswer, nextQuestion, setStatus } from "../store/interviewSlice";
import { submitAnswer } from "../services/interviewAPI";
import Timer from "./Timer";

function ChatBox() {
  const dispatch = useDispatch();
  const { candidate = null, questions = [], currentQuestion = 0, status } =
    useSelector((state) => state.interview);

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!questions.length) {
    return <p>⚠️ No questions loaded. Please click "Start Interview".</p>;
  }

  if (status === "completed") {
    return <p>✅ Interview finished. Thank you!</p>;
  }

  const q = questions[currentQuestion];
  if (!q) return <p>⚠️ Question not found.</p>;

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!autoSubmit && !answer.trim()) {
        message.warning("Please type an answer before submitting.");
        return;
      }

      setSubmitting(true);
      try {
        const finalAnswer = autoSubmit
          ? answer || "No answer provided - time expired"
          : answer;

        // Save in Redux
        dispatch(
          addAnswer({
            q: q.q || "Untitled question",
            a: finalAnswer,
            difficulty: q.difficulty || "medium",
          })
        );

        // Submit to backend
        console.log("📤 Submitting answer:", {
          candidateId: candidate._id,
          questionIndex: currentQuestion,
          answer: finalAnswer,
        });

        const response = await submitAnswer(
          candidate._id,
          currentQuestion,
          finalAnswer
        );

        console.log("✅ Backend response:", response.data);

        setAnswer("");

        if (currentQuestion < questions.length - 1) {
          dispatch(nextQuestion());
          if (autoSubmit) {
            message.warning(
              "⏰ Time's up! Your answer was auto-submitted. Moving to next question."
            );
          }
        } else {
          dispatch(setStatus("completed"));
          message.success("🎉 Interview completed!");
        }
      } catch (err) {
        console.error("❌ Error submitting answer:", err);
        message.error(
          `Failed to submit: ${err.response?.data?.error || err.message}`
        );
      } finally {
        setSubmitting(false);
      }
    },
    [answer, q, candidate?._id, currentQuestion, questions.length, dispatch]
  );

  const handleTimeUp = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  return (
    <Card
      style={{
        marginTop: 20,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        borderRadius: 15,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        border: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          padding: "15px 20px",
          background: "linear-gradient(45deg, #667eea, #764ba2)",
          borderRadius: 10,
          color: "white",
          margin: "-16px -16px 20px -16px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold" }}>
          📝 Question {currentQuestion + 1} of {questions.length}
        </h3>
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "5px 15px",
            borderRadius: 20,
            fontSize: "0.9rem",
            fontWeight: "bold",
          }}
        >
          {(q.difficulty || "medium").toUpperCase()}
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          fontSize: "1.1rem",
          lineHeight: "1.6",
          marginBottom: 20,
          padding: "15px",
          background: "rgba(255,255,255,0.8)",
          borderRadius: 10,
          border: "1px solid #e1e8ed",
        }}
      >
        {q.q || "❓ No question text available."}
      </div>

      {/* Timer */}
      <Timer
        key={currentQuestion}
        difficulty={q.difficulty || "medium"}
        onTimeUp={handleTimeUp}
      />

      {/* Answer Box */}
      <Input.TextArea
        rows={4}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        disabled={submitting}
        style={{
          marginTop: 10,
          borderRadius: 10,
          border: "2px solid #e1e8ed",
          fontSize: "1rem",
          lineHeight: "1.5",
          padding: "15px",
        }}
      />

      {/* Submit Button */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => handleSubmit(false)}
          loading={submitting}
          disabled={!answer.trim() && !submitting}
          style={{
            background: "linear-gradient(45deg, #4CAF50, #45a049)",
            border: "none",
            borderRadius: 25,
            padding: "12px 30px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            boxShadow: "0 6px 15px rgba(76, 175, 80, 0.4)",
            transition: "all 0.3s ease",
            height: "auto",
          }}
        >
          {submitting ? (
            <>
              <Spin size="small" style={{ marginRight: 8 }} /> Submitting...
            </>
          ) : (
            "📤 Submit Answer"
          )}
        </Button>
      </div>
    </Card>
  );
}

export default ChatBox;
