import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../../packages/backend-common/index.js';
import { middleware } from './middleware';
import { CreateUserSchema, CreateRoomSchema, signInSchema } from '@repo/common';
const app = express();

app.use(express.json());

app.post('/signup', (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
  return res.status(400).json({ error: 'Invalid user data' });
  }

  res.json({
  userId: 1,
 })
})

app.post('/signin', (req, res) => {
  const result = signInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid sign in data' });
  }

  const userId = 1;
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
})

app.post('/room',middleware, (req, res) => {
 res.json({
  roomId: 1,
 })
})

const port = 3000;
