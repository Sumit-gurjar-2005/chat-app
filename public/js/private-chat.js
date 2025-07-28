const socket = io();
const messagesList = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('messageInput');
const chatHeader = document.getElementById('chat-header');

const urlParams = new URLSearchParams(window.location.search);
const friendId = urlParams.get('friendId');

let currentUser = null;

// Fetch current user
async function getCurrentUser() {
  const res = await fetch(window.location.origin + '/auth/current-user');
  const data = await res.json();
  if (data.success) {
    currentUser = data.user;
    setupPrivateChat();
  } else {
    alert("You must be logged in.");
    window.location.href = '/login';
  }
}

// Setup private chat logic
function setupPrivateChat() {
  socket.emit('join-private-room', { userId: currentUser._id, friendId });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text === '') return;

    socket.emit('private-message', {
      senderId: currentUser._id,
      receiverId: friendId,
      text
    });

    appendMessage({ text, senderId: currentUser._id }, true);
    input.value = '';
  });

  socket.on('private-message', (msg) => {
    if (msg.senderId === friendId) {
      appendMessage(msg, false);
    }
  });
}

// Display message in UI
function appendMessage(msg, isSelf) {
  const li = document.createElement('li');
  li.classList.add('message');
  if (isSelf) li.classList.add('self');
  li.innerText = msg.text;
  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

getCurrentUser();
