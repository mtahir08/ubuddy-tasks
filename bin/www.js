import http from 'http'
import path from 'path'

import app from './../server'

const port = process.env.PORT || 3000

const server = http.createServer(app);

server.listen(port, () => {
    console.log('Express server listening on %d', port);
});
