document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;

  function sendRequest(id) {
    fetch(`${baseUrl}/friend/send-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: id })
    }).then(() => location.reload());
  }

  function cancelRequest(id) {
    fetch(`${baseUrl}/friend/cancel-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: id })
    }).then(() => location.reload());
  }

  function acceptRequest(id) {
    fetch(`${baseUrl}/friend/accept-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: id })
    }).then(() => location.reload());
  }

  function rejectRequest(id) {
    fetch(`${baseUrl}/friend/reject-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: id })
    }).then(() => location.reload());
  }

  window.sendRequest = sendRequest;
  window.cancelRequest = cancelRequest;
  window.acceptRequest = acceptRequest;
  window.rejectRequest = rejectRequest;
});
