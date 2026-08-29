// ===============================
// GET HTML ELEMENTS
// ===============================

const teamName = document.getElementById("teamName");
const teamList = document.getElementById("teamList");
const teamBadge = document.getElementById("teamBadge");
const message = document.getElementById("message");

const fixtureList = document.getElementById("fixtureList");
const calendarList = document.getElementById("calendarList");
const resultList = document.getElementById("resultList");
const standingsTable = document.getElementById("standingsTable");

const byeMessage = document.getElementById("byeMessage");

const teamCount = document.getElementById("teamCount");
const matchCount = document.getElementById("matchCount");
const dayCount = document.getElementById("dayCount");
const resultCount = document.getElementById("resultCount");


// ===============================
// ADD TEAM
// ===============================

function addTeam() {

    const team = teamName.value.trim();

    if (team === "") {

        message.innerText = "Please enter a team name.";
        return;

    }

    fetch("/add_team", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            team: team
        })

    })

    .then(response => response.json())

    .then(data => {

        message.innerText = data.message;

        showTeams(data.teams);

        teamName.value = "";

        teamName.focus();

    })

    .catch(error => {

        console.error(error);

        message.innerText = "Error adding team.";

    });

}


// ===============================
// ENTER KEY TO ADD TEAM
// ===============================

teamName.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        addTeam();

    }

});


// ===============================
// SHOW TEAMS
// ===============================

function showTeams(teams) {

    // Dashboard team count
    teamCount.innerText = teams.length;

    // Registered team badge
    teamBadge.innerText = teams.length + " Teams";


    if (teams.length === 0) {

        teamList.innerHTML = `
            <div class="empty-state">
                <div>👥</div>
                <p>No teams added yet</p>
            </div>
        `;

        return;

    }


    teamList.innerHTML = "";


    teams.forEach(function(team, index) {

        teamList.innerHTML += `

            <div class="team-item">

                <strong>
                    ${index + 1}. 🏆 ${team}
                </strong>

            </div>

        `;

    });

}


// ===============================
// LOAD TEAMS
// ===============================

function loadTeams() {

    fetch("/teams")

    .then(response => response.json())

    .then(data => {

        showTeams(data);

    });

}


// ===============================
// GENERATE FIXTURE
// ===============================

function generateFixture() {

    fetch("/generate_fixture", {

        method: "POST"

    })

    .then(response => response.json())

    .then(data => {

        // Show message
        byeMessage.innerText =
            data.bye_message || data.message;


        // If less than 2 teams
        if (!data.matches || data.matches.length === 0) {

            if (!data.bye_matches ||
                data.bye_matches.length === 0) {

                alert(data.message);

                return;

            }

        }


        // Show fixtures
        showFixtures(
            data.matches,
            data.bye_matches || []
        );


        // Show calendar
        showCalendar(
            data.matches,
            data.bye_matches || []
        );


        // Show result cards
        showResults(data.matches);


        // Update match count
        matchCount.innerText =
            data.matches.length;


        // Calculate schedule days
        const dates = [];


        data.matches.forEach(function(match) {

            if (!dates.includes(match.date)) {

                dates.push(match.date);

            }

        });


        (data.bye_matches || []).forEach(function(bye) {

            if (!dates.includes(bye.date)) {

                dates.push(bye.date);

            }

        });


        dayCount.innerText =
            dates.length;


        // Reset result count
        resultCount.innerText = 0;


        // Update standings
        loadStandings();

    })

    .catch(error => {

        console.error(error);

        alert("Error generating fixtures.");

    });

}


// ===============================
// SHOW FIXTURES
// ===============================

