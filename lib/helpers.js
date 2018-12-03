const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const helpers = {};
const path = require('path'); 
const fs = require('fs')




helpers.hash = (str) => {
    if (typeof str == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObj = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj
    } catch (e) {
        return {};
    }
}

helpers.createRandomString = (strLength) => {
    strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        let possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';

        for (let i = 1; i <= strLength; i++) {

            let randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randomChar;
        }
        return str;
    } else {
        return false
    }
}

helpers.sendTwilioSms = (phone, message, callback) => {
    // validate the parameters 
    phone = typeof phone == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    message = typeof message == 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false;

    if (phone && message) {
        const payload = {
            'From': config.twilio.fromPhone,
            'To': '+1' + phone,
            'Body': message
        };

        const stringPayload = querystring.stringify(payload);

        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };
        const req = https.request(requestDetails, res => {
            // console.log(res, 'this is the request from the twilio send')
            const status = res.statusCode
            if (status == 200 || status == 201) {
                callback(false)
            } else {
                console.log('test')
                console.log(res)
                callback(`status code was ${status}`)
            }
        });

        req.on('error', e => {
            callback(e)
        })

        req.write(stringPayload);

        // This is the point that the request will be sent during the end phase
        req.end()


    } else {
        callback('The parameter given are missing or invalid')
    }
}

helpers.getTemplate = (templateName ,callback) => {
    templateName = typeof templateName == 'string' && templateName.length > 0 ? templateName : false 
    if (templateName) { 
        const templatesDir = path.join(__dirname, '/../templates/');

        fs.readFile(templatesDir + templateName + '.html', 'utf8', (err, str) => {
            if(!err && str.length > 0) {
                callback(false, str)
            } else {
                callback('template could not be found ')
            }
        })
    } else { 
        callback('A valid template name is needed')
    }
}

module.exports = helpers;