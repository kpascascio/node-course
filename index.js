const server = require('./lib/server');
const workers = require('./lib/workers');

const app = {};
// creates the function
app.init = () => {
    server.init();
    workers.init();
};
// invokes the function
app.init();

module.exports = app;