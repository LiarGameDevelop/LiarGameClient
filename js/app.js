class ConnectionInfo {
    constructor(maxPersonCount, ownerId, roomId, roomName, personCount) {
        this.maxPersonCount = maxPersonCount
        this.ownerId = ownerId
        this.roomId = roomId
        this.roomName = roomName
        this.personCount = personCount
    }
}
class Message {
    constructor(message, senderId) {
        this.message = message
        this.senderId = senderId
    }
}

var test=1
var ip=(test===0)? "127.0.0.1":"13.125.250.0"

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
        //data: param,
        data: JSON.stringify({ "maxPersonCount": 5, "roomName": "my room","ownerName":"chulsoo"}),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.info("requestMakeRoom : " + JSON.stringify(response))

            _gconnectionInfo = new ConnectionInfo(response.maxPersonCount, response.ownerId, response.roomId, response.roomName, response.personCount)
            $("#roomId").text(response.roomId)
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
        //data: param,
        data: { "roomId": param.roomId, "senderId": param.senderId },
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.info(JSON.stringify(response))
            connectionInfo = new ConnectionInfo(response)
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
        data: { "roomId": param.roomId, "senderId": param.senderId },
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
        data: { "roomId": connectionInfo.roomId, "ownerId": connectionInfo.senderId },
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
        connectionInfo = new ConnectionInfo(8, guid(), $("#roomId").val(), "example room")
        _gconnectionInfo = connectionInfo
    }
    console.info("connecting room : " + JSON.stringify(connectionInfo))

    var socket = new SockJS(socketEndPoint)
    console.log("socket :" + JSON.stringify(socket))
    stompClient = Stomp.over(socket)
    console.log("stompClient :" + JSON.stringify(stompClient))

    stompClient.connect({"username":"chulsoo","roomId":connectionInfo.roomId}, function (frame) {
        setConnected(true)
        console.log('Connected: ' + frame)
        console.info('_gconnectionInfo :' + JSON.stringify(getConnectionInfo()))

        console.info('_gconnectionInfo room id: ' + getConnectionInfo().roomId)

        //클라이언트끼리 대화
        stompClient.subscribe(`/subscribe/room/${getConnectionInfo().roomId}/chat`, function (frame) {
            addChat(frame.body)
        })

        //사람 들어온것 =>웹소켓, STOMP 연결하면 자동으로 날라오는것.
        stompClient.subscribe(`/subscribe/room.login/${getConnectionInfo().roomId}`, function (frame) {
            //addChat(greeting)
            console.info(`Someone entered in room id ${getConnectionInfo().roomId}`)
            addChat("entered:"+frame.body);
        })

        //사람 나간것
        stompClient.subscribe(`/subscribe/room.logout/${getConnectionInfo().roomId}`, function (frame) {
            console.info(`Someone left from room id ${getConnectionInfo().roomId}`)
            addChat("left:"+frame.body);
        })

        //게임서버랑 통신 =>방장:게임을 시작하고, 게임설정(카테고리 설정...)
        stompClient.subscribe(`/subscribe/system/private/${getConnectionInfo().roomId}`, function (frame) {
            addChat("gameserver :"+frame.body);
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

    // //게임서버용도 추가되어함.
    // stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
    var message = {
        "senderId":_gconnectionInfo.ownerId,
        "message":{
            "method":"startGame",
            "body":
                JSON.stringify({"round":3,
                "category":["food"],
                "turn":1
            })
            
        },
        "uuid":guid()
    }
    stompClient.send(`/publish/system/private/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
}

function sendChat() {
    var message = new Message($("#text-data").val(), senderId)
    console.info(`send info : ${JSON.stringify(message)}`)

    // //게임서버용도 추가되어함.
    stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
}

function sendRoundStart() {
    // var message = new Message($("#text-data").val(), senderId)
    // console.info(`send info : ${JSON.stringify(message)}`)

    // //게임서버용도 추가되어함.
    // stompClient.send(`/publish/messages/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))


    // //서버에 요청하는것
    // // ws://publish/room.system '{method:{startGame}, body:{}}'
    // // ws://publish/room.system/{roomId}/startGame '{body:{}}'
    // stompClient.send(`/publish/room.system/${_gconnectionInfo.roomId}`, {}, JSON.stringify(message))
    // //POST API
    // //http://liargame/methodA '{JSON format}'
    var message = {
        "senderId":_gconnectionInfo.ownerId,
        "message":{
            "method":"startRound",
            "body":"{}"
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
    $("#make").click(function () { requestMakeRoom(); })
    $("#connect").click(function () { 
        var param;
        if($("#roomId").val())
            param.roomId = $("#roomId").val()
        else{
            console.error("Insert room id")
            alert("Insert room id")
            return;
        }
        param.senderId = guid()
        //enterRoom(param);
        connect()
    })
    $("#disconnect").click(function () { disconnect() })
    $("#send").click(function () { sendChat() })
    $("#game_start").click(function () { sendGameStart() })
    $("#round_start").click(function () { sendRoundStart() })
})