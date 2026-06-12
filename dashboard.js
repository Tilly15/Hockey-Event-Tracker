const seasonSelect = document.getElementById("seasonSelect");
const gameSelect = document.getElementById("gameSelect");
const summary = document.getElementById("summary");
const playerTotals = document.getElementById("playerTotals");
const situationFilter = document.getElementById("situationFilter");
const loadSeasonCardsBtn = document.getElementById("loadSeasonCardsBtn");
const playerCards = document.getElementById("playerCards");
const seasonCardPlayerSelect = document.getElementById("seasonCardPlayerSelect");
const rosterNumber = document.getElementById("rosterNumber");
const rosterName = document.getElementById("rosterName");
const addRosterPlayerBtn = document.getElementById("addRosterPlayerBtn");
const rosterList = document.getElementById("rosterList");
const shotMapType = document.getElementById("shotMapType");
let shotMapDots = document.getElementById("shotMapDots");
const shotMapSection = document.getElementById("shotMapSection");
const shotVideoSection = document.getElementById("shotVideoSection");
const shotVideoFrame = document.getElementById("shotVideoFrame");
const gameRosterGameSelect = document.getElementById("gameRosterGameSelect");
const gameRosterPlayer = document.getElementById("gameRosterPlayer");
const gameRosterPosition = document.getElementById("gameRosterPosition");
const addGameRosterPlayerBtn = document.getElementById("addGameRosterPlayerBtn");
const gameRosterList = document.getElementById("gameRosterList");
const lineComboGameSelect = document.getElementById("lineComboGameSelect");
const showForwardLinesBtn = document.getElementById("showForwardLinesBtn");
const showDefensePairsBtn = document.getElementById("showDefensePairsBtn");
const lineCombinationsContent = document.getElementById("lineCombinationsContent");
const lineComboMinShots = document.getElementById("lineComboMinShots");

document.getElementById("dashboardRink").innerHTML =
  getRinkMarkup("shotMapDots");

  shotMapDots = document.getElementById("shotMapDots");

let currentGameData = null;

let currentTotals = {};
let currentSortColumn = "player";
let currentSortAscending = true;

let currentEvents = [];

let currentLineComboRows = [];
let currentLineComboType = "forward";
let currentLineComboSortColumn = "onIceShotsFor";
let currentLineComboSortAscending = false;

function getSavedGames() {
  return JSON.parse(localStorage.getItem("savedGames") || "[]");
}

function getGameStorageKey(seasonId, gameId) {
  return `hockey-game-${seasonId}-${gameId}`;
}

function populateSeasons() {
  const savedGames = getSavedGames();
  const seasons = [...new Set(savedGames.map((game) => game.seasonId))];

  seasonSelect.innerHTML = `<option value="">Select season...</option>`;

  seasons.forEach((seasonId) => {
    const option = document.createElement("option");
    option.value = seasonId;
    option.textContent = seasonId;
    seasonSelect.appendChild(option);
  });
}

function populateGames() {
  const selectedSeason = seasonSelect.value;
  const savedGames = getSavedGames();

  gameSelect.innerHTML = `
  <option value="">Select game...</option>
  <option value="all">All Games</option>
`;

  savedGames
    .filter((game) => game.seasonId === selectedSeason)
    .forEach((game) => {
      const option = document.createElement("option");
      option.value = game.gameId;
      option.textContent = game.gameId;
      gameSelect.appendChild(option);
    });
}

function loadGameData() {
  const seasonId = seasonSelect.value;
  const gameId = gameSelect.value;

  if (!seasonId || !gameId) {
    alert("Please select a season and game.");
    return;
  }

  let events = [];

if (gameId === "all") {
  events = getSeasonEvents(seasonId);
  currentGameData = null;
} else {
  const savedGame = localStorage.getItem(getGameStorageKey(seasonId, gameId));

  if (!savedGame) {
    alert("Game data not found.");
    return;
  }

  const gameData = JSON.parse(savedGame);
  currentGameData = gameData;
  events = gameData.events || [];
}

  currentEvents = events;
    const filteredEvents = filterEventsBySituation(currentEvents);

  renderPlayerTotals(filteredEvents);
  if (gameId === "all") {
  shotMapSection.style.display = "none";
  shotMapDots.innerHTML = "";
} else {
  shotMapSection.style.display = "block";
  renderShotMap(filteredEvents);
}

  summary.innerHTML = `
    <h2>Summary</h2>
    <p><strong>Season:</strong> ${seasonId}</p>
    <p><strong>Game:</strong> ${gameId === "all" ? "All Games" : gameId}</p>
    <p><strong>Total Events:</strong> ${filteredEvents.length}</p>
    <p><strong>Shots:</strong> ${
      events.filter((event) => event.eventType === "shot").length
    }</p>
    <p><strong>Opponent Shots:</strong> ${
      events.filter((event) => event.eventType === "opponent_shot").length
    }</p>
    <p><strong>Zone Entries:</strong> ${
      events.filter((event) => event.eventType === "zone_entry").length
    }</p>
    <p><strong>Zone Exits:</strong> ${
      events.filter((event) => event.eventType === "zone_exit").length
    }</p>
  `;
}

function parsePlayerList(playerList) {
  return playerList
    .split(",")
    .map((player) => player.trim())
    .filter((player) => player !== "");
}

