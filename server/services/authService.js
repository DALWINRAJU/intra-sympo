const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Participant = require('../models/Participant');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const environment = require('../config/environment');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, environment.jwtSecret, {
    expiresIn: environment.jwtExpiresIn,
  });
};

exports.registerParticipant = async (data) => {
  const { fullName, collegeName, department, participantId, participantPin } = data;
  
  const existing = await Participant.findOne({ participantId });
  if (existing) {
    throw new AppError('Participant ID already registered', 409);
  }

  const hashedPin = await bcrypt.hash(participantPin, 10);

  const participant = await Participant.create({
    fullName,
    collegeName,
    department,
    participantId,
    participantPin: hashedPin
  });

  const token = generateToken(participant._id, 'participant');
  
  const participantResponse = participant.toObject();
  delete participantResponse.participantPin;

  return { token, participant: participantResponse };
};

exports.loginParticipant = async (participantId, participantPin) => {
  const participant = await Participant.findOne({ participantId });
  if (!participant) {
    throw new AppError('Invalid Participant ID or PIN', 401);
  }

  const isMatch = await bcrypt.compare(participantPin, participant.participantPin);
  if (!isMatch) {
    throw new AppError('Invalid Participant ID or PIN', 401);
  }

  const token = generateToken(participant._id, 'participant');
  
  const participantResponse = participant.toObject();
  delete participantResponse.participantPin;

  return { token, participant: participantResponse };
};

exports.loginAdmin = async (username, password) => {
  const admin = await Admin.findOne({ username });
  if (!admin || !admin.isActive) {
    throw new AppError('Invalid credentials or inactive account', 401);
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(admin._id, admin.role);
  
  const adminResponse = admin.toObject();
  delete adminResponse.passwordHash;

  return { token, admin: adminResponse };
};
