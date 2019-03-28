const request = require('request');
const querystring = require('querystring')

module.exports = {
    issue_request : function (method, url, headers, body, callback)
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
                    
                    callback(error, response, body);
                }
            });
    }    
}