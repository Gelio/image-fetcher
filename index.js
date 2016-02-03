var express = require('express'),
    http = require('http'),
    https = require('https'),
    MongoClient = require('mongodb').MongoClient,
    dbUrl = "mongodb://localhost:27017/image-search",
    app = express(),
    dbConnection,
    port = Number(process.argv[2]) || 3000;

app.get('/image/:query', function(req, res) {
    // 1. Perform a query to the Azure server (Bing) (requires authentication, add another header)
    // 2. Display results as a JSON object
    // 3. Add a new entry to the log with current date and query parameters
    // req.params.query, req.query.offset (optional)

    var offset = Number(req.query.offset);
    var requestOptions = {
        host: 'api.datamarket.azure.com',
        port: 443,
        path: '/Bing/Search/v1/Image?Query=%27' + encodeURI(req.params.query) + '%27&$format=json',
        method: 'GET',
        auth: 'Boomdi3kDhgcaR7r1gPBW63iUd4x2kXUkUXvlAYtCwQ=:Boomdi3kDhgcaR7r1gPBW63iUd4x2kXUkUXvlAYtCwQ='
    };

    if(offset)
        requestOptions.path += '&$skip=' + (offset > 0 ? offset : 0);

    console.log('starting request', requestOptions);

    var apiRequest = https.request(requestOptions, function(apiRes) {
        var jsonString = "";
        apiRes.setEncoding('utf8');
        apiRes.on('data', function(chunk) {
            jsonString += chunk;
        });

        apiRes.on('end', function() {
            console.log(jsonString);
            var responseObject;
            try {
                responseObject = JSON.parse(jsonString);
            } catch(error) {
                console.error('Cannot convert response to JSON object');
                return res.json({error: 'response from an external API cannot be converted to JSON'});
            }

            responseObject = responseObject.d.results;
            res.json(responseObject.map(function(image) {
                return {title: image.Title,
                    url: image.MediaUrl,
                    width: image.Width,
                    height: image.Height,
                    fileSize: image.fileSize,
                    thumbnail: image.Thumbnail.MediaUrl
                };
            }));

            // Add that to the logs
            dbConnection.collection('logs').insertOne({
                query: req.params.query,
                offset: offset || 0,
                date: new Date()
            });
        });
    });

    apiRequest.on('error', function(error) {
        console.error('An error connecting to the external API', error);
        res.json({error: 'cannot connect to an external API'});
    });

    apiRequest.end();
});

app.get('/logs', function(req, res) {
    // Access the logs collection and fetch 10 latest queries (sort by _id)
    // Display them as a JSON object

    dbConnection.collection('logs').find().sort({_id:-1}).limit(10).toArray(function(err, docs) {
        if(err) {
            res.json({error: 'cannot connect to the database and fetch logs'});
            return console.error('Cannot fetch the logs from the database');
        }

        res.json(docs.map(function(log) {
            return {query: log.query, offset: log.offset, date: log.date};
        }));
    })
});


app.use('/', express.static(__dirname + '/public'));

MongoClient.connect(dbUrl, function(err, db) {
    if(err)
        return console.error('Cannot connect to the database');

    dbConnection = db;

    app.listen(port, function() {
        console.log('Server is listening on port ' + port);
    })
});