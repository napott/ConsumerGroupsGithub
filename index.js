/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  const mongoose = require('mongoose');
  require('dotenv').config();

  const GithubEvent = require('./schemas/githubEvent');

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

  app.on('issues.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'issue',
      state: context.payload.issue.state,
      url: context.payload.issue.url,
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
      status: 'closed',
      url: context.payload.issue.compare,
    });

    githubEvent.save();
    app.log("Added push " + githubEvent.githubId);
  });
}
