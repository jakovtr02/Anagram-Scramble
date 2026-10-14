# Anagram Scramble — How to Play

## Getting started

Extract the game ZIP into a folder. Keep `index.html`, `style.css`, and `script.js` together, then open `index.html` in your browser. No installation or internet connection is required.

Choose **Time Bank** or **Speed Mode**, then click **Start Game**.

## Solve the scrambled word

- Type your answer in the input, or click the letter tiles to build it.
- Use Backspace to remove letters. Clicked tiles become available again when their letters are removed.
- Press **Enter** or click **Submit Answer** to check your answer.
- Answers are case-insensitive. Empty submissions do not cost time.

Words start at 4–5 letters. Longer words are introduced as you solve more, up to 8 letters. Words do not repeat until the word list is exhausted; skipped words count as used.

## Time Bank

Start with **60 seconds** and score **10 points per letter** for each correct answer.

- Correct answer: **+5 seconds**.
- Wrong answer: **−3 seconds** and a reset streak.
- The timer turns red and pulses below 10 seconds.
- The run ends at zero.

Time Bank has no score multipliers or power-ups.

## Speed Mode

Speed Mode uses the same time bank, rewards, and penalties, plus speed multipliers, streak bonuses, and power-ups.

### Scoring

Base score is **word length × 10**.

| Time to solve the word | Speed multiplier |
| --- | --- |
| Under 5 seconds | 3× |
| 5–10 seconds, including exactly 10 | 2× |
| Over 10 seconds | 1× |

Consecutive correct answers increase the streak multiplier:

| Streak after a correct answer | Streak multiplier |
| --- | --- |
| 1 | 1× |
| 2 | 1.5× |
| 3 | 2× |
| 4 | 2.5× |
| 5 | 3× |
| 6 | 3.5× |
| 7 or more | 4× |

**Points = base score × speed multiplier × streak multiplier**, with any Reveal deductions applied to the base score. Points are rounded to the nearest whole number.

For example, a 5-letter word solved in 4 seconds on your third consecutive correct answer earns **50 × 3 × 2 = 300 points**, before Reveal deductions.

The displayed **Next Solve Multiplier** previews the multiplier your next correct answer would receive at that moment. A wrong answer or Skip resets the streak. A wrong attempt does not restart the word’s solve timer.

### Power-ups

Power-ups are available **only in Speed Mode**. Start with one of each, and earn a random available power-up every three consecutive correct answers. You can hold at most two of each. If all counts are full, that milestone grants no additional power-up.

| Power-up | Shortcut | Effect |
| --- | --- | --- |
| Reveal a Letter | **1** | Keeps your correct answer prefix and fills in its next correct letter, replacing any incorrect suffix. |
| Freeze Time | **2** | Pauses the time bank for 5 seconds. The timer turns blue. |
| Re-shuffle | **3** | Rearranges the tiles without changing the word. |
| Skip | **4** | Moves to another word without a time penalty and resets your streak. |

Each Reveal use subtracts **25% of the original base score** for that word. Two uses leave 50% of the base score; the deduction resets for the next word. Reveal does not automatically submit an answer.

Freeze cannot stack: activating it while frozen does nothing and spends nothing. Freezing pauses the time bank, but the word’s solve time still advances for speed scoring. Re-shuffling also does not restart solve time.

Buttons are disabled when their count reaches zero. Keyboard shortcuts work during the run, including while the answer input is focused.

## Results and replay

When time runs out, the results screen shows your final score, words solved, best streak, fastest correct solve, and personal high score.

Each mode keeps its own high score in your browser’s local storage. Scores may not persist if storage is blocked or cleared, or if you switch browsers.

Click **Play Again** to replay the same mode, or **Change Mode** to return to mode selection. The clock continues to run while the browser tab is in the background, except during an active freeze.

## Customize the game

Edit the named constants near the top of `script.js`:

- `STARTING_TIME`: initial time bank.
- `CORRECT_TIME_REWARD` and `WRONG_TIME_PENALTY`: time rewards and penalties.
- `FAST_MULTIPLIER`, `MEDIUM_MULTIPLIER`, and `SLOW_MULTIPLIER`: speed scoring values.
- `FAST_SOLVE_THRESHOLD` and `MEDIUM_SOLVE_THRESHOLD`: speed scoring thresholds.
- `STREAK_BONUS_STEP` and `MAX_STREAK_BONUS`: streak bonus progression.
- `WORDS`: the built-in word list. Use 4–8 letter words containing letters only.

Change the CSS variables at the top of `style.css` to adjust the color palette.
