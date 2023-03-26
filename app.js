const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log("DBError:${e,message}");
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT *
                             FROM player_details`;
  const players = await db.all(getPlayersQuery);
  response.send(
    players.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT *
                             FROM player_details
                             WHERE player_id = ${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `UPDATE player_details
                          SET
                              player_name = '${playerName}'
                              WHERE player_id = ${playerId}`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4
const convertDbObjectToResponseObjects = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT *
                             FROM match_details
                             WHERE match_id = ${matchId}`;
  const matches = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObjects(matches));
});

//API 5
const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `SELECT *
                             FROM player_match_score
                             NATURAL JOIN match_details
                             WHERE player_id = ${playerId}`;
  const result = await db.all(getMatchQuery);
  response.send(
    result.map((eachPlayer) => convertMatchObjectToResponseObject(eachPlayer))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = ` SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	      FROM player_match_score NATURAL JOIN player_details
          WHERE match_id=${matchId};`;
  const playerDetails = await db.get(getMatch);
  response.send(convertDbObjectToResponseObject(playerDetails));
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScore = `SELECT
                player_details.player_id AS playerId,
                player_details.player_name AS playerName,
                SUM(player_match_score.score) AS totalScore,
                SUM(fours) AS totalFours,
                SUM(sixes) AS totalSixes FROM 
                player_details INNER JOIN player_match_score ON
                player_details.player_id = player_match_score.player_id
                WHERE player_details.player_id = ${playerId};
                `;
  const playerScores = await db.get(getTotalScore);
  response.send({
    playerId: playerScores["playerId"],
    playerName: playerScores["playerName"],
    totalScore: playerScores["totalScore"],
    totalFours: playerScores["totalFours"],
    totalSixes: playerScores["totalSixes"],
  });
});

module.exports = app;
