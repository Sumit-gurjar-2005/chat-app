document.addEventListener("DOMContentLoaded", async () => {
  const incomingList = document.getElementById("incomingList");
  const sentList = document.getElementById("sentList");
  const userList = document.getElementById("userList");
  const friendList = document.getElementById("friendList");

  const res = await fetch("/get-current-user");
  const currentUser = await res.json();

  async function fetchUsers() {
    const res = await fetch("/users");
    const users = await res.json();
    userList.innerHTML = "";

    users.forEach((user) => {
      if (user._id !== currentUser._id &&
          !currentUser.friends.includes(user._id) &&
          !currentUser.friendRequests.includes(user._id) &&
          !currentUser.sentRequests.includes(user._id)) {
        const li = document.createElement("li");
        li.textContent = user.username;
        const btn = document.createElement("button");
        btn.textContent = "Send Request";
        btn.onclick = () => sendRequest(user._id);
        li.appendChild(btn);
        userList.appendChild(li);
      }
    });
  }

  async function sendRequest(userId) {
    await fetch("/friend/send-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    loadAll();
  }

  async function cancelRequest(userId) {
    await fetch("/friend/cancel-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    loadAll();
  }

  async function acceptRequest(userId) {
    await fetch("/friend/accept-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: userId }),
    });
    loadAll();
  }

  async function rejectRequest(userId) {
    await fetch("/friend/reject-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: userId }),
    });
    loadAll();
  }

  async function fetchFriendData() {
    const userData = await (await fetch("/get-current-user")).json();

    // Incoming requests
    const incoming = await Promise.all(
      userData.friendRequests.map(id => fetch(`/users/${id}`).then(res => res.json()))
    );
    incomingList.innerHTML = "";
    incoming.forEach(user => {
      const li = document.createElement("li");
      li.textContent = user.username;
      const accept = document.createElement("button");
      accept.textContent = "Accept";
      accept.onclick = () => acceptRequest(user._id);
      const reject = document.createElement("button");
      reject.textContent = "Reject";
      reject.onclick = () => rejectRequest(user._id);
      li.append(accept, reject);
      incomingList.appendChild(li);
    });

    // Sent requests
    const sent = await Promise.all(
      userData.sentRequests.map(id => fetch(`/users/${id}`).then(res => res.json()))
    );
    sentList.innerHTML = "";
    sent.forEach(user => {
      const li = document.createElement("li");
      li.textContent = user.username;
      const cancel = document.createElement("button");
      cancel.textContent = "Cancel";
      cancel.onclick = () => cancelRequest(user._id);
      li.append(cancel);
      sentList.appendChild(li);
    });

    // Friends list
    const friends = await Promise.all(
      userData.friends.map(id => fetch(`/users/${id}`).then(res => res.json()))
    );
    friendList.innerHTML = "";
    friends.forEach(user => {
      const li = document.createElement("li");
      li.textContent = user.username;
      friendList.appendChild(li);
    });
  }

  async function loadAll() {
    await fetchUsers();
    await fetchFriendData();
  }

  loadAll();
});