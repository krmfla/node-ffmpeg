const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');
const express = require('express');

/*
 replicates this sequence of commands:

 ffmpeg -i title.mp4 -qscale:v 1 intermediate1.mpg
 ffmpeg -i source.mp4 -qscale:v 1 intermediate2.mpg
 ffmpeg -i concat:"intermediate1.mpg|intermediate2.mpg" -c copy intermediate_all.mpg
 ffmpeg -i intermediate_all.mpg -qscale:v 2 output.mp4

 Create temporary .mpg files for each video and deletes them after merge is completed.
 These files are created by filename pattern like [videoFilename.ext].temp.mpg [outputFilename.ext].temp.merged.mp4
 */

// var firstFile = "short.mp3";
// var secondFile = "5s.mp3";
// var outPath = "out.mp3";

express()
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .use(function (req, res, next) {
    // print_request(req);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Verify-Token");
    next();
  })
  .use(express.static('public'))
  // === helloworld api ===
  .get('/hello', (req, res, next) => {
    console.log(req, "request hello api");
    res.status(200).send("(๑•̀ㅂ•́)و✧");
    console.log(req, "hello api response");
  })
  .post('/merge', (req, res, next) => {
    var url = req.body.url;
    console.log(url);
    var callback = function() {
      res.status(200).send('ok');
    };
    merge(url, callback);
  })
  .listen(3310, () => {
    console.log(`Listen on 3310`);
    console.log(`process id: ${process.pid}`);
  });

function merge(url, callback) {
  ffmpeg()
    .input('short.mp3')
    .input(url)
    .complexFilter([
      {
          "filter":"amix",
          "options": {
              "inputs": "2",
              "duration": "longest"
          },
          "input": "[0:0][1:0]"
      }
    ])
    // .complexFilter([
    //   '[a][b]amix=2'
    // ])
    .on('start', function(commandLine) {
      console.log("start:" + commandLine);
    })
    .on('end', function() {
      console.log('files have been merged succesfully');
      callback();
    })
    .on('error', function(err) {
      console.log('an error happened: ' + err.message);
    })
    .save('public/out.mp3')
    // .mergeToFile(outPath);
}

