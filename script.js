"use strict";

// Built-in word list: edit this array to customize the game.
const WORDS = [
  "arch", "bake", "ball", "band", "bank", "barn", "bear", "bell",
  "bird", "boat", "bolt", "book", "bowl", "cage", "cake", "camp",
  "card", "cart", "chin", "clam", "clay", "club", "coat", "coin",
  "cold", "corn", "crab", "dark", "deer", "desk", "dirt", "door",
  "drum", "duck", "dust", "face", "farm", "fern", "fire", "fish",
  "flag", "frog", "gate", "gift", "goat", "gold", "hand", "harp",
  "hill", "home", "hope", "horn", "kite", "lake", "lamp", "leaf",
  "lime", "lion", "lock", "moon", "nest", "note", "park", "pear",
  "pine", "pond", "rain", "ring", "road", "rock", "rose", "sail",
  "sand", "seed", "ship", "shoe", "snow", "soap", "star", "surf",
  "tent", "tide", "time", "tree", "wave", "wind", "wolf", "wood",
  "apple", "beach", "bread", "brick", "brush", "candy", "chair",
  "charm", "chess", "cloud", "coral", "crane", "dance", "dream",
  "earth", "flame", "flute", "glass", "grape", "grass", "green",
  "heart", "horse", "house", "juice", "light", "magic", "maple",
  "metal", "music", "night", "ocean", "olive", "panda", "peach",
  "pearl", "piano", "plant", "prize", "queen", "river", "robot",
  "shell", "smile", "snake", "solar", "space", "spice", "spoon",
  "stone", "storm", "sugar", "table", "tiger", "torch", "tower",
  "train", "water", "whale", "wheel", "world", "zebra",
  "anchor", "animal", "banana", "basket", "bottle", "branch",
  "bridge", "button", "camera", "candle", "castle", "cherry",
  "circle", "coffee", "cookie", "desert", "dragon", "fabric",
  "flower", "forest", "garden", "guitar", "island", "jacket",
  "jungle", "kitten", "ladder", "lemon", "magnet", "market",
  "meadow", "mirror", "monkey", "orange", "pencil", "planet",
  "pocket", "purple", "rabbit", "rocket", "silver", "spring",
  "summer", "sunset", "tomato", "turtle", "valley", "window",
  "winter", "wizard", "blanket", "cabinet", "captain", "caramel",
  "compass", "crystal", "dolphin", "emerald", "feather", "gallery",
  "giraffe", "harvest", "journey", "lantern", "library", "monster",
  "morning", "mystery", "octopus", "orchard", "penguin", "picture",
  "rainbow", "silence", "sparkle", "sunrise", "thunder", "trumpet",
  "village", "avocado", "balloon", "bicycle", "diamond", "freedom",
  "mountain", "elephant", "cupboard", "dinosaur", "festival",
  "hospital", "keyboard", "notebook", "sandwich", "treasure",
  "umbrella", "universe", "sunshine", "painting", "squirrel",
  "backpack", "bluebird", "broccoli", "cinnamon", "lollipop"
];

// Config constants: times are seconds unless named otherwise.
const STARTING_TIME = 60;
const CORRECT_TIME_REWARD = 5;
const WRONG_TIME_PENALTY = 3;
const LOW_TIME_THRESHOLD = 10;
const POINTS_PER_LETTER = 10;
const FAST_SOLVE_THRESHOLD = 5;
const MEDIUM_SOLVE_THRESHOLD = 10;
const FAST_MULTIPLIER = 3;
const MEDIUM_MULTIPLIER = 2;
const SLOW_MULTIPLIER = 1;
const STREAK_BONUS_STEP = 0.5;
const MAX_STREAK_BONUS = 3;
const POWER_UP_START_COUNT = 1;
const POWER_UP_MAX_COUNT = 2;
const POWER_UP_STREAK_INTERVAL = 3;
const FREEZE_DURATION = 5;
const REVEAL_SCORE_REDUCTION = 0.25;
const MIN_WORD_LENGTH = 4;
const MAX_WORD_LENGTH = 8;
const INITIAL_MAX_LENGTH = 5;
const SOLVES_PER_DIFFICULTY_STEP = 5;
const MILLISECONDS_PER_SECOND = 1000;
const STORAGE_KEY = "anagram-scramble-high-score";
const POWER_NAMES = {
  reveal: "Reveal a Letter", freeze: "Freeze Time",
  shuffle: "Re-shuffle", skip: "Skip"
};