function calculatePlayerTotals(events) {
  const totals = {};

  events.forEach((event) => {
    const player = event.player || "Unknown";

    if (!totals[player]) {
      totals[player] = createEmptyPlayerStats();
    }

    // SHOTS
    if (event.eventType === "shot" || event.eventType === "goal") {
      totals[player].shots += 1;
    }

    // SHOT ASSISTS
    if (event.shotAssist) {
      const assistPlayer = event.shotAssist;

      if (!totals[assistPlayer]) {
        totals[assistPlayer] = createEmptyPlayerStats();
      }

      totals[assistPlayer].shotAssists += 1;
    }

    // ZONE ENTRIES
    if (event.eventType === "zone_entry") {
      if (event.entryExitType === "failed") {
        totals[player].failedEntries += 1;
      } else {
        totals[player].zoneEntries += 1;

        if (event.entryExitType === "carry") {
          totals[player].carryEntries += 1;
        }

        if (event.entryExitType === "dump") {
          totals[player].dumpEntries += 1;
        }

        if (event.entryExitType === "pass") {
          totals[player].passEntries += 1;
        }
      }
    }

    // ZONE EXITS
    if (event.eventType === "zone_exit") {
      if (event.entryExitType === "failed") {
        totals[player].failedExits += 1;
      } else {
        totals[player].zoneExits += 1;

        if (event.entryExitType === "carry") {
          totals[player].carryExits += 1;
        }

        if (event.entryExitType === "dump") {
          totals[player].dumpExits += 1;
        }

        if (event.entryExitType === "pass") {
          totals[player].passExits += 1;
        }
      }
    }

    // ON-ICE SHOTS FOR
    if (
      event.eventType === "shot" ||
      event.eventType === "goal"
    ) {
      parsePlayerList(event.playersOnIce || "").forEach((onIcePlayer) => {
        if (!totals[onIcePlayer]) {
          totals[onIcePlayer] = createEmptyPlayerStats();
        }

        totals[onIcePlayer].onIceShotsFor += 1;
      });
    }

    // ON-ICE SHOTS AGAINST
    if (
      event.eventType === "opponent_shot" ||
      event.eventType === "opponent_goal"
    ) {
      parsePlayerList(event.shotAgainstPlayers || "").forEach((onIcePlayer) => {
        if (!totals[onIcePlayer]) {
          totals[onIcePlayer] = createEmptyPlayerStats();
        }

        totals[onIcePlayer].onIceShotsAgainst += 1;
      });
    }

    // GOALS
    if (event.eventType === "goal") {
      totals[player].goals += 1;
    }

    // PRIMARY ASSISTS
    if (event.primaryAssist) {
      const primaryAssistPlayer = event.primaryAssist;

      if (!totals[primaryAssistPlayer]) {
        totals[primaryAssistPlayer] = createEmptyPlayerStats();
      }

      totals[primaryAssistPlayer].primaryAssists += 1;
    }

    // SECONDARY ASSISTS
    if (event.secondaryAssist) {
      const secondaryAssistPlayer = event.secondaryAssist;

      if (!totals[secondaryAssistPlayer]) {
        totals[secondaryAssistPlayer] = createEmptyPlayerStats();
      }

      totals[secondaryAssistPlayer].secondaryAssists += 1;
    }

    // PENALTIES
    if (event.eventType === "penalty") {
      totals[player].penalties += 1;
    }

    // DRAWN PENALTIES
    if (event.eventType === "drawn_penalty") {
      totals[player].drawnPenalties += 1;
    }

    // ON-ICE GOALS FOR
    if (event.eventType === "goal") {
      parsePlayerList(event.playersOnIce || "").forEach((onIcePlayer) => {
        if (!totals[onIcePlayer]) {
          totals[onIcePlayer] = createEmptyPlayerStats();
        }

        totals[onIcePlayer].onIceGoalsFor += 1;
      });
    }

    // ON-ICE GOALS AGAINST
    if (event.eventType === "opponent_goal") {
      parsePlayerList(event.shotAgainstPlayers || "").forEach((onIcePlayer) => {
        if (!totals[onIcePlayer]) {
          totals[onIcePlayer] = createEmptyPlayerStats();
        }

        totals[onIcePlayer].onIceGoalsAgainst += 1;
      });
    }
  });

  // DERIVED STATS
  Object.values(totals).forEach((stats) => {
    stats.points =
      stats.goals +
      stats.primaryAssists +
      stats.secondaryAssists;

    stats.assists =
      stats.primaryAssists +
      stats.secondaryAssists;

    stats.controlledEntries =
      stats.carryEntries +
      stats.passEntries;

    stats.controlledExits =
      stats.carryExits +
      stats.passExits;

    stats.onIceGoalDifferential =
      stats.onIceGoalsFor -
      stats.onIceGoalsAgainst;

    stats.individualShootingPercentage =
      stats.shots > 0
        ? ((stats.goals / stats.shots) * 100).toFixed(1)
        : "0.0";

    stats.onIceShootingPercentage =
      stats.onIceShotsFor > 0
        ? ((stats.onIceGoalsFor / stats.onIceShotsFor) * 100).toFixed(1)
        : "0.0";

    stats.onIceSavePercentage =
      stats.onIceShotsAgainst > 0
        ? (
            ((stats.onIceShotsAgainst - stats.onIceGoalsAgainst) /
              stats.onIceShotsAgainst) *
            100
          ).toFixed(1)
        : "0.0";

    stats.shotDifferential = stats.onIceShotsFor - stats.onIceShotsAgainst;
    
    stats.pdo = (
      Number(stats.onIceShootingPercentage) +
      Number(stats.onIceSavePercentage)
    ).toFixed(1);
  });

  return totals;
}

function renderPlayerTotals(events) {
  currentTotals = calculatePlayerTotals(events);
  renderSortedTotals(Object.entries(currentTotals));
}

