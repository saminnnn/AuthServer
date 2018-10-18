var logger = require('./logger.js');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride=require('method-override');
var serveStatic = require('serve-static');
var path=require('path');
var hat=require('hat');
var mongoose=require('mongoose');
var passwordHash = require('password-hash');

mongoose.connect('mongodb://localhost/Database');

var app = express();
var rack=hat.rack();
var sessionTokens=[]; //List of session tokens

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(bodyParser.json({verify:function(req,res,buf){req.rawBody=buf}}));

app.use(bodyParser.urlencoded({
    verify:function(req,res,buf){req.rawBody=buf},
    extended: true
}));

app.use(methodOverride());

app.use(serveStatic(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    logger.info('GET Request at /');
    res.send('Hello World');
});

//Get the authorization token from header and see if it already exists in the list of session tokens.
app.get('/api/verify', function(req, res){
	if(req.headers.authorization){
        var currentToken=req.headers.authorization;
        var id=findSessionByToken(currentToken, req.connection.address);
        if(id!=-1){
            res.send({status:200, id:id})
            //console.log('Varified token');
            return;
        }
	}
    sendNotFound(res);
});

app.options('/api/verify', function(req, res){
    res.sendStatus(200);
    //console.log('Sent 200 for option check')
});

//Get email and password combination. If combination exitsts in mongodb database, create a new session token, add it to the list of tokens and
//send it to user.
app.post('/api/authenticate', function (req, res) {
    var requestAddress=req.connection.remoteAddress;

    dbPeople.find({email: req.body.email}, (err, person)=>{
        if(person.length>0){
            if(passwordHash.verify(req.body.password, person[0].password)){
                var currentToken=rack();
                res.send({status: 200, id: person[0].id, fullName:'Full Name', email:person[0].email, token: currentToken, group: person[0].type});
                var currentIndex=findSessionById(person[0].id, requestAddress);
                if(currentIndex===-1){
                    sessionTokens.push({token: currentToken, id: person[0].id, address: requestAddress});
                    //console.log('Pushed a new session entry')
                }
                else{
                    sessionTokens[currentIndex].token=currentToken;
                    //console.log('Updated existing session entry');
                }
                return;
            }
        }
        sendNotFound(res);
    });
});

//route to handle user registration
app.listen(5000, function () {
    logger.info('Starting Server at port 5000...');
});

function sendNotFound(res){
    res.send({status: 401});
    console.log('Sent 401');
}

function findSessionById(id, address){
    var sessionTokenLength=sessionTokens.length;
    
    for(var i=0;i<sessionTokenLength;i++){
        if(sessionTokens[i].id===id && sessionTokens[i].address===address){
            return i;
        }
    }
    
    return -1;
}

function findSessionByToken(token, address){
    var sessionTokenLength=sessionTokens.length;

    for(var i=0;i<sessionTokenLength;i++){
        if(sessionTokens[i].token===token && sessionTokens[i].address===address){
            return sessionTokens[i].id;
        }
    }

    return -1;
}