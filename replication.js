var PouchDB = require('pouchdb'),
    LevelDownPouchDB = PouchDB.defaults({
        db: require('leveldown-mobile')
    });

var startRemote = function () {
    var express = require('express'),
        app = express(),
        remoteDB,
        counter = 0;

    app.use('/db', require('express-pouchdb')(LevelDownPouchDB, {mode: 'minimumForPouchDB'}));
    remoteDB = new LevelDownPouchDB('remoteDB');
    app.listen(3000);

    setInterval(function () {
        counter++;
        if (counter % 2) {
            var doc = {
                "_id": "TestDoc " + counter + ": " + (new Date().toString()),
                "content": "Data" + counter
            };
            remoteDB.put(doc)
                .then(function () {
                    console.log("Remote inserted TestDoc " + counter);
                })
                .catch(function (err) {
                    console.log("Error while adding data: " + err);
                });
        } else {
            var attachment = new Buffer("Attachment" + counter);
            remoteDB.putAttachment("TestAttachment " + counter + ": " + (new Date().toString()), 'att.txt', attachment, 'text/plain')
                .then(function (result) {
                    console.log("Remote inserted TestAttachment " + counter);
                }).catch(function (err) {
                console.log("Error while adding attachment: " + err);
            });
        }
    }, 4000);
};

var startLocal = function () {
    var localDB = new LevelDownPouchDB('localDB'),
        remoteDB = new PouchDB("http://localhost:3000/db/remoteDB");

    remoteDB.replicate.to(localDB, {
        live: true
    })
        .on('paused', function (err) {
            console.log("paused: " + err);
        })
        .on('active', function () {
            console.log("resumed");
        })
        .on('denied', function (err) {
            console.log("denied: " + err);
        })
        .on('complete', function (info) {
            console.log("completed: " + info);
        })
        .on('error', function (err) {
            console.log("error: " + err);
        })
        .on('change', function (info) {
            console.log("change: " + info.docs[0]._id);
        });
};

startRemote();
startLocal();