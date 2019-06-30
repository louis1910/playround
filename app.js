var express = require('express');
var app = require('express')();

var server = require('http').Server(app);
var io = require('socket.io')(server);

const shortid = require('shortid');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

var session = require('express-session');

var cookieParser = require('cookie-parser');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ users: [] })
  .write()

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

server.listen(8080);

let count = 0;


app.get('/quiz',(req, res)=>{
	let id = req.cookies.userID;

	var user = db.get('users').find({ userID: id }).value();

	if (!user) {
		res.redirect('/create');
		return;
	}

	res.render('quiz.ejs', {
		user: user.name
	})
})

app.get('/create', (req, res)=>{
	
	res.render('create.ejs',{

	});
});



app.post('/create', (req, res)=>{
	req.body.userID = shortid.generate();

	if(req.body.name === ''){
		res.render('create.ejs');
		return;
	}
	else db.get('users').push(req.body).write();

	res.cookie("userID", req.body.userID);

	res.redirect('/quiz');

});

let ar = [];
let total = [];
let status = 0;

let currentIndex = 0;

io.on('connection', function (socket) {

	socket.on('click user',(data)=>{
		ar.push(data);
		io.sockets.emit('winner', ar[0])
	});

	socket.on('reset', ()=>{
		ar = [];
		io.sockets.emit('re-success', 'Reset Successfully');
	});

	socket.on('new user', (data)=>{

		total.forEach((element)=>{
			if(data === element){ 
				status = 1;
				return;
			}
		})

		if(status == 0){
			total.push(data);
			io.sockets.emit('whenDis', total.indexOf(data));
			status = 0; 
		}

		io.sockets.emit('total', total.length)
	});

	socket.on('disconnected', (data)=>{
		currentIndex = data;
	})

	socket.on('disconnect', ()=>{
		total.splice(currentIndex, 1);
		io.sockets.emit('total', total.length);
	})

});





