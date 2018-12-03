const _data = require('./data')
const helpers = require('./helpers');
const handlers = {};
const config = require('./config')

handlers.index = (data, callback) => {
    // callback(undefined, 'test', 'html')
    if (data.method == 'get') {
        helpers.getTemplate('index', (err, str) => {
            if (!err && str) {
                console.log(str)
                callback(200, str, 'html')

            }  else { 
                    callback(500, undefined, 'html')
            }
        }) 
    } else {
        callback(405, undefined, 'html')

    }
}


// API stuff
handlers.users = function (data, cb) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method >= -1)) {
        handlers._users[data.method](data, cb);
    } else {
        cb(405)
    }
};

handlers._users = {};

handlers._users.post = (data, callback) => {
    const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
    const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    const tosAgreement = typeof data.payload.tosAgreement == 'boolean' && data.payload.tosAgreement ? true : false

    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data) => {
            if (err) {
                const hashedPassword = helpers.hash(password)

                if (hashedPassword) {
                    const usrObj = {
                        firstName,
                        lastName,
                        phone,
                        tosAgreement,
                        hashedPassword
                    };

                    _data.create('users', phone, usrObj, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {
                                'Error': 'Could not create user'
                            })
                        }
                    })
                } else {
                    callback(500, {
                        'Error': 'Could not hash password'
                    })
                }
            } else {
                callback(400, {
                    'Error': 'User already exist'
                })
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }


};

handlers._users.get = (data, callback) => {
    const phone = typeof data.queryString.phone == 'string' && data.queryString.phone.length >= 10 ? data.queryString.phone.trim() : false;

    if (phone) {
        const token = typeof data.headers.token == 'string' ? data.headers.token : ''

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, data)
                    } else {
                        callback(404, {
                            'Error': 'nope'
                        })
                    }
                })
            } else {
                callback(403, {
                    'Error': 'Missing token in header or token is invalid'
                })
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
}

handlers._users.put = (data, callback) => {
    const phone = typeof data.payload.phone == 'string' && data.payload.phone.length >= 10 ? data.payload.phone.trim() : false;
    const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    if (phone) {
        if (firstName || lastName || password) {
            const token = typeof data.headers.token == 'string' ? data.headers.token : ''

            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    _data.read('users', phone, (err, userData) => {
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }

                            if (lastName) {
                                userData.lastName = lastName;
                            }

                            if (password) {
                                userData.password = helpers.hash(password);
                            }

                            _data.update('users', phone, userData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {
                                        'Error': 'Could not update user'
                                    })
                                }
                            })

                        } else {
                            // we could use a 404 as the callback, (what I originally thought) but some people prefer not to have a 404 on an put request
                            callback(400, {
                                'Error': 'The specified user does not exist'
                            });
                        }
                    })
                } else {
                    callback(403, {
                        'Error': 'Missing token in header or token is invalid'
                    })
                }
            })
        } else {
            callback(400, {
                'Error': 'Missing updated field'
            })
        }

    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }
}

handlers._users.delete = (data, callback) => {
    const phone = typeof data.queryString.phone == 'string' && data.queryString.phone.length >= 10 ? data.queryString.phone.trim() : false;

    if (phone) {
        const token = typeof data.headers.token == 'string' ? data.headers.token : ''

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checksToDelete = userChecks.length;

                                if (checksToDelete > 0) {
                                    const checksDeleted = 0;
                                    const deletionError = false;

                                    userChecks.forEach(checkId => {
                                        _data.delete('checks', checkId, (err) => {
                                            if (err) {
                                                deletionError = true
                                            }
                                            checksDeleted++
                                            if (checksToDelete == checksDeleted) {
                                                if (!deletionError) {
                                                    callback(200)
                                                } else {
                                                    callback(500, {
                                                        'Error': 'There was a problem deleting checks for user'
                                                    })
                                                }
                                            }
                                        })
                                    })
                                } else {
                                    callback(200)
                                }
                                // callback(200)
                            } else {
                                console.log(err)
                                callback(500, {
                                    'Error': 'Could not delete user'
                                })
                            }
                        })
                    } else {
                        callback(400, {
                            'Error': 'Could not find the specified user'
                        })
                    }
                })
            } else {
                callback(403, {
                    'Error': 'Missing token in header or token is invalid'
                })
            }
        })

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

