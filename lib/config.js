let environments = {};

environments.staging = {
    'http': 3000,
    'https': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxCheckLimit': 5,
    'twilio': {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
}

environments.production = {
    'http': 5000,
    'https': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsASecret',
    'maxCheckLimit': 5,
    'twilio': {
        'authToken': '',
        'accountSid': '',
        'fromPhone': ''
    }
}

// process.env.NODE_ENV = 'production'

const currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const checkedEnvironment = typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = checkedEnvironment;