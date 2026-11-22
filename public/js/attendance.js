const token = sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const dateInput = document.querySelector("#attendanceDate");

const rows = document.querySelector("#attendanceRows");

const studentMessage = document.querySelector("#studentMessage");

const attendanceMessage = document.querySelector("#attendanceMessage");

dateInput.value = new Date().toLocaleDateString("en-CA");


// API REQUEST FUNCTION
async function apiRequest(url, options = {}) {

    const response = await fetch(url, {

        ...options,

        headers: {

            "Content-Type": "application/json",

            "Authorization": `Bearer ${token}`,

            ...(options.headers || {})

        }

    });

    const data = await response.json();

    if (response.status === 401) {

        sessionStorage.removeItem("token");

        window.location.href = "login.html";

        return null;

    }

    if (!response.ok) {

        throw new Error(data.message || "Request failed.");

    }

    return data;

}


// LOAD ATTENDANCE
async function loadAttendance() {

    try {

        const [students, records] = await Promise.all([

            apiRequest("/api/students"),

            apiRequest(`/api/attendance?date=${dateInput.value}`)

        ]);

        if (!students || !records) return;

        const recordByStudent = new Map(

            records.map(record => [
                record.student._id,
                record.status
            ])

        );

        rows.replaceChildren();

        let present = 0;
        let absent = 0;
        let unmarked = 0;


        students.forEach(student => {

            const status = recordByStudent.get(student._id);

            if (status === "Present") present++;

            else if (status === "Absent") absent++;

            else unmarked++;


            const tr = document.createElement("tr");

            const roll = document.createElement("td");

            const name = document.createElement("td");

            const classCell = document.createElement("td");

            const action = document.createElement("td");


            roll.textContent = student.rollNumber;

            name.textContent = student.name;

            classCell.textContent = student.className;


            // PRESENT BUTTON
            const presentButton = document.createElement("button");

            presentButton.textContent = "Present";

            presentButton.className =
                status === "Present" ? "selected" : "";

            presentButton.addEventListener("click", () =>

                saveStatus(student._id, "Present")

            );


            // ABSENT BUTTON
            const absentButton = document.createElement("button");

            absentButton.textContent = "Absent";

            absentButton.className =
                status === "Absent" ? "selected" : "";

            absentButton.addEventListener("click", () =>

                saveStatus(student._id, "Absent")

            );


            action.append(presentButton, absentButton);

            tr.append(roll, name, classCell, action);

            rows.append(tr);

        });


        document.querySelector("#presentCount").textContent = present;

        document.querySelector("#absentCount").textContent = absent;

        document.querySelector("#unmarkedCount").textContent = unmarked;


    } catch (error) {

        attendanceMessage.textContent = error.message;

    }

}


// SAVE ATTENDANCE
async function saveStatus(studentId, status) {

    try {

        await apiRequest("/api/attendance", {

            method: "POST",

            body: JSON.stringify({

                studentId: studentId,

                date: dateInput.value,

                status: status

            })

        });

        attendanceMessage.textContent = "Attendance saved.";

        await loadAttendance();

    } catch (error) {

        attendanceMessage.textContent = error.message;

    }

}


// ADD STUDENT
document.querySelector("#studentForm").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        try {

            await apiRequest("/api/students", {

                method: "POST",

                body: JSON.stringify({

                    name: document.querySelector("#studentName").value,

                    rollNumber: document.querySelector("#rollNumber").value,

                    className: document.querySelector("#className").value,

                    email: document.querySelector("#studentEmail").value

                })

            });

            event.target.reset();

            studentMessage.textContent = "Student added.";

            await loadAttendance();

        } catch (error) {

            studentMessage.textContent = error.message;

        }

    }
);


// CHANGE DATE
dateInput.addEventListener("change", loadAttendance);


// LOGOUT
document.querySelector("#logoutButton").addEventListener("click", () => {

    sessionStorage.removeItem("token");

    window.location.href = "login.html";

});


// INITIAL LOAD
loadAttendance();