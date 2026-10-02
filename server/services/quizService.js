const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const AppError = require('../utils/AppError');
const { SESSION_STATUS } = require('../utils/constants');

const normalizeOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/\r\n/g, '\n').trim().replace(/\n+$/, '');
};

exports.getCurrentQuestion = async (participantId) => {
  const session = await QuizSession.findOne({ participant: participantId });
  if (!session) throw new AppError('No active session found', 404);

  // LEVEL 1
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_1) {
    if (session.level1CurrentIndex >= session.level1Questions.length) {
       throw new AppError('Level 1 already completed', 400);
    }
    const questionId = session.level1Questions[session.level1CurrentIndex];
    const question = await Question.findById(questionId).select('-correctAnswer');
    return { question, currentIndex: session.level1CurrentIndex, totalQuestions: session.level1Questions.length, level: 1 };
  }

  // LEVEL 2
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_2) {
    if (session.level2CurrentIndex >= session.level2Questions.length) {
       throw new AppError('Level 2 already completed', 400);
    }
    const questionId = session.level2Questions[session.level2CurrentIndex];
    const question = await Question.findById(questionId).select('-correctAnswer');
    return { question, currentIndex: session.level2CurrentIndex, totalQuestions: session.level2Questions.length, lives: session.lives, level: 2 };
  }

  // LEVEL 3
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_3) {
    if (session.level3CurrentIndex >= session.level3Questions.length) {
       throw new AppError('Level 3 already completed', 400);
    }
    const questionId = session.level3Questions[session.level3CurrentIndex];
    const question = await Question.findById(questionId).select('-correctAnswer');
    return { question, currentIndex: session.level3CurrentIndex, totalQuestions: session.level3Questions.length, level: 3 };
  }

  throw new AppError('Not in an active level state for retrieving questions', 403);
};