// Single game state object.
const state = {
  mode: "timebank", running: false, remaining: STARTING_TIME, score: 0, solved: 0,
  streak: 0, bestStreak: 0, fastestSolve: null, word: "", scramble: "",
  pool: [], powers: {}, reveals: 0, roundStarted: 0, lastTick: 0,
  frozenUntil: 0, frame: null, highScore: 0
};

// DOM references.
const dom = {
  start: document.querySelector("#start-screen"),
  game: document.querySelector("#game-screen"),
  over: document.querySelector("#over-screen"),
  startButton: document.querySelector("#start-button"),
  againButton: document.querySelector("#again-button"),
  timer: document.querySelector("#timer"),
  timerWrap: document.querySelector("#timer-wrap"),
  freezeStatus: document.querySelector("#freeze-status"),
  timeEffects: document.querySelector("#time-effects"),
  score: document.querySelector("#score"),
  streak: document.querySelector("#streak"),
  multiplier: document.querySelector("#multiplier"),
  round: document.querySelector("#round-label"),
  difficulty: document.querySelector("#difficulty-label"),
  tiles: document.querySelector("#tiles"),
  form: document.querySelector("#answer-form"),
  answer: document.querySelector("#answer"),
  feedback: document.querySelector("#feedback"),
  powerButtons: [...document.querySelectorAll("[data-power]")],
  finalScore: document.querySelector("#final-score"),
  finalSolved: document.querySelector("#final-solved"),
  finalStreak: document.querySelector("#final-streak"),
  finalFastest: document.querySelector("#final-fastest"),
  highScore: document.querySelector("#high-score"),
  recordMessage: document.querySelector("#record-message")
};

// Timer logic: monotonic timestamps avoid interval drift and stale callbacks.
function advanceClock(now) {
  if (!state.running) return false;
  const chargedMilliseconds = Math.max(0, now - Math.max(state.lastTick, state.frozenUntil));
  state.remaining = Math.max(0, state.remaining - chargedMilliseconds / MILLISECONDS_PER_SECOND);
  state.lastTick = now;
  if (state.remaining <= 0) { endGame(); return false; }
  return true;
}
function timerFrame(now) {
  if (!advanceClock(now)) return;
  updateStats(now);
  updatePowerButtons(now);
  state.frame = requestAnimationFrame(timerFrame);
}
function changeTime(amount) {
  state.remaining = Math.max(0, state.remaining + amount);
  showTimeEffect(amount);
  if (state.remaining <= 0) endGame();
}
function showTimeEffect(amount) {
  const effect = document.createElement("span");
  effect.className = `time-effect${amount < 0 ? " negative" : ""}`;
  effect.textContent = `${amount > 0 ? "+" : ""}${amount}s`;
  dom.timeEffects.append(effect);
  effect.addEventListener("animationend", () => effect.remove(), { once: true });
}

// Scoring logic.
function speedMultiplier(elapsed) {
  if (elapsed < FAST_SOLVE_THRESHOLD) return FAST_MULTIPLIER;
  if (elapsed <= MEDIUM_SOLVE_THRESHOLD) return MEDIUM_MULTIPLIER;
  return SLOW_MULTIPLIER;
}
function streakBonus(streak) {
  return Math.min(MAX_STREAK_BONUS, Math.max(0, streak - 1) * STREAK_BONUS_STEP);
}
function calculatePoints(elapsed) {
  const base = state.word.length * POINTS_PER_LETTER;
  if (state.mode === "timebank") return base;
  const revealFactor = Math.max(0, 1 - state.reveals * REVEAL_SCORE_REDUCTION);
  return Math.round(base * revealFactor * speedMultiplier(elapsed) * (1 + streakBonus(state.streak)));
}
function submitAnswer() {
  const now = performance.now();
  if (!advanceClock(now)) return;
  const answer = dom.answer.value.trim().toLowerCase();
  if (!answer) { setFeedback("Build an answer first."); return; }
  if (answer !== state.word) {
    state.streak = 0;
    changeTime(-WRONG_TIME_PENALTY);
    if (!state.running) return;
    animate(dom.answer, "shake");
    setFeedback("Not quite. Try again!", "error");
    updateStats(now);
    return;
  }
  const elapsed = (now - state.roundStarted) / MILLISECONDS_PER_SECOND;
  state.streak += 1;
  state.solved += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.fastestSolve = state.fastestSolve === null ? elapsed : Math.min(state.fastestSolve, elapsed);
  const points = calculatePoints(elapsed);
  state.score += points;
  changeTime(CORRECT_TIME_REWARD);
  animate(dom.score, "score-pop");
  let message = `Correct! +${points} points.`;
  if (state.mode === "speed" && state.streak % POWER_UP_STREAK_INTERVAL === 0) message += ` ${earnPowerUp()}`;
  nextWord(now);
  setFeedback(message, "success");
  updateStats(now);
}

