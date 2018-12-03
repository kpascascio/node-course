const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');

const workers = {};

workers.gatherAllChecks = () => {
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.debug('Error: Could not read the specified check', check)
                    }
                })
            })
        } else {
            console.debug('Error: Could not find any checks to process')
        }
    });
};

workers.validateCheckData = checkData => {
    // fist start with validation
    checkData = typeof checkData == 'object' && checkData !== null ? checkData : {};
    checkData.id = typeof checkData.id == 'string' && checkData.id.trim().length == 20 ? checkData.id.trim() : false;
    checkData.phone = typeof checkData.phone == 'string' && checkData.phone.trim().length == 10 ? checkData.phone.trim() : false;
    checkData.protocol = typeof checkData.protocol == 'string' && ['http', 'https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
    checkData.url = typeof checkData.url == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
    checkData.method = typeof checkData.method == 'string' && ['post', 'put', 'delete', 'get'].indexOf(checkData.method) > -1 ? checkData.method : false;
    checkData.successCodes = typeof checkData.successCodes == 'object' && checkData.successCodes.length > 0 && checkData.successCodes instanceof Array ? checkData.successCodes : false;
    checkData.timeoutSeconds = typeof checkData.timeoutSeconds == 'number' && checkData.timeoutSeconds % 1 === 0 && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;


    checkData.state = typeof checkData.state == 'string' && ['up', 'dowm'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof checkData.lastChecked == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;

    if (checkData.id &&
        checkData.phone &&
        checkData.protocol &&
        checkData.url &&
        checkData.method &&
        checkData.successCodes &&
        checkData.timeoutSeconds) {

        workers.preformCheck(checkData);
    } else {
        console.debug('Error: one of the checks are not properly formatted.')
    }
};

workers.preformCheck = (checkData) => {
    const checkOutcome = {
        'error': false,
        'responseCode': false
    };

    let outcomeSent = false;

    // TODO: is the value of this an object?
    const parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path;

    const requestDetails = {
        'protocol': checkData.protocol + ':',
        'hostname': hostName,
        'method': checkData.method.toUpperCase(),
        'path': path,
        'timeoutSeconds': checkData.timeoutSeconds * 1000
    };


    const _moduleToUse = checkData.protocol == 'http' ? http : https;

    const req = _moduleToUse.request(requestDetails, res => {

        const status = res.statusCode

        checkOutcome.responseCode = status
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome)
            outcomeSent = true
        }
    });

    req.on('error', (err) => {
        checkOutcome.error = {
            'error': true,
            'value': err
        }
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome)
            outcomeSent = true
        }
    })

    req.on('timeout', (err) => {

        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        }
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome)
            outcomeSent = true
        }
    })

    req.end();
}

workers.processCheckOutcome = (data, outcome) => {
    const state = !outcome.error && outcome.responseCode && data.successCodes.indexOf(outcome.responseCode) > -1 ? 'up' : 'down';

    const alertWarranted = data.lastChecked && data.state !== state ? true : false;

    // Logger
    const timeOfCheck = Date.now();
    workers.log(data, outcome, state, alertWarranted, timeOfCheck)

    const newCheckData = data;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    _data.update('checks', newCheckData.id, newCheckData, (err => {
        if (!err) {
            if (alertWarranted) {
                workers.alertUsersToStatusChange(newCheckData);
            } else {
                console.debug('Check outcome has not changed, no alert needed')
            }
        } else {
            console.debug('Error: trying to save updates to one of the checks')
        }
    }))
}

workers.alertUsersToStatusChange = (checkData) => {
    const msg = 'Alert: Your check for ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' is currently ' + checkData.state;
    helpers.sendTwilioSms(checkData.phone, msg, err => {
        if (!err) {
            console.debug('Success: User was alerted!', msg);
        } else {
            console.debug('Error: Could not send message')
        }
    })
}

workers.log = (data, outcome, state, alertWarranted, timeOfCheck) => {
    const log = {
        'check': data,
        outcome,
        state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };

    const logToString = JSON.stringify(log);

    const logFileName = data.id;

    _logs.append(logFileName, logToString, err => {
        if (!err) {
            console.log('Success: Logging to a file succeeded')
        } else {
            console.log('Error: Logging to a file failed')
        }
    })
}

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60)
}

workers.rotateLogs = () => {
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {
            logs.forEach( log => {
                const logId = log.replace('.log', ''); 
                const newFileId = logId + '-' + Date.now();
                _logs.compress(logId, newFileId, err => {
                    if(!err) {
                        _logs.truncate(logId, err => {
                            if (!err) {
                                console.log('Success: Truncated log file')
                            } else {
                                console.log('Error: Could not truncate the log file')
                            }
                        })
                    } else {
                        console.log('Error: Could not compress the log', err)
                    }
                })
            })
        } else {
            console.log('Error: Could not show logs ')
        }
    });

}

// compresses the logs once per day
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24)
}

workers.init = () => {
    console.error('\x1b[33m%s\x1b[0m', 'Background worker are working');

    // execute all of the checks 
    workers.gatherAllChecks();

    // call the loop so that it continues to run in the background
    workers.loop();

    // Compress all logs immediately 
    workers.rotateLogs();

    // This works like the workers.loop above, but does it for the logs
    workers.logRotationLoop();

}

module.exports = workers;