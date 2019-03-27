/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  require('dotenv').config();

  const mongoose = require('mongoose');

  const GithubEvent = require('./schemas/githubEvent');
  const Group = require('./schemas/groupSchema');
  const consumerGroupController = require('./controllers/consumerGroup');

  // ------------------------------ DB and router setup ------------------------------

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

  require('./router')(app);

  // ------------------------------ Github event handlers ------------------------------

  /**
   * Handle newly opened issues
   */
  app.on('issues.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'issue',
      state: context.payload.issue.state,
      url: context.payload.issue.html_url,
      repo: context.payload.repository.id,
      title: context.payload.issue.title,
      body: context.payload.issue.body,
      githubId: context.payload.issue.id,
    });

    githubEvent.save();
    app.log("Added issue " + githubEvent.githubId);
  });

  /**
   * Handle updating issues
   */
  app.on(['issues.closed', 'issues.reopened', 'issues.edited'], async context => {
    let query = {githubId: context.payload.issue.id};
    let update = {
      state: context.payload.issue.state,
      url: context.payload.issue.html_url,
      title: context.payload.issue.title,
      body: context.payload.issue.body,
    }
    GithubEvent.findOneAndUpdate(query, update, {upsert: true}, function(err, issue) {
      if (err) {
        app.log("Error updating issue: " + err);
      } else {
        app.log("Successfully updated issue");
      }
    })
  });

  /**
   * Handle newly opened pull requests
   */
  app.on('pull_request.opened', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'pull_request',
      state: context.payload.pull_request.state,
      url: context.payload.pull_request.html_url,
      repo: context.payload.repository.id,
      title: context.payload.pull_request.title,
      body: context.payload.pull_request.body,
      githubId: context.payload.pull_request.id,
    });

    githubEvent.save();
    app.log("Added pull request " + githubEvent.githubId);
  });

  /**
   * Handle updating pull requests
   */
  app.on(['pull_request.closed', 'pull_request.reopened', 'pull_request.edited'], async context => {
    let query = {githubId: context.payload.pull_request.id};
    let update = {
      state: context.payload.pull_request.state,
      url: context.payload.pull_request.html_url,
      title: context.payload.pull_request.title,
      body: context.payload.pull_request.body,
    }
    GithubEvent.findOneAndUpdate(query, update, {upsert: true}, function(err, pull) {
      if (err) {
        app.log("Error updating pull request: " + err);
      } else {
        app.log("Successfully updated pull request");
      }
    })
  });

  /**
   * Handle new push events
   */
  app.on('push', async context => {
    let githubEvent = new GithubEvent({
      eventType: 'push',
      repo: context.payload.repository.id,
      url: context.payload.compare,
    });

    githubEvent.save();
    app.log("Added push event");
  });

  /**
   * Handle members being added to the repository
   */
  app.on('member.added', async context => {
    let repo = context.payload.repository.id;

    context.github.users.getByUsername({
      username: context.payload.member.login
    }).then(({data, headers, status}) => {
      if (status != 200) {
        app.log(data, status);
        return;
      }

      let userEmail = data.email;
      if (userEmail == null) {
        app.log("User email isn't configured or is private");
        return;
      }
      
      Group.find({repos: repo}, function(err, groups) {
        if (err) {
          app.log("ERROR: " + err);
          return;
        }

        groups.forEach(function(group) {
          consumerGroupController.addMemberToConsumerGroup(group.address, userEmail, function(result) {
            app.log(result);
          })
        });
      });
    });
  });

  /**
   * Handle members being added to the repository
   */
  app.on('member.deleted', async context => {
    app.log('MEMBER DELETED');
    context.github.users.getByUsername({
      username: context.payload.member.login
    }).then(({data, headers, status}) => {
      app.log(data, headers, status);
    });
  });
}