exports.submitAnswer = async (participantId, questionId, submittedAnswer) => {
  const session = await QuizSession.findOne({ participant: participantId });
  if (!session) throw new AppError('No active session found', 404);

  // LEVEL 1
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_1) {
    const currentIndex = session.level1CurrentIndex;
    if (session.level1Questions[currentIndex].toString() !== questionId) {
      throw new AppError('Invalid question submitted for current state', 400);
    }

    const question = await Question.findById(questionId);
    const isCorrect = question.correctAnswer === submittedAnswer;
    const pointsAwarded = isCorrect ? question.points : 0;

    await Answer.create({ session: session._id, question: questionId, level: 1, submittedAnswer, isCorrect, pointsAwarded });

    const nextIndex = currentIndex + 1;
    const isLevelComplete = nextIndex >= session.level1Questions.length;
    const nextStatus = isLevelComplete ? SESSION_STATUS.COMPLETED_LEVEL_1 : SESSION_STATUS.ACTIVE_LEVEL_1;

    const updatedSession = await QuizSession.findByIdAndUpdate(
      session._id,
      {
        $inc: { level1Score: pointsAwarded, totalScore: pointsAwarded },
        $set: { level1CurrentIndex: nextIndex, status: nextStatus }
      },
      { new: true }
    );

    return {
      isCorrect, correctAnswer: question.correctAnswer, pointsAwarded,
      currentScore: updatedSession.level1Score, totalScore: updatedSession.totalScore,
      isLevelComplete, nextIndex
    };
  }

  // LEVEL 2
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_2) {
    const currentIndex = session.level2CurrentIndex;
    if (session.level2Questions[currentIndex].toString() !== questionId) {
      throw new AppError('Invalid question submitted for current state', 400);
    }

    const question = await Question.findById(questionId);
    const isCorrect = question.correctAnswer === submittedAnswer;
    const pointsAwarded = isCorrect ? question.points : 0;

    await Answer.create({ session: session._id, question: questionId, level: 2, submittedAnswer, isCorrect, pointsAwarded });

    const nextIndex = currentIndex + 1;
    const updatedLives = isCorrect ? session.lives : session.lives - 1;
    const isEliminated = updatedLives <= 0;
    const isLevelComplete = !isEliminated && (nextIndex >= session.level2Questions.length);
    
    let nextStatus = SESSION_STATUS.ACTIVE_LEVEL_2;
    if (isEliminated) nextStatus = SESSION_STATUS.ELIMINATED;
    else if (isLevelComplete) nextStatus = SESSION_STATUS.COMPLETED_LEVEL_2;

    const updateDoc = {
      $inc: { level2Score: pointsAwarded, totalScore: pointsAwarded },
      $set: { level2CurrentIndex: nextIndex, status: nextStatus, lives: updatedLives }
    };

    if (isEliminated) {
      const endTime = new Date();
      updateDoc.$set.endTime = endTime;
      updateDoc.$set.timeTakenMs = endTime.getTime() - session.startTime.getTime();
    }

    const updatedSession = await QuizSession.findByIdAndUpdate(session._id, updateDoc, { new: true });

    return {
      isCorrect, correctAnswer: question.correctAnswer, pointsAwarded,
      currentScore: updatedSession.level2Score, totalScore: updatedSession.totalScore,
      lives: updatedSession.lives, isLevelComplete, isEliminated, nextIndex
    };
  }

  // LEVEL 3
  if (session.status === SESSION_STATUS.ACTIVE_LEVEL_3) {
    const currentIndex = session.level3CurrentIndex;
    if (session.level3Questions[currentIndex].toString() !== questionId) {
      throw new AppError('Invalid question submitted for current state', 400);
    }

    const question = await Question.findById(questionId);
    
    // String normalization for programming output
    const isCorrect = normalizeOutput(submittedAnswer) === normalizeOutput(question.correctAnswer);
    const pointsAwarded = isCorrect ? question.points : 0;

    await Answer.create({ session: session._id, question: questionId, level: 3, submittedAnswer, isCorrect, pointsAwarded });

    const nextIndex = currentIndex + 1;
    const isLevelComplete = nextIndex >= session.level3Questions.length;
    const nextStatus = isLevelComplete ? SESSION_STATUS.COMPLETED : SESSION_STATUS.ACTIVE_LEVEL_3;

    const updateDoc = {
      $inc: { level3Score: pointsAwarded, totalScore: pointsAwarded },
      $set: { level3CurrentIndex: nextIndex, status: nextStatus }
    };

    if (isLevelComplete) {
      const endTime = new Date();
      updateDoc.$set.endTime = endTime;
      updateDoc.$set.timeTakenMs = endTime.getTime() - session.startTime.getTime();
    }

    const updatedSession = await QuizSession.findByIdAndUpdate(session._id, updateDoc, { new: true });

    return {
      isCorrect, correctAnswer: question.correctAnswer, pointsAwarded,
      currentScore: updatedSession.level3Score, totalScore: updatedSession.totalScore,
      isLevelComplete, isCompetitionComplete: isLevelComplete, nextIndex
    };
  }

  throw new AppError(`Session is not active for submitted level. Current status: ${session.status}`, 403);
};

exports.advanceLevel = async (participantId, targetLevel) => {
  const session = await QuizSession.findOne({ participant: participantId });
  if (!session) throw new AppError('No active session found', 404);

  if (targetLevel === 2) {
    if (session.status !== SESSION_STATUS.COMPLETED_LEVEL_1) throw new AppError('Cannot advance to Level 2 from current state', 403);
    session.status = SESSION_STATUS.ACTIVE_LEVEL_2;
    await session.save();
    return session;
  }

  if (targetLevel === 3) {
    if (session.status !== SESSION_STATUS.COMPLETED_LEVEL_2) throw new AppError('Cannot advance to Level 3 from current state', 403);
    session.status = SESSION_STATUS.ACTIVE_LEVEL_3;
    await session.save();
    return session;
  }

  throw new AppError('Invalid target level', 400);
};
