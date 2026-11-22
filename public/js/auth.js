const registerForm = document.querySelector("#registerForm");

const loginForm = document.querySelector("#loginForm");

const message = document.querySelector("#message");


// REGISTER
if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        try {

            const response = await fetch("/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: document.querySelector("#name").value,

                    email: document.querySelector("#email").value,

                    password: document.querySelector("#password").value

                })

            });

            const data = await response.json();

            message.textContent = data.message;

            if (response.ok) {

                sessionStorage.setItem("token", data.token);

                window.location.href = "dashboard.html";

            }

        } catch (error) {

            message.textContent =
                "Could not connect to the server.";

        }

    });

}


// LOGIN
if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        try {

            const response = await fetch("/api/auth/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: document.querySelector("#email").value,

                    password: document.querySelector("#password").value

                })

            });

            const data = await response.json();

            message.textContent = data.message;

            if (response.ok) {

                sessionStorage.setItem("token", data.token);

                window.location.href = "dashboard.html";

            }

        } catch (error) {

            message.textContent =
                "Could not connect to the server.";

        }

    });

}