handlers.token = function (data, cb) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method >= -1)) {
        handlers._tokens[data.method](data, cb);
    } else {
        cb(405)
    }
};

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
    const phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
    const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    if (phone && password) {
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                const hashedPassword = helpers.hash(password)
                if (hashedPassword == userData.hashedPassword) {

                    const tokenId = helpers.createRandomString(20)
                    const expires = Date.now() + 1000 * 60 * 60
                    const tokenObj = {
                        phone,
                        expires,
                        'id': tokenId
                    }

                    _data.create('tokens', tokenId, tokenObj, (err) => {
                        if (!err) {
                            callback(200, tokenObj)
                        } else {
                            callback(500, {
                                'Error': 'Could not create a token'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'Password doesn\'t match'
                    })
                }
            } else {
                callback(400, {
                    'Error': 'Could not find user'
                })
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }
};

handlers._tokens.get = (data, callback) => {
    const tokenId = typeof data.queryString.tokenId == 'string' && data.queryString.tokenId.length >= 20 ? data.queryString.tokenId.trim() : false;

    if (tokenId) {

        _data.read('tokens', tokenId, (err, data) => {
            if (!err && data) {
                callback(200, data)
            } else {
                callback(404)
            }
        })

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

handlers._tokens.put = (data, callback) => {
    const tokenId = typeof data.payload.tokenId == 'string' && data.payload.tokenId.length >= 20 ? data.payload.tokenId.trim() : false;
    const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false;

    if (tokenId && extend) {
        _data.read('tokens', tokenId, (err, tokenData) => {
            if (!err && tokenData) {

                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update('tokens', tokenId, tokenData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {
                                'Error': 'Could not update token\'s expiration'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'The token has already expired'
                    })
                }


            } else {
                callback(400, {
                    'Error': 'Cannot find token'
                })
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }

};

handlers._tokens.delete = (data, callback) => {
    const tokenId = typeof data.queryString.tokenId == 'string' && data.queryString.tokenId.length >= 20 ? data.queryString.tokenId.trim() : false;

    _data.read('tokens', tokenId, (err, data) => {
        if (!err && data) {
            if (tokenId) {
                _data.delete('tokens', tokenId, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, {
                            'Error': 'Could not delete token'
                        })
                    }
                })
            } else {
                callback(400, {
                    'Error': 'Missing required field'
                })
            }
        } else {
            callback(400, {
                'Error': 'Could not find token'
            })
        }
    })
};

handlers._tokens.verifyToken = (token, phone, callback) => {

    _data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

handlers.checks = function (data, cb) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method >= -1)) {
        handlers._checks[data.method](data, cb);
    } else {
        cb(405)
    }
};

handlers._checks = {};

handlers._checks.post = (data, callback) => {
    const protocol = typeof data.payload.protocol == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof data.payload.url == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof data.payload.method == 'string' && ['post', 'put', 'delete', 'get'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof data.payload.successCodes == 'object' && data.payload.successCodes.length > 0 && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
    const timeoutSeconds = typeof data.payload.timeoutSeconds == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof data.headers.token == 'string' ? data.headers.token : '';

        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone

                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        if (userChecks.length < config.maxCheckLimit) {
                            const checkId = helpers.createRandomString(20);

                            const checkObj = {
                                'id': checkId,
                                'phone': userData.phone,
                                url,
                                protocol,
                                method,
                                timeoutSeconds,
                                successCodes
                            }

                            _data.create('checks', checkId, checkObj, (err) => {
                                if (!err) {
                                    userData.checks = userChecks
                                    userData.checks.push(checkId)

                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObj)
                                        } else {
                                            callback(500, {
                                                'Error': 'Could not update user'
                                            })
                                        }
                                    })
                                } else {
                                    callback(500, {
                                        'Error': 'Could not create a new check'
                                    })
                                }
                            })
                        } else {
                            callback(400, {
                                'Error': 'User has reached their check limit'
                            })
                        }
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(403)
            }
        })

    } else {
        // console.log('here')

        callback(400, {
            'Error': 'Missing required fields, or fields are invalid'
        })
    }
};