function sortPlayerTotals(column) {
  if (currentSortColumn === column) {
    currentSortAscending = !currentSortAscending;
  } else {
    currentSortColumn = column;
    currentSortAscending = false;
  }

  const sortedEntries = Object.entries(currentTotals).sort(
    ([playerA, statsA], [playerB, statsB]) => {
      let valueA;
      let valueB;

      if (column === "player") {
        valueA = playerA;
        valueB = playerB;

        return currentSortAscending
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      valueA = statsA[column] || 0;
      valueB = statsB[column] || 0;

      return currentSortAscending
        ? valueA - valueB
        : valueB - valueA;
    }
  );

  renderSortedTotals(sortedEntries);
}

function renderSortedTotals(sortedEntries) {
  const rows = sortedEntries
    .map(([player, stats]) => `
      <tr>
        <td>${player}</td>
        <td>${stats.shots}</td>
        <td>${stats.shotAssists}</td>
        <td>${stats.zoneEntries}</td>
        <td>${stats.zoneExits}</td>
        <td>${stats.carryEntries}</td>
        <td>${stats.dumpEntries}</td>
        <td>${stats.passEntries}</td>
        <td>${stats.failedEntries}</td>
        <td>${stats.carryExits}</td>
        <td>${stats.dumpExits}</td>
        <td>${stats.passExits}</td>
        <td>${stats.failedExits}</td>
        <td>${stats.onIceShotsFor}</td>
        <td>${stats.onIceShotsAgainst}</td>
        <td>${stats.shotDifferential}</td>
        <td>${stats.goals}</td>
        <td>${stats.primaryAssists}</td>
        <td>${stats.secondaryAssists}</td>
        <td>${stats.points}</td>
        <td>${stats.penalties}</td>
        <td>${stats.drawnPenalties}</td>
        <td>${stats.onIceGoalsFor}</td>
        <td>${stats.onIceGoalsAgainst}</td>
        <td>${stats.individualShootingPercentage}%</td>
        <td>${stats.onIceShootingPercentage}%</td>
        <td>${stats.onIceSavePercentage}%</td>
        <td>${stats.pdo}</td>
      </tr>
    `)
    .join("");

  playerTotals.innerHTML = `
    <table>
      <thead>
  <tr>
    <th onclick="sortPlayerTotals('player')">Player</th>
    <th onclick="sortPlayerTotals('shots')">Shots</th>
    <th onclick="sortPlayerTotals('shotAssists')">Shot Assists</th>
    <th onclick="sortPlayerTotals('zoneEntries')">Zone Entries</th>
    <th onclick="sortPlayerTotals('zoneExits')">Zone Exits</th>
    <th onclick="sortPlayerTotals('carryEntries')">Carry Entries</th>
    <th onclick="sortPlayerTotals('dumpEntries')">Dump Entries</th>
    <th onclick="sortPlayerTotals('passEntries')">Pass Entries</th>
    <th onclick="sortPlayerTotals('failedEntries')">Failed Entries</th>
    <th onclick="sortPlayerTotals('carryExits')">Carry Exits</th>
    <th onclick="sortPlayerTotals('dumpExits')">Dump Exits</th>
    <th onclick="sortPlayerTotals('passExits')">Pass Exits</th>
    <th onclick="sortPlayerTotals('failedExits')">Failed Exits</th>
    <th onclick="sortPlayerTotals('onIceShotsFor')">On-Ice Shots For</th>
    <th onclick="sortPlayerTotals('onIceShotsAgainst')">On-Ice Shots Against</th>
    <th onclick="sortPlayerTotals('shotDifferential')">Shot Differential</th>
    <th onclick="sortPlayerTotals('goals')">Goals</th>
    <th onclick="sortPlayerTotals('primaryAssists')">Primary Assists</th>
    <th onclick="sortPlayerTotals('secondaryAssists')">Secondary Assists</th>
    <th onclick="sortPlayerTotals('points')">Points</th>
    <th onclick="sortPlayerTotals('penalties')">Penalties</th>
    <th onclick="sortPlayerTotals('drawnPenalties')">Drawn Penalties</th>
    <th onclick="sortPlayerTotals('onIceGoalsFor')">On-Ice Goals For</th>
    <th onclick="sortPlayerTotals('onIceGoalsAgainst')">On-Ice Goals Against</th>
    <th onclick="sortPlayerTotals('individualShootingPercentage')">Individual SH%</th>
    <th onclick="sortPlayerTotals('onIceShootingPercentage')">On-Ice SH%</th>
    <th onclick="sortPlayerTotals('onIceSavePercentage')">On-Ice SV%</th>
    <th onclick="sortPlayerTotals('pdo')">PDO</th>
  </tr>
</thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}


function createEmptyPlayerStats() {
  return {
    shots: 0,
    shotAssists: 0,

    zoneEntries: 0,
    zoneExits: 0,

    carryEntries: 0,
    dumpEntries: 0,
    passEntries: 0,
    failedEntries: 0,

    carryExits: 0,
    dumpExits: 0,
    passExits: 0,
    failedExits: 0,

    onIceShotsFor: 0,
    onIceShotsAgainst: 0,
    shotDifferential: 0,

    goals: 0,
    primaryAssists: 0,
    secondaryAssists: 0,
    points: 0,

    penalties: 0,
    drawnPenalties: 0,

    onIceGoalsFor: 0,
    onIceGoalsAgainst: 0,

    individualShootingPercentage: 0,
    onIceShootingPercentage: 0,
    onIceSavePercentage: 0,
    pdo: 0,
    assists: 0,
    controlledEntries: 0,
    controlledExits: 0,
    onIceGoalDifferential: 0,
  };
}

function filterEventsBySituation(events) {
  const selectedSituation = situationFilter.value;

  const evenStrength = ["5v5", "4v4", "3v3"];
  const powerPlay = ["5v4", "5v3", "4v3", "6v5", "6v4", "6v3"];
  const shorthanded = ["4v5", "3v5", "3v4", "5v6", "4v6", "3v6"];

  if (selectedSituation === "all") {
    return events;
  }

  if (selectedSituation === "even") {
    return events.filter((event) => evenStrength.includes(event.situation));
  }

  if (selectedSituation === "powerplay") {
    return events.filter((event) => powerPlay.includes(event.situation));
  }

  if (selectedSituation === "shorthanded") {
    return events.filter((event) => shorthanded.includes(event.situation));
  }

  return events.filter((event) => event.situation === selectedSituation);
}

situationFilter.addEventListener("change", () => {
  const filteredEvents = filterEventsBySituation(currentEvents);

  renderPlayerTotals(filteredEvents);

  if (currentGameData) {
    renderShotMap(filteredEvents);
  }
});

function getSeasonEvents(seasonId) {
  const savedGames = getSavedGames();

  const seasonGames = savedGames.filter(
    (game) => game.seasonId === seasonId
  );

  let allEvents = [];

  seasonGames.forEach((game) => {
    const savedGame = localStorage.getItem(
      getGameStorageKey(game.seasonId, game.gameId)
    );

    if (!savedGame) {
      return;
    }

    const gameData = JSON.parse(savedGame);
    allEvents = allEvents.concat(gameData.events || []);
  });

  return allEvents;
}

function getRank(totals, statName, playerName) {
  const sortedPlayers = Object.entries(totals)
    .sort(([, aStats], [, bStats]) => bStats[statName] - aStats[statName]);

  return sortedPlayers.findIndex(([player]) => player === playerName) + 1;
}

function renderSeasonPlayerCards() {
  const seasonId = seasonSelect.value;

  if (!seasonId) {
    alert("Please select a season first.");
    return;
  }

  const seasonEvents = getSeasonEvents(seasonId);
  const totals = calculatePlayerTotals(seasonEvents);
  const roster = getRoster(seasonId);
  const selectedPlayer = seasonCardPlayerSelect.value;

  const playerEntries = Object.entries(totals).filter(
    ([player]) => selectedPlayer === "all" || player === selectedPlayer
  );

  const cards = playerEntries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([player, stats]) => `
        <div class="player-card">
          <h3>#${player} ${roster[player] || ""}</h3>

          <p class="${getRankClass(totals, "goals", player)}"><strong>Goals:</strong> ${stats.goals} <span>Team Rank: #${getRank(totals, "goals", player)}</span></p>
          <p class="${getRankClass(totals, "assists", player)}"><strong>Assists:</strong> ${stats.assists} <span>Team Rank: #${getRank(totals, "assists", player)}</span></p>
          <p class="${getRankClass(totals, "points", player)}"><strong>Points:</strong> ${stats.points} <span>Team Rank: #${getRank(totals, "points", player)}</span></p>
          <p class="${getRankClass(totals, "shots", player)}"><strong>Shots:</strong> ${stats.shots} <span>Team Rank: #${getRank(totals, "shots", player)}</span></p>
          <p class="${getRankClass(totals, "shotAssists", player)}"><strong>Shot Assists:</strong> ${stats.shotAssists} <span>Team Rank: #${getRank(totals, "shotAssists", player)}</span></p>
          <p class="${getRankClass(totals, "shotDifferential", player)}"><strong>On-Ice Shot Differential:</strong> ${stats.shotDifferential} <span>Team Rank: #${getRank(totals, "shotDifferential", player)}</span></p>
          <p class="${getRankClass(totals, "onIceGoalDifferential", player)}"><strong>On-Ice Goal Differential:</strong> ${stats.onIceGoalDifferential} <span>Team Rank: #${getRank(totals, "onIceGoalDifferential", player)}</span></p>
          <p class="${getRankClass(totals, "controlledEntries", player)}"><strong>Controlled Entries:</strong> ${stats.controlledEntries} <span>Team Rank: #${getRank(totals, "controlledEntries", player)}</span></p>
          <p class="${getRankClass(totals, "controlledExits", player)}"><strong>Controlled Exits:</strong> ${stats.controlledExits} <span>Team Rank: #${getRank(totals, "controlledExits", player)}</span></p>
          <p class="${getRankClass(totals, "drawnPenalties", player)}"><strong>Penalties Drawn:</strong> ${stats.drawnPenalties} <span>Team Rank: #${getRank(totals, "drawnPenalties", player)}</span></p>

          <div class="player-card-shot-controls">
            <label>
              Game:
              <select id="player-card-game-${player}">
                <option value="all">All Games</option>
                ${getSavedGames()
                  .filter((game) => game.seasonId === seasonId)
                  .map(
                    (game) =>
                      `<option value="${game.gameId}">${game.gameId}</option>`
                  )
                  .join("")}
              </select>
            </label>

            <label>
              Type:
              <select id="player-card-type-${player}">
                <option value="shots">Shots</option>
                <option value="shotAssists">Shot Assists</option>
              </select>
            </label>

            <button type="button" onclick="renderPlayerCardShotMap('${player}')">
              Load Shot Map
            </button>
          </div>

          <div class="player-card-rink">
            ${getRinkMarkup(`player-card-dots-${player}`)}
          </div>
        </div>
      `
    )
    .join("");

  playerCards.innerHTML = cards;
}

function populateSeasonCardPlayers() {
  const seasonId = seasonSelect.value;

  seasonCardPlayerSelect.innerHTML = `<option value="all">All Players</option>`;

  if (!seasonId) {
    return;
  }

  const seasonEvents = getSeasonEvents(seasonId);
  const totals = calculatePlayerTotals(seasonEvents);

  Object.keys(totals)
    .sort((a, b) => a.localeCompare(b))
    .forEach((player) => {
      const option = document.createElement("option");
      option.value = player;
      option.textContent = player;
      seasonCardPlayerSelect.appendChild(option);
    });
}

function getRosterKey(seasonId) {
  return `hockey-roster-${seasonId}`;
}

function getRoster(seasonId) {
  return JSON.parse(localStorage.getItem(getRosterKey(seasonId)) || "{}");
}

function saveRoster(seasonId, roster) {
  localStorage.setItem(getRosterKey(seasonId), JSON.stringify(roster));
}

function renderRoster() {
  const seasonId = seasonSelect.value;

  if (!seasonId) {
    rosterList.innerHTML = "<p>Select a season to view roster.</p>";
    return;
  }

  const roster = getRoster(seasonId);

  rosterList.innerHTML = Object.entries(roster)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(
      ([number, name]) => `
        <div class="roster-row">
          <span>#${number} — ${name}</span>

          <button type="button" onclick="editRosterPlayer('${number}')">
            Edit
          </button>

          <button type="button" onclick="deleteRosterPlayer('${number}')">
            Delete
          </button>
        </div>
      `
    )
    .join("");
}

function editRosterPlayer(number) {
  const seasonId = seasonSelect.value;
  const roster = getRoster(seasonId);

  rosterNumber.value = number;
  rosterName.value = roster[number] || "";
}

function deleteRosterPlayer(number) {
  const seasonId = seasonSelect.value;
  const roster = getRoster(seasonId);

  const confirmed = confirm(`Delete player #${number} from this roster?`);

  if (!confirmed) {
    return;
  }

  delete roster[number];

  saveRoster(seasonId, roster);
  renderRoster();
  populateSeasonCardPlayers();
}

addRosterPlayerBtn.addEventListener("click", () => {
  const seasonId = seasonSelect.value;

  if (!seasonId) {
    alert("Please select a season first.");
    return;
  }

  const playerNumber = gameRosterPlayer.value;
  
  const seasonRoster = getRoster(seasonId);
  const playerName = seasonRoster[playerNumber];

  if (!number || !name) {
    alert("Please enter both player number and name.");
    return;
  }

  const roster = getRoster(seasonId);
  roster[number] = name;

  saveRoster(seasonId, roster);
  renderRoster();

  roster[playerNumber] = {
  name: playerName,
  position: gameRosterPosition.value,
};
});

loadSeasonCardsBtn.addEventListener("click", renderSeasonPlayerCards);

seasonSelect.addEventListener("change", () => {
  populateGames();
  populateSeasonCardPlayers();
  renderRoster();
});

shotMapType.addEventListener("change", () => {
  if (!currentGameData) {
    shotMapSection.style.display = "none";
    shotMapDots.innerHTML = "";
    return;
  }

  const filteredEvents = filterEventsBySituation(currentEvents);
  shotMapSection.style.display = "block";
  renderShotMap(filteredEvents);
});

function shouldFlipShot(event) {
  const period = String(event.period);
  const period1Direction =
    currentGameData?.period1AttackDirection || "right";

  const attackingRight =
    period === "1" || period === "3" || period === "OT"
      ? period1Direction === "right"
      : period1Direction === "left";

  return !attackingRight;
}

function normalizeShotCoordinates(event) {
  const x = Number(event.x);
  const y = Number(event.y);

  if (shouldFlipShot(event)) {
    return {
      x: -x,
      y: -y,
    };
  }

  return { x, y };
}

function rinkToPixelCoordinates(x, y) {
  return {
    left: ((x + 100) / 200) * 100,
    top: ((42.5 - y) / 85) * 100,
  };
}

function renderShotMap(events) {
  shotMapDots = document.getElementById("shotMapDots");
  if (!shotMapDots) {
    return;
  }

  const selectedType = shotMapType.value;

  const shotEvents = events.filter((event) => {
    if (selectedType === "for") {
      return event.eventType === "shot" || event.eventType === "goal";
    }

    if (selectedType === "against") {
      return (
        event.eventType === "opponent_shot" ||
        event.eventType === "opponent_goal"
      );
    }

    return false;
  });

  shotMapDots.innerHTML = "";

  shotEvents.forEach((event) => {
    const { x, y } = normalizeShotCoordinates(event);
    const pixel = rinkToPixelCoordinates(x, y);

    const dot = document.createElement("div");
    dot.classList.add("shot-dot");

    dot.title = getShotTooltip(event);

    dot.addEventListener("click", () => {
  showShotClip(event);
});

    if (event.eventType === "goal" || event.eventType === "opponent_goal") {
      dot.classList.add("goal-dot");
    }

    dot.style.left = `${pixel.left}%`;
    dot.style.top = `${pixel.top}%`;

    shotMapDots.appendChild(dot);
  });
}

function getShotTooltip(event) {
  const baseInfo = [
    `Period: ${event.period || ""}`,
    `Time: ${event.time || ""}`,
    `Situation: ${event.situation || ""}`,
  ];

  if (event.eventType === "opponent_shot" || event.eventType === "opponent_goal") {
    return [
      ...baseInfo,
      `Our Players On Ice: ${event.shotAgainstPlayers || ""}`,
    ].join("\n");
  }

  if (event.eventType === "goal") {
    return [
      ...baseInfo,
      `Shooter: ${event.player || ""}`,
      `Shot Assist: ${event.shotAssist || ""}`,
      `Primary Assist: ${event.primaryAssist || ""}`,
      `Secondary Assist: ${event.secondaryAssist || ""}`,
      `Players On Ice: ${event.playersOnIce || ""}`,
    ].join("\n");
  }

  return [
    ...baseInfo,
    `Shooter: ${event.player || ""}`,
    `Shot Assist: ${event.shotAssist || ""}`,
    `Players On Ice: ${event.playersOnIce || ""}`,
  ].join("\n");
}

function getRankClass(totals, statName, playerName) {
  const sortedPlayers = Object.entries(totals)
    .sort(([, aStats], [, bStats]) => bStats[statName] - aStats[statName]);

  const rank = sortedPlayers.findIndex(([player]) => player === playerName) + 1;
  const percentile = rank / sortedPlayers.length;

  if (percentile <= 0.25) return "rank-green";
  if (percentile <= 0.5) return "rank-yellow";
  if (percentile <= 0.75) return "rank-orange";
  return "rank-red";
}


function getYouTubeVideoId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : url;
}

