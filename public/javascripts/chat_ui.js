
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message +'</i>');
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	
	if (message.charAt(0) == '/') {
	
		systemMessage = chatApp.processCommand(message);
		
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}

	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	
	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	// display results of name change
	socket.on('nameResult', function(result) {
		var message;
		
		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	// display results of room join
	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
				console.log('result msg room changed' + result.room);

	});
	
	// display messages 
	socket.on('message', function (message) {
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});
	
	// display list of rooms available, and remember to filter text
	socket.on('rooms', function(rooms) {
		$('#room-list').empty();
		
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		
		// allow click on a room name to change that room
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});
	
	// request list of rooms intermittently
	setInterval(function() {
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	// allow submitting form to send message
	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	});
});
