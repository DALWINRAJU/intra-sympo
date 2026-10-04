const mongoose = require('mongoose');
const environment = require('../config/environment');
const connectDB = require('../config/db');
const Question = require('../models/Question');

const run = async () => {
  try {
    environment.validate();
    await connectDB();

    const counts = await Question.aggregate([
      { $match: { level: 2 } },
      { $group: { _id: { type: '$type', subcategory: '$subcategory' }, count: { $sum: 1 } } }
    ]);
    console.log('Level 2 distribution:', counts);

    const sampleA = await Question.findOne({ level: 2, subcategory: 'A' });
    const sampleB = await Question.findOne({ level: 2, subcategory: 'B' });
    const sampleC = await Question.findOne({ level: 2, subcategory: 'C' });
    console.log('Sample A:', sampleA ? { id: sampleA._id, sub: sampleA.subcategory, cat: sampleA.category, q: sampleA.questionText } : 'NONE');
    console.log('Sample B:', sampleB ? { id: sampleB._id, sub: sampleB.subcategory, cat: sampleB.category, q: sampleB.questionText } : 'NONE');
    console.log('Sample C:', sampleC ? { id: sampleC._id, sub: sampleC.subcategory, cat: sampleC.category, q: sampleC.questionText } : 'NONE');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
