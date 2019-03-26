/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  require('dotenv').config();

  const express = require('express');
  const bodyParser = require('body-parser');
  const mongoose = require('mongoose');

  const GithubEvent = require('./schemas/githubEvent');
  const Group = require('./schemas/groupSchema');

  // Connect to the Mongo database using credentials
  // in your environment variables
  mongoose.connect(process.env.COSMOSDB_CONNSTR+"?ssl=true&replicaSet=globaldb", {
    auth: {
      user: process.env.COSMOSDB_USER,
      password: process.env.COSMOSDB_PASSWORD
    }
  })
  .then(() => console.log('Connection to CosmosDB successful'))
  .catch((err) => console.error(err));

  const server = express();

  server.use(bodyParser.urlencoded({extended: false}));
  server.use(bodyParser.json());

  server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  server.get('/events', (req, res) => {
    const groupAddress = req.body.groupAddress;
    Group.findOne({address: groupAddress}, function(err, group) {
      if (err) {
        res.status(500).json({'message': 'Error finding group'});
        return;
      } else if (group == null) {
        res.status(404).json({'message': 'Group to gather events for not found'});
        return;
      } else {
        GithubEvent.find({repo: {$in: group.repos}}, function(err, events) {
          if (err) {
            res.status(500).json({'message': 'There was an error retrieving the events'});
          } else {
            res.status(200).json({events: events});
          }
        })
      }
    })
  });

  server.post('/groupRepos', (req, res) => {
    const groupAddress = req.body.groupAddress;
    const repo = req.body.repo;

    if (groupAddress == null || repo == null) {
      res.status(400).json({'message': 'Must include group address and repo'});
      return;
    }
    
    let conditions = {
      address: groupAddress,
    };

    let update = {
      $addToSet: { repos: repo },
    };

    Group.findOneAndUpdate(conditions, update, {upsert: true}, function(err, group) {
      if (err) {
        res.status(500).json({'message': 'There was an error saving the group repos'});
      } else {
        res.status(200).json({'message': 'Group repo added'});
      }
    });
  });

  let port = 8000;
  // Exposed express API
  server.listen(port, () => {
    app.log('API server listening on port ' + port);
  })

  // Github probot app

  app.on('issues.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'issue',
      state: context.payload.issue.state,
      url: context.payload.issue.url,
      repo: context.payload.repository.id,
      title: context.payload.issue.title,
      body: context.payload.issue.body,
      githubId: context.payload.issue.id,
    });

    githubEvent.save();
    app.log("Added issue " + githubEvent.githubId);
  });

  app.on(['issues.closed', 'issues.reopened', 'issues.edited'], async context => {
    let query = {githubId: context.payload.issue.id};
    let update = {
      state: context.payload.issue.state,
      url: context.payload.issue.url,
      title: context.payload.issue.title,
      body: context.payload.issue.body,
    }
    GithubEvent.findOneAndUpdate(query, update, function(err, doc) {
      if (err) {
        app.log("Error updating issue: " + err);
      } else {
        app.log("Successfully updated issue: " + doc.githubId);
      }
    })
  });

  app.on('pull_request.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'pull_request',
      state: context.payload.pull_request.state,
      url: context.payload.pull_request.url,
      repo: context.payload.repository.id,
      title: context.payload.pull_request.title,
      body: context.payload.pull_request.body,
      githubId: context.payload.pull_request.id,
    });

    githubEvent.save();
    app.log("Added pull request " + githubEvent.githubId);
  });

  app.on(['pull_request.closed', 'pull_request.reopened', 'pull_request.edited'], async context => {
    let query = {githubId: context.payload.pull_request.id};
    let update = {
      state: context.payload.pull_request.state,
      url: context.payload.pull_request.url,
      title: context.payload.pull_request.title,
      body: context.payload.pull_request.body,
    }
    GithubEvent.findOneAndUpdate(query, update, function(err, doc) {
      if (err) {
        app.log("Error updating pull request: " + err);
      } else {
        app.log("Successfully updated pull request: " + doc.githubId);
      }
    })
  });

  app.on('push', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'push',
      state: 'closed',
      repo: context.payload.repository.id,
      url: context.payload.compare,
    });

    githubEvent.save();
    app.log("Added push event");
  });
}
