const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const githubEventSchema = new Schema({
  eventType: {type: String, required: true},
  url: {type: String, required: true},
  repo: {type: String, required: true},
  state: {type: String},
  title: {type: String},
  body: {type: String},
  githubId: {type: String},
}, {
  timestamps: true,
});

module.exports = mongoose.model('GithubEvent', githubEventSchema);