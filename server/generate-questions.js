const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const questions = [];
const categories = ['Operating Systems', 'Data Structures', 'Java', 'Python', 'OOSE'];

// Level 1: MCQ (100 questions)
categories.forEach((cat) => {
  for (let i = 1; i <= 20; i++) {
    questions.push({
      type: 'mcq',
      level: 1,
      category: cat,
      questionText: `Sample ${cat} Question ${i}: Which of the following is correct?`,
      options: [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' }
      ],
      correctAnswer: 'A',
      points: 5,
      difficulty: 'medium',
      isActive: true
    });
  }
});

// Level 2: Exit Room (10 questions)
for (let i = 1; i <= 10; i++) {
  questions.push({
    type: 'exit_room',
    level: 2,
    category: 'Mixed Core',
    questionText: `Exit Room Challenge ${i}: Identify the correct statement.`,
    options: [
      { label: 'A', text: 'Statement 1' },
      { label: 'B', text: 'Statement 2' },
      { label: 'C', text: 'Statement 3' },
      { label: 'D', text: 'Statement 4' }
    ],
    correctAnswer: 'B',
    points: 10,
    difficulty: 'hard',
    isActive: true
  });
}

// Level 3: Guess Output (10 questions)
for (let i = 1; i <= 10; i++) {
  const isPython = i % 2 === 0;
  questions.push({
    type: 'guess_output',
    level: 3,
    category: isPython ? 'Python' : 'Java',
    questionText: 'What is the exact output of this code snippet?',
    codeSnippet: isPython 
      ? 'for i in range(2):\n    print(i, end="")' 
      : 'public class Main {\n  public static void main(String[] args) {\n    System.out.print(1 + 2);\n  }\n}',
    language: isPython ? 'python' : 'java',
    correctAnswer: isPython ? '01' : '3',
    points: 10,
    difficulty: 'hard',
    isActive: true
  });
}

fs.writeFileSync(path.join(dataDir, 'questions.json'), JSON.stringify(questions, null, 2));
console.log(`Created questions.json with ${questions.length} questions.`);
