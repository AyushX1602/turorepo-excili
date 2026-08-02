const { z } = require("zod");

exports.CreateUserSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
  email: z.string().email(),
});

exports.signInSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
});

exports.CreateRoomSchema = z.object({
  name: z.string().min(3).max(50),
});