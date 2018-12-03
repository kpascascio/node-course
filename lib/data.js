const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

let lib = {};

lib.baseDir = path.join(__dirname, '/../.data/')


// create a function that writes data to a file

lib.create = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // convert data to a string 
            const stringData = JSON.stringify(data)
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file')
                        }
                    })
                } else {
                    callback('Error writing to the file');
                }
            })
        } else {
            callback('Could not create new file')
        }
    });
}

lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObj(data)
            return callback(false, parsedData);;
        } else {
            return callback(err, data)
        }
        
    })
}

lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err, fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.truncate(fileDescriptor, err => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if (!err) {
                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file ')
                                }
                            })
                        } else {
                            callback('Could not write to the file ')
                        }
                    })
                } else {
                    callback('Could not add to the file')
                }
            })
        } else {
            callback('Error could not open file to update')
        }
    })
}

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('error deleting file')
        }
    })
}

lib.list = (dir, callback) => {
    fs.readdir(lib.baseDir + dir + '/', (err, files) => {
        if(!err && files && files.length > 0) {
            let trimmedFileNames = []; 
            files.forEach(file => {
                trimmedFileNames.push(file.replace('.json', ''))
            })
            callback(false, trimmedFileNames)
        } else {
            callback(err, files)
        }
    })
}
module.exports = lib;