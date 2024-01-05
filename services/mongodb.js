const mongoose = require('./mongoose');

const getMongoDB = async () => {
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (mongoose.connection.db) {
        resolve(mongoose.connection.db);
        clearInterval(t);
      }
    }, 200);
  });
};

module.exports = { getMongoDB };
