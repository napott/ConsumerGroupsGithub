const request = require('request');
const querystring = require('querystring')

module.exports = {

    writeSimpleEmail : function (recipientSmtpAddress, subject, bodyInHtml, callback)
    {
        var accessToken = getAccessToken(function(accessToken)
        {
            var url = "https://outlook.office.com/api/beta/me/sendmail";
            var headers =
            {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }; 
            
            var body = 
            {
                "Message" :
                {
                    "Subject" : subject,
                    "Body": {
                        "ContentType" : "HTML",
                        "Content" : bodyInHtml
                    },
                    "ToRecipients" : [
                        {
                            "EmailAddress" : {
                                "Address" : recipientSmtpAddress
                            }
                        }
                    ]
                },
                "SaveToSentItems" : "false"
            };

            jsonBody = JSON.stringify(body);

            issue_request(
                "POST",
                url,
                headers,
                jsonBody,
                function (result)
                {
                    callback(result);
                });
        });
    },

    addMemberToConsumerGroup : function (groupSmtpAdddress, userSmtpAddress, callback)
    {
        var accessToken = getAccessToken(function(accessToken)
        {
            var url = `https://outlook.office365.com/api/beta/Groups('${groupSmtpAdddress}')/AddMembers`;
            var headers =
            {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
                'prefer': 'exchange.behavior="GroupMembers"'
            }; 
            
            var body = 
            {
                "Members" : [ userSmtpAddress ]
            };

            jsonBody = JSON.stringify(body);

            issue_request(
                "POST",
                url,
                headers,
                jsonBody,
                function (result)
                {
                    callback(result);
                });
        });        
    }

}

function getAccessToken (callback)
{
    var url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    var refresh_token = process.env.CONSUMERGROUPS_REFRESHTOKEN;

    var form = {
        client_id: process.env.CONSUMERGROUPS_CLIENTID,
        client_secret: process.env.CONSUMERGROUPS_SECRET,
        scope: 'https://outlook.office.com/mail.send https://outlook.office.com/mail.read https://outlook.office.com/group.readwrite.all',
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
        redirect_uri: 'https://localhost'
    };
    
    var formData = querystring.stringify(form);
    var contentLength = formData.length;
    var headers =
    {
        'Content-Length': contentLength,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    var result = issue_request(
        "POST",
        url, headers,
        formData, 
        function (result)
        {
            return callback(result.access_token);
        });
}

function issue_request(method, url, headers, body, callback)
{
    request(
        {
            headers: headers,
            uri: url,
            body: body,
            method: method
        },
        function (error, response, body)
        {
            if (error)
            {
                console.log("Error: ", method, url, error);
            }
            else
            {
                console.log("success:", method, url);
                
                if (body)
                {
                    var result = JSON.parse(body);
                    callback(result);
                }
            }
        });
}