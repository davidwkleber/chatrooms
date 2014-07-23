
// create the Chat class-object giving it the socket
var Chat = function(socket) {
	this.socket = socket;
}

// send a message via the class socket 
Chat.prototype.sendMessage = function(room, text) {
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

// change rooms
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	});
};

// Process Commands 
//	join to join a room
// 	nick to change names
Chat.prototype.processCommand = function(command) {

	// split the string into commands
	var words = command.split(' ');
	var commands = words[0]
					.substring(1, words[0].length)
					.toLowerCase();
	var message = false;
	
	switch(commands) {
		// join command changes rooms
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		// nick command sends a message to server as nameAttempt 
		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;
			
		default:
			message = 'Unrecognized command.';
			break;
		}
		
		return message;
	};
	

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	