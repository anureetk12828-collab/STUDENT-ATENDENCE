const token = sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const dateInput = document.querySelector("#attendanceDate");
const rows = document.querySelector("#attendanceRows");

const studentMessage = document.querySelector("#studentMessage");
const attendanceMessage = document.querySelector("#attendanceMessage");

const searchInput = document.querySelector("#searchStudent");
const classFilter = document.querySelector("#classFilter");
const exportButton = document.querySelector("#exportButton");

let allStudents = [];
let allRecords = [];
let dailyRecords = [];

dateInput.value = new Date().toLocaleDateString("en-CA");


// API REQUEST
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


// LOAD STUDENTS AND ATTENDANCE
async function loadAttendance() {

    try {

        attendanceMessage.textContent = "Loading...";

        const [students, history, todayRecords] = await Promise.all([

            apiRequest("/api/students"),

            apiRequest("/api/attendance"),

            apiRequest(`/api/attendance?date=${dateInput.value}`)

        ]);

        if (!students || !history || !todayRecords) return;

        allStudents = students;
        allRecords = history;
        dailyRecords = todayRecords;

        createClassFilter();

        renderAttendance();

        attendanceMessage.textContent = "";

    } catch (error) {

        attendanceMessage.textContent = error.message;

    }
}


// CALCULATE ATTENDANCE PERCENTAGE
function getAttendancePercentage(studentId) {

    const studentRecords = allRecords.filter(record => {

        const id = record.student?._id || record.student;

        return String(id) === String(studentId);

    });

    const totalMarked = studentRecords.filter(record => {

        return record.status === "Present" ||
               record.status === "Absent";

    }).length;

    const totalPresent = studentRecords.filter(record => {

        return record.status === "Present";

    }).length;

    if (totalMarked === 0) {
        return 0;
    }

    return Math.round((totalPresent / totalMarked) * 100);
}


// CREATE CLASS FILTER
function createClassFilter() {

    const selectedClass = classFilter.value;

    const classes = [...new Set(

        allStudents.map(student => student.className)

    )].sort();

    classFilter.replaceChildren();

    const allOption = document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All Classes";

    classFilter.append(allOption);

    classes.forEach(className => {

        const option = document.createElement("option");

        option.value = className;
        option.textContent = className;

        classFilter.append(option);

    });

    if (classes.includes(selectedClass)) {
        classFilter.value = selectedClass;
    }

}


// RENDER ATTENDANCE
function renderAttendance() {

    rows.replaceChildren();

    let present = 0;
    let absent = 0;
    let unmarked = 0;

    const recordByStudent = new Map();

    dailyRecords.forEach(record => {

        const studentId = record.student?._id || record.student;

        recordByStudent.set(
            String(studentId),
            record.status
        );

    });


    // DAILY SUMMARY
    allStudents.forEach(student => {

        const status = recordByStudent.get(
            String(student._id)
        );

        if (status === "Present") present++;

        else if (status === "Absent") absent++;

        else unmarked++;

    });


    document.querySelector("#presentCount").textContent = present;

    document.querySelector("#absentCount").textContent = absent;

    document.querySelector("#unmarkedCount").textContent = unmarked;


    // SEARCH AND CLASS FILTER
    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    const selectedClass = classFilter.value;


    const filteredStudents = allStudents.filter(student => {

        const matchesSearch =

            student.name.toLowerCase().includes(searchText) ||

            String(student.rollNumber)
                .toLowerCase()
                .includes(searchText);


        const matchesClass =

            selectedClass === "all" ||

            student.className === selectedClass;


        return matchesSearch && matchesClass;

    });


    // DISPLAY STUDENTS
    filteredStudents.forEach(student => {

        const status = recordByStudent.get(
            String(student._id)
        );

        const percentage = getAttendancePercentage(
            student._id
        );


        const tr = document.createElement("tr");


        // ROLL NUMBER
        const roll = document.createElement("td");

        roll.textContent = student.rollNumber;


        // NAME
        const name = document.createElement("td");

        name.textContent = student.name;


        // CLASS
        const classCell = document.createElement("td");

        classCell.textContent = student.className;


        // PERCENTAGE
        const percentageCell = document.createElement("td");

        percentageCell.textContent = `${percentage}%`;


        // STATUS BUTTONS
        const action = document.createElement("td");

        const presentButton = document.createElement("button");

        presentButton.textContent = "Present";

        presentButton.className =

            status === "Present"
                ? "status-button present selected"
                : "status-button present";


        presentButton.addEventListener("click", () => {

            saveStatus(student._id, "Present");

        });


        const absentButton = document.createElement("button");

        absentButton.textContent = "Absent";

        absentButton.className =

            status === "Absent"
                ? "status-button absent selected"
                : "status-button absent";


        absentButton.addEventListener("click", () => {

            saveStatus(student._id, "Absent");

        });


        action.append(presentButton, absentButton);

        tr.append(
            roll,
            name,
            classCell,
            percentageCell,
            action
        );

        rows.append(tr);

    });

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

            studentMessage.textContent = "Student added successfully.";

            await loadAttendance();

        } catch (error) {

            studentMessage.textContent = error.message;

        }

    }
);


// DATE CHANGE
dateInput.addEventListener("change", loadAttendance);


// SEARCH
searchInput.addEventListener("input", renderAttendance);


// CLASS FILTER
classFilter.addEventListener("change", renderAttendance);


// EXPORT CSV THAT EXCEL CAN OPEN
exportButton.addEventListener("click", exportAttendance);


// EXPORT FUNCTION
function exportAttendance() {

    const data = allStudents.map(student => {

        const studentRecords = allRecords.filter(record => {

            const id = record.student?._id || record.student;

            return String(id) === String(student._id);

        });


        const presentDays = studentRecords.filter(record => {

            return record.status === "Present";

        }).length;


        const absentDays = studentRecords.filter(record => {

            return record.status === "Absent";

        }).length;


        const totalMarked = presentDays + absentDays;


        const percentage = totalMarked === 0

            ? 0

            : Math.round((presentDays / totalMarked) * 100);


        const todayStatus = dailyRecords.find(record => {

            const id = record.student?._id || record.student;

            return String(id) === String(student._id);

        });


        return {

            "Roll Number": student.rollNumber,

            "Name": student.name,

            "Class": student.className,

            "Present Days": presentDays,

            "Absent Days": absentDays,

            "Total Marked Days": totalMarked,

            "Attendance Percentage": `${percentage}%`,

            "Selected Date": dateInput.value,

            "Selected Date Status": todayStatus?.status || "Unmarked"

        };

    });


    if (data.length === 0) {

        attendanceMessage.textContent = "No students to export.";

        return;

    }


    const headers = Object.keys(data[0]);


    const csvRows = [

        headers.join(","),

        ...data.map(row =>

            headers.map(header => {

                const value = String(row[header] ?? "");

                return `"${value.replace(/"/g, '""')}"`;

            }).join(",")

        )

    ];


    const csv = "\uFEFF" + csvRows.join("\n");


    const blob = new Blob(

        [csv],

        { type: "text/csv;charset=utf-8;" }

    );


    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);


    link.href = url;

    link.download = `attendance-${dateInput.value}.csv`;


    document.body.append(link);

    link.click();

    link.remove();


    URL.revokeObjectURL(url);

    attendanceMessage.textContent = "Attendance report exported.";

}


// LOGOUT
document.querySelector("#logoutButton").addEventListener(
    "click",
    () => {

        sessionStorage.removeItem("token");

        window.location.href = "login.html";

    }
);


// INITIAL LOAD
loadAttendance();