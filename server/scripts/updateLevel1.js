const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const environment = require('../config/environment');

const updateLevel1Questions = async () => {
  try {
    environment.validate();
    await connectDB();

    const questPath = path.join(__dirname, '../../quest/updated_level1.json');
    console.log(`Reading updated Level 1 questions from: ${questPath}`);

    if (!fs.existsSync(questPath)) {
      throw new Error(`File not found: ${questPath}`);
    }

    const rawData = JSON.parse(fs.readFileSync(questPath, 'utf8'));
    const items = Array.isArray(rawData) ? rawData : (rawData.questions || []);

    const level1Questions = items.map((q, idx) => {
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

    console.log(`Parsed ${level1Questions.length} Level 1 questions from updated_level1.json`);

    const deletedResult = await Question.deleteMany({ level: 1 });
    console.log(`Deleted ${deletedResult.deletedCount} existing Level 1 questions from MongoDB.`);

    const insertedResult = await Question.insertMany(level1Questions);
    console.log(`Successfully inserted ${insertedResult.length} Level 1 questions into MongoDB.`);

    const totalLevel1 = await Question.countDocuments({ level: 1 });
    const totalAll = await Question.countDocuments();
    console.log(`MongoDB Question Stats -> Level 1 Questions: ${totalLevel1}, Total All Questions: ${totalAll}`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating Level 1 questions:', error);
    process.exit(1);
  }
};

updateLevel1Questions();
