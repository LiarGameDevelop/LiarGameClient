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
    constructor(message, senderId, roomId) {
        this.message = message
        this.senderId = senderId
        this.roomId = roomId
    }
}

var stompClient = null
var _gconnectionInfo = null
var senderId = guid()
function getConnectionInfo() {
    return _gconnectionInfo
}
const socketEndPoint = 'http://13.125.250.0:8080/ws-connection'

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
        url: 'http://13.125.250.0:8080/room',
        //data: param,
        data: JSON.stringify({ "maxPersonCount": 5, "roomName": "my room", "senderId": senderId }),
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
        url: 'http://13.125.250.0:8080/room/enter',
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
        url: 'http://13.125.250.0:8080/room/enter',
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

function deleteRoom() {
    $.ajax({
        type: "DELETE",
        url: 'http://13.125.250.0:8080/room',
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
        url: `http://13.125.250.0:8080/room?roomId=${roomId}`,
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

    //동작안함.
    stompClient.connect({}, function (frame) {
        setConnected(true)
        console.log('Connected: ' + frame)
        console.info('_gconnectionInfo :' + JSON.stringify(getConnectionInfo()))

        console.info('_gconnectionInfo room id: ' + getConnectionInfo().roomId)

        stompClient.subscribe(`/subscribe/room/${getConnectionInfo().roomId}`, function (greeting) {
            addChat(greeting)
        })
    })
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

function sendName() {
    var message = new Message($("#text-data").val(), senderId, _gconnectionInfo.roomId)
    console.info(`send info : ${JSON.stringify(message)}`)

    stompClient.send('/publish/messages', {}, JSON.stringify(message))
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
    $("#connect").click(function () { connect() })
    $("#disconnect").click(function () { disconnect() })
    $("#send").click(function () { sendName() })
})