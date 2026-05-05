const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../models/db');
const { getJwtSecret } = require('../middleware/auth');

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
    employerStatus: user.employerStatus,
    createdAt: user.createdAt,
  };
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['student', 'institution', 'employer', 'verifier'].includes(role)) {
      return res.status(400).json({ message: 'Only student, institution, employer, and verifier self-registration is allowed.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const users = await readCollection('users');
    if (users.some((entry) => entry.email === normalizedEmail)) {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }

    const user = {
      id: uuidv4(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      institutionId: null,
      savedVerifications: [],
      ...(role === 'employer' ? { employerStatus: 'pending' } : {}),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await writeCollection('users', users);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to register user.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const users = await readCollection('users');
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to log in.' });
  }
}

async function me(req, res) {
  try {
    const institutions = await readCollection('institutions');
    const institution = req.user.institutionId
      ? institutions.find((entry) => entry.id === req.user.institutionId) || null
      : null;

    return res.json({ user: sanitizeUser(req.user), institution });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch profile.' });
  }
}

module.exports = {
  register,
  login,
  me,
  sanitizeUser,
};
