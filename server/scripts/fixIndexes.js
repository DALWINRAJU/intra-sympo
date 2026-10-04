const mongoose = require('mongoose');
const path = require('path');
const environment = require('../config/environment');
const connectDB = require('../config/db');

const run = async () => {
  try {
    environment.validate();
    await connectDB();

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('--- Current Collections & Indexes ---');
    for (const col of collections) {
      const indexes = await db.collection(col.name).indexes();
      console.log(`\nCollection: ${col.name}`);
      indexes.forEach(idx => {
        console.log(`  Index: ${idx.name}, Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
      });
    }

    // Check answers collection specifically
    const answerIndexes = await db.collection('answers').indexes();
    for (const idx of answerIndexes) {
      // If there is an index on session alone that is unique, drop it!
      if (idx.name !== '_id_' && idx.unique && Object.keys(idx.key).length === 1 && idx.key.session) {
        console.log(`\nDropping invalid unique index '${idx.name}' on answers collection...`);
        await db.collection('answers').dropIndex(idx.name);
        console.log(`Successfully dropped ${idx.name}!`);
      }
      // If there is unique index on session_1_question_1 that prevents multiple attempts, drop it too so answers can be logged safely
      if (idx.name === 'session_1_question_1' && idx.unique) {
        console.log(`\nDropping unique index '${idx.name}' on answers collection to allow multiple attempts...`);
        await db.collection('answers').dropIndex(idx.name);
        console.log(`Successfully dropped ${idx.name}!`);
      }
    }

    // Also sync indexes on all models
    const Answer = require('../models/Answer');
    const QuizSession = require('../models/QuizSession');
    const Question = require('../models/Question');
    const Participant = require('../models/Participant');

    await Answer.syncIndexes();
    await QuizSession.syncIndexes();
    await Question.syncIndexes();
    await Participant.syncIndexes();

    console.log('\n--- Indexes synced successfully! ---');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing indexes:', err);
    process.exit(1);
  }
};

run();
