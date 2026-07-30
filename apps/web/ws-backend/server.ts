import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 3001);
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (socket: WebSocket) => {
  console.log('Client connected');

  socket.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Connected to the Excilidraw WebSocket backend',
    })
  );

  socket.on('message', (data) => {
    const text = data.toString();
    console.log('Received:', text);
    socket.send(JSON.stringify({ type: 'echo', message: text }));
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(port, () => {
  console.log(`WebSocket server listening on ws://localhost:${port}`);
});
