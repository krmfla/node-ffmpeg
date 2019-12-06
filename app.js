const bodyParser = require('body-parser');
const express = require('express');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const multer  =   require('multer');
const formidable = require('formidable');
const fs = require('fs');
const PORT = process.env.PORT || 3310;

var count = 0;

ffmpeg.setFfmpegPath(ffmpegPath);

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './upload');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now());
    }
});

var upload = multer({ storage : storage}).single('filetoupload');
var upload = multer({ storage : storage});

express()
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json())
    .use(function (req, res, next) {
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
        var callback = function() {
            res.status(200).send('ok');
        };
        merge(url, callback);
    })
    .post('/mix', (req, res, next) => {
        count = 0;
        var learn = req.body.learn;
        var voice = req.body.voice;
        var callback = function() {
            res.status(200).send('ok');
        };
        get_source_learn(learn, callback);
        get_source_voice(voice, callback);
    })
    .post('/upload/learn',function(req,res){
        upload(req,res,function(err) {
            if(err) {
                return res.end("Error uploading file.");
            }
            res.end("File is uploaded");
        });
    })
    .post('/upload', upload.single('logo'), function(req, res, next){
        console.log('get upload');
        var file = req.body;
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, file) {
        console.log('file parse');
        var oldpath = file.filetoupload.path;
        var newpath = './upload/' + file.filetoupload.name;
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.write('File uploaded and moved!');
            res.end("File is uploaded~");
        });
        });
        console.log('upload complete');
        res.end("File is uploaded");
    })
    .listen(PORT, () => {
        console.log(`Listen on 3310`);
        console.log(`process id: ${process.pid}`);
        console.log(typeof ffmpeg);
        // merge();
    });

function get_source_learn(source, callback) {
    var url = `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=&client=tw-ob&q='${source}'&tl=zh-tw`;
    ffmpeg()
        .input(url)
        .audioFilters('volume=3.5')
        .audioFilters('atempo=1')
        .addOption(['-af', 'asetrate=30000*0.9,aresample=30000'])
        .on('start', function(commandLine) {
            console.log("get_source start:" + commandLine);
        })
        .on('end', function() {
            count += 1;
            console.log(`download ${source} succesfully`);
            if (count === 2) {
                mixin(callback);
            }
        })
        .on('error', function(err) {
            console.log('an error happened: ' + err.message);
        })
        .save('learn.mp3')
}

function get_source_voice(source, callback) {
    var url = `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=&client=tw-ob&q='${source}'&tl=zh-tw`;
    ffmpeg()
        // .input('voice3.mp3')
        .input(url)
        .audioFilters('volume=3')
        .audioFilters('atempo=1')
        .addOption(['-af', 'asetrate=30000*0.9,aresample=30000'])
        .on('start', function(commandLine) {
            console.log("get_source start:" + commandLine);
        })
        .on('end', function() {
        count += 1;
            console.log(`download ${source} succesfully`);
        if (count === 2) {
            mixin(callback);
        }
        })
        .on('error', function(err) {
            console.log('an error happened: ' + err.message);
        })
        .save('voice.mp3')
}

function merge(url, callback) {
    var wmimage = 'step_1.png';
    var url = 'ma.mp3';

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
        .addOption(['-ignore_loop 0', '-i '+ wmimage + '','-filter_complex [0:v][1:v]overlay=10:10:shortest=1:enable="between(t,2,5)"'])
        .on('start', function(commandLine) {
            console.log("start:" + commandLine);
        })
        .on('end', function() {
            console.log('files have been merged succesfully');
            if (typeof callback === 'function') {
                callback();
            }
        })
        .on('error', function(err) {
            console.log('an error happened: ' + err.message);
        })
        .save('out.mp4')
}

function mixin(callback) {
    console.log(typeof ffmpeg);
    const command = ffmpeg();
    var str = [];
    str[0] = '-c:v';
    str[1] = 'copy';

    command
        .input('soundtrack.mp4')
        .input('learn.mp3')
        .input('voice.mp3')
        .input('voice.mp3')
        .input('voice.mp3')
        .complexFilter([
            '[1]adelay=9000|9000[aud1]',
            '[2]adelay=10600|10600[aud2]',
            '[3]adelay=14500|14500[aud3]',
            '[4]adelay=22300|22300[aud4]',
            '[0][aud1][aud2][aud3][aud4]amix=5'
        ])
        .addOption(str)
        .on('start', function(commandLine) {
            console.log("start:" + commandLine);
        })
        .on('end', function() {
            console.log('files have been merged succesfully');
            if (typeof callback === 'function') {
                callback();
            }
        })
        .on('error', function(err) {
            console.log('an error happened: ' + err.message);
        })
        .save('public/out.mp3')
}