import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  GameState,
  GameAction,
  PlayerToken,
  GameMode,
} from '@business/shared-types';
import {
  createInitialGameState,
  applyGameAction,
} from '@business/game-engine';

interface RoomMember {
  socketId: string;
  playerId: string;
  name: string;
  token: PlayerToken;
  color: string;
  isHost: boolean;
}

interface GameRoom {
  code: string;
  members: RoomMember[];
  gameState: GameState | null;
  mode: GameMode;
  maxRounds?: number;
  createdAt: number;
}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', (data: { name: string; token: PlayerToken; color: string; mode: GameMode; maxRounds?: number }, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const host: RoomMember = {
      socketId: socket.id,
      playerId: 'player-1',
      name: data.name || 'Host',
      token: data.token,
      color: data.color,
      isHost: true,
    };

    const room: GameRoom = {
      code,
      members: [host],
      gameState: null,
      mode: data.mode || 'classic',
      maxRounds: data.maxRounds,
      createdAt: Date.now(),
    };

    rooms.set(code, room);
    socket.join(code);
    callback({ success: true, roomCode: code, playerId: host.playerId });
    io.to(code).emit('room_updated', room);
  });

  // Join Room
  socket.on('join_room', (data: { roomCode: string; name: string; token: PlayerToken; color: string }, callback) => {
    const code = data.roomCode?.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return callback({ success: false, message: 'Room not found.' });
    }
    if (room.gameState) {
      return callback({ success: false, message: 'Match is already in progress.' });
    }
    if (room.members.length >= 6) {
      return callback({ success: false, message: 'Room is full (Maximum 6 players).' });
    }

    const newMember: RoomMember = {
      socketId: socket.id,
      playerId: `player-${room.members.length + 1}`,
      name: data.name || `Player ${room.members.length + 1}`,
      token: data.token,
      color: data.color,
      isHost: false,
    };

    room.members.push(newMember);
    socket.join(code);
    callback({ success: true, roomCode: code, playerId: newMember.playerId });
    io.to(code).emit('room_updated', room);
  });

  // Start Online Game (Host Only)
  socket.on('start_game', (data: { roomCode: string }, callback) => {
    const code = data.roomCode?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback?.({ success: false, message: 'Room not found.' });

    const member = room.members.find((m) => m.socketId === socket.id);
    if (!member || !member.isHost) {
      return callback?.({ success: false, message: 'Only the host can start the match.' });
    }

    if (room.members.length < 2) {
      return callback?.({ success: false, message: 'At least 2 players are needed to start.' });
    }

    const players = room.members.map((m) => ({
      name: m.name,
      token: m.token,
      color: m.color,
    }));

    const initialState = createInitialGameState({
      mode: room.mode,
      players,
      maxRounds: room.maxRounds,
    });

    room.gameState = initialState;
    io.to(code).emit('game_started', initialState);
    callback?.({ success: true });
  });

  // Client requests game action -> Authoritative server validation
  socket.on('action', (data: { roomCode: string; action: GameAction }, callback) => {
    const code = data.roomCode?.toUpperCase();
    const room = rooms.get(code);
    if (!room || !room.gameState) {
      return callback?.({ success: false, message: 'Game not active.' });
    }

    const activePlayer = room.gameState.players[room.gameState.activePlayerIndex];
    const member = room.members.find((m) => m.socketId === socket.id);

    // Validate turn ownership for turn-restricted actions
    if (
      data.action.type !== 'START_GAME' &&
      data.action.type !== 'ACCEPT_TRADE' &&
      data.action.type !== 'REJECT_TRADE'
    ) {
      if (!member || member.playerId !== activePlayer?.id) {
        return callback?.({ success: false, message: "It is not your turn." });
      }
    }

    const result = applyGameAction(room.gameState, data.action);
    if (result.error) {
      return callback?.({ success: false, message: result.error });
    }

    room.gameState = result.state;
    io.to(code).emit('state_update', result.state);
    callback?.({ success: true });
  });

  // Reconnect
  socket.on('reconnect_player', (data: { roomCode: string; playerId: string }, callback) => {
    const code = data.roomCode?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback({ success: false, message: 'Room not found.' });

    const member = room.members.find((m) => m.playerId === data.playerId);
    if (member) {
      member.socketId = socket.id;
      socket.join(code);
      callback({ success: true, gameState: room.gameState, room });
      io.to(code).emit('player_reconnected', { playerId: member.playerId, name: member.name });
    } else {
      callback({ success: false, message: 'Player record not found in room.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (const [code, room] of rooms.entries()) {
      const idx = room.members.findIndex((m) => m.socketId === socket.id);
      if (idx !== -1) {
        const member = room.members[idx];
        io.to(code).emit('player_disconnected', { playerId: member.playerId, name: member.name });
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Business Online Game Server listening on port ${PORT}`);
});
