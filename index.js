// 익스프레스서버 설정
var express= require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

//서버 가동
http.listen(port, function () { console.log('Server listening at port %d', port); });
//웹 접속 경로설정
app.use(express.static(__dirname));

// 변수설정
var numClients= 0; var numUsers = 0;

// 추가사용자 함수
function countCharacter(str){
  var i=0,l=str.length,c='',length=0;
  for(;i<l;i++){
    c=str.charCodeAt(i);
    if(0x0000<=c&&c<=0x0019){
      length += 0;
    }else if(0x0020<=c&&c<=0x1FFF){
      length += 1;
    }else if(0x2000<=c&&c<=0xFF60){
      length += 2;
    }else if(0xFF61<=c&&c<=0xFF9F){
      length += 1;
    }else if(0xFFA0<=c){
      length += 2;
    }
  }
  return length;
}
function fillzero(obj, len) { obj= '          '+obj; return obj.substring(countCharacter(obj)-len); }

//클라이언트가 최초 접속시작
io.on('connection', function (socket) {

  //클라이언트 접속시 초기화 루틴
  { var addedUser = false;
    numClients ++;
    console.log('Client    connected : ' + fillzero((socket.username || "anomymous"),10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );
    socket.emit('connected', {
    userid : socket.id,
    numUsers : numClients
    });
  }

  //디버깅 함수
  socket.on('check',function() {console.log("Check Complete");});

  // 클라이언트에서 New message패킷이 온경우
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
    console.log((socket.username || "anomymous") +'['+ socket.id +']' + " says " + data);
  });

  // 클라이언트에서 New user패킷이 온경우
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    console.log('Client       Logged : ' + fillzero(socket.username,10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );

    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // 클라이언트가 접속을 끊은경우
  socket.on('disconnect', function () {
    numClients--;

    if (addedUser) {
      --numUsers;
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }

    console.log('Client Disconnected : ' + fillzero((socket.username || "anomymous"),10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );

  });

});
