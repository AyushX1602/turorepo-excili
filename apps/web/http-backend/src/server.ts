import express from 'express';
import jwt from 'jsonwebtoken';
import { middleware } from './middleware';
const app = express();

app.post('/signup', (req, res) => {
 res.json({
  userId: 1,
 })
})

app.post('/signin', (req, res) => {
  const userId = 1;
  const token = jwt.sign({ userId }, 'your-secret-key', { expiresIn: '1h' });
  res.json({ token });
})

app.post('/room',middleware, (req, res) => {
 res.json({
  roomId: 1,
 })
})

const port = 3000;
