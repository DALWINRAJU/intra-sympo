const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const environment = require('../config/environment');

const updateLevel1Diff = async () => {
  try {
    environment.validate();
    await connectDB();

    // 1. Update existing level 1 questions to 'easy'
    const updateResult = await Question.updateMany(
      { level: 1 },
      { $set: { difficulty: 'easy' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} existing Level 1 questions to difficulty 'easy'.`);

    // 2. Read new file and add moderate and hard questions
    const questPath = path.join(__dirname, '../../quest/LEVEL1_Moderate_Hard_MCQs.json');
    console.log(`Reading new Level 1 questions from: ${questPath}`);

    if (!fs.existsSync(questPath)) {
      throw new Error(`File not found: ${questPath}`);
    }

    const rawData = JSON.parse(fs.readFileSync(questPath, 'utf8'));
    const newQuestions = [];

    if (rawData.sections && Array.isArray(rawData.sections)) {
      rawData.sections.forEach(section => {
        let diff = 'medium';
        if (section.section.toLowerCase() === 'hard') {
          diff = 'hard';
        } else if (section.section.toLowerCase() === 'moderate') {
          diff = 'medium';
        }

        if (Array.isArray(section.questions)) {
          section.questions.forEach(q => {
            const options = [];
            if (q.options) {
              for (const [key, value] of Object.entries(q.options)) {
                options.push({ label: key, text: String(value) });
              }
            }
            newQuestions.push({
              type: 'mcq',
              level: 1,
              category: q.category || section.section,
              questionText: q.question,
              options: options,
              correctAnswer: q.answer || q.answer_letter,
              points: diff === 'hard' ? 15 : (diff === 'medium' ? 10 : 5),
              difficulty: diff,
              isActive: true
            });
          });
        }
      });
    }

    console.log(`Parsed ${newQuestions.length} new Level 1 questions from LEVEL1_Moderate_Hard_MCQs.json`);

    // Check if we already inserted them to prevent duplicates on rerun
    const existingMediumHard = await Question.countDocuments({ level: 1, difficulty: { $in: ['medium', 'hard'] } });
    if (existingMediumHard > 0) {
      console.log(`Found ${existingMediumHard} existing medium/hard level 1 questions. Skipping insertion to prevent duplicates.`);
    } else {
      const insertedResult = await Question.insertMany(newQuestions);
      console.log(`Successfully inserted ${insertedResult.length} Level 1 questions (moderate/hard) into MongoDB.`);
    }

    const totalLevel1 = await Question.countDocuments({ level: 1 });
    const easyCount = await Question.countDocuments({ level: 1, difficulty: 'easy' });
    const mediumCount = await Question.countDocuments({ level: 1, difficulty: 'medium' });
    const hardCount = await Question.countDocuments({ level: 1, difficulty: 'hard' });
    console.log(`Level 1 Stats -> Total: ${totalLevel1}, Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating Level 1 difficulty and adding new ones:', error);
    process.exit(1);
  }
};

updateLevel1Diff();
