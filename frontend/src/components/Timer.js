import React, { useEffect, useState, useRef } from "react";

function Timer({ difficulty, onTimeUp }) {
  let duration = 20; // easy questions
  if (difficulty === "medium") duration = 60;
  if (difficulty === "hard") duration = 120;

  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredRef = useRef(false);

  // Update the ref when onTimeUp changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onTimeUpRef.current();
      return;
    }
    
    if (timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  // Reset the timer when component mounts (new question)
  useEffect(() => {
    setTimeLeft(duration);
    hasTriggeredRef.current = false;
  }, [duration]);

  return (
    <div style={{ 
      marginBottom: 15, 
      padding: '10px 15px',
      background: timeLeft <= 10 ? 'linear-gradient(45deg, #ff6b6b, #ee5a52)' : 'linear-gradient(45deg, #4ecdc4, #44a08d)',
      borderRadius: 20,
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '1rem',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease'
    }}>
      ⏱️ Time remaining: {timeLeft}s
    </div>
  );
}

export default Timer;
