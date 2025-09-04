const LOCAL_QUESTIONS = [
  { question: "Which of these is a primitive data type in Java?", options: ["String", "int", "Array", "Class"], correctAnswer: "int" },
  { question: "What is the entry point for a Java application?", options: ["main()", "start()", "run()", "execute()"], correctAnswer: "main()" },
  { question: "What keyword is used to declare a constant in Java?", options: ["const", "final", "static", "volatile"], correctAnswer: "final" },
];

let questions = [];
let current = 0;
let selected = null;
let answers = [];
let score = 0;
let timer;
let timeLeft = 30;

const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const startScreen = document.getElementById("start-screen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const answersEl = document.getElementById("answers");
const highScoreEl = document.getElementById("highScore");

document.getElementById("startBtn").onclick = startQuiz;
document.getElementById("nextBtn").onclick = nextQuestion;
document.getElementById("prevBtn").onclick = prevQuestion;
document.getElementById("skipBtn").onclick = skipQuestion;
document.getElementById("restartBtn").onclick = restartQuiz;

function startQuiz() {
  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  loadQuestions();
}

async function loadQuestions() {
  try {
    const res = await fetch("https://opentdb.com/api.php?amount=5&type=multiple");
    const data = await res.json();
    questions = data.results.map(q => ({
      question: q.question,
      options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
      correctAnswer: q.correct_answer
    }));
  } catch {
    questions = LOCAL_QUESTIONS;
  }
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  questionEl.innerHTML = q.question;
  progressEl.textContent = `Question ${current+1} of ${questions.length}`;
  optionsEl.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.onclick = () => selectOption(btn, opt);
    optionsEl.appendChild(btn);
  });
  selected = null;
  resetTimer();
}

function selectOption(btn, option) {
  document.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selected = option;
}

function saveAnswer(ans) {
  const q = questions[current];
  const isCorrect = ans === q.correctAnswer;
  answers.push({ ...q, selectedOption: ans, isCorrect });
  if (isCorrect) score++;
}

function nextQuestion() {
  if (!selected) return;
  saveAnswer(selected);
  if (current+1 < questions.length) {
    current++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function prevQuestion() {
  if (current > 0) {
    current--;
    showQuestion();
  }
}

function skipQuestion() {
  saveAnswer("Skipped");
  if (current+1 < questions.length) {
    current++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  quizScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");
  scoreEl.textContent = `You scored ${score} out of ${questions.length}`;
  answersEl.innerHTML = answers.map((a,i) => `
    <div>
      <strong>Q${i+1}:</strong> ${a.question}<br/>
      Your Answer: <span class="${a.isCorrect ? "correct" : "wrong"}">${a.selectedOption}</span><br/>
      ${!a.isCorrect ? `Correct Answer: <span class="correct">${a.correctAnswer}</span>` : ""}
    </div>
  `).join("");

  const high = Math.max(score, localStorage.getItem("highScore") || 0);
  localStorage.setItem("highScore", high);
  highScoreEl.textContent = high;
}

function restartQuiz() {
  resultsScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  current = 0;
  score = 0;
  answers = [];
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timerEl.textContent = `⏳ ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏳ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      skipQuestion();
    }
  }, 1000);
}
