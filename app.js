var logger = require('./logger.js');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride=require('method-override');
var serveStatic = require('serve-static');
var path=require('path');
var hat=require('hat');
var mongoose=require('mongoose');
var passwordHash = require('password-hash');
var multer=require('multer');

mongoose.connect('mongodb://localhost/School');
var dbSessionClasses={class: Number, section: String, teacher: String};
var dbDialyRoutine={period: Number, start: String, duration: String, classes: [dbSessionClasses]};
var dbWeeklyRoutine=mongoose.model('weeklyRoutine',{index: Number, day: String, routine: dbDialyRoutine});
var dbPeople=mongoose.model('users', {fullName: String, email: String, password: String, type: String, id: String});
var dbEmployees=mongoose.model('employees', {id: Number, email: String, type: String, name: String, birth: String, joined: String, male: Boolean, married: Boolean, prAddress: String, paAddress: String, phone: String, nid: String, image: Buffer});
var dbStudents=mongoose.model('students', {name: String, fName: String, mName: String, class: Number, section: String, roll: Number, birthday: String, male: Boolean, prAddress: String, paAddress: String, phone: String, email: String, image:Buffer});
var dbTuitionFee=mongoose.model('fees',{month: 'String', amount: Number, class: Number, section: String, roll: Number, receiver: String, date: String});

var app = express();
var rack=hat.rack();
var sessionTokens=[];
var upload=multer({storage: multer.memoryStorage()});

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

app.get('/login', function (req, res) {
    var html=getLogin(req);
    res.send(html);
});

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

app.post('/api/authenticate', function (req, res) {
    var requestAddress=req.connection.remoteAddress;

    dbPeople.find({email: req.body.email}, (err, person)=>{
        if(person.length>0){
            if(passwordHash.verify(req.body.password, person[0].password)){
                var currentToken=rack();
                res.send({status: 200, id: person[0].id, fullName:'Full Name', email:person[0].email, token: currentToken, group: person[0].type});
                var currentIndex=findSessionById(person[0].id, requestAddress);
                if(currentIndex===-1){
                    //console.log(typeof(person[0].id));
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

app.post('/newStudent',upload.single('image'), function(req,res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        var reqBody=req.body;
        new dbStudents({name: reqBody.name, fName: reqBody.fName, mName: reqBody.mName, class: reqBody.class, section: reqBody.section, roll: reqBody.roll, birthday: reqBody.birthday, male: reqBody.male, prAddress: reqBody.prAddress, paAddress: reqBody.paAddress, phone: reqBody.phone, email: reqBody.email, image:req.file.buffer}).save();
        res.sendStatus(200);
    }
    else sendNotFound(res);
});

app.post('/newEmployee',upload.single('image'), function(req,res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        var reqBody=req.body;
        new dbEmployees({nid:reqBody.nid, id:reqBody.eid, name: reqBody.name, type: reqBody.type, id: reqBody.id, birthday: reqBody.birthday, male: reqBody.male, prAddress: reqBody.prAddress, paAddress: reqBody.paAddress, phone: reqBody.phone, email: reqBody.email, married: reqBody.married, joined: reqBody.joined, image:req.file.buffer}).save();
        new dbPeople({id:reqBody.eid, email:reqBody.email, password:passwordHash.generate(reqBody.password)}).save();
        res.sendStatus(200);
    }
    else sendNotFound(res);
});

app.post('/getStaff', function(req,res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        if(req.body.teacherOnly){
            dbEmployees.find({type:'teacher'}, (err,result)=> res.send(result));
        }
        else{
            dbEmployees.find({}, (err,result)=> res.send(result));
        }  
    }
    else sendNotFound(res);
});

app.post('/getRoutine', function(req,res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        dbSessionClasses.find({}, (err, result)=>res.send(result));
    }
    else sendNotFound(res);
});

app.post('/newFee', function(req,res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        new dbTuitionFee(req.body.feeInfo).save();
    }
    else sendNotFound(res);
});

app.post('/addClass', function(req, res){
    if(sessionTokens[findSessionById(req.body.id, req.connection.remoteAddress)].token===req.body.token){
        new dbSessionClasses(req.class).save();
    }
    else sendNotFound(res);
});

//route to handle user registration
app.listen(5000, function () {
    logger.info('Starting Server at port 5000...');
});

function getLogin(req){
    return '<html><body><form action="/login" method="post"><input type="text" name="username"><input type="submit" value="Submit"></form></body>'
}

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