var express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    dbUrl = "mongodb://localhost:27017/image-search",
    app = express(),
    dbConnection,
    port = Number(process.argv[2]) || 3000;

app.get('/image/:query', function(req, res) {
    // 1. Perform a query to the Azure server (Bing) (requires authentication, add another header)
    // 2. Display results as a JSON object
});

app.get('/logs', function(req, res) {
    // Access the logs collection and fetch 10 latest queries
    // Display them as a JSON object
});


app.use('/', express.static(__dirname + '/public'));

MongoClient.connect(dbUrl, function(err, db) {
    if(err)
        return console.error('Cannot connect to the database');

    app.listen(port, function() {
        console.log('Server is listening on port ' + port);
    })
});