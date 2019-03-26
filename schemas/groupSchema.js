const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
  address: {type: String, unique: true},
  repos: [{type: String}],
});

module.exports = mongoose.model('Group', groupSchema);