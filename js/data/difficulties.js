// js/data/difficulties.js
// Difficulty settings that modify rival AI behavior and penalty scaling.

const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy',
    rivalAggression: 0.7,
    rivalReactionTurns: 3,
    rivalAnswerScope: 1,
    playerPenaltyMult: 0.7,
    desc: 'Rivals take their time. Your breakthroughs land before they can respond.',
  },
  {
    id: 'normal',
    name: 'Normal',
    rivalAggression: 1.0,
    rivalReactionTurns: 2,
    rivalAnswerScope: 1,
    playerPenaltyMult: 1.0,
    desc: 'Rivals read the market and field a real answer to your strongest line.',
  },
  {
    id: 'hard',
    name: 'Hard',
    rivalAggression: 1.4,
    rivalReactionTurns: 1,
    rivalAnswerScope: 2,
    playerPenaltyMult: 1.3,
    desc: 'Rivals anticipate your moves. Every launch is met with a coordinated response.',
  },
];

function getDifficulty(id) {
  return DIFFICULTIES.find(d => d.id === id) || DIFFICULTIES[1];
}

function getActiveDifficulty(state) {
  if (!state || !state.difficulty) return DIFFICULTIES[1];
  return getDifficulty(state.difficulty);
}
