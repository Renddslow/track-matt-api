'use strict';

const got = require('got');

module.exports = async (location) => {
  const url = `https://api.what3words.com/v2/reverse?coords=${location.latitude},${location.longitude}&key=KESOM4RB&format=json&display=full`;
  try {
    const data = await got(url);
    const response = JSON.parse(data.body);
    return response.words;
  } catch (e) {
    return '<location-not-found>';
  }
};