class ConnectionInfo{
    constructor(senderId,roomId,personCount){
        this.senderId=senderId
        this.roomId=roomId
        this.personCount = personCount
    }
}
class Message{
    constructor(message, senderId, roomId){
        this.message=message
        this.senderId=senderId
        this.roomId=roomId
    }
}

var stompClient = null
var connectionInfo = null
const socketEndPoint = 'http://127.0.0.1:8080/ws-connection'

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

function makeRoom(request) {
    fetch('/localhost:8080/room',
    {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: request
    })
}

function connect() {
    var socket = new SockJS(socketEndPoint)
    console.log("socket :" +JSON.stringify(socket))
    stompClient = Stomp.over(socket)
    console.log("stompClient :" +JSON.stringify(stompClient))
    
    stompClient.connect({}, function (frame) { //TODO: 방만들기
        setConnected(true)
        console.log('Connected: ' + frame)
        connectionInfo = new ConnectionInfo(guid(),$("#roomId").val(),1)
        console.info("connected room : "+$("#roomId").val())
        stompClient.subscribe(`/subscribe/room/${connectionInfo.roomId}`, function (greeting) { //room 뒤에 uuid를 가지고 uuid에 전달된 메세지만 받을 수 있다.
            //addChat(JSON.parse(greeting.body).content)
            addChat(greeting)
        })
    })
}

function makeRoom() {
    var socket = new SockJS(socketEndPoint)
    console.log("socket :" +JSON.stringify(socket))
    stompClient = Stomp.over(socket)
    console.log("stompClient :" +JSON.stringify(stompClient))
    stompClient.connect({}, function (frame) { //TODO: 방만들기
        setConnected(true)
        console.log('Connected: ' + frame)
        connectionInfo = new ConnectionInfo(guid(),guid(),1)
        console.info(`connected room id ${connectionInfo.ro}`)
        stompClient.subscribe(`/subscribe/room/${connectionInfo.roomId}`, function (greeting) { //room 뒤에 uuid를 가지고 uuid에 전달된 메세지만 받을 수 있다.
            //addChat(JSON.parse(greeting.body).content)
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
    var message = new Message($("#name").val(),connectionInfo.senderId,connectionInfo.roomId)
    console.info(`send info : ${message}` )

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
    $( "#make" ).click(function() { makeRoom() })
    $( "#connect" ).click(function() { connect() })
    $( "#disconnect" ).click(function() { disconnect() })
    $( "#send" ).click(function() { sendName() })
})