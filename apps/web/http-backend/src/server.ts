import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common';
import { middleware } from './middleware';
import { CreateUserSchema, CreateRoomSchema, signInSchema } from '@repo/common';
import { prismaClient } from '@repo/db';
const app = express();

app.use(express.json());

app.post('/signup', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  try {
    const user = await prismaClient.user.create({
      data: {
        name: result.data.username,
        password: result.data.password,
        email: result.data.email,
      },
    });

    res.json({
      userId: user.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
})

app.post('/signin', async (req, res) => {
  const result = signInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid sign in data' });
  }
  const user = await prismaClient.user.findFirst({
    where: {
      name: result.data.username,
      password: result.data.password,
    },
  })
  if(!user){
    return res.status(401).json({ error: 'Invalid username or password' });
  }
    
  const userId = user?.id;
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
})

app.post('/room',middleware, async (req, res) => {
  const result = CreateRoomSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid room data' });
  }
  const userId = req.userId;
  if(!userId){
    return res.status(403).json({ error: 'Forbidden' });
  }

  const room = await prismaClient.room.create({
    data: {
      slug: result.data.name,
      adminId: userId,
    },
  });
 res.json({
  roomId: room.id,
 })
})

app.get("/chats/:roomId",middleware, async (req, res) => {
  const roomId = Number(req.params.roomId);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return res.status(400).json({ error: 'Invalid room id' });
  }

  const chats = await prismaClient.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: {
      id: 'desc',
    },
    take: 100,
  });

  res.json({ chats });
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`http-backend listening on http://localhost:${port}`);
});
