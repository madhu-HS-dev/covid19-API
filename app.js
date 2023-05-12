const express = require("express");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjToResponseObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// Get All States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;

  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => {
      return convertDbObjectToResponseObject(eachState);
    })
  );
});

//Get state API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;

  const stateResponse = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateResponse));
});

//Add District API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO
      district(district_name, state_id, cases, cured, active, deaths)
    VALUES (
        "${districtName}",
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Get District API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`;

  const districtResponse = await db.get(getDistrictQuery);
  response.send(convertDbObjToResponseObj(districtResponse));
});

//Delete District API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
        DELETE FROM
          district
        WHERE
          district_id = ${districtId};`;

  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District API

app.put("/districts/:districtId/", (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name = "${districtName}",
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE
      district_id = ${districtId};`;

  db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Total Statistics API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatisticsQuery = `
    SELECT
      SUM(cases)  AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE
      state_id = ${stateId};`;

  const getResponse = await db.get(getStatisticsQuery);
  response.send(getResponse);
});

//Get Object Containing State Name API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getObjectQuery = `
    SELECT
      state_id
    FROM
      district
    WHERE
      district_id = ${districtId};`;

  const getDistrictResponse = await db.get(getObjectQuery);

  const getStateNameQuery = `
    SELECT
      state_name AS stateName
    FROM
      state
    WHERE
      state_id = ${getDistrictResponse.state_id};`;

  const getStateNameResponse = await db.get(getStateNameQuery);
  response.send(getStateNameResponse);
});

module.exports = app;