function showFixtures(matches, byeMatches) {

    if (!matches || matches.length === 0) {

        fixtureList.innerHTML = `
            <div class="empty-fixture">
                <div>⚔</div>
                <h3>No Fixtures Generated</h3>
                <p>Add teams and click Generate Fixture.</p>
            </div>
        `;

        return;

    }


    fixtureList.innerHTML = "";


    // NORMAL MATCHES
    matches.forEach(function(match) {

        let status = "🟠 Pending";


        if (match.winner !== "") {

            status = "🟢 Completed";

        }


        fixtureList.innerHTML += `

            <div class="fixture-card">

                <h3>
                    ⚔ Match ${match.number}
                    — Round ${match.round}
                </h3>

                <p>
                    <strong>${match.team1}</strong>
                    vs
                    <strong>${match.team2}</strong>
                </p>

                <p>
                    📅 ${match.date}
                </p>

                <p>
                    ${status}
                </p>

            </div>

        `;

    });


    // BYE CARDS
    byeMatches.forEach(function(bye) {

        fixtureList.innerHTML += `

            <div class="fixture-card">

                <h3>
                    🏖️ BYE — Round ${bye.round}
                </h3>

                <p>
                    <strong>${bye.team}</strong>
                    gets a BYE
                </p>

                <p>
                    📅 ${bye.date}
                </p>

                <p>
                    No match for this team in this round.
                </p>

            </div>

        `;

    });

}


// ===============================
// SHOW CALENDAR
// ===============================

function showCalendar(matches, byeMatches) {

    calendarList.innerHTML = "";


    const allDates = {};


    // ADD NORMAL MATCHES
    matches.forEach(function(match) {

        if (!allDates[match.date]) {

            allDates[match.date] = [];

        }


        allDates[match.date].push({

            type: "match",
            number: match.number,
            team1: match.team1,
            team2: match.team2

        });

    });


    // ADD BYE
    byeMatches.forEach(function(bye) {

        if (!allDates[bye.date]) {

            allDates[bye.date] = [];

        }


        allDates[bye.date].push({

            type: "bye",
            team: bye.team,
            round: bye.round

        });

    });


    // EMPTY CALENDAR
    if (Object.keys(allDates).length === 0) {

        calendarList.innerHTML = `

            <div class="empty-state">

                <div>🗓️</div>

                <p>
                    Your match calendar will appear here.
                </p>

            </div>

        `;

        return;

    }


    // SHOW DATE-WISE SCHEDULE
    Object.keys(allDates).forEach(function(date) {

        let html = `

            <div class="calendar-item">

                <h3>📅 ${date}</h3>

        `;


        allDates[date].forEach(function(item) {

            // NORMAL MATCH
            if (item.type === "match") {

                html += `

                    <p>
                        ⚔ Match ${item.number}:
                        <strong>${item.team1}</strong>
                        vs
                        <strong>${item.team2}</strong>
                    </p>

                `;

            }


            // BYE
            if (item.type === "bye") {

                html += `

                    <p>
                        🏖️ <strong>${item.team}</strong>
                        gets a BYE
                        (Round ${item.round})
                    </p>

                `;

            }

        });


        html += `</div>`;


        calendarList.innerHTML += html;

    });

}


// ===============================
// SHOW RESULTS
// ===============================

function showResults(matches) {

    if (!matches || matches.length === 0) {

        resultList.innerHTML = `

            <div class="empty-fixture">

                <div>🏅</div>

                <h3>No Matches Available</h3>

                <p>Generate fixtures first.</p>

            </div>

        `;

        return;

    }


    resultList.innerHTML = "";


    matches.forEach(function(match) {

        // RESULT ALREADY SAVED
        if (match.winner !== "") {

            resultList.innerHTML += `

                <div class="result-card">

                    <h3>
                        Match ${match.number}
                    </h3>

                    <p>
                        ${match.team1}
                        vs
                        ${match.team2}
                    </p>

                    <p>
                        🏆 Winner:
                        <strong>${match.winner}</strong>
                    </p>

                    <p>
                        ❌ Loser:
                        <strong>${match.loser}</strong>
                    </p>

                    <p>
                        🟢 Result Saved
                    </p>

                </div>

            `;

        }


        // RESULT NOT SAVED
        else {

            resultList.innerHTML += `

                <div class="result-card">

                    <h3>
                        ⚔ Match ${match.number}
                    </h3>

                    <p>
                        <strong>${match.team1}</strong>
                        vs
                        <strong>${match.team2}</strong>
                    </p>

                    <select id="winner-${match.number}">

                        <option value="">
                            Select Winner
                        </option>

                        <option value="${match.team1}">
                            ${match.team1}
                        </option>

                        <option value="${match.team2}">
                            ${match.team2}
                        </option>

                    </select>

                    <button
                        onclick="saveResult(${match.number})">

                        Save Result

                    </button>

                </div>

            `;

        }

    });

}


