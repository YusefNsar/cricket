/* eslint-disable no-param-reassign */
const moment = require('moment');
const sheetDB = require('../../../services/sheetDB');
const { getMatchesGamesUsers, getAllGames } = require('../models/games');

module.exports.getMatches = async (req, res) => {
  const { matches } = sheetDB;

  // get matches in upcoming week
  const upcomingMatches = matches.filter((m) => {
    const matchTime = moment.utc(m.datetime);

    return matchTime.isBetween(moment(), moment().add(1, 'week'));
  });

  // adds number of users played on each match
  const matchesGamesUsers = await getMatchesGamesUsers(
    matches.map((m) => m.match_id)
  );
  upcomingMatches.forEach((m) => {
    const matchUsersCount = matchesGamesUsers.find(
      (mgu) => mgu._id === m.match_id
    );
    m.users = matchUsersCount ? matchUsersCount.users : 0;
  });

  return res.status(200).json({
    matches: upcomingMatches,
  });
};

module.exports.getPastGames = async (req, res) => {
  const { matches } = sheetDB;
  const { user } = req.headers;

  const games = await getAllGames({ 'users.id': user });

  games.forEach((g) => {
    g.match = matches.find((m) => m.match_id === g.matchId);
  });

  return res.status(200).json({
    games,
  });
};
