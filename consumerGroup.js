const request = require('request');
const querystring = require('querystring')

module.exports = {

    writeSimpleEmail : function (recipientSmtpAddress, bodyInHtml)
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
                    "Subject" : "theSubject",
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
    }
}

function getAccessToken (callback)
{
    var url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    var refresh_token = 'MCU7gxwEkkBPQA55DCaAXYpE9fUMTiabDW9PHR6I5yUDqvh1UCa1iMhby1x3*L8jeJaBmQ9yKDP2dM!Qnd*m3kJu*WLQcHAqaYh8WiBWE7jwELEV7zsXf!rMvpFPcBk50*bDvmRwkedxFUQ0bA9rOWeTFkRTjUcvgrULzMVdQX*58DqeRZB9S2WBevOnUoyetr!aTHyGlDxBZUy0NmakA3MZ3Vc*NLiuHaskclLXzXjoDyJOHo*OUIZK1MiQGsTAwlpoEQERmcc8uJiPXfEaM!BP378F2VJxDZ3cfuiwoWJWu0O!a*BCVOR1Fa3qtQTXj1kYcz*4J2kbJGo*RxEzBTjeS8ewq6SG8BqTPURKxMoBkXbWmKn01FEcqQzb1p8pX9ynpalcVXAJ1P9OG9z!sRFwPwWHfTGca6LXMO0qcIjZ693bdTSd70I3Ya7SOTwDr4vhBOFhN0TAm5ov0dmOSLQ0$';

    var form = {
        client_id: '4ac73e6e-dd1f-445f-94f8-20c27bec7b56',
        client_secret: 'nARVVT96)~pvlfrnHJ895[*',
        scope: 'https://outlook.office.com/mail.send https://outlook.office.com/mail.read',
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