function showShotClip(event) {
  let gameData = currentGameData;

  if (!gameData || gameData.gameId !== event.gameId) {
    const savedGame = localStorage.getItem(
      getGameStorageKey(seasonSelect.value, event.gameId)
    );

    if (savedGame) {
      gameData = JSON.parse(savedGame);
    }
  }

  if (!gameData || !gameData.youtubeUrls) {
    alert("No video URL saved for this game.");
    return;
  }

  const videoIndex = Number(event.videoIndex || 0);
  const videoUrl = gameData.youtubeUrls[videoIndex];

  if (!videoUrl) {
    alert("No video found for this event.");
    return;
  }

  const videoId = getYouTubeVideoId(videoUrl);
  const startTime = Math.max(0, Math.floor(Number(event.videoTime || 0) - 10));

  shotVideoFrame.src =
    `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;

  shotVideoSection.style.display = "block";
}

function renderPlayerCardShotMap(player) {
  const seasonId = seasonSelect.value;
  const selectedGameId = document.getElementById(`player-card-game-${player}`).value;
  const selectedType = document.getElementById(`player-card-type-${player}`).value;

  let seasonEvents = getSeasonEvents(seasonId);

  if (selectedGameId !== "all") {
    seasonEvents = seasonEvents.filter(
      (event) => event.gameId === selectedGameId
    );
  }

  let eventsToShow = [];

  if (selectedType === "shots") {
    eventsToShow = seasonEvents.filter(
      (event) =>
        (event.eventType === "shot" || event.eventType === "goal") &&
        event.player === player
    );
  }

  if (selectedType === "shotAssists") {
    eventsToShow = seasonEvents.filter(
      (event) =>
        (event.eventType === "shot" || event.eventType === "goal") &&
        event.shotAssist === player
    );
  }

  const dotsContainer = document.getElementById(`player-card-dots-${player}`);
  dotsContainer.innerHTML = "";

  eventsToShow.forEach((event) => {
    const { x, y } = normalizeShotCoordinatesForCards(event);
    const pixel = rinkToPixelCoordinates(x, y);

    const dot = document.createElement("div");
    dot.classList.add("shot-dot");

    if (event.eventType === "goal") {
      dot.classList.add("goal-dot");
    }

    dot.title = getShotTooltip(event);
    dot.style.left = `${pixel.left}%`;
    dot.style.top = `${pixel.top}%`;

    dot.addEventListener("click", () => {
      showShotClip(event);
    });

    dotsContainer.appendChild(dot);
  });
}

function normalizeShotCoordinatesForCards(event) {
  const savedGames = getSavedGames();
  const game = savedGames.find(
    (savedGame) =>
      savedGame.seasonId === seasonSelect.value &&
      savedGame.gameId === event.gameId
  );

  let gameData = null;

  if (game) {
    const savedGame = localStorage.getItem(
      getGameStorageKey(game.seasonId, game.gameId)
    );

    if (savedGame) {
      gameData = JSON.parse(savedGame);
    }
  }

  const period1Direction = gameData?.period1AttackDirection || "right";
  const period = String(event.period);

  const attackingRight =
    period === "1" || period === "3" || period === "OT"
      ? period1Direction === "right"
      : period1Direction === "left";

  const x = Number(event.x);
  const y = Number(event.y);

  if (!attackingRight) {
    return {
      x: -x,
      y: -y,
    };
  }

  return { x, y };
}

function getRinkMarkup(dotsId = "") {
  return `
    <div class="goal-line left-goal-line"></div>
    <div class="goal-line right-goal-line"></div>

    <div class="faceoff-circle left-zone top"></div>
    <div class="faceoff-circle left-zone bottom"></div>
    <div class="faceoff-circle right-zone top"></div>
    <div class="faceoff-circle right-zone bottom"></div>

    <div class="faceoff-dot left-top-dot"></div>
    <div class="faceoff-dot left-bottom-dot"></div>
    <div class="faceoff-dot right-top-dot"></div>
    <div class="faceoff-dot right-bottom-dot"></div>

    <div class="neutral-dot left-top-neutral"></div>
    <div class="neutral-dot left-bottom-neutral"></div>
    <div class="neutral-dot right-top-neutral"></div>
    <div class="neutral-dot right-bottom-neutral"></div>

    <div class="center-circle"></div>

    <div class="crease left-crease"></div>
    <div class="crease right-crease"></div>

    <div class="blue-line left-blue-line"></div>
    <div class="blue-line right-blue-line"></div>
    <div class="center-line"></div>

    <div class="shot-dots-layer" ${dotsId ? `id="${dotsId}"` : ""}></div>
  `;
}

function showPanel(panelId) {
  document.querySelectorAll(".dashboard-panel").forEach((panel) => {
    panel.style.display = "none";
  });

  document.getElementById(panelId).style.display = "block";

  if (panelId === "shotMapPanel") {
    if (currentGameData) {
      shotMapSection.style.display = "block";
      const filteredEvents = filterEventsBySituation(currentEvents);
      renderShotMap(filteredEvents);
    } else {
      shotMapSection.style.display = "none";
      shotMapDots.innerHTML = "";
    }
  }

  if (panelId === "playerTotalsPanel") {
    const filteredEvents = filterEventsBySituation(currentEvents);
    renderPlayerTotals(filteredEvents);
  }
}

seasonSelect.addEventListener("change", () => {
  const dashboardContent = document.getElementById("dashboardContent");

  if (seasonSelect.value) {
    dashboardContent.style.display = "block";
    refreshGamesDropdown();
  } else {
    dashboardContent.style.display = "none";
  }
});

seasonSelect.addEventListener("change", () => {
  const dashboardContent = document.getElementById("dashboardContent");

  if (!seasonSelect.value) {
    dashboardContent.style.display = "none";
    return;
  }

  dashboardContent.style.display = "block";

  populateGames();
  populateSeasonCardPlayers();
  renderRoster();
  showPanel("summaryPanel");
  populateGameRosterGames();
  populateGameRosterPlayers();
  populateLineComboGames();
});

gameSelect.addEventListener("change", () => {
  if (!seasonSelect.value || !gameSelect.value) {
    return;
  }

  loadGameData();
  showPanel("summaryPanel");
});

function getGameRosterKey(seasonId, gameId) {
  return `hockey-game-roster-${seasonId}-${gameId}`;
}

function getGameRoster(seasonId, gameId) {
  return JSON.parse(localStorage.getItem(getGameRosterKey(seasonId, gameId)) || "{}");
}

function saveGameRoster(seasonId, gameId, roster) {
  localStorage.setItem(getGameRosterKey(seasonId, gameId), JSON.stringify(roster));
}

function populateGameRosterGames() {
  const seasonId = seasonSelect.value;
  const savedGames = getSavedGames();

  gameRosterGameSelect.innerHTML = `<option value="">Select game...</option>`;

  savedGames
    .filter((game) => game.seasonId === seasonId)
    .forEach((game) => {
      const option = document.createElement("option");
      option.value = game.gameId;
      option.textContent = game.gameId;
      gameRosterGameSelect.appendChild(option);
    });
}

function renderGameRoster() {
  const seasonId = seasonSelect.value;
  const gameId = gameRosterGameSelect.value;

  if (!seasonId || !gameId) {
    gameRosterList.innerHTML = "<p>Select a game to view roster.</p>";
    return;
  }

  const roster = getGameRoster(seasonId, gameId);

  gameRosterList.innerHTML = Object.entries(roster)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(
      ([number, player]) => `
        <div class="roster-row">
          <span>#${number} — ${player.name} — ${player.position}</span>

          <button type="button" onclick="editGameRosterPlayer('${number}')">
            Edit
          </button>

          <button type="button" onclick="deleteGameRosterPlayer('${number}')">
            Delete
          </button>
        </div>
      `
    )
    .join("");
}

function editGameRosterPlayer(number) {
  const seasonId = seasonSelect.value;
  const gameId = gameRosterGameSelect.value;
  const roster = getGameRoster(seasonId, gameId);

  gameRosterNumber.value = number;
  gameRosterName.value = roster[number].name;
  gameRosterPosition.value = roster[number].position;
}

function deleteGameRosterPlayer(number) {
  const seasonId = seasonSelect.value;
  const gameId = gameRosterGameSelect.value;
  const roster = getGameRoster(seasonId, gameId);

  if (!confirm(`Delete player #${number} from this game roster?`)) {
    return;
  }

  delete roster[number];

  saveGameRoster(seasonId, gameId, roster);
  renderGameRoster();
}

