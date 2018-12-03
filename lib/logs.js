const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/')


lib.append = (file, str, callback) => {
    fs.open(lib.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            fs.appendFile(fileDescriptor, str + '\n', (err) => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error: Could not close the file')
                        }
                    })
                } else {
                    callback('Error: Could not append data to the file')
                }
            })
        } else {
            callback('Error: Could not open file for appending')
        }
    })
};

lib.list = (includeCompressLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileNames = [];

            data.forEach(file => {
                if (file.indexOf('.log') > -1) {
                    trimmedFileNames.push(file.replace('.log', ''))
                }

                if (file.indexOf('.gz.b64') > -1 && includeCompressLogs) {
                    trimmedFileNames.push(file.replace('.gz.b64', ''))
                }
            })

            callback(false, trimmedFileNames)
        } else {
            callback('Error: Could not read Log directory')
        }
    })
}

lib.compress = (logId, newId, callback) => {
    const sourceFile = logId + '.log'
    const destinationFile = newId + '.gz.b64';

    fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, fileData) => {
        if (!err && fileData) {

            zlib.gzip(fileData, (err, buffer) => {
                if (!err && buffer) {
                    fs.open(lib.baseDir + destinationFile, 'wx', (err, fileDescriptor) => {
                        if (!err && fileDescriptor) {
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), err => {
                                if (!err) {
                                    fs.close(fileDescriptor, err => {
                                        if (!err) {
                                            callback(false)
                                        } else {
                                            callback(err)
                                        }
                                    })
                                } else {
                                    callback(err)
                                }
                            })
                        } else {
                            callback(err)
                        }
                    })
                } else {
                    callback(err)
                }
            })

        } else {
            callback({
                'message': 'Error: Could not read the file given',
                err
            })
        }
    })
}

lib.decompress = function (fileId, callback) {
    var fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', function (err, str) {
        if (!err && str) {
            // Inflate the data
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function (err, outputBuffer) {
                if (!err && outputBuffer) {
                    // Callback
                    var str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

lib.truncate = function (logId, callback) {
    fs.truncate(lib.baseDir + logId + '.log', 0, function (err) {
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
};



module.exports = lib;