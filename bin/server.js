var static = require('node-static');

// Create a node-static server instance to serve the './public' folder
var file = new(static.Server)('./public');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        // Serve files!
        file.serve(request, response, function(e, res) {
            if (e) {
                switch(e.status) {
                    case 404: 
                        file.serveFile('/404.html', 404, {}, request, response);
                        break;
                    case 505:
                        file.serveFile('/500.html', 500, {}, request, response);
                        break;
                }
            }
        });
    });
}).listen(process.env.PORT);