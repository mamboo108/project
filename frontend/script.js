document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const role = document.getElementById("login-role").value;

    fetch("http://localhost:5500/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.role === "donor") {
            window.location.href = "donor.html";
        } else if (data.role === "receiver") {
            window.location.href = "receiver.html";
        }
    })
    .catch(error => console.error("Error:", error));
});

document.getElementById("register-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;

    fetch("http://localhost:5500/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
    })
    .then(response => response.json())
    .then(data => {
        if (role === "donor") {
            window.location.href = "donor.html";
        } else if (role === "receiver") {
            window.location.href = "receiver.html";
        }
    })
    .catch(error => console.error("Error:", error));
});

document.getElementById("donor-form")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("donor-name").value;
    const age = document.getElementById("donor-age").value;
    const weight = document.getElementById("donor-weight").value;
    const location = document.getElementById("donor-location").value;

    fetch("http://localhost:5500/donors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, weight, location }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("donation-info").innerText = `Donate at: ${data.hospital.name}`;
    })
    .catch(error => console.error("Error:", error));
});

document.getElementById("receiver-form")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const location = document.getElementById("receiver-location").value;

    fetch(`http://localhost:5500/nearest-hospital?location=${location}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById("blood-info").innerText = `Get blood at: ${data.name}`;
    })
    .catch(error => console.error("Error:", error));
});

function goBack() {
    window.history.back();
}
