const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../data/questions.json');
const level3Path = path.join(__dirname, '../../quest/Level3.json');

const existing = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
const level3Data = JSON.parse(fs.readFileSync(level3Path, 'utf-8'));

// Remove old Level 3 questions
const withoutOldL3 = existing.filter(q => q.level !== 3);

// Convert Level3.json sections into questions.json format
// Section names map to categories that sessionService.js regex matches:
//   "If-else"    -> "if-else"    (matches /^if-else/i)
//   "For loop"   -> "for loop"   (matches /^for loop/i)
//   "While loop" -> "while loop" (matches /^while loop/i)
const newL3Questions = [];

for (const section of level3Data.sections) {
  const category = section.section.toLowerCase(); // "If-else" -> "if-else", etc.

  for (const q of section.questions) {
    newL3Questions.push({
      type: 'guess_output',
      level: 3,
      category: category,
      questionText: 'What is the exact output of this C code?',
      codeSnippet: q.code,
      language: 'c',
      correctAnswer: q.output,
      points: 10,
      difficulty: 'hard',
      isActive: true
    });
  }
}

const newQuestions = [...withoutOldL3, ...newL3Questions];
fs.writeFileSync(questionsPath, JSON.stringify(newQuestions, null, 2));

console.log(`Removed old L3 questions. Added ${newL3Questions.length} from quest/Level3.json`);
console.log(`Total questions: ${newQuestions.length}`);
const l3cats = [...new Set(newL3Questions.map(q => q.category))];
console.log('Level 3 categories:', l3cats);
console.log('Per category:', l3cats.map(c => `${c}: ${newL3Questions.filter(q => q.category === c).length}`));
