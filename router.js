const bodyParser = require('body-parser');

const consumerGroupController = require('./controllers/consumerGroup')
const databaseController = require('./controllers/database');
const querystring = require('querystring');
const githubController = require('./controllers/github');

module.exports = app => {
    // ------------------------------ Router Setup for root------------------------------
    var path = require('path'); 
    const rootRouter = app.route('/')
    rootRouter.use(require('express').static('public'));
   
    // Add a new route
    rootRouter.get('/', (req, res) => {
        res.sendFile(path.join(__dirname+'/static/setup.html'));
    })

    rootRouter.get('/configureRepos', (req, res) => {
        var code = req.query.code;

        if (code)
        {
            var url = 'https://github.com/login/oauth/access_token';
    
            var form = {
                client_id: process.env.GITHUB_CLIENTID,
                client_secret: process.env.GITHUB_CLIENTSECRET,
                code: code,
                state : "12345"
            };
            
            var formData = querystring.stringify(form);
            var contentLength = formData.length;
            var headers =
            {
                'Content-Length': contentLength,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept' : 'application/json'
            };
            
            var result = githubController.issue_request(
                "POST",
                url,
                headers,
                formData, 
                function (error, response, body)
                {
                    console.log("The body: ", body);
                    result = JSON.parse(body);
                    res.redirect(301, 'http://localhost:3000/selectRepos?access_token=' + result.access_token);
                });
        }
        else
        {
            res.status(404).json();
        }
    });

    rootRouter.get('/selectRepos', (req, res) => {
        var access_token = req.query.access_token;

        if (access_token)
        {
            console.log("Access token:", access_token);

            var headers =
            {
                'Accept' : 'application/json',
                'Authorization' : 'bearer ' + access_token,
                'User-Agent': process.env.GITHUB_USERAGENT
            };
            githubController.issue_request(
                "GET",
                "https://api.github.com/user/repos",
                headers,
                null,
                function (error, response, body)
                {
                    console.log(body);

                    result = JSON.parse(body);

                    res.status(200).json();
                });
        }
        else
        {
            res.status(404).json();
        }
    });

    // ------------------------------ Router Setup for Groups------------------------------
    const router = app.route('/groups');
    router.use(require('express').static('public'));

    router.use(bodyParser.urlencoded({extended: false}));
    router.use(bodyParser.json());

    router.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // ------------------------------ App API routes ------------------------------

    /**
     * List all groups
     */
    router.get('/', (req, res) => {
      databaseController.getGroups(function(status, body) {
          res.status(status).json(body);
      });
    });

    /**
     * Get the repo events for a given group
     */
    router.get('/events', (req, res) => {
        const groupAddress = req.query.groupAddress;
        databaseController.getEventsForGroup(groupAddress, function(status, body) {
          res.status(status).json(body);
        });
    });

    /**
     * Add a repo to a group's list of connected repos
     */
    router.post('/repos', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const repos = req.body.repos;

        databaseController.addReposToGroup(groupAddress, repos, function(status, body) {
          res.status(status).json(body);
        });
    });

    /**
     * Add a repo to a group's list of connected repos
     */
    router.delete('/repos', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const repos = req.body.repos;

        databaseController.deleteReposFromGroup(groupAddress, repos, function(status, body) {
          res.status(status).json(body);
        });
    });

    /**
     * Send an email to a group
     */
    router.post('/email', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const subject = req.body.subject;
        const emailBody = req.body.emailBody;

        consumerGroupController.writeSimpleEmail(groupAddress, subject, emailBody, function(result) {
            res.status(200).json({'result': result});
        });
    });

    /**
     * Add a member to a consumer group
     */
    router.post('/members', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const userAddress = req.body.userAddress;

        consumerGroupController.addMemberToConsumerGroup(groupAddress, userAddress, function(result) {
            res.status(200).json({'result': result});
        });
    });
}