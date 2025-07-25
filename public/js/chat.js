const socket = io();
console.log("✅ Connected to server via socket");

document.addEventListener("DOMContentLoaded", async () => {
  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message");
  const mediaInput = document.getElementById("media");
  const chatBox = document.getElementById("chat-box");

  // ✅ Load existing messages
  try {
    const res = await fetch("/chat/messages");
    const messages = await res.json();
    messages.forEach(msg => displayMessage(msg.username, msg.message, msg.media));
  } catch (err) {
    console.error("Failed to load messages:", err);
  }

  // ✅ Send new message
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    const media = mediaInput.files[0];

    if (!message && !media) return;

    let mediaPath = null;

    if (media) {
      const formData = new FormData();
      formData.append("media", media);

      try {
        const res = await fetch("/chat/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        mediaPath = data.filePath;
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    }

    socket.emit("chatMessage", {
      message,
      media: mediaPath,
    });

    messageInput.value = "";
    mediaInput.value = "";
  });

  // ✅ Listen for new message from server
  socket.on("chatMessage", (data) => {
    displayMessage(data.username, data.message, data.media);
  });

  // ✅ Render message to chat
  function displayMessage(username, message, media) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "msg";

    const userPara = document.createElement("p");
    userPara.className = "meta";
    userPara.textContent = `${username}:`;

    const textPara = document.createElement("p");
    textPara.className = "text";
    textPara.textContent = message;

    msgDiv.appendChild(userPara);

    if (media) {
      const img = document.createElement("img");
      img.src = media;
      img.style.maxWidth = "200px";
      img.style.marginTop = "5px";
      msgDiv.appendChild(img);
    }

    msgDiv.appendChild(textPara);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});