gameRosterGameSelect.addEventListener("change", renderGameRoster);

addGameRosterPlayerBtn.addEventListener("click", () => {
  const seasonId = seasonSelect.value;
  const gameId = gameRosterGameSelect.value;

  if (!seasonId || !gameId) {
    alert("Please select a game first.");
    return;
  }

  const playerNumber = gameRosterPlayer.value;
  const seasonRoster = getRoster(seasonId);
  const playerName = seasonRoster[playerNumber];
  const position = gameRosterPosition.value;
  const roster = getGameRoster(seasonId, gameId);

  roster[playerNumber] = {
  name: playerName,
  position: gameRosterPosition.value,
};
  saveGameRoster(seasonId, gameId, roster);
  renderGameRoster();

  gameRosterNumber.value = "";
  gameRosterName.value = "";
  gameRosterPosition.value = "forward";
});

function populateGameRosterPlayers() {
  const seasonId = seasonSelect.value;

  if (!seasonId) return;

  const roster = getRoster(seasonId);

  gameRosterPlayer.innerHTML =
    '<option value="">Select Player...</option>';

  Object.entries(roster)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([number, name]) => {
      const option = document.createElement("option");

      option.value = number;
      option.textContent = `#${number} ${name}`;

      gameRosterPlayer.appendChild(option);
    });
}