// ===============================
// SAVE RESULT
// ===============================

function saveResult(matchNumber) {

    const winnerSelect =
        document.getElementById(
            "winner-" + matchNumber
        );


    const winner =
        winnerSelect.value;


    if (winner === "") {

        alert("Please select a winner.");

        return;

    }


    fetch("/update_result", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            number: matchNumber,
            winner: winner

        })

    })

    .then(response => response.json())

    .then(data => {

        alert(data.message);

        loadMatches();

        loadStandings();

    })

    .catch(error => {

        console.error(error);

        alert("Error saving result.");

    });

}


// ===============================
// LOAD MATCHES
// ===============================

function loadMatches() {

    fetch("/matches")

    .then(response => response.json())

    .then(data => {

        showFixtures(data, []);

        showResults(data);


        let completed = 0;


        data.forEach(function(match) {

            if (match.winner !== "") {

                completed++;

            }

        });


        resultCount.innerText =
            completed;

    });

}


// ===============================
// LOAD STANDINGS
// ===============================

function loadStandings() {

    fetch("/standings")

    .then(response => response.json())

    .then(data => {

        showStandings(data);

    });

}


// ===============================
// SHOW STANDINGS
// ===============================

function showStandings(data) {

    if (!data || data.length === 0) {

        standingsTable.innerHTML = `

            <tr class="table-empty">

                <td colspan="6">
                    No standings available yet.
                </td>

            </tr>

        `;

        return;

    }


    standingsTable.innerHTML = "";


    data.forEach(function(item, index) {

        const team = item[0];

        const stats = item[1];


        standingsTable.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    🏆 ${team}
                </td>

                <td>
                    ${stats.played}
                </td>

                <td>
                    ${stats.won}
                </td>

                <td>
                    ${stats.lost}
                </td>

                <td>
                    <strong>
                        ${stats.points}
                    </strong>
                </td>

            </tr>

        `;

    });

}


// ===============================
// RESET TOURNAMENT
// ===============================

function resetTournament() {

    const answer = confirm(
        "Are you sure you want to reset the tournament?"
    );


    if (!answer) {

        return;

    }


    fetch("/reset", {

        method: "POST"

    })

    .then(response => response.json())

    .then(data => {

        alert(data.message);


        // CLEAR TEAM LIST
        showTeams([]);


        // CLEAR FIXTURES
        fixtureList.innerHTML = `

            <div class="empty-fixture">

                <div>⚔</div>

                <h3>No Fixtures Generated</h3>

                <p>
                    Add teams and click Generate Fixture.
                </p>

            </div>

        `;


        // CLEAR CALENDAR
        calendarList.innerHTML = `

            <div class="empty-state">

                <div>🗓️</div>

                <p>
                    Your match calendar will appear here.
                </p>

            </div>

        `;


        // CLEAR RESULTS
        resultList.innerHTML = `

            <div class="empty-fixture">

                <div>🏅</div>

                <h3>No Matches Available</h3>

                <p>
                    Generate fixtures first.
                </p>

            </div>

        `;


        // CLEAR STANDINGS
        standingsTable.innerHTML = `

            <tr class="table-empty">

                <td colspan="6">
                    No standings available yet.
                </td>

            </tr>

        `;


        // RESET COUNTERS
        matchCount.innerText = 0;
        dayCount.innerText = 0;
        resultCount.innerText = 0;


        // RESET BYE MESSAGE
        byeMessage.innerText =
            "Add teams and generate fixtures to receive smart recommendations.";


        // CLEAR MESSAGE
        message.innerText = "";


        // CLEAR INPUT
        teamName.value = "";

    })

    .catch(error => {

        console.error(error);

        alert("Error resetting tournament.");

    });

}


// ===============================
// LOAD DATA ON PAGE START
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadTeams();
        loadMatches();
        loadStandings();

    }
);