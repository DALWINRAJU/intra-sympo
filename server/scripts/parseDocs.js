const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const environment = require('../config/environment');

const parseLevel1 = (content) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const questions = [];
  let currentCategory = 'General';
  let q = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Category match
    const catMatch = line.match(/^#.*__([^(]+)\s*\\\(/);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      continue;
    }

    // Question match
    const qMatch = line.match(/^(\d+)\\\.\s*(.*)/);
    if (qMatch) {
      if (q && q.options.length === 4) questions.push(q);
      q = {
        type: 'mcq',
        level: 1,
        category: currentCategory,
        questionText: qMatch[2].replace(/__/g, ''),
        options: [],
        correctAnswer: '',
        points: 5,
        difficulty: 'medium',
        isActive: true
      };
      continue;
    }

    // Option match
    const isCorrect = line.startsWith('__');
    const cleanLine = line.replace(/__/g, '');
    const optMatch = cleanLine.match(/^([A-D])\\\)\s*(.*)/);
    
    if (optMatch && q) {
      q.options.push({ label: optMatch[1], text: optMatch[2] });
      if (isCorrect) q.correctAnswer = optMatch[1];
    }
  }
  if (q && q.options.length === 4) questions.push(q);
  return questions;
};

const parseLevel2 = (content) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const questions = [];
  let q = null;
  let inCode = false;
  let codeSnippet = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^(\d+)\\\.\s*(.*)/)) {
      const qMatch = line.match(/^(\d+)\\\.\s*(.*)/);
      if (q && q.options.length === 4) questions.push(q);
      q = {
        type: 'exit_room',
        level: 2,
        category: 'Exit Room',
        questionText: qMatch[2].replace(/__/g, ''),
        codeSnippet: '',
        options: [],
        correctAnswer: '',
        points: 10,
        difficulty: 'medium',
        isActive: true
      };
      inCode = false;
      codeSnippet = [];
      continue;
    }

    if (q && !inCode && line === '```') {
      inCode = true;
      continue;
    }
    if (q && inCode && line === '```') {
      inCode = false;
      q.codeSnippet = codeSnippet.join('\n');
      continue;
    }
    if (inCode) {
      codeSnippet.push(line);
      continue;
    }

    const isCorrect = line.startsWith('__');
    const cleanLine = line.replace(/__/g, '');
    const optMatch = cleanLine.match(/^([A-D])\\\)\s*(.*)/);
    
    if (optMatch && q) {
      q.options.push({ label: optMatch[1], text: optMatch[2] });
      if (isCorrect) q.correctAnswer = optMatch[1];
    }
  }
  if (q && q.options.length === 4) questions.push(q);
  return questions;
};

const parseLevel3 = (content) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const questions = [];
  let q = null;
  let inCode = false;
  let codeSnippet = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^(\d+)\\\.\s*(.*)/)) {
      const qMatch = line.match(/^(\d+)\\\.\s*(.*)/);
      if (q) {
        q.codeSnippet = codeSnippet.join('\n');
        questions.push(q);
      }
      q = {
        type: 'guess_output',
        level: 3,
        category: 'Code Output',
        questionText: qMatch[2].replace(/__/g, ''),
        codeSnippet: '',
        correctAnswer: '',
        points: 15,
        difficulty: 'hard',
        isActive: true
      };
      inCode = false;
      codeSnippet = [];
      continue;
    }

    if (q && !inCode && line === '```') {
      inCode = true;
      continue;
    }
    if (q && inCode && line === '```') {
      inCode = false;
      continue;
    }
    if (inCode) {
      codeSnippet.push(line);
      continue;
    }

    if (q && line.startsWith('__Answer:')) {
      q.correctAnswer = line.replace('__Answer: ', '').replace(/__/g, '').trim();
    }
  }
  if (q) {
    q.codeSnippet = codeSnippet.join('\n');
    questions.push(q);
  }
  return questions;
};

const run = async () => {
  try {
    environment.validate();
    await connectDB();
    
    console.log('Reading markdown files...');
    const l1Content = fs.readFileSync('../Level1.md', 'utf16le');
    const l2Content = fs.readFileSync('../Level2.md', 'utf16le');
    const l3Content = fs.readFileSync('../Level3.md', 'utf16le');

    const l1q = parseLevel1(l1Content);
    const l2q = parseLevel2(l2Content);
    const l3q = parseLevel3(l3Content);

    console.log(`Parsed ${l1q.length} L1, ${l2q.length} L2, ${l3q.length} L3 questions.`);
    
    const allQ = [...l1q, ...l2q, ...l3q];
    
    await Question.deleteMany({});
    console.log('Cleared existing questions.');
    
    await Question.insertMany(allQ);
    console.log('Inserted new real questions.');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
