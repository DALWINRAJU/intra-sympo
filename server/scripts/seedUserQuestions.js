const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const environment = require('../config/environment');
const path = require('path');

const run = async () => {
  try {
    environment.validate();
    await connectDB();
    
    console.log('Reading JSON files from quest directory...');
    const questDir = path.join(__dirname, '../../quest');
    
    // Read Level 1
    const l1FileName = fs.existsSync(path.join(questDir, 'updated_level1.json')) ? 'updated_level1.json' : 'Level1.json';
    const l1Raw = JSON.parse(fs.readFileSync(path.join(questDir, l1FileName), 'utf8'));
    const l1Items = Array.isArray(l1Raw) ? l1Raw : (l1Raw.questions || []);
    const level1Questions = l1Items.map(q => {
      const options = [];
      if (q.options) {
        for (const [key, value] of Object.entries(q.options)) {
          options.push({ label: key, text: String(value) });
        }
      }
      return {
        type: 'mcq',
        level: 1,
        category: q.category || q.section || 'General',
        questionText: q.question,
        options: options,
        correctAnswer: q.answer || q.answer_letter,
        points: 5,
        difficulty: 'medium',
        isActive: true
      };
    });

    // Read Level 2 — tag each with subcategory A, B, or C from respective files
    const level2Questions = [];
    const l2Files = [
      { file: 'Level2a.json', subcategory: 'A' },
      { file: 'Level2b.json', subcategory: 'B' },
      { file: 'Level2c.json', subcategory: 'C' },
    ];
    for (const { file, subcategory } of l2Files) {
      const l2Data = JSON.parse(fs.readFileSync(path.join(questDir, file), 'utf8'));
      l2Data.parts.forEach(part => {
        part.questions.forEach(q => {
          if (!q.options) return;
          const options = [];
          for (const [key, value] of Object.entries(q.options)) {
            options.push({ label: key, text: value });
          }
          level2Questions.push({
            type: 'exit_room',
            level: 2,
            subcategory,                          // 'A', 'B', or 'C'
            category: part.title || 'Exit Room',
            questionText: q.question,
            options: options,
            correctAnswer: q.answer_letter || q.answer,
            points: 10,
            difficulty: 'medium',
            isActive: true
          });
        });
      });
    }

    // Read Level 3
    const l3Data = JSON.parse(fs.readFileSync(path.join(questDir, 'Level3.json'), 'utf8'));
    const level3Questions = [];
    l3Data.sections.forEach(section => {
      section.questions.forEach(q => {
        level3Questions.push({
          type: 'guess_output',
          level: 3,
          category: section.section || 'Code Output',
          questionText: q.note || 'Predict the output of the following code:',
          codeSnippet: q.code,
          correctAnswer: q.output,
          points: 15,
          difficulty: 'hard',
          isActive: true
        });
      });
    });

    console.log(`Parsed ${level1Questions.length} Level 1 MCQs`);
    console.log(`Parsed ${level2Questions.length} Level 2 Exit Room questions`);
    console.log(`Parsed ${level3Questions.length} Level 3 Code questions`);
    
    const allQuestions = [...level1Questions, ...level2Questions, ...level3Questions];
    
    await Question.deleteMany({});
    console.log('Cleared existing dummy questions.');
    
    await Question.insertMany(allQuestions);
    console.log(`Successfully inserted ${allQuestions.length} real questions into the database.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding questions:', err);
    process.exit(1);
  }
};

run();
