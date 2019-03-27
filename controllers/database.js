// controllers/database.js

const GithubEvent = require('../schemas/githubEvent');
const Group = require('../schemas/groupSchema');

function getGroups(callback) {
  Group.find({}, function(err, groups) {
    if (err) {
        callback(500, {'message': err});
    } else {
        callback(200, {'groups': groups});
    }
  });
}

function getEventsForGroup(groupAddress, callback) {
  Group.findOne({address: groupAddress}, function(err, group) {
    if (err) {
        callback(500, {'message': 'Error finding group'});
        return;
    } else if (group == null) {
        callback(404, {'message': 'Group to gather events for not found'});
        return;
    } else {
        GithubEvent.find({repo: {$in: group.repos}}, function(err, events) {
            if (err) {
                callback(500, {'message': 'There was an error retrieving the events'});
            } else {
                callback(200, {events: events});
            }
        });
    }
  });
}

function addReposToGroup(groupAddress, repos, callback) {
  if (groupAddress == null || repos == null) {
    callback(400, {'message': 'Must include group address and repos'});
    return;
  }

  let conditions = {
      address: groupAddress,
  };

  let update = {
      $addToSet: { repos: repos },
  };

  Group.findOneAndUpdate(conditions, update, {upsert: true}, function(err, group) {
      if (err) {
          callback(500, {'message': 'There was an error saving the group repos'});
      } else {
          callback(200, {'message': 'Group repositories added'});
      }
  });
}

function deleteReposFromGroup(groupAddress, repos, callback) {
  if (groupAddress == null || repos == null) {
    callback(400, {'message': 'Must include group address and repos'});
    return;
  }

  let conditions = {
      address: groupAddress,
  };

  let update = {
      $pullAll: { repos: repos },
  };

  Group.findOneAndUpdate(conditions, update, function(err, group) {
      if (err) {
          callback(500, {'message': 'There was an error saving the group repos'});
      } else {
          callback(200, {'message': 'Group repositories added'});
      }
  });
}

module.exports = {
  getGroups,
  getEventsForGroup,
  addReposToGroup,
  deleteReposFromGroup,
}