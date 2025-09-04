import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Gradient animation
const animatedGradient = `
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-gradient {
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
`;

// Local fallback questions
const LOCAL_QUESTIONS = [
  { question: "Which of these is a primitive data type in Java?", options: ["String", "int", "Array", "Class"], correctAnswer: "int" },
  { question: "What is the entry point for a Java application?", options: ["main()", "start()", "run()", "execute()"], correctAnswer: "main()" },
  { question: "What keyword is used to declare a constant in Java?", options: ["const", "final", "static", "volatile"], correctAnswer: "final" },
];

// Question Card component (props-driven)
const QuestionCard = ({ questionData, currentIndex, total, selectedOption, onAnswer, onNext, onPrev, onSkip, timeLeft }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl mx-auto">
    <div className="mb-4 flex justify-between items-center">
      <div className="text-gray-500 text-sm font-semibold">Question {currentIndex + 1} of {total}</div>
      <div className="text-sm font-bold text-red-500">⏳ {timeLeft}s</div>
    </div>
    <div className="text-xl font-bold text-gray-800 text-center mb-6">{questionData.question}</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {questionData.options.map((option, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAnswer(option)}
          aria-pressed={selectedOption === option}
          className={`w-full text-left py-3 px-5 rounded-xl ${
            selectedOption === option ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {option}
        </motion.button>
      ))}
    </div>
    <div className="flex justify-between mt-6">
      <button onClick={onPrev} disabled={currentIndex === 0} className="px-4 py-2 bg-gray-300 rounded-lg">Previous</button>
      <div className="space-x-2">
        <button onClick={onSkip} className="px-4 py-2 bg-yellow-400 rounded-lg">Skip</button>
        <button onClick={onNext} className="px-4 py-2 bg-green-500 text-white rounded-lg">
          {currentIndex + 1 === total ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  </div>
);

// Quiz Page
const QuizPage = ({ questions, setResults }) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft === 0) handleNext(); // auto-lock when time runs out
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleAnswer = (option) => setSelectedOption(option);

  const saveAnswer = (option) => {
    const q = questions[currentQuestionIndex];
    const isCorrect = option === q.correctAnswer;
    setUserAnswers([...userAnswers, { ...q, selectedOption: option, isCorrect }]);
    if (isCorrect) setScore(score + 1);
  };

  const handleNext = () => {
    if (!selectedOption) return; // prevent skipping without Skip button
    saveAnswer(selectedOption);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTimeLeft(30);
    } else {
      setResults({ score, userAnswers });
      localStorage.setItem("highScore", Math.max(score, localStorage.getItem("highScore") || 0));
      navigate("/results");
    }
  };

  const handlePrev = () => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  const handleSkip = () => {
    saveAnswer("Skipped");
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTimeLeft(30);
    }
  };

  return (
    <QuestionCard
      questionData={questions[currentQuestionIndex]}
      currentIndex={currentQuestionIndex}
      total={questions.length}
      selectedOption={selectedOption}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      timeLeft={timeLeft}
    />
  );
};

// Results Page
const ResultsPage = ({ results }) => {
  const navigate = useNavigate();
  if (!results) return <div>No results</div>;
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Quiz Complete!</h1>
      <p className="text-center mb-6">You scored {results.score} out of {results.userAnswers.length}</p>
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {results.userAnswers.map((a, i) => (
          <div key={i} className="p-4 border rounded-xl">
            <div className="font-semibold">Q{i + 1}: {a.question}</div>
            <div>Your Answer: <span className={a.isCorrect ? "text-green-600" : "text-red-600"}>{a.selectedOption}</span></div>
            {!a.isCorrect && <div>Correct Answer: <span className="text-green-600">{a.correctAnswer}</span></div>}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <button onClick={() => navigate("/quiz")} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Restart Quiz</button>
      </div>
      <div className="text-sm text-gray-500 mt-2 text-center">High Score: {localStorage.getItem("highScore")}</div>
    </div>
  );
};

// Main App
const App = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("https://opentdb.com/api.php?amount=5&type=multiple");
        const data = await res.json();
        if (data.results.length === 0) throw new Error("No questions");
        const formatted = data.results.map((q, idx) => ({
          question: q.question,
          options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
          correctAnswer: q.correct_answer,
        }));
        setQuestions(formatted);
      } catch (e) {
        console.warn("Falling back to local questions:", e.message);
        setQuestions(LOCAL_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) return <div className="text-center p-8">Loading questions...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

  return (
    <Router>
      <style>{animatedGradient}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animated-gradient flex items-center justify-center p-4">
        <Routes>
          <Route path="/quiz" element={<QuizPage questions={questions} setResults={setResults} />} />
          <Route path="/results" element={<ResultsPage results={results} />} />
          <Route path="*" element={<button onClick={() => window.location.href='/quiz'} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Start Quiz</button>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
