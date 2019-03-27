const bodyParser = require('body-parser');

const Group = require('./schemas/groupSchema');
const GithubEvent = require('./schemas/githubEvent');
const consumerGroup = require('./consumerGroup')

module.exports = app => {
    // ------------------------------ Router Setup ------------------------------
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

    router.get('/', (req, res) => {
      Group.find({}, function(err, groups) {
        if (err) {
            res.status(500).json({'message': err});
        } else {
            res.status(200).json({'groups': groups});
        }
      });
    });

    /**
     * Get the repo events for a given group
     */
    router.get('/events', (req, res) => {
        const groupAddress = req.query.groupAddress;
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
                });
            }
        });
    });

    /**
     * Add a repo to a group's list of connected repos
     */
    router.post('/repos', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const repos = req.body.repos;

        if (groupAddress == null || repos == null) {
            res.status(400).json({'message': 'Must include group address and repos'});
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
                res.status(500).json({'message': 'There was an error saving the group repos'});
            } else {
                res.status(200).json({'message': 'Group repositories added'});
            }
        });
    });

    /**
     * Add a repo to a group's list of connected repos
     */
    router.delete('/repos', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const repos = req.body.repos;

        if (groupAddress == null || repos == null) {
            res.status(400).json({'message': 'Must include group address and repos'});
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
                res.status(500).json({'message': err});
            } else {
                res.status(200).json({'message': 'Group repositories removed'});
            }
        });
    });

    /**
     * Send an email to a group
     */
    router.post('/email', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const subject = req.body.subject;
        const emailBody = req.body.emailBody;

        consumerGroup.writeSimpleEmail(groupAddress, subject, emailBody, function(result) {
            res.status(200).json({'result': result});
        });
    });

    /**
     * Add a member to a consumer group
     */
    router.post('/members', (req, res) => {
        const groupAddress = req.body.groupAddress;
        const userAddress = req.body.userAddress;

        consumerGroup.addMemberToConsumerGroup(groupAddress, userAddress, function(result) {
            res.status(200).json({'result': result});
        });
    });
}