function populateLineComboGames() {
  const seasonId = seasonSelect.value;
  const savedGames = getSavedGames();

  lineComboGameSelect.innerHTML = `
    <option value="all">All Games</option>
  `;

  savedGames
    .filter((game) => game.seasonId === seasonId)
    .forEach((game) => {
      const option = document.createElement("option");
      option.value = game.gameId;
      option.textContent = game.gameId;
      lineComboGameSelect.appendChild(option);
    });
}

function getEventsForLineCombos() {
  const seasonId = seasonSelect.value;
  const selectedGame = lineComboGameSelect.value;

  let events = getSeasonEvents(seasonId);

  if (selectedGame !== "all") {
    events = events.filter((event) => event.gameId === selectedGame);
  }

  return events;
}

function getGameRosterForEvent(event) {
  return getGameRoster(seasonSelect.value, event.gameId);
}

function getPlayersByPosition(event, position) {
  const roster = getGameRosterForEvent(event);

  return Object.entries(roster)
    .filter(([, player]) => player.position === position)
    .map(([number]) => number);
}

function getCombinations(players, size) {
  if (size === 0) return [[]];
  if (players.length < size) return [];

  const [first, ...rest] = players;

  return [
    ...getCombinations(rest, size - 1).map((combo) => [first, ...combo]),
    ...getCombinations(rest, size),
  ];
}

