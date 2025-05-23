const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/',
  auth,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const search = req.query.search;

      const query = {};
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-passwordHash -verificationToken -verificationTokenExpires')
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await User.countDocuments(query);

      res.json({
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get user profile
router.get('/profile',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('-passwordHash -verificationToken -verificationTokenExpires');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update user profile
router.put('/profile',
  auth,
  [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email } = req.body;
      const user = await User.findById(req.user._id);

      if (username) user.username = username;
      if (email) {
        // If email is changed, require re-verification
        user.email = email;
        user.emailVerified = false;
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await sendVerificationEmail(email, verificationToken);
      }

      await user.save();
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Assign role (admin only)
router.put('/:userId/role',
  auth,
  checkRole(['admin']),
  [
    body('roles').isArray(),
    body('roles.*').isIn(['user', 'admin'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.roles = req.body.roles;
      await user.save();

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Delete user (admin only)
router.delete('/:userId',
  auth,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.remove();
      res.json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router; 