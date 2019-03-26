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
      user: process.env.COSMODDB_USER,
      password: process.env.COSMOSDB_PASSWORD
    }
  })
  .then(() => console.log('Connection to CosmosDB successful'))
  .catch((err) => console.error(err));

  app.on('issues.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'issue',
      url: context.payload.issue.url,
    });

    githubEvent.save();
  });

  app.on('pull_request.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'pull_request',
      url: context.payload.issue.url,
    });

    githubEvent.save();
  });

  app.on('push', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'push',
      url: context.payload.issue.compare,
    });

    githubEvent.save();
  });
}
