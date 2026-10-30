const API = "http://localhost:3000/api";

function login() {

    console.log("Login button clicked");

    const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");
    
  const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);


  fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json"
     },
    body: JSON.stringify({
      email: email,
      password: password
    })
  })

  .then(res => res.json())
  .then(data => {
    if (!data.token) {
      error.textContent = data.message || "Login failed";
    } else {
      localStorage.setItem("token", data.token);
      window.location = "dashboard.html";
    }
  });
}

if (document.getElementById("leadForm")) {
  const token = localStorage.getItem("token");

  fetch(`${API}/leads`, {
    headers: { Authorization: token }
  })
  .then(res => res.json())
  .then(leads => {
    leadList.innerHTML = leads.map(l => `<li>${l.name} - ${l.status}</li>`).join("");
  });
}
