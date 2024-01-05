/* eslint-disable eqeqeq */
/* eslint-disable no-use-before-define */
const axios = require('axios');
const XLSX = require('xlsx');
const config = require('./config');

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

    console.log(this.teams, this.players)

    // setup refresh
    // setTimeout(() => {
    //   this.refreshData();
    // }, config.refreshEveryMinutes * 60 * 1000);

    // console.log('updated', this.matches.length);
  }

}

module.exports = new SheetDB();
