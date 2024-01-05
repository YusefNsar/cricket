const moment = require('moment');
const { getMongoDB } = require('../../../services/mongodb');

const GAMES_COLLECTION = 'games';

const saveGame = async (game, match) => {
  const db = await getMongoDB();
  return db.collection(GAMES_COLLECTION).insertOne({
    ...game,
    matchTime: match.datetime,
    datetime: moment.utc().toISOString(),
  });
};

const getAllGames = async (filters = {}) => {
  const db = await getMongoDB();
  return db.collection(GAMES_COLLECTION).find(filters).toArray();
};

const getMatchesGamesUsers = async (matchIds) => {
  const db = await getMongoDB();

  const matchesGamesUsers = await db
    .collection('games')
    .aggregate(
      [
        { $match: matchIds ? { matchId: { $in: matchIds } } : {} },
        {
          $group: {
            _id: '$matchId',
            // number of users have played on this match
            users: { $sum: { $size: '$users' } },
          },
        },
      ],
      { maxTimeMS: 60000, allowDiskUse: true }
    )
    .toArray();

  return matchesGamesUsers;
};

// get all games which ended but it's score is not set yet
const getPendingScoreGames = async () => {
  const db = await getMongoDB();

  const pendingScores = await db
    .collection(GAMES_COLLECTION)
    .find({
      matchTime: { $lt: new Date().toISOString() },
      gamePoints: { $exists: false },
    })
    .toArray();

  return pendingScores;
};

// save game's users points
const saveGamePoints = async (gameId, gamePoints) => {
  const db = await getMongoDB();
  await db.collection(GAMES_COLLECTION).updateOne(
    {
      _id: gameId,
    },
    {
      $set: { gamePoints },
    }
  );
};

module.exports = {
  saveGame,
  getMatchesGamesUsers,
  getAllGames,
  getPendingScoreGames,
  saveGamePoints,
};
