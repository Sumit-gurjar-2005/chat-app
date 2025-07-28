const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const friendId = urlParams.get("friendId");
let currentUser;

const chatHeader = document.getElementById("chat-header");
const messagesContainer = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("messageInput");
const mediaInput = document.getElementById("mediaInput");

// Get current user
fetch("/auth/current-user")
  .then((res) => res.json())
  .then((data) => {
    if (!data.success) {
      alert("Please log in first.");
      window.location.href = "/login";
    } else {
      currentUser = data.user;
      getFriendName();
      loadMessages();
    }
  });

// Get friend name to show in header
function getFriendName() {
  fetch(`/friend/user/${friendId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user) {
        chatHeader.innerText = `Chat with ${data.user.username}`;
      }
    });
}

// Load message history
function loadMessages() {
  fetch(`/private-chat/messages/${friendId}`)
    .then((res) => res.json())
    .then((messages) => {
      messagesContainer.innerHTML = "";
      messages.forEach((msg) => displayMessage(msg, msg.sender === currentUser._id));
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Display a message in chat
function displayMessage(message, isSelf) {
  const li = document.createElement("li");
  li.classList.add("message");
  if (isSelf) li.classList.add("self");

  if (message.message) {
    li.innerHTML = `<p>${message.message}</p>`;
  }

  if (message.media) {
    const mediaUrl = `/uploads/${message.media}`;
    if (message.media.endsWith(".mp4") || message.media.endsWith(".webm")) {
      const video = document.createElement("video");
      video.src = mediaUrl;
      video.controls = true;
      li.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = mediaUrl;
      li.appendChild(img);
    }
  }

  messagesContainer.appendChild(li);
}

// Handle sending message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("to", friendId);

  if (messageInput.value.trim()) {
    formData.append("message", messageInput.value.trim());
  }

  if (mediaInput.files[0]) {
    formData.append("media", mediaInput.files[0]);
  }

  const res = await fetch("/private-chat/send", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (data.success && data.message) {
    displayMessage(data.message, true);
    socket.emit("private-message", {
      to: friendId,
      message: data.message,
    });
    messageInput.value = "";
    mediaInput.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } else {
    alert("Message failed to send.");
  }
});

// Receive incoming message via socket
socket.on("private-message", (data) => {
  if (data.message.sender === friendId) {
    displayMessage(data.message, false);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});
