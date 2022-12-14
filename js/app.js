class ConnectionInfo {
    constructor(maxPersonCount, ownerId, roomId, roomName, personCount,userList) {
        this.maxPersonCount = maxPersonCount
        this.ownerId = ownerId
        this.roomId = roomId
        this.roomName = roomName
        this.personCount = personCount
        this.userList=userList
        this.user= null
    }
}
class Message {
    constructor(message, senderId) {
        this.message = message
        this.senderId = senderId
    }
}

var test=0
var ip=(test===1)? "127.0.0.1":"43.201.45.154"

var stompClient = null
var _gconnectionInfo = null
var senderId = guid()
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
        url: `http://${ip}:8080/room`,
        data: JSON.stringify({ "maxPersonCount": 5, "roomName": "my room","ownerName": param?param:"chulsoo"}),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.info("requestMakeRoom : " + JSON.stringify(response))

            _gconnectionInfo = new ConnectionInfo(response.maxPersonCount, response.ownerId, response.roomId, response.roomName, response.personCount,response.userList)
            _gconnectionInfo.user={"userId":response.userList[0].userId,"username":response.userList[0].username};
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
        data: JSON.stringify({ "roomId": param.roomId, "username": param.username }),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.info(JSON.stringify(response))
            _gconnectionInfo = new ConnectionInfo()
            _gconnectionInfo.maxPersonCount = response.maxPersonCount;
            _gconnectionInfo.ownerId = response.ownerId;
            _gconnectionInfo.roomName = response.roomName;
            _gconnectionInfo.roomId = response.roomId;
            _gconnectionInfo.personCount = response.personCount;
            _gconnectionInfo.user = response.user;
            _gconnectionInfo.userList = response.userList;
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
        data: JSON.stringify({ "roomId": param.roomId, "senderId": param.senderId }),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.info(JSON.stringify(response))
            connectionInfo = new ConnectionInfo(response)
            connect(connectionInfo)
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

function deleteRoom() {
    $.ajax({
        type: "DELETE",
        url: `http://${ip}:8080/room`,
        //TODO: change delete room param
        data: JSON.stringify({ "roomId": connectionInfo.roomId, "ownerId": connectionInfo.senderId }),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            disconnect()
            console.info(JSON.stringify(response))
        },
        error: function (response) {
            console.info(JSON.stringify(response))
        }
    })
}

//get room info
function getRooms(roomId) {
    $.get({
        url: `http://${ip}:8080/room?roomId=${roomId}`,
        //data: param,
        success: function (response) {
            //connect()
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

    stompClient.connect({"username":connectionInfo.username,"roomId":connectionInfo.roomId}, function (frame) {
        setConnected(true)
        console.log('Connected: ' + frame)
        console.info('_gconnectionInfo :' + JSON.stringify(getConnectionInfo()))

        console.info('_gconnectionInfo room id: ' + getConnectionInfo().roomId)
        $("#roomId").attr('value',getConnectionInfo().roomId)
        var roomid = document.getElementById("roomId")
        roomid.disabled = true

        $("#userId").attr('value',getConnectionInfo().user.userId)

        //????????????????????? ??????
        stompClient.subscribe(`/subscribe/room/${getConnectionInfo().roomId}/chat`, function (frame) {
            console.info("frame :"+JSON.stringify(frame))
            addChat(frame.body)
        })

        //?????? ???????????? =>?????????, STOMP ???????????? ???????????? ???????????????.
        stompClient.subscribe(`/subscribe/room.login/${getConnectionInfo().roomId}`, function (frame) {
            //addChat(greeting)
            console.info(`Someone entered in room id ${getConnectionInfo().roomId}`)
            addChat("entered:"+frame.body);
        })

        //?????? ?????????
        stompClient.subscribe(`/subscribe/room.logout/${getConnectionInfo().roomId}`, function (frame) {
            console.info(`Someone left from room id ${getConnectionInfo().roomId}`)
            addChat("left:"+frame.body);
        })

        //????????? ??????(?????? private/roomId??? ????????? ??? ??????)
        stompClient.subscribe(`/subscribe/system/private/${getConnectionInfo().user.userId}`, function (frame) {
            addChat("[User]:"+frame.body);
        })

        //??????????????? ?????? =>??????:????????? ????????????, ????????????(???????????? ??????...)
        stompClient.subscribe(`/subscribe/system/private/${getConnectionInfo().roomId}`, function (frame) {
            addChat("[??????]:"+frame.body);
        })

        stompClient.subscribe(`/subscribe/system/public/${getConnectionInfo().roomId}`, function (frame) {
            addChat("[??????] :"+frame.body);
        })
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

    // //?????????????????? ???????????????.
    // stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //????????? ???????????????
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
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
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendChat() {
    var message = new Message($("#text-data").val(), senderId)
    console.info(`send info : ${JSON.stringify(message)}`)

    // //?????????????????? ???????????????.
    stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //????????? ???????????????
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
}

function sendRoundStart() {
    // var message = new Message($("#text-data").val(), senderId)
    // console.info(`send info : ${JSON.stringify(message)}`)

    // //?????????????????? ???????????????.
    // stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //????????? ???????????????
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"startRound"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendSelectLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"selectLiar"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendOpenKeyword() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openKeyword"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendTurnFinish() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"requestTurnFinished"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/public/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendVoteLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"voteLiar",
            "body":{"liar":_gconnectionInfo.ownerId}
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendOpenLiar() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openLiar"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendOpenScores() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"openScores"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendPublishRankings() {
    var message = {
        "senderId":_gconnectionInfo.user.userId,
        "message":{
            "method":"publishRankings"
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
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
    $("#disconnect").click(function () { disconnect() })
    $("#send").click(function () { sendChat() })
    $("#game_start").click(function () { sendGameStart() })
    $("#round_start").click(function () { sendRoundStart() })
    $("#select_liar").click(function () { sendSelectLiar() })
    $("#open_keyword").click(function () { sendOpenKeyword() })
    $("#request_turn_finish").click(function () { sendTurnFinish() })
    $("#vote_liar").click(function () { sendVoteLiar() })
    $("#open_liar").click(function () { sendOpenLiar() })
    //$("#check_keyword_correct").click(function () { sendOpenKeyword() })
    $("#open_scores").click(function () { sendOpenScores() })
    $("#publish_rankings").click(function () { sendPublishRankings() })
})