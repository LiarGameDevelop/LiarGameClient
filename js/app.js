//https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Usage.md.html

class ConnectionInfo {
    // constructor(maxPersonCount, ownerId, roomId, roomName, personCount,userList) {
    //     this.maxPersonCount = maxPersonCount
    //     this.ownerId = ownerId
    //     this.roomId = roomId
    //     this.roomName = roomName
    //     this.personCount = personCount
    //     this.userList=userList
    //     this.user= null
    // }
    constructor(room,user,users,token){
        this.room=room;
        this.user=user;
        this.users=users;
        this.token=token;
    }
}

class Message {
    constructor(message, senderId) {
        this.message = message
        this.senderId = senderId
    }
}

var test=0
var ip=(test===0)? "127.0.0.1":"3.35.70.119"

var stompClient = null
var _gconnectionInfo = null
var senderId = guid()
var users=new Array()
function getConnectionInfo() {
    return _gconnectionInfo
}
const socketEndPoint = `http://${ip}:8080/ws-connection`
console.info("JBJB "+socketEndPoint)

function setConnected(connected) {
    $("#connect").prop("disabled", connected)
    $("#disconnect").prop("disabled", !connected)
    if (connected) {
        $("#conversation").show()
    }
    else {
        $("#conversation").hide()
    }
    $("#greetings").html("")
}

