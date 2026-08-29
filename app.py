from flask import Flask, render_template, request, jsonify
from datetime import date, timedelta

app = Flask(__name__)

# =========================
# DATA
# =========================

teams = []
matches = []
standings = {}


# =========================
# HOME PAGE
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# =========================
# ADD TEAM
# =========================

@app.route("/add_team", methods=["POST"])
def add_team():

    data = request.get_json()
    team = data.get("team", "").strip()

    if team == "":
        return jsonify({
            "message": "Please enter a team name.",
            "teams": teams
        })

    if team in teams:
        return jsonify({
            "message": "This team is already added.",
            "teams": teams
        })

    teams.append(team)

    # Create standings for new team
    standings[team] = {
        "played": 0,
        "won": 0,
        "lost": 0,
        "points": 0
    }

    return jsonify({
        "message": team + " added successfully!",
        "teams": teams
    })


# =========================
# GET TEAMS
# =========================

@app.route("/teams")
def get_teams():
    return jsonify(teams)


# =========================
# GENERATE ROUND ROBIN FIXTURE
# =========================

@app.route("/generate_fixture", methods=["POST"])
def generate_fixture():

    global matches

    # Minimum 2 teams required
    if len(teams) < 2:
        return jsonify({
            "message": "Please add at least 2 teams.",
            "matches": [],
            "bye_matches": [],
            "bye_message": "Add at least 2 teams."
        })

    # Clear old fixtures
    matches = []

    # Copy teams for fixture generation
    schedule_teams = teams.copy()

    # Store BYE details
    bye_matches = []

    # Check odd number of teams
    has_bye = False

    if len(schedule_teams) % 2 != 0:
        schedule_teams.append("BYE")
        has_bye = True

    total_teams = len(schedule_teams)
    rounds = total_teams - 1
    matches_per_round = total_teams // 2

    match_number = 1
    start_date = date.today()

    # =========================
    # CREATE ROUND ROBIN FIXTURE
    # =========================

    for round_number in range(rounds):

        round_date = start_date + timedelta(days=round_number)

        # Create matches for current round
        for i in range(matches_per_round):

            team1 = schedule_teams[i]
            team2 = schedule_teams[total_teams - 1 - i]

            # -------------------------
            # BYE ALLOCATION
            # -------------------------

            if team1 == "BYE":

                bye_matches.append({
                    "round": round_number + 1,
                    "team": team2,
                    "date": round_date.strftime("%d-%m-%Y")
                })

            elif team2 == "BYE":

                bye_matches.append({
                    "round": round_number + 1,
                    "team": team1,
                    "date": round_date.strftime("%d-%m-%Y")
                })

            # -------------------------
            # NORMAL MATCH
            # -------------------------

            else:

                matches.append({
                    "number": match_number,
                    "round": round_number + 1,
                    "team1": team1,
                    "team2": team2,
                    "date": round_date.strftime("%d-%m-%Y"),
                    "winner": "",
                    "loser": ""
                })

                match_number += 1

        # -------------------------
        # ROTATE TEAMS
        # Keep first team fixed
        # -------------------------

        schedule_teams = (
            [schedule_teams[0]]
            + [schedule_teams[-1]]
            + schedule_teams[1:-1]
        )

    # =========================
    # CREATE BYE MESSAGE
    # =========================

    if has_bye:

        bye_message = (
            "Odd number of teams detected. "
            "A different team gets a BYE in each round."
        )

    else:

        bye_message = (
            "Even number of teams detected. "
            "No BYE required. Conflict-free schedule created."
        )

    # =========================
    # SEND DATA TO WEBSITE
    # =========================

    return jsonify({
        "message": "Fixtures generated successfully!",
        "matches": matches,
        "bye_matches": bye_matches,
        "bye_message": bye_message
    })


# =========================
# GET MATCHES
# =========================

@app.route("/matches")
def get_matches():
    return jsonify(matches)


# =========================
# UPDATE RESULT
# =========================

@app.route("/update_result", methods=["POST"])
def update_result():

    data = request.get_json()

    match_number = data.get("number")
    winner = data.get("winner", "")

    # Find match
    for match in matches:

        if match["number"] == match_number:

            # Check if result already saved
            if match["winner"] != "":
                return jsonify({
                    "message": "Result already saved. Cannot add points twice."
                })

            team1 = match["team1"]
            team2 = match["team2"]

            # Check valid winner
            if winner != team1 and winner != team2:
                return jsonify({
                    "message": "Invalid winner selected."
                })

            # Find loser
            if winner == team1:
                loser = team2
            else:
                loser = team1

            # Save result
            match["winner"] = winner
            match["loser"] = loser

            # Update winner
            standings[winner]["played"] += 1
            standings[winner]["won"] += 1
            standings[winner]["points"] += 3

            # Update loser
            standings[loser]["played"] += 1
            standings[loser]["lost"] += 1

            return jsonify({
                "message": (
                    winner + " won! "
                    + loser + " lost. "
                    + winner + " received 3 points."
                ),
                "winner": winner,
                "loser": loser
            })

    return jsonify({
        "message": "Match not found."
    })


# =========================
# GET STANDINGS
# =========================

@app.route("/standings")
def get_standings():

    sorted_standings = sorted(
        standings.items(),
        key=lambda item: (
            item[1]["points"],
            item[1]["won"]
        ),
        reverse=True
    )

    return jsonify(sorted_standings)


# =========================
# RESET TOURNAMENT
# =========================

@app.route("/reset", methods=["POST"])
def reset():

    global teams
    global matches
    global standings

    teams = []
    matches = []
    standings = {}

    return jsonify({
        "message": "Tournament reset successfully!"
    })


# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    app.run(debug=True)