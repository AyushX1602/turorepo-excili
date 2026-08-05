import { WebSocket, WebSocketServer, type RawData } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common";
import { prismaClient } from "@repo/db";

const port = Number(process.env.PORT ?? 8080);
const wss = new WebSocketServer({ port });

interface User {
  ws: WebSocket;
  userId: string;
  rooms: number[];
}

type ClientMessage =
  | { type: "joinRoom"; roomId: number | string }
  | { type: "leaveRoom"; roomId: number | string }
  | { type: "chat"; roomId: number | string; message: string };

const users: User[] = [];

function checkUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

function getTokenFromRequestUrl(requestUrl: string): string | null {
  try {
    return new URL(requestUrl, "ws://localhost").searchParams.get("token");
  } catch {
    return null;
  }
}

function parseRoomId(roomId: number | string): number | null {
  const parsedRoomId = Number(roomId);

  if (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0) {
    return null;
  }

  return parsedRoomId;
}

function parseClientMessage(data: RawData): ClientMessage | null {
  try {
    const parsed = JSON.parse(data.toString()) as Partial<ClientMessage>;

    if (
      parsed.type !== "joinRoom" &&
      parsed.type !== "leaveRoom" &&
      parsed.type !== "chat"
    ) {
      return null;
    }

    if (parsed.roomId === undefined) {
      return null;
    }

    if (parsed.type === "chat" && typeof parsed.message !== "string") {
      return null;
    }

    return parsed as ClientMessage;
  } catch {
    return null;
  }
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload), (error) => {
    if (error) {
      console.error("WebSocket send error:", error);
    }
  });
}

function getErrorSummary(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String(error.code);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

wss.on("connection", function connection(ws, request) {
  const token = request.url ? getTokenFromRequestUrl(request.url) : null;
  const userId = token ? checkUserIdFromToken(token) : null;

  if (!userId) {
    ws.close();
    return;
  }

  const currentUser: User = {
    userId,
    rooms: [],
    ws,
  };

  users.push(currentUser);

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });

  ws.on("message", async function message(data) {
    const parsedMessage = parseClientMessage(data);

    if (!parsedMessage) {
      sendJson(ws, { type: "error", message: "Invalid message payload" });
      return;
    }

    const roomId = parseRoomId(parsedMessage.roomId);

    if (!roomId) {
      sendJson(ws, { type: "error", message: "Invalid roomId" });
      return;
    }

    if (parsedMessage.type === "joinRoom") {
      if (!currentUser.rooms.includes(roomId)) {
        currentUser.rooms.push(roomId);
      }
      return;
    }

    if (parsedMessage.type === "leaveRoom") {
      currentUser.rooms = currentUser.rooms.filter((id) => id !== roomId);
      return;
    }

    try {
      await prismaClient.chat.create({
        data: {
          roomId,
          userId,
          message: parsedMessage.message,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          sendJson(user.ws, {
            type: "chat",
            roomId,
            message: parsedMessage.message,
          });
        }
      });
    } catch (error) {
      console.error("Failed to persist chat message:", getErrorSummary(error));
      sendJson(ws, { type: "error", message: "Failed to send chat message" });
    }
  });

  ws.on("close", function close() {
    const index = users.findIndex((user) => user.ws === ws);

    if (index > -1) {
      users.splice(index, 1);
    }
  });
});

wss.on("listening", () => {
  console.log(`ws-backend listening on ws://localhost:${port}`);
});

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});
