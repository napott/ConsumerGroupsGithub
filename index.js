/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    app.log(context);
    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // return context.github.issues.createComment(issueComment)



  });

  app.on('pull_request.opened', async context => {
    app.log(context);
  });

  app.on('push', async context => {
    app.log(context);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  // Create test end point for consumer groups apis
  const consumerGroupsRouter = app.route('/cg')
  consumerGroupsRouter.use(require('express').static('public'))
  consumerGroupsRouter.get('/hello-world', (req, res) => {

    var cg = require('./consumerGroup')
    
    cg.writeSimpleEmail("juancamiloochoa@gmail.com", "<h1>hola</h1>");
    res.send('Hello World');
  })
}
