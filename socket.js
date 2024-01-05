const { v4: uuid } = require('uuid');
const getRandomColor = require('./utils/randomColor');
const { saveGame } = require('./src/data/models/games');
const sheetDB = require('./services/sheetDB');

const rooms = {};
const roomStatuses = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

const addRoom = (user, matchId) => {
  const roomId = uuid();

  rooms[roomId] = {
    roomId,
    matchId,
    status: roomStatuses.WAITING,
    users: [{ ...user, color: getRandomColor() }],
    turn: null, // zero based turn
  };

  return roomId;
};

const joinRoom = (user, matchId) => {
  const roomId = Object.keys(rooms).find(
    (rId) =>
      rooms[rId].matchId === matchId &&
      rooms[rId].status === roomStatuses.WAITING
  );

  // all rooms are full
  if (!roomId) {
    // create new room
    return addRoom(user, matchId);
  }

  if (rooms[roomId].users.find((u) => u.id === user.id)) {
    return roomId;
  }

  // room found at user to it
  const userColor = getRandomColor(rooms[roomId].users.map((u) => u.color));
  rooms[roomId].users.push({ ...user, color: userColor });
  if (rooms[roomId].users.length === 3) {
    rooms[roomId].status = roomStatuses.PLAYING;
    rooms[roomId].turn = 0;
  }
  return roomId;
};

const leaveRoom = (user) => {
  const leavedRoomId = Object.keys(rooms).find((rId) =>
    rooms[rId].users.find((u) => u.sId === user.sId)
  );

  if (!leavedRoomId) {
    return null;
  }

  const leavedRoom = rooms[leavedRoomId];
  leavedRoom.users = leavedRoom.users.filter((u) => u.sId !== user.sId);

  if (leavedRoom.users.length === 0) {
    delete rooms[leavedRoomId];
    return null;
  }

  // correct game turn
  if (
    leavedRoom.status === roomStatuses.PLAYING &&
    leavedRoom.turn >= leavedRoom.users.length
  ) {
    leavedRoom.turn = 0;
  }

  return leavedRoomId;
};

const selectPlayer = (playerId, playerIndex, isFirstTeam, userId, roomId) => {
  const room = rooms[roomId];

  if (!room || room.status !== roomStatuses.PLAYING) {
    return;
  }

  if (
    room.users.find(
      (u) =>
        u.selection &&
        u.selection.find((s) => s.i === playerIndex && s.ft === isFirstTeam)
    )
  ) {
    return;
  }
  const userI = room.users.findIndex((u) => u.id === userId);
  const user = room.users[userI];

  if (!user || userI !== room.turn) {
    return;
  }

  user.selection = [
    ...(user.selection || []),
    {
      id: playerId,
      i: playerIndex,
      ft: isFirstTeam,
    },
  ];
  room.turn = (room.turn + 1) % room.users.length;
};

const checkGameFinished = (roomId) => {
  const room = rooms[roomId];

  const finished = room.users.every(
    (u) => u.selection && u.selection.length >= 4
  );

  if (finished) {
    room.status = roomStatuses.FINISHED;
    const match = sheetDB.matches.find((m) => m.match_id === room.matchId);
    saveGame({ ...room }, match);
  }

  return finished;
};

module.exports = (socket) => {
  socket.on('disconnect', () => {
    console.log('disconnect');
    const roomId = leaveRoom({ sId: socket.id });
    if (roomId) {
      socket.to(roomId).emit('leaved', rooms[roomId]);
    }
  });

  socket.on('join', (userId, matchId, username) => {
    console.log('join');
    const roomId = joinRoom({ id: userId, sId: socket.id, username }, matchId);

    socket.join(roomId);
    socket.emit('joined', rooms[roomId]);
    socket.to(roomId).emit('joined', rooms[roomId]);
  });

  socket.on(
    'player-selection',
    (playerId, playerIndex, isFirstTeam, userId, roomId) => {
      console.log('player-selection');
      selectPlayer(playerId, playerIndex, isFirstTeam, userId, roomId);

      checkGameFinished(roomId);

      socket.emit('joined', rooms[roomId]);
      socket.to(roomId).emit('joined', rooms[roomId]);
    }
  );
};
