const request = require('request');
const querystring = require('querystring')

module.exports = {

    writeSimpleEmail : function (recipientSmtpAddress, subject, bodyInHtml)
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
                    console.log(result);
                });
        });
    },

    addMemberToConsumerGroup : function (groupSmtpAdddress, userSmtpAddress)
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
                    console.log(result);
                });
        });        
    }

}

function getAccessToken (callback)
{
    var url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    var refresh_token = 'MCeYaosjp2woZegPHS2MgcwfNQqAv!XJ86F2Vkg26DWk6!aa7xnp3PjInKL!H9es8RMJfHl735088vh5kThtIY0Yjh7y4BVFr!EOrbwA7xzfMmqHjG28hcxrppp2tksdiwZf8508ipEqLM7SgRwq8*uzFwfxWH6RGighgaN7rdaibebH51OtQIMg9rLeqMLshn2gK0iadCAzXETQH1p**U3UQxXUdx105UnhSRHn*r1HtNLlS8JFUUDyWfhPgtuaj*LQge71YkUxy011qA0pKGK5bK0n5W6u1TvnWU5FRbrjpyZwmRtp8qfyLnOyUNNdRH!e37biicsTmaslICJ6p3wl4DBPrFJr8FJUA3n2egxMnn1YFPHUDdHe0Og1cKJGWKcJJDIxLKQsGuQTLGlSU7M!cO11mNsgxebPxwMfcsJnu1bNDKrC1ORyQCiXvAaOeK*tmheM0RSVW8P*uKYsn*jy!Eb51!bnwKIuHQDKl3tSF';

    var form = {
        client_id: '561d3096-12ee-4ee6-b2fe-1fc37af25dd3',
        client_secret: 'uqbjZDAY041]@{rncLBS85(',
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
                console.log(error);
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