handlers._checks.get = (data, callback) => {
    const id = typeof data.queryString.id == 'string' && data.queryString.id.length >= 20 ? data.queryString.id.trim() : false;

    if (id) {

        _data.read('checks', id, (err, checksData) => {

            if (!err && checksData) {
                const token = typeof data.headers.token == 'string' ? data.headers.token : ''

                handlers._tokens.verifyToken(token, checksData.phone, (tokenIsValid) => {

                    if (tokenIsValid) {
                        callback(200, checksData)
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(404)
            }
        })

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

handlers._checks.put = (data, callback) => {
    const id = typeof data.payload.id == 'string' && data.payload.id.length >= 20 ? data.payload.id.trim() : false;

    const protocol = typeof data.payload.protocol == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof data.payload.url == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof data.payload.method == 'string' && ['post', 'put', 'delete', 'get'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof data.payload.successCodes == 'object' && data.payload.successCodes.length > 0 && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
    const timeoutSeconds = typeof data.payload.timeoutSeconds == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            const token = typeof data.headers.token == 'string' ? data.headers.token : ''

            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {

                    handlers._tokens.verifyToken(token, checkData.phone, (tokenIsValid) => {
                        if (tokenIsValid) {

                            if (protocol) {
                                checkData.protocol = protocol;
                            }

                            if (url) {
                                checkData.url = url;
                            }

                            if (method) {
                                checkData.method = method;
                            }

                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }

                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {
                                        'Error': 'Could not update check'
                                    })
                                }
                            })

                        } else {
                            callback(403, {
                                'Error': 'Missing token in header or token is invalid'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'Check id does not exist'
                    })
                }
            })
        } else {
            callback(400, {
                'Error': 'Missing updated field'
            })
        }

    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }
};

handlers._checks.delete = (data, callback) => {
    const id = typeof data.queryString.id == 'string' && data.queryString.id.length >= 20 ? data.queryString.id.trim() : false;

    if (id) {

        _data.read('checks', id, (err, checksData) => {
            if (!err && checksData) {
                const token = typeof data.headers.token == 'string' ? data.headers.token : ''

                handlers._tokens.verifyToken(token, checksData.phone, (tokenIsValid) => {
                    if (tokenIsValid) {

                        _data.delete('checks', id, (err) => {
                            if (!err) {
                                _data.read('users', checksData.phone, (err, userData) => {
                                    if (!err && userData) {
                                        const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1)

                                            _data.update('users', checksData.phone, userData, (err) => {
                                                if (!err) {
                                                    callback(200)
                                                } else {
                                                    console.log(err)
                                                    callback(500, {
                                                        'Error': 'Could not delete user'
                                                    })
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                'Error': 'Could not find the check on the users object'
                                            })
                                        }
                                    } else {
                                        callback(500, {
                                            'Error': 'Could not find the specified user who created the check'
                                        })
                                    }
                                })

                            } else {
                                callback(500, {
                                    'Error': 'Could not delete check'
                                })
                            }
                        })
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(400, {
                    'Error': 'The check ID doesn\'t exist'
                })
            }
        })


    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

handlers.ping = function (data, cb) {
    // callback status code and payload 
    cb(200)
};

handlers.notFound = function (data, cb) {
    cb(404)
};

module.exports = handlers;