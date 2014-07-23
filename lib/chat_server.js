

var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {

	// start socketio server allowing it to piggyback on existing HTTP server
	io = socketio.listen(server);
	io.set('log level', 1);
	
	// define how user connection will be handled
	io.sockets.on('connection', function (socket) {
	
		// assign user a guest name when they connect
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
	
		// place user in lobby when they connect
		joinRoom(socket, 'Lobby');
		
		// Handle user messages, name change and room change
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		
		// Provide user with list of rooms
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		
		// Define cleanup logic
		handleClientDisconnection(socket, nickNames, namesUsed);
	});
}


// Helper function for assigning Guest Names
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	
	// generate a new name
	var name = 'Guest' + guestNumber;
	
	// Associate name with client connection ID
	nickNames[socket.id] = name;
	
	// tell user the name
	socket.emit('#nameResult', {
		success: true,
		name: name
	});
	
	// note that name is now used
	namesUsed.push(name);
	
	// remeber to incriment counter for names used, helps generte next name
	return guestNumber +1;
}

// Joining Rooms
function joinRoom(socket, room) {

	// user join room
	socket.join(room);
	// note that user is in this room
	currentRoom[socket.id] = room;
	// tell user about entering room
	socket.emit('joinResult', {room: room});
	// and let other users know
	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	
	// get list of users in room
	var usersInRoom = io.sockets.clients(room);
	// if others exist, tell this user who is there
	if (usersInRoom.length < 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ' : ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketID != socket.id) {
				if (index < 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketID];
			}
		}
		usersInRoomSummary += '.';
		// send the summary to the user
		socket.emit('message', {text: usersInRoomSummary});
	}
}
	
	
// handle name request
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	// add listener for name accept events
	socket.on('nameAttempt', function(name) {
		// no names beginning with Guest, since this is the default
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			// if the name is not already in the namesUsed list
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				// remove old name, each user has only one
				delete namesUsed[previousNameIndex];
				// return the success of the name change
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				// and broadcast to all in the room
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + ' is now known as ' + name + '.'
				});
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	});
}

// handle messages
function handleMessageBroadcasting(socket) {
	socket.on('message', function (message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ':' + message.text
		});
	});
}

// handle room creation and joining
function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

// handle user disconnects
function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}
 

				
	