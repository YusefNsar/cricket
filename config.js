require('dotenv').config();

const config = {
  port: 3030,
  refreshEveryMinutes: 5,
  dbUrlMongoDB: process.env.dbUrlMongoDB,
  dbUrlSheetDB: process.env.dbUrlSheetDB,
  API_KEY_JWT: process.env.API_KEY_JWT,
  TOKEN_EXPIRES_IN: process.env.TOKEN_EXPIRES_IN,
};

module.exports = config;