function parseOnIcePlayers(event) {
  if (event.eventType === "opponent_shot" || event.eventType === "opponent_goal") {
    return parsePlayerList(event.shotAgainstPlayers || "");
  }

  return parsePlayerList(event.playersOnIce || "");
}

function renderLineCombinations(type) {
  const events = getEventsForLineCombos().filter(isEvenStrength);
  const comboSize = type === "forward" ? 3 : 2;
  const position = type === "forward" ? "forward" : "defenseman";
  const combos = {};

  currentLineComboType = type;

  events.forEach((event) => {
    const isShotFor = event.eventType === "shot" || event.eventType === "goal";
    const isShotAgainst =
      event.eventType === "opponent_shot" ||
      event.eventType === "opponent_goal";

    if (!isShotFor && !isShotAgainst) {
      return;
    }

    const onIcePlayers = parseOnIcePlayers(event);

    const eligiblePlayers = getPlayersByPosition(event, position).filter(
      (player) => onIcePlayers.includes(player)
    );

    const playerCombos = getCombinations(eligiblePlayers.sort(), comboSize);

    playerCombos.forEach((combo) => {
      const key = combo.join(",");

      if (!combos[key]) {
        combos[key] = {
          combo: key,
          onIceGoalsFor: 0,
          onIceGoalsAgainst: 0,
          onIceShotsFor: 0,
          onIceShotsAgainst: 0,
          goalSharePercentage: 0,
          shotSharePercentage: 0,
          pdo: 0,
        };
      }

      if (isShotFor) {
        combos[key].onIceShotsFor += 1;
      }

      if (event.eventType === "goal") {
        combos[key].onIceGoalsFor += 1;
      }

      if (isShotAgainst) {
        combos[key].onIceShotsAgainst += 1;
      }

      if (event.eventType === "opponent_goal") {
        combos[key].onIceGoalsAgainst += 1;
      }
    });
  });

  const minimumTotalShots = Number(lineComboMinShots.value || 0);

  currentLineComboRows = Object.values(combos).map((stats) => {
    const totalGoals =
      stats.onIceGoalsFor + stats.onIceGoalsAgainst;

    const totalShots =
      stats.onIceShotsFor + stats.onIceShotsAgainst;

    const onIceShooting =
      stats.onIceShotsFor > 0
        ? (stats.onIceGoalsFor / stats.onIceShotsFor) * 100
        : 0;

    const onIceSave =
      stats.onIceShotsAgainst > 0
        ? ((stats.onIceShotsAgainst - stats.onIceGoalsAgainst) /
            stats.onIceShotsAgainst) *
          100
        : 0;

    return {
      ...stats,
      goalSharePercentage:
        totalGoals > 0
          ? (stats.onIceGoalsFor / totalGoals) * 100
          : 0,
      shotSharePercentage:
        totalShots > 0
          ? (stats.onIceShotsFor / totalShots) * 100
          : 0,
      pdo: onIceShooting + onIceSave,

      
    };
    
  })
    .filter(
    (stats) =>
      stats.onIceShotsFor + stats.onIceShotsAgainst >= minimumTotalShots
  );
  

  sortLineCombinations(currentLineComboSortColumn, true);
}

