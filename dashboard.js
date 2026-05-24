const seasonSelect = document.getElementById("seasonSelect");
const gameSelect = document.getElementById("gameSelect");
const loadDashboardBtn = document.getElementById("loadDashboardBtn");
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

let currentTotals = {};
let currentSortColumn = "player";
let currentSortAscending = true;

let currentEvents = [];

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
} else {
  const savedGame = localStorage.getItem(getGameStorageKey(seasonId, gameId));

  if (!savedGame) {
    alert("Game data not found.");
    return;
  }

  const gameData = JSON.parse(savedGame);
  events = gameData.events || [];
}

  currentEvents = events;
    const filteredEvents = filterEventsBySituation(currentEvents);

  renderPlayerTotals(filteredEvents);

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

const playerEntries = Object.entries(totals)
  .filter(([player]) => selectedPlayer === "all" || player === selectedPlayer);

  const cards = playerEntries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([player, stats]) => `
      <div class="player-card">
        <h3>#${player} ${roster[player] || ""}</h3>

        <p class="${getRankClass(totals, "goals", player)}"><strong>Goals:</strong> ${stats.goals} <span>Team Rank: #${getRank(totals, "goals", player)}</span></p>
        <p class="${getRankClass(totals, "assists", player)}"><strong>Assists:</strong> ${stats.assists} <span>Team Rank: #${getRank(totals, "assists", player)}</span></p>
        <p class="${getRankClass(totals, "points", player)}"><strong>Points:</strong> ${stats.points} <span>Team Rank: #${getRank(totals, "points", player)}</span></p>

        <p class="${getRankClass(totals, "shots", player)}"><strong>Shots:</strong> ${stats.shots} <span>Team Rank: #${getRank(totals, "shots", player)}</span></p>
        <p class="${getRankClass(totals, "shotAssists", player)}"><strong>Shot Assists:</strong> ${stats.shotAssists} <span>Team Rank: #${getRank(totals, "shotAssists", player)}</span></p>
        <p class="${getRankClass(totals, "shotDifferential", player)}"><strong>On-Ice Shot Differential:</strong> ${stats.onIceShotsFor - stats.onIceShotsAgainst} <span>Team Rank: #${getRank(totals, "shotDifferential", player)}</span></p>

        <p class="${getRankClass(totals, "onIceGoalDifferential", player)}"><strong>On-Ice Goal Differential:</strong> ${stats.onIceGoalDifferential} <span>Team Rank: #${getRank(totals, "onIceGoalDifferential", player)}</span></p>
        <p class="${getRankClass(totals, "controlledEntries", player)}"><strong>Controlled Entries:</strong> ${stats.controlledEntries} <span>Team Rank: #${getRank(totals, "controlledEntries", player)}</span></p>
        <p class="${getRankClass(totals, "controlledExits", player)}"><strong>Controlled Exits:</strong> ${stats.controlledExits} <span>Team Rank: #${getRank(totals, "controlledExits", player)}</span></p>
        <p class="${getRankClass(totals, "drawnPenalties", player)}"><strong>Penalties Drawn:</strong> ${stats.drawnPenalties} <span>Team Rank: #${getRank(totals, "drawnPenalties", player)}</span></p>
      </div>
    `)
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
    .map(([number, name]) => `<p>#${number} — ${name}</p>`)
    .join("");
}

addRosterPlayerBtn.addEventListener("click", () => {
  const seasonId = seasonSelect.value;

  if (!seasonId) {
    alert("Please select a season first.");
    return;
  }

  const number = rosterNumber.value.trim();
  const name = rosterName.value.trim();

  if (!number || !name) {
    alert("Please enter both player number and name.");
    return;
  }

  const roster = getRoster(seasonId);
  roster[number] = name;

  saveRoster(seasonId, roster);
  renderRoster();

  rosterNumber.value = "";
  rosterName.value = "";
});

loadSeasonCardsBtn.addEventListener("click", renderSeasonPlayerCards);

seasonSelect.addEventListener("change", () => {
  populateGames();
  populateSeasonCardPlayers();
  renderRoster();
});

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
loadDashboardBtn.addEventListener("click", loadGameData);
situationFilter.addEventListener("change", () => {
  const filteredEvents = filterEventsBySituation(currentEvents);
  renderPlayerTotals(filteredEvents);
});

populateSeasons();