//make room
function requestMakeRoom(param) {
    $.post({
        url: `http://${ip}:8080/room/create`,
        data: JSON.stringify({ "maxPersonCount": 2, "roomName": "my room","ownerName": param?param:"chulsoo", "password":guid()}),
        contentType: "application/json",
        dataType: "JSON",
        success: function (response) {
            console.info("requestMakeRoom response : " + JSON.stringify(response))

            _gconnectionInfo = new ConnectionInfo(response.room,response.user,response.users,response.token)
            /* "token": {
                "grantType": "Bearer",
                "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI5MmUzYTE1ZS05OTZmLTQ4MjItYmNmZS1kNDA2ZTNjN2IxMGEyZjRhNDVjMS1kMTVkLTQyMGQtYjAzYi0yYmM3Njk4N2Y2NzkiLCJhdXRoIjoiUk9MRV9VU0VSIiwiZXhwIjoxNjc0NTU5MDM1fQ.51ljQIuFAMTEUnC6dD5_a9RX3injIHbed5tShItsL54f15a1D1uVWe0jpj0j3lozjJCl4xqISagmh0vPsbrfYw",
                "refreshToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NzQ1NTkwMzV9.Zj7X5hFFHzitX4dicaQQeIFoh558JGuo8qeSE6bDv0M5xG5PKzELCex5T3X26xNHyEhwjgGDZ0an-5LU3eC9yw",
                "accessTokenExpiresIn": 1674559035315
              }*/
            connect(_gconnectionInfo)
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

function enterRoom(param) {
    $.post({
        url: `http://${ip}:8080/room/enter`,
        data: JSON.stringify({ "roomId": param.roomId, "username": param.username ,"password":guid()}),
        contentType: "application/json",
        dataType: "JSON",
        success: function (response) {
            console.info(JSON.stringify(response))
            _gconnectionInfo = new ConnectionInfo(response.room,response.user,response.users,response.token)
            connect(_gconnectionInfo)
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

function leaveRoom(param) {
    $.post({
        url: `http://${ip}:8080/room/leave`,
        //data: param,
        data: JSON.stringify({ "roomId": _gconnectionInfo.room.roomId, "userId": _gconnectionInfo.user.userId }),
        contentType: "application/json",
        dataType: "JSON",
        headers: {
            Authorization: 'Bearer ' + _gconnectionInfo.token.accessToken
        },
        success: function (response) {
            console.info(JSON.stringify(response))
            disconnect()
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

function deleteRoom() {
    $.ajax({
        type: "DELETE",
        url: `http://${ip}:8080/room/delete`,
        //TODO: change delete room param
        data: JSON.stringify({ "roomId": connectionInfo.room.roomId }),
        contentType: "application/json",
        dataType: "JSON",
        success: function (response) {
            disconnect()
            console.info(JSON.stringify(response))
            addChat(message)
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

//get room info
function getRoom(roomId) {
    $.get({
        url: `http://${ip}:8080/room/info?roomId=${roomId}`,
        headers: {
            Authorization: 'Bearer ' + _gconnectionInfo.token.accessToken
        },
        dataType:"JSON",
        success: function (response) {
            //connect()
            console.info(JSON.stringify(response))
            response.userList.forEach(user => {
                users.push(user)
            });
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}


function getCategory(roomId) {
    $.get({
        url: `http://${ip}:8080/game/categories`,
        dataType:"JSON",
        success: function (response) {
            console.info(JSON.stringify(response))
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

function connect(connectionInfo) {
    if (connectionInfo == null) {
        if ($("#roomId").val() == null) {
            console.error("Insert room id")
            alert("Insert room id")
            return
        }
        if ($("#username").val()==null){
            console.error("Insert user name")
            alert("Insert room user name")
            return
        }
        //connectionInfo = new ConnectionInfo(8, null, $("#roomId").val(), "example room")
        //_gconnectionInfo = connectionInfo
    }
    console.info("connecting room : " + JSON.stringify(connectionInfo))

    var socket = new SockJS(socketEndPoint)
    console.log("socket :" + JSON.stringify(socket))
    stompClient = Stomp.over(socket)
    console.log("stompClient :" + JSON.stringify(stompClient))

    stompClient.connect({"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`}, function (frame) {
        setConnected(true)
        console.log('Connected: ' + frame)
        console.info('_gconnectionInfo :' + JSON.stringify(getConnectionInfo()))

        console.info('_gconnectionInfo room id: ' + getConnectionInfo().room.roomId)
        $("#roomId").attr('value',getConnectionInfo().room.roomId)
        var roomid = document.getElementById("roomId")
        roomid.disabled = true

        $("#userId").attr('value',getConnectionInfo().user.userId)

        console.info("room id : "+_gconnectionInfo.room.roomId);
        getRoom(_gconnectionInfo.room.roomId)

        //클라이언트끼리 대화
        stompClient.subscribe(`/topic/room.${getConnectionInfo().room.roomId}.chat`, function (frame) {
            console.info("frame :"+JSON.stringify(frame))
            addChat(frame.body)
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})

        //사람 들어온것 =>웹소켓, STOMP 연결하면 자동으로 날라오는것.
        stompClient.subscribe(`/topic/room.${getConnectionInfo().room.roomId}.login`, function (frame) {
            //addChat(greeting)
            console.info(`Someone entered in room id ${getConnectionInfo().room.roomId}`)
            addChat("entered:"+frame.body);
            frame.body
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})

        //사람 나간것
        stompClient.subscribe(`/topic/room.${getConnectionInfo().room.roomId}.logout`, function (frame) {
            console.info(`Someone left from room id ${getConnectionInfo().room.roomId}`)
            addChat("left:"+frame.body);
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})

        stompClient.subscribe(`/exchange/message.direct/room.${getConnectionInfo().room.roomId}.user.${getConnectionInfo().user.userId}`, function (frame) {
            addChat("[User]:"+frame.body);
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})

        stompClient.subscribe(`/topic/room.${getConnectionInfo().room.roomId}.user.*`, function (frame) {
            addChat("[모두] :"+frame.body);
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})

        stompClient.subscribe(`/exchange/message.error/user.${getConnectionInfo().user.userId}`, function (frame) {
            addChat("[에러] :"+frame.body);
        },{"Authorization": `${_gconnectionInfo.token.grantType} ${_gconnectionInfo.token.accessToken}`})
    })
}
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }
  


function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect()
    }
    setConnected(false)
    console.log("Disconnected")
}

function guid() {
    function s4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function sendGameStart() {
    // var message = new Message($("#text-data").val(), senderId)
    // console.info(`send info : ${JSON.stringify(message)}`)

    // //게임서버용도 추가되어함.
    // stompClient.send(`/publish.messages/${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/private.${_gconnectionInfo.room.roomId} '{method:{startGame}, body:{}}'
    // stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"startGame",
            "body":
                {"round":3,
                "category":["food"],
                "turn":1
            }
            
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendChat() {
    var message = new Message($("#text-data").val(), $("#userId").val())
    //console.info(`send info : ${JSON.stringify(message)}`)
    // //게임서버용도 추가되어함.
    stompClient.send(`/publish/messages.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish.room.system/${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
}

function sendRoundStart() {
    // var message = new Message($("#text-data").val(), senderId)
    // console.info(`send info : ${JSON.stringify(message)}`)

    // //게임서버용도 추가되어함.
    // stompClient.send(`/publish.messages/${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish.room.system/${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"startRound"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendSelectLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"selectLiar"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendOpenKeyword() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openKeyword"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendTurnFinish() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"requestTurnFinished"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendVoteLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"voteLiar",
            "body":{"liar":_gconnectionInfo.room.ownerId}
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendOpenLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openLiar"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendCheckKeywordCorrect() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"checkKeywordCorrect",
            "body":{"keyword":"tteok"}
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendOpenScores() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openScores"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function sendPublishRankings() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"publishRankings"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/private.${_gconnectionInfo.room.roomId}`, {}, JSON.stringify(message))
}

function addChat(message) {
    console.info(`message: ${message} is added`)
    $("#greetings").append("<tr><td>" + message + "</td></tr>")
}
$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault()
    })
    $("#make").click(function () { requestMakeRoom($("#username").val()); })
    $("#connect").click(function () { 
        var param=new Object();
        if($("#roomId").val() && $("#username").val())
        {
            param.roomId = $("#roomId").val()
            param.username = $("#username").val()
            console.info(param);
        }
        else{
            console.error("Insert room id")
            alert("Insert room id")
            return;
        }
        enterRoom(param);
    })
    $("#leave").click(function () { leaveRoom() })
    $("#disconnect").click(function () { disconnect() })
    $("#send").click(function () { sendChat() })
    $("#game_start").click(function () { sendGameStart() })
    $("#round_start").click(function () { sendRoundStart() })
    $("#select_liar").click(function () { sendSelectLiar() })
    $("#open_keyword").click(function () { sendOpenKeyword() })
    $("#request_turn_finish").click(function () { sendTurnFinish() })
    $("#vote_liar").click(function () { sendVoteLiar() })
    $("#open_liar").click(function () { sendOpenLiar() })
    $("#check_keyword_correct").click(function () { sendCheckKeywordCorrect() })
    $("#open_scores").click(function () { sendOpenScores() })
    $("#publish_rankings").click(function () { sendPublishRankings() })
    $("#get_category").click(function () { getCategory() })
})