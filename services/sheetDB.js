/* eslint-disable eqeqeq */
/* eslint-disable no-use-before-define */
const axios = require('axios');
const XLSX = require('xlsx');
const config = require('../config');
const {
  getPendingScoreGames,
  saveGamePoints,
} = require('../src/data/models/games');

class SheetDB {
  constructor() {
    this.sheetURL = config.dbUrlSheetDB;

    this.matches = [];
    this.teams = [];
    this.players = [];

    this.refreshData();
  }

  async refreshData() {
    const res = await axios.get(this.sheetURL, { cache: false });
    const content = XLSX.read(res.data, { type: 'string' });

    // read data from sheet
    this.matches = XLSX.utils.sheet_to_json(
      content.Sheets[content.SheetNames[0]]
    );
    this.teams = XLSX.utils.sheet_to_json(
      content.Sheets[content.SheetNames[1]]
    );
    this.players = XLSX.utils.sheet_to_json(
      content.Sheets[content.SheetNames[2]]
    );

    // set each team's players
    this.teams = this.teams.map((t) => ({
      ...t,
      players: Object.keys(t)
        .filter((k) => k.startsWith('players['))
        .map((k) => this.players[t[k] - 1]),
    }));

    // set each match's teams
    this.matches = this.matches.map((m) => ({
      ...m,
      team1: this.teams[m.team1 - 1],
      team2: this.teams[m.team2 - 1],
    }));

    // get new set scores
    const scores = XLSX.utils.sheet_to_json(
      content.Sheets[content.SheetNames[3]]
    );
    this.getNewScores(scores);

    // setup refresh
    setTimeout(() => {
      this.refreshData();
    }, config.refreshEveryMinutes * 60 * 1000);

    console.log('updated', this.matches.length);
  }

  async getNewScores(scores) {
    const gamesPendingScores = await getPendingScoreGames();

    gamesPendingScores.forEach((game) => {
      // if ga me not scored skip
      const match = this.matches.find((m) => m.match_id == game.matchId);
      if (!match.scored) {
        return;
      }

      // get game's scores
      const matchScores = scores.filter((s) => s.match_id == game.matchId);
      if (matchScores.length === 0) {
        return;
      }

      // let validScores = true;

      const usersPoints = game.users.map((user) => {
        // for each user
        const playersPoints = user.selection.map((sel) => {
          // for each selection
          // calc selection points
          const playerScoreInMatch = matchScores.find(
            (s) => s.player_id === sel.id
          );

          // if (!playerScoreInMatch) {
          //   validScores = false;
          //   return {};
          // }

          const { run, s4, s6, wickets, economy } = playerScoreInMatch || {};

          let batting = run / 5;
          if (run >= 50 && run <= 75) {
            batting += 1;
          } else if (run > 75 <= 100) {
            batting += 2;
          } else if (run > 100) {
            batting += 3;
          }

          let bowling = 5 * wickets;
          if (economy < 6) {
            bowling += 2;
          }

          return { run, s4, s6, wickets, economy, batting, bowling };
        });

        // if (!validScores) {
        //   return {};
        // }

        // sum the selection points to get  user points
        const userPoints = playersPoints.reduce(
          (sum, playerPoints) =>
            sum + playerPoints.batting + playerPoints.bowling,
          0
        );

        return { points: userPoints, playersPoints };
      });

      // get winnings
      const totalUsersPoints = usersPoints.reduce(
        (sum, userPoints) => sum + userPoints.points,
        0
      );
      usersPoints.forEach((up) => {
        // eslint-disable-next-line no-param-reassign
        up.winnings = 3 * up.points - totalUsersPoints;
      });

      // save scores in game doc
      saveGamePoints(game._id, usersPoints);
    });

    // alt solution
    // const matchesPendingScores = gamesPendingScores.reduce(
    //   (matches, game) => ({
    //     [game.matchId]: [...(matches[game.matchId] || []), game],
    //   }),
    //   {}
    // );
  }
}

module.exports = new SheetDB();