showForwardLinesBtn.addEventListener("click", () => {
  renderLineCombinations("forward");
});

showDefensePairsBtn.addEventListener("click", () => {
  renderLineCombinations("defenseman");
});

function isEvenStrength(event) {
  return ["5v5", "4v4", "3v3"].includes(event.situation);
}

function sortLineCombinations(column, keepDirection = false) {
  if (!keepDirection) {
    if (currentLineComboSortColumn === column) {
      currentLineComboSortAscending = !currentLineComboSortAscending;
    } else {
      currentLineComboSortColumn = column;
      currentLineComboSortAscending = false;
    }
  }

  const sortedRows = [...currentLineComboRows].sort((a, b) => {
    if (column === "combo") {
      return currentLineComboSortAscending
        ? a.combo.localeCompare(b.combo)
        : b.combo.localeCompare(a.combo);
    }

    return currentLineComboSortAscending
      ? a[column] - b[column]
      : b[column] - a[column];
  });

  renderLineComboTable(sortedRows);
}

function renderLineComboTable(rows) {
  const title =
    currentLineComboType === "forward"
      ? "Forward Lines"
      : "Defensive Pairs";

  const comboHeader =
    currentLineComboType === "forward"
      ? "Forward Line"
      : "Defense Pair";

  const tableRows = rows
    .map(
      (stats) => `
        <tr>
          <td>${stats.combo}</td>
          <td>${stats.onIceGoalsFor}</td>
          <td>${stats.onIceGoalsAgainst}</td>
          <td>${stats.goalSharePercentage.toFixed(1)}%</td>
          <td>${stats.onIceShotsFor}</td>
          <td>${stats.onIceShotsAgainst}</td>
          <td>${stats.shotSharePercentage.toFixed(1)}%</td>
          <td>${stats.pdo.toFixed(1)}</td>
        </tr>
      `
    )
    .join("");

  lineCombinationsContent.innerHTML = `
    <h3>${title}</h3>
    <p>Even strength only</p>

    <table>
      <thead>
        <tr>
          <th onclick="sortLineCombinations('combo')">${comboHeader}</th>
          <th onclick="sortLineCombinations('onIceGoalsFor')">GF</th>
          <th onclick="sortLineCombinations('onIceGoalsAgainst')">GA</th>
          <th onclick="sortLineCombinations('goalSharePercentage')">Goal Share %</th>
          <th onclick="sortLineCombinations('onIceShotsFor')">SF</th>
          <th onclick="sortLineCombinations('onIceShotsAgainst')">SA</th>
          <th onclick="sortLineCombinations('shotSharePercentage')">Shot Share %</th>
          <th onclick="sortLineCombinations('pdo')">PDO</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

populateSeasons();