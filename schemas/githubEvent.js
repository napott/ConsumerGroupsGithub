const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const githubEventSchema = new Schema({
  eventType: {type: String, required: true},
  url: {type: String},
});

module.exports = mongoose.model('GithubEvent', githubEventSchema);