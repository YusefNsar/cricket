const axios = require('axios');

const getMatches = async () => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url:
      'https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=3&api_token=kxdiq3aZt01BuILwiWBnXuC9HfKxJLx96ad7BvvPzZnYZRZovsoeTSceFHtu',
    headers: {},
  };

  const allMatches = await axios
    .request(config)
    .then((response) => response.data?.data)
    .catch((error) => {
      console.error(error);
    });

  allMatches.forEach((match) => {
    const matchStart = new Date(match.starting_at).getTime();
    const matchEnd = matchStart + 1000 * 60 * 60 * 2.5; // match ends after 2 and half hours
    const timeNow = new Date().getTime();

    if (matchEnd < timeNow) {
      match.class = 'finished';
    } else if (matchStart < timeNow) {
      match.class = 'live';
    } else {
      match.class = 'incomming';
    }
  });

  return allMatches;
};

const getPlayersScores = async (matchId = 21897) => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=bowling,batting&api_token=kxdiq3aZt01BuILwiWBnXuC9HfKxJLx96ad7BvvPzZnYZRZovsoeTSceFHtu`,
    headers: {},
  };

  const matchDetails = await axios
    .request(config)
    .then((response) => response.data?.data)
    .catch((error) => {
      console.error(error);
    });

  const players = {};

  matchDetails.batting.forEach((score) => {
    const player_id = score.player_id;

    if (!players[player_id]) {
      players[player_id] = {
        bowlingPoints: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      };
    }

    players[player_id].battingPoints = score.score;
    players[player_id].four_x = score.four_x;
    players[player_id].six_x = score.six_x;
    players[player_id].six_x = score.six_x;
  });

  matchDetails.bowling.forEach((score) => {
    const player_id = score.player_id;

    if (!players[player_id]) {
      players[player_id] = { battingPoints: 0, four_x: 0, six_x: 0 };
    }

    players[player_id].bowlingPoints = score.rate;
    players[player_id].runs = score.runs;
    players[player_id].wickets = score.wickets;
    players[player_id].economy = score.overs;
  });

  return players;
};

getPlayersScores().then((res) => console.log(res));
