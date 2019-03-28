const bodyParser = require('body-parser');

const consumerGroupController = require('./controllers/consumerGroup')
const databaseController = require('./controllers/database');
const querystring = require('querystring');
const githubController = require('./controllers/github');
var Cookies = require('cookies');

module.exports = app => {
    // ------------------------------ Router Setup for root------------------------------
    var path = require('path'); 
    const rootRouter = app.route('/')
    rootRouter.use(require('express').static('public'));
   
    // Add a new route
    rootRouter.get('/', (req, res) => {
        res.render('../../../views/setup.hbs', {
            root_url : process.env.APP_ROOT_URL,
            client_id: process.env.GITHUB_CLIENTID
        });
    })

    rootRouter.get('/start', (req, res) => {

        var groupSmtpAddress = req.query.groupSmtpAddress;

        console.log("start/: ", groupSmtpAddress);
        res.status(404).json();
        if (groupSmtpAddress)
        {
            console.log("start2/: ", groupSmtpAddress);
            var keys = [ process.env.COOKIE_KEYS ];
            var cookies = new Cookies(req, res, { keys: keys })

            console.log("start3/: ", groupSmtpAddress);
            console.log("groupSmtpAddress: ", groupSmtpAddress);
            cookies.set('groupSmtpAddress', groupSmtpAddress, { signed: true });

            console.log("start4/: ", groupSmtpAddress);
            res.redirect(301, "https://github.com/login/oauth/authorize?client_id="+ process.env.GITHUB_CLIENTID +"&redirect_uri="+process.env.APP_ROOT_URL+"/configure&state=12345");
        }
        else
        {
            console.log("start5/: ", groupSmtpAddress);
            res.status(404).json(); 
        }

    });

    rootRouter.get('/configure', (req, res) => {
        var code = req.query.code;
        var installation_id=req.query.installation_id;
        var setup_action=req.query.setup_action;

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
                    res.redirect(301, process.env.APP_ROOT_URL + '/processAccessToken?access_token=' + result.access_token);
                });
        }
        else if (installation_id)
        {
            res.redirect(301, "https://github.com/login/oauth/authorize?client_id="+ process.env.GITHUB_CLIENTID +"&redirect_uri="+process.env.APP_ROOT_URL+"/configure&state=12345");
        }
        else
        {
            res.status(404).json();
        }
    });

    rootRouter.get('/processAccessToken', (req, res) => {
        var access_token = req.query.access_token;

        if (access_token)
        {
            console.log("Access token:", access_token);
            var headers =
            {
                'Accept' : 'application/vnd.github.machine-man-preview+json',
                'Authorization' : 'bearer ' + access_token,
                'User-Agent': process.env.GITHUB_USERAGENT
            };
            githubController.issue_request(
                "GET",
                "https://api.github.com/user/installations",
                headers,
                null,
                function (error, response, body)
                {
                    result = JSON.parse(body);

                    if (result.total_count == 0)
                    {
                        // Take to installation page
                        res.redirect(301, process.env.APP_INSTALLATION_URL);
                    }
                    else
                    {
                        // Take to repository configuration page
                        res.redirect(301, process.env.APP_ROOT_URL + '/selectRepos?access_token=' + access_token);
                    }
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

            var keys = [ process.env.COOKIE_KEYS ];
            var cookies = new Cookies(req, res, { keys: keys })            
            var groupSmtpAddress = cookies.get('groupSmtpAddress', {signed: true});

            console.log("GroupSmtpAddress: ", groupSmtpAddress)

            githubController.issue_request(
                "GET",
                "https://api.github.com/user/repos?type=owner",
                headers,
                null,
                function (error, response, body)
                {
                    result = JSON.parse(body);
                    res.render('../../../views/selectRepos.hbs', {
                        actionUrl : '/processRepos',
                        repositories : result,
                        groupSmtpAddress : 'groupSmtpAddress'
                    });
                });
        }
        else
        {
            res.status(404).json();
        }
    });

    rootRouter.post('/processRepos', (req, res) => {

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {

            var result = querystring.parse(body);

            var keys = [ process.env.COOKIE_KEYS ];
            var cookies = new Cookies(req, res, { keys: keys })            
            var groupSmtpAddress = cookies.get('groupSmtpAddress', {signed: true});
            cookies.set('groupSmtpAddress', null, { signed: true });

            console.log("The group smtp address: ", groupSmtpAddress);

            databaseController.addReposToGroup(groupSmtpAddress, result.repository, function(status, body) {
                res.render('../../../views/reposConfigured', {
                    groupSmtpAddress : groupSmtpAddress,
                    result : body.message
                });
            });
        });
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