// Word selection and run lifecycle.
function validWords() {
  return [...new Set(WORDS.map(word => String(word).trim().toLowerCase())
    .filter(word => /^[a-z]+$/.test(word) && word.length >= MIN_WORD_LENGTH &&
      word.length <= MAX_WORD_LENGTH && new Set(word).size > 1))];
}
function maximumLength() {
  return Math.min(MAX_WORD_LENGTH, INITIAL_MAX_LENGTH + Math.floor(state.solved / SOLVES_PER_DIFFICULTY_STEP));
}
function makeScramble(word, previous = "") {
  // Bounded retries, then a guaranteed different permutation.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const letters = [...word];
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const result = letters.join("");
    if (result !== word && result !== previous) return result;
  }
  // Find another non-original arrangement without an unbounded loop.
  const letters = [...word];
  for (let i = 0; i < letters.length; i += 1) {
    for (let j = i + 1; j < letters.length; j += 1) {
      const copy = [...letters];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      const result = copy.join("");
      if (result !== word && result !== previous) return result;
    }
  }
  // Only relevant to custom lists with very few distinct permutations.
  return previous || [...word.slice(1), word[0]].join("");
}
function nextWord(now) {
  // Refill only after every word has been used, including skipped words.
  if (state.pool.length === 0) state.pool = validWords();
  if (state.pool.length === 0) { endGame("No playable words in the word list."); return; }
  let candidates = state.pool.filter(word => word.length <= maximumLength());
  // Exhausted short words: introduce the shortest remaining words.
  if (candidates.length === 0) {
    const shortest = Math.min(...state.pool.map(word => word.length));
    candidates = state.pool.filter(word => word.length === shortest);
  }
  state.word = candidates[Math.floor(Math.random() * candidates.length)];
  state.pool.splice(state.pool.indexOf(state.word), 1);
  state.scramble = makeScramble(state.word);
  state.reveals = 0;
  state.roundStarted = now;
  dom.answer.value = "";
  dom.answer.maxLength = state.word.length;
  dom.round.textContent = `Word ${state.solved + 1}`;
  dom.difficulty.textContent = `${MIN_WORD_LENGTH}–${Math.max(maximumLength(), state.word.length)} letters`;
  renderTiles();
  dom.answer.focus();
}
function startGame() {
  cancelAnimationFrame(state.frame);
  const now = performance.now();
  Object.assign(state, {
    running: true, remaining: STARTING_TIME, score: 0, solved: 0,
    streak: 0, bestStreak: 0, fastestSolve: null, pool: validWords(),
    powers: Object.fromEntries(Object.keys(POWER_NAMES).map(key => [key, POWER_UP_START_COUNT])),
    reveals: 0, lastTick: now, frozenUntil: 0, frame: null, highScore: readHighScore()
  });
  configureModeUI();
  showScreen("game");
  dom.timeEffects.replaceChildren();
  dom.answer.classList.remove("shake");
  dom.score.classList.remove("score-pop");
  setFeedback(state.mode === "speed" ? "Go! Solve quickly to earn bigger multipliers." : "Go! Each correct answer earns points and 5 seconds.");
  nextWord(now);
  if (!state.running) return;
  updateStats(now);
  updatePowerButtons(now);
  state.frame = requestAnimationFrame(timerFrame);
}
function endGame(message = "") {
  if (!state.running) return;
  state.running = false;
  cancelAnimationFrame(state.frame);
  const newRecord = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  try { localStorage.setItem(`${STORAGE_KEY}-${state.mode}`, String(state.highScore)); }
  catch { /* The game remains playable if storage is blocked or full. */ }
  dom.finalScore.textContent = state.score.toLocaleString();
  dom.finalSolved.textContent = state.solved;
  dom.finalStreak.textContent = state.bestStreak;
  dom.finalFastest.textContent = state.fastestSolve === null ? "—" : `${state.fastestSolve.toFixed(2)}s`;
  dom.highScore.textContent = state.highScore.toLocaleString();
  dom.recordMessage.textContent = message || (newRecord ? "A new personal best!" : "Ready to beat your best?");
  showScreen("over");
  dom.againButton.focus();
}
function readHighScore() {
  try {
    const value = Number(localStorage.getItem(`${STORAGE_KEY}-${state.mode}`) || (state.mode === "speed" ? localStorage.getItem(STORAGE_KEY) : null));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

// Power-up logic.
function earnPowerUp() {
  const available = Object.keys(POWER_NAMES).filter(key => state.powers[key] < POWER_UP_MAX_COUNT);
  if (available.length === 0) return "Power-ups already full!";
  const key = available[Math.floor(Math.random() * available.length)];
  state.powers[key] += 1;
  return `Earned ${POWER_NAMES[key]}!`;
}
function usePowerUp(key) {
  if (state.mode !== "speed") return;
  const now = performance.now();
  if (!advanceClock(now) || !state.powers[key]) return;
  if (key === "freeze" && now < state.frozenUntil) return;
  if (key === "reveal") {
    const answer = dom.answer.value.toLowerCase();
    let prefixLength = 0;
    while (prefixLength < state.word.length && answer[prefixLength] === state.word[prefixLength]) prefixLength += 1;
    if (prefixLength === state.word.length) { setFeedback("Your answer is complete. Submit it!"); return; }
    // Preserve the correct prefix; replace any incorrect suffix.
    dom.answer.value = state.word.slice(0, prefixLength + 1);
    state.reveals += 1;
    syncTileAvailability();
    setFeedback("Next correct letter revealed. Base score reduced by 25%.");
  } else if (key === "freeze") {
    state.frozenUntil = now + FREEZE_DURATION * MILLISECONDS_PER_SECOND;
    setFeedback(`Time frozen for ${FREEZE_DURATION} seconds!`);
  } else if (key === "shuffle") {
    state.scramble = makeScramble(state.word, state.scramble);
    renderTiles();
    setFeedback("Fresh tiles, same word.");
  } else if (key === "skip") {
    const skipped = state.word;
    state.streak = 0;
    nextWord(now);
    setFeedback(`Skipped: ${skipped.toUpperCase()}. Streak reset.`);
  }
  state.powers[key] -= 1;
  updatePowerButtons(now);
  updateStats(now);
  dom.answer.focus();
}

// UI updates.
function showScreen(name) {
  dom.start.hidden = name !== "start";
  dom.game.hidden = name !== "game";
  dom.over.hidden = name !== "over";
  document.querySelectorAll("[data-mode]").forEach(button => { button.disabled = state.running; });
}
function updateStats(now) {
  dom.timer.textContent = `${state.remaining.toFixed(1)}s`;
  dom.score.textContent = state.score.toLocaleString();
  dom.streak.textContent = state.streak;
  const elapsed = (now - state.roundStarted) / MILLISECONDS_PER_SECOND;
  const speed = speedMultiplier(elapsed);
  const streakFactor = 1 + streakBonus(state.streak + 1);
  dom.multiplier.textContent = state.mode === "speed" ? `${speed * streakFactor}×` : "1×";
  dom.multiplier.title = state.mode === "timebank" ? "Time Bank: base points only." : `Next correct answer: ${speed}× speed × ${streakFactor}× streak. Reveal deductions apply separately.`;
  const frozen = now < state.frozenUntil;
  dom.timerWrap.classList.toggle("frozen", frozen);
  dom.timerWrap.classList.toggle("urgent", state.remaining < LOW_TIME_THRESHOLD);
  dom.freezeStatus.textContent = frozen ? `Frozen · ${((state.frozenUntil - now) / MILLISECONDS_PER_SECOND).toFixed(1)}s` : "";
}
function updatePowerButtons(now) {
  for (const button of dom.powerButtons) {
    const key = button.dataset.power;
    const count = state.powers[key] || 0;
    button.querySelector("[data-count]").textContent = count;
    button.disabled = state.mode !== "speed" || !state.running || count === 0 || (key === "freeze" && now < state.frozenUntil);
  }
}
function renderTiles() {
  dom.tiles.replaceChildren();
  [...state.scramble].forEach((letter, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.dataset.letter = letter;
    tile.textContent = letter.toUpperCase();
    tile.setAttribute("aria-label", `Add letter ${letter.toUpperCase()}`);
    tile.style.animationDelay = `${index * 25}ms`;
    tile.addEventListener("click", () => {
      const now = performance.now();
      if (!advanceClock(now) || tile.disabled) return;
      if (dom.answer.value.length >= state.word.length) return;
      dom.answer.value += letter;
      syncTileAvailability();
      dom.answer.focus();
    });
    dom.tiles.append(tile);
  });
  syncTileAvailability();
}
function syncTileAvailability() {
  const used = {};
  for (const letter of dom.answer.value.toLowerCase()) used[letter] = (used[letter] || 0) + 1;
  for (const tile of dom.tiles.children) {
    const letter = tile.dataset.letter;
    tile.disabled = (used[letter] || 0) > 0;
    if (tile.disabled) used[letter] -= 1;
  }
}
function setFeedback(message, type = "") {
  dom.feedback.textContent = message;
  dom.feedback.className = `feedback ${type}`;
}
function animate(element, className) {
  element.classList.remove(className);
  void element.offsetWidth; // Restart an animation on consecutive events.
  element.classList.add(className);
}

// Mode selection: each mode keeps its own personal high score.
function selectMode(mode) {
  if (state.running || !["timebank", "speed"].includes(mode)) return;
  state.mode = mode;
  document.querySelectorAll("[data-mode]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.checked = radio.value === mode;
  });
  document.querySelector("#mode-description").textContent = mode === "speed"
    ? "Solve fast for up to 3× speed and 4× streak points. Includes all four power-ups."
    : "Score 10 points per letter. No multipliers or power-ups.";
  if (!dom.over.hidden) showScreen("start");
}
function configureModeUI() {
  document.querySelector("#active-mode").textContent = state.mode === "speed"
    ? "Speed Mode · Multipliers & power-ups" : "Time Bank · Beat the clock";
  document.querySelector(".power-ups").hidden = state.mode !== "speed";
  document.querySelector("#power-note").hidden = state.mode !== "speed";
}

// Event listeners.
document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => selectMode(button.dataset.mode));
});
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", () => selectMode(radio.value));
});
document.querySelector("#change-mode-button").addEventListener("click", () => {
  showScreen("start");
  document.querySelector('input[name="mode"]:checked').focus();
});
dom.startButton.addEventListener("click", startGame);
dom.againButton.addEventListener("click", startGame);
dom.form.addEventListener("submit", event => { event.preventDefault(); submitAnswer(); });
dom.answer.addEventListener("input", () => {
  dom.answer.value = dom.answer.value.replace(/[^a-z]/gi, "").toLowerCase();
  syncTileAvailability();
});
dom.powerButtons.forEach(button => {
  button.addEventListener("click", () => usePowerUp(button.dataset.power));
});
document.addEventListener("keydown", event => {
  if (!state.running || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const shortcuts = { "1": "reveal", "2": "freeze", "3": "shuffle", "4": "skip" };
  const key = shortcuts[event.key];
  if (key) { event.preventDefault(); usePowerUp(key); }
});
dom.answer.addEventListener("animationend", () => dom.answer.classList.remove("shake"));
dom.score.addEventListener("animationend", () => dom.score.classList.remove("score-pop"));
// Charge elapsed time immediately when returning from a background tab.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.running) {
    const now = performance.now();
    if (advanceClock(now)) { updateStats(now); updatePowerButtons(now); }
  }
});
