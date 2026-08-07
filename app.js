const rink = document.getElementById("rink");
const dot = document.getElementById("dot");
const coordsDisplay = document.getElementById("coords");
const eventTable = document.getElementById("eventTable");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const logBtn = document.getElementById("logBtn");
const deleteLastBtn = document.getElementById("deleteLastBtn");
const videoInput = document.getElementById("videoInput");
const gameVideo = document.getElementById("gameVideo");
const back5Btn = document.getElementById("back5Btn");
const forward5Btn = document.getElementById("forward5Btn");
const youtubeUrls = document.getElementById("youtubeUrls");
const videoSelect = document.getElementById("videoSelect");
const loadYoutubeBtn = document.getElementById("loadYoutubeBtn");
const saveGameBtn = document.getElementById("saveGameBtn");
const savedGamesSelect = document.getElementById("savedGamesSelect");
const openSelectedGameBtn = document.getElementById("openSelectedGameBtn");
const deleteSavedGameBtn = document.getElementById("deleteSavedGameBtn");
const seasonIdInput = document.getElementById("seasonId");
const savedSeasonsSelect = document.getElementById("savedSeasonsSelect");
const newSeasonInput = document.getElementById("newSeasonInput");
const createSeasonBtn = document.getElementById("createSeasonBtn");
const createSeasonStatus = document.getElementById("createSeasonStatus");
const newPlayerNumber = document.getElementById("newPlayerNumber");
const newPlayerName = document.getElementById("newPlayerName");
const addRosterPlayerBtn = document.getElementById("addRosterPlayerBtn");
const addRosterStatus = document.getElementById("addRosterStatus");
const rosterListEl = document.getElementById("rosterList");
const newGameDate = document.getElementById("newGameDate");
const createGameBtn = document.getElementById("createGameBtn");
const createGameStatus = document.getElementById("createGameStatus");
const gamesListEl = document.getElementById("gamesList");
const newOpponentName = document.getElementById("newOpponentName");
const addOpponentBtn = document.getElementById("addOpponentBtn");
const addOpponentStatus = document.getElementById("addOpponentStatus");
const opponentsListEl = document.getElementById("opponentsList");
const gameOpponentSelect = document.getElementById("gameOpponentSelect");
const gameRosterGameSelect = document.getElementById("gameRosterGameSelect");
const gameRosterCheckboxesEl = document.getElementById("gameRosterCheckboxes");
const saveGameRosterBtn = document.getElementById("saveGameRosterBtn");
const saveGameRosterStatus = document.getElementById("saveGameRosterStatus");
const eventGameSelect = document.getElementById("eventGameSelect");
const dbEventStatus = document.getElementById("dbEventStatus");
const saveVideosBtn = document.getElementById("saveVideosBtn");
const saveVideosStatus = document.getElementById("saveVideosStatus");
const gameVideosListEl = document.getElementById("gameVideosList");
const period1AttackDirection = document.getElementById("period1AttackDirection");

let selectedLocation = null;
let events = [];
let editingIndex = null;
let loadedSeasons = [];
let loadedGames = [];
let loadedRoster = [];
let loadedGameVideos = [];

let youtubePlayer = null;

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

function getYouTubeVideoId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : url;
}

function getGameStorageKey(seasonId, gameId) {
  return `hockey-game-${seasonId}-${gameId}`;
}

window.onYouTubeIframeAPIReady = function () {
  console.log("YouTube API ready");
};

function getFormValues() {
  // The Player/assist fields are now dropdowns tied to real player IDs
  // (needed for the database write below). This keeps the older local
  // event table showing readable "#19 — Name" text instead of raw IDs.
  const getSelectLabel = (id) => {
    const el = document.getElementById(id);
    return el.value ? el.selectedOptions[0].textContent : "";
  };

  return {
    gameId: document.getElementById("gameId").value,
    period: document.getElementById("period").value,
    time: document.getElementById("time").value,
    player: getSelectLabel("player"),
    eventType: document.getElementById("eventType").value,
    shotAssist: getSelectLabel("shotAssist"),
    playersOnIce: getCheckedPlayerLabels("playersOnIceCheckboxes"),
    shotAgainstPlayers: getCheckedPlayerLabels("shotAgainstCheckboxes"),
    ledToShot: document.getElementById("ledToShot").value,
    entryExitType: document.getElementById("entryExitType").value,
    situation: document.getElementById("situation").value,
    primaryAssist: getSelectLabel("primaryAssist"),
    secondaryAssist: getSelectLabel("secondaryAssist"),
  };
}

function pixelToRinkCoordinates(clickX, clickY, width, height) {
  const x = (clickX / width) * 200 - 100;
  const y = 42.5 - (clickY / height) * 85;

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  };
}

function renderEvents() {
  eventTable.innerHTML = "";

  events.forEach((event, index) => {
    const row = document.createElement("tr");

row.innerHTML = `
  <td>${event.gameId}</td>
  <td>${event.period}</td>
  <td>${event.time}</td>
  <td>${event.player}</td>
  <td>${event.eventType}</td>
  <td>${event.x}</td>
  <td>${event.y}</td>
  <td>${event.shotAssist}</td>
  <td>${event.playersOnIce}</td>
  <td>${event.shotAgainstPlayers}</td>
  <td>${event.ledToShot}</td>
  <td>${event.entryExitType}</td>
  <td>${event.situation}</td>
  <td>${event.videoTime}</td>
  <td>${event.primaryAssist}</td>
<td>${event.secondaryAssist}</td>
  <td>
    <button class="goto-btn" data-index="${index}">
      Go To
    </button>
  </td>

  <td>
  <button class="edit-btn" data-index="${index}" type="button">Edit</button>
</td>
`;

    eventTable.appendChild(row);

    const goToBtn = row.querySelector(".goto-btn");

goToBtn.addEventListener("click", () => {
  // Database-loaded events carry their own video URL directly (joined
  // in when the game's history was loaded), so this takes priority
  // over the old textarea-index lookup below.
  if (event.videoUrl) {
    loadYouTubeVideo(event.videoUrl);

    setTimeout(() => {
      if (youtubePlayer && typeof youtubePlayer.seekTo === "function") {
        youtubePlayer.seekTo(Number(event.videoTime || 0), true);
        youtubePlayer.playVideo();
      }
    }, 1000);
    return;
  }

  const urls = getYouTubeUrls();
  const eventVideoIndex = Number(event.videoIndex || 0);
  const eventVideoUrl = urls[eventVideoIndex];

  if (eventVideoUrl) {
    videoSelect.value = String(eventVideoIndex);
    loadYouTubeVideo(eventVideoUrl);

    setTimeout(() => {
      youtubePlayer.seekTo(Number(event.videoTime), true);
      youtubePlayer.playVideo();
    }, 1000);
  } else if (gameVideo && event.videoTime) {
    gameVideo.currentTime = Number(event.videoTime);
    gameVideo.play();
  }
});

const editBtn = row.querySelector(".edit-btn");

editBtn.addEventListener("click", () => {
  editingIndex = index;

  document.getElementById("gameId").value = event.gameId;
  document.getElementById("period").value = event.period;
  document.getElementById("time").value = event.time;
  document.getElementById("player").value = event.player;
  document.getElementById("eventType").value = event.eventType;
  document.getElementById("shotAssist").value = event.shotAssist;
  document.getElementById("playersOnIce").value = event.playersOnIce;
  document.getElementById("shotAgainstPlayers").value = event.shotAgainstPlayers;
  document.getElementById("ledToShot").value = event.ledToShot;
  document.getElementById("entryExitType").value = event.entryExitType;
  document.getElementById("situation").value = event.situation;

  selectedLocation = {
    x: event.x,
    y: event.y,
  };

  coordsDisplay.textContent = `Editing Coordinates: (${event.x}, ${event.y})`;
  logBtn.textContent = "Update Event";
});
  });
  
}

rink.addEventListener("click", (event) => {
  const rect = rink.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  const { x, y } = pixelToRinkCoordinates(clickX, clickY, rect.width, rect.height);

  selectedLocation = { x, y, clickX, clickY };

  dot.style.left = `${clickX}px`;
  dot.style.top = `${clickY}px`;
  dot.style.display = "block";

  coordsDisplay.textContent = `Selected Coordinates: (${x}, ${y})`;
});

exportBtn.addEventListener("click", () => {
const headers = [
  "gameId",
  "period",
  "time",
  "player",
  "eventType",
  "x",
  "y",
  "shotAssist",
  "playersOnIce",
  "shotAgainstPlayers",
  "ledToShot",
  "entryExitType",
  "situation",
  "videoTime",
];

  const csvRows = [
    headers.join(","),
    ...events.map((event) =>
      headers.map((header) => `"${event[header] ?? ""}"`).join(",")
    ),
  ];

  const csv = csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "hockey-events.csv";
  link.click();

  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  events = [];
  dot.style.display = "none";
  coordsDisplay.textContent = "Coordinates: none";
  renderEvents();
});

logBtn.addEventListener("click", () => {
  if (!selectedLocation) {
    alert("Please click a location on the rink first.");
    return;
  }

  const formValues = getFormValues();

  let currentVideoTime = 0;

try {
  if (
    youtubePlayer &&
    typeof youtubePlayer.getCurrentTime === "function"
  ) {
    currentVideoTime = Number(
      youtubePlayer.getCurrentTime().toFixed(2)
    );
  } else if (gameVideo) {
    currentVideoTime = Number(
      gameVideo.currentTime.toFixed(2)
    );
  }
} catch (error) {
  currentVideoTime = 0;
}
  const loggedEvent = {
    id: crypto.randomUUID(),
    ...formValues,
    x: selectedLocation.x,
    y: selectedLocation.y,
    videoIndex: Number(videoSelect.value || 0),
    videoTime:
      editingIndex !== null
        ? events[editingIndex].videoTime
        : currentVideoTime,
  };

  if (editingIndex !== null) {
    loggedEvent.id = events[editingIndex].id;
    events[editingIndex] = loggedEvent;
    editingIndex = null;
    logBtn.textContent = "Log Event";
  } else {
    events.push(loggedEvent);
  }

  renderEvents();
});

// Writes the same click to the real events table. A separate listener
// on purpose, so the older local-array behavior above stays untouched.
logBtn.addEventListener("click", async () => {
  if (!selectedLocation) {
    return; // already alerted by the listener above
  }

  // Editing a local-only row isn't the same as logging a new event --
  // skip the database write in that case, to avoid an unintended
  // duplicate row. (Real "edit an existing database event" is a
  // separate feature, not part of this first pass.)
  if (editingIndex !== null) {
    return;
  }

  const gameId = eventGameSelect.value;

  if (!gameId) {
    alert("Select a game under \"Event Game (database)\" before logging.");
    return;
  }

  if (!currentTeamId) {
    return;
  }

  dbEventStatus.textContent = "Saving...";

  const playerSelect = document.getElementById("player");
  const playerId = playerSelect.value || null;

  const shotAssistId = document.getElementById("shotAssist").value || null;
  const primaryAssistId = document.getElementById("primaryAssist").value || null;
  const secondaryAssistId = document.getElementById("secondaryAssist").value || null;

  const playersOnIceFor = getCheckedPlayerIds("playersOnIceCheckboxes");
  const playersOnIceAgainst = getCheckedPlayerIds("shotAgainstCheckboxes");

  const selectedVideo = loadedGameVideos[Number(videoSelect.value || 0)] || null;
  let videoTime = null;
  try {
    if (youtubePlayer && typeof youtubePlayer.getCurrentTime === "function") {
      videoTime = Number(youtubePlayer.getCurrentTime().toFixed(2));
    }
  } catch (error) {
    videoTime = null;
  }

  const { error } = await supabaseClient.from("events").insert({
    team_id: currentTeamId,
    game_id: gameId,
    period: document.getElementById("period").value,
    time_in_period: document.getElementById("time").value,
    event_type: document.getElementById("eventType").value,
    player_id: playerId,
    shot_assist_player_id: shotAssistId,
    primary_assist_player_id: primaryAssistId,
    secondary_assist_player_id: secondaryAssistId,
    players_on_ice_for: playersOnIceFor.length > 0 ? playersOnIceFor : null,
    players_on_ice_against: playersOnIceAgainst.length > 0 ? playersOnIceAgainst : null,
    situation: document.getElementById("situation").value,
    entry_exit_type: document.getElementById("entryExitType").value,
    x: selectedLocation.x,
    y: selectedLocation.y,
    video_id: selectedVideo ? selectedVideo.id : null,
    video_time: videoTime,
  });

  dbEventStatus.textContent = error
    ? `Error: ${error.message}`
    : "Saved to database.";
});

  deleteLastBtn.addEventListener("click", () => {
  if (events.length === 0) {
    alert("No events to delete.");
    return;
  }
  events.pop();

  renderEvents();
});

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];

  if (!file) {
    return;
  }

  gameVideo.src = URL.createObjectURL(file);
});

back5Btn.addEventListener("click", () => {
  gameVideo.currentTime = Math.max(0, gameVideo.currentTime - 5);
});

forward5Btn.addEventListener("click", () => {
  gameVideo.currentTime += 5;
});

loadYoutubeBtn.addEventListener("click", () => {
  const selectedIndex = Number(videoSelect.value || 0);
  const video = loadedGameVideos[selectedIndex];

  if (!video) {
    alert("Select an Event Game above, then save a video URL first.");
    return;
  }

  loadYouTubeVideo(video.url);
});

videoSelect.addEventListener("change", () => {
  const selectedIndex = Number(videoSelect.value);
  const video = loadedGameVideos[selectedIndex];

  if (!video) {
    return;
  }

  loadYouTubeVideo(video.url);
});

function getSavedGames() {
  return JSON.parse(localStorage.getItem("savedGames") || "[]");
}

function saveSavedGames(savedGames) {
  localStorage.setItem("savedGames", JSON.stringify(savedGames));
}

function refreshSavedGamesSelect() {
  const selectedSeason = savedSeasonsSelect.value;
  const savedGames = getSavedGames();

  savedGamesSelect.innerHTML = `<option value="">Select saved game...</option>`;

  savedGames
    .filter((game) => game.seasonId === selectedSeason)
    .forEach((game) => {
      const option = document.createElement("option");
      option.value = game.gameId;
      option.textContent = game.gameId;
      savedGamesSelect.appendChild(option);
    });
}

savedSeasonsSelect.addEventListener("change", refreshSavedGamesSelect);

function saveCurrentGame() {
  const seasonId = seasonIdInput.value.trim();
  const gameId = document.getElementById("gameId").value.trim();

  if (!seasonId) {
    alert("Please enter a Season first.");
    return;
  }

  if (!gameId) {
    alert("Please enter a Game ID first.");
    return;
  }

  const gameData = {
    seasonId,
    gameId,
    youtubeUrls: getYouTubeUrls(),
    period1AttackDirection: period1AttackDirection.value,
    events,
  };

  localStorage.setItem(
    getGameStorageKey(seasonId, gameId),
    JSON.stringify(gameData)
  );

  const savedGames = getSavedGames();

  const alreadyExists = savedGames.some(
    (game) => game.seasonId === seasonId && game.gameId === gameId
  );

  if (!alreadyExists) {
    savedGames.push({ seasonId, gameId });
    saveSavedGames(savedGames);
  }

  refreshSavedSeasonsSelect();
  refreshSavedGamesSelect();

  alert("Game saved.");
}

function openGame(seasonId, gameId) {
  const savedGame = localStorage.getItem(getGameStorageKey(seasonId, gameId));

  if (!savedGame) {
    alert("Saved game not found.");
    return;
  }

  const gameData = JSON.parse(savedGame);

  document.getElementById("gameId").value = gameData.gameId;
  period1AttackDirection.value = gameData.period1AttackDirection || "right";
  youtubeUrls.value = (gameData.youtubeUrls || []).join("\n");
  refreshVideoSelect();
  events = gameData.events || [];

  renderEvents();

  const urls = getYouTubeUrls();

if (urls.length > 0) {
  videoSelect.value = "0";
  loadYouTubeVideo(urls[0]);
}

  alert("Game loaded.");
}

function loadYouTubeVideo(url) {
  const videoId = getYouTubeVideoId(url);

  if (youtubePlayer && typeof youtubePlayer.loadVideoById === "function") {
    youtubePlayer.loadVideoById(videoId);
    return;
  }

  youtubePlayer = new YT.Player("youtubePlayer", {
    height: "450",
    width: "800",
    videoId,
  });
}

saveGameBtn.addEventListener("click", saveCurrentGame);

openSelectedGameBtn.addEventListener("click", () => {
  const selectedSeasonId = savedSeasonsSelect.value;
  const selectedGameId = savedGamesSelect.value;

  if (!selectedSeasonId || !selectedGameId) {
    alert("Please select a season and game first.");
    return;
  }

  openGame(selectedSeasonId, selectedGameId);
});

deleteSavedGameBtn.addEventListener("click", () => {
  const selectedGameId = savedGamesSelect.value;

  if (!selectedGameId) {
    alert("Please select a saved game to delete.");
    return;
  }

  const confirmDelete = confirm(`Delete saved game "${selectedGameId}"?`);

  if (!confirmDelete) {
    return;
  }

  localStorage.removeItem(`hockey-game-${selectedGameId}`);

  const updatedSavedGames = getSavedGames().filter(
    (game) => game.gameId !== selectedGameId
  );

  saveSavedGames(updatedSavedGames);
  refreshSavedGamesSelect();

  alert("Saved game deleted.");
});

function getYouTubeUrls() {
  return youtubeUrls.value
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url !== "");
}

function refreshVideoSelect() {
  const urls = getYouTubeUrls();

  videoSelect.innerHTML = "";

  urls.forEach((url, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Video ${index + 1}`;
    videoSelect.appendChild(option);
  });
}

function refreshSavedSeasonsSelect() {
  const savedGames = getSavedGames();
  const seasons = [...new Set(savedGames.map((game) => game.seasonId))];

  savedSeasonsSelect.innerHTML = `<option value="">Select season...</option>`;

  seasons.forEach((seasonId) => {
    const option = document.createElement("option");
    option.value = seasonId;
    option.textContent = seasonId;
    savedSeasonsSelect.appendChild(option);
  });
}

// ---- Database-backed version, added while migrating off localStorage ----
// Called from auth-gate.js once we know which team the logged-in user
// belongs to. Overwrites the localStorage-derived list above with the
// real thing once it arrives.
async function loadSeasonsFromDatabase(teamId) {
  const { data, error } = await supabaseClient
    .from("seasons")
    .select("id, label")
    .eq("team_id", teamId)
    .order("label");

  if (error) {
    console.error("Could not load seasons from database:", error.message);
    return;
  }

  loadedSeasons = data;

  savedSeasonsSelect.innerHTML = `<option value="">Select season...</option>`;

  data.forEach((season) => {
    const option = document.createElement("option");
    option.value = season.label;
    option.textContent = season.label;
    savedSeasonsSelect.appendChild(option);
  });
}

// The season dropdown's value is still the label text (to avoid breaking
// the localStorage-based game filtering above), so anything that needs
// the real database id -- like roster rows -- looks it up here.
function getSelectedSeasonId() {
  const match = loadedSeasons.find((season) => season.label === savedSeasonsSelect.value);
  return match ? match.id : null;
}

async function loadRosterFromDatabase(seasonId) {
  const { data, error } = await supabaseClient
    .from("roster_players")
    .select("id, jersey_number, name")
    .eq("season_id", seasonId)
    .order("jersey_number");

  if (error) {
    console.error("Could not load roster:", error.message);
    return;
  }

  loadedRoster = data;
  rosterListEl.innerHTML = "";

  data.forEach((player) => {
    const row = document.createElement("p");
    row.textContent = `#${player.jersey_number} — ${player.name}`;
    rosterListEl.appendChild(row);
  });
}

async function loadGamesFromDatabase(seasonId) {
  const { data, error } = await supabaseClient
    .from("games")
    .select("id, game_date, opponents(name)")
    .eq("season_id", seasonId)
    .order("game_date");

  if (error) {
    console.error("Could not load games:", error.message);
    return;
  }

  loadedGames = data;
  gamesListEl.innerHTML = "";
  gameRosterGameSelect.innerHTML = `<option value="">Select game...</option>`;
  gameRosterCheckboxesEl.innerHTML = "";
  eventGameSelect.innerHTML = `<option value="">Select game...</option>`;
  document.getElementById("player").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("shotAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("primaryAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("secondaryAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("playersOnIceCheckboxes").innerHTML = "";
  document.getElementById("shotAgainstCheckboxes").innerHTML = "";

  data.forEach((game) => {
    const opponentText = game.opponents ? ` vs ${game.opponents.name}` : "";
    const label = `${game.game_date || "(no date set)"}${opponentText}`;

    const row = document.createElement("p");
    row.textContent = label;
    gamesListEl.appendChild(row);

    const rosterOption = document.createElement("option");
    rosterOption.value = game.id;
    rosterOption.textContent = label;
    gameRosterGameSelect.appendChild(rosterOption);

    const eventOption = document.createElement("option");
    eventOption.value = game.id;
    eventOption.textContent = label;
    eventGameSelect.appendChild(eventOption);
  });
}

// Opponents belong to the whole team, not a specific season, so this
// loads once per login rather than every time the season changes.
async function loadOpponentsFromDatabase(teamId) {
  const { data, error } = await supabaseClient
    .from("opponents")
    .select("id, name")
    .eq("team_id", teamId)
    .order("name");

  if (error) {
    console.error("Could not load opponents:", error.message);
    return;
  }

  opponentsListEl.innerHTML = "";
  data.forEach((opponent) => {
    const row = document.createElement("p");
    row.textContent = opponent.name;
    opponentsListEl.appendChild(row);
  });

  gameOpponentSelect.innerHTML = `<option value="">No opponent selected</option>`;
  data.forEach((opponent) => {
    const option = document.createElement("option");
    option.value = opponent.id;
    option.textContent = opponent.name;
    gameOpponentSelect.appendChild(option);
  });
}

async function loadGameRoster(gameId) {
  const { data, error } = await supabaseClient
    .from("game_rosters")
    .select("roster_player_id, player_position")
    .eq("game_id", gameId);

  if (error) {
    console.error("Could not load game roster:", error.message);
    return;
  }

  renderGameRosterCheckboxes(data);
}

// Builds one checkbox + position dropdown per player on the season
// roster, pre-checked/pre-set based on whatever's already saved for
// this game (so re-opening a game you've already set shows its state).
function renderGameRosterCheckboxes(existingRows) {
  const existingByPlayer = {};
  existingRows.forEach((row) => {
    existingByPlayer[row.roster_player_id] = row.player_position;
  });

  gameRosterCheckboxesEl.innerHTML = "";

  loadedRoster.forEach((player) => {
    const wrapper = document.createElement("div");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `gr-check-${player.id}`;
    checkbox.dataset.playerId = player.id;
    checkbox.checked = Boolean(existingByPlayer[player.id]);

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = ` #${player.jersey_number} — ${player.name} `;

    const positionSelect = document.createElement("select");
    positionSelect.id = `gr-pos-${player.id}`;

    ["forward", "defenseman", "goalie"].forEach((pos) => {
      const option = document.createElement("option");
      option.value = pos;
      option.textContent = pos;
      option.selected = existingByPlayer[player.id] === pos;
      positionSelect.appendChild(option);
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    wrapper.appendChild(positionSelect);
    gameRosterCheckboxesEl.appendChild(wrapper);
  });
}

gameRosterGameSelect.addEventListener("change", () => {
  const gameId = gameRosterGameSelect.value;
  gameRosterCheckboxesEl.innerHTML = "";

  if (gameId) {
    loadGameRoster(gameId);
  }
});

// Populates the event-logging Player dropdown (and, since Pass 2,
// Shot Assist / Primary Assist / Secondary Assist / both on-ice
// checkbox groups) with only the players actually dressed for this
// specific game -- one fetch, five UI pieces built from it.
async function loadEventGameRoster(gameId) {
  const { data, error } = await supabaseClient
    .from("game_rosters")
    .select("roster_player_id, roster_players(jersey_number, name)")
    .eq("game_id", gameId);

  if (error) {
    console.error("Could not load game roster for event logging:", error.message);
    return;
  }

  const players = data
    .map((row) => ({
      id: row.roster_player_id,
      jersey_number: row.roster_players.jersey_number,
      name: row.roster_players.name,
    }))
    .sort((a, b) => a.jersey_number - b.jersey_number);

  populatePlayerSelect(document.getElementById("player"), players);
  populatePlayerSelect(document.getElementById("shotAssist"), players);
  populatePlayerSelect(document.getElementById("primaryAssist"), players);
  populatePlayerSelect(document.getElementById("secondaryAssist"), players);
  populatePlayerCheckboxes(document.getElementById("playersOnIceCheckboxes"), players, "poi");
  populatePlayerCheckboxes(document.getElementById("shotAgainstCheckboxes"), players, "poa");
}

function populatePlayerSelect(selectEl, players) {
  selectEl.innerHTML = `<option value="">Select player...</option>`;
  players.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `#${player.jersey_number} — ${player.name}`;
    selectEl.appendChild(option);
  });
}

function populatePlayerCheckboxes(containerEl, players, idPrefix) {
  containerEl.innerHTML = "";
  players.forEach((player) => {
    const wrapper = document.createElement("span");
    wrapper.style.marginRight = "12px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${idPrefix}-${player.id}`;
    checkbox.dataset.playerId = player.id;
    checkbox.dataset.playerLabel = `#${player.jersey_number} — ${player.name}`;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.title = player.name;
    label.textContent = ` #${player.jersey_number}`;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    containerEl.appendChild(wrapper);
  });
}

function getCheckedPlayerIds(containerId) {
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
  return Array.from(checkboxes).map((checkbox) => checkbox.dataset.playerId);
}

function getCheckedPlayerLabels(containerId) {
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
  return Array.from(checkboxes)
    .map((checkbox) => checkbox.dataset.playerLabel)
    .join(", ");
}

async function loadGameVideosFromDatabase(gameId) {
  const { data, error } = await supabaseClient
    .from("game_videos")
    .select("id, url, sort_order")
    .eq("game_id", gameId)
    .order("sort_order");

  if (error) {
    console.error("Could not load game videos:", error.message);
    return;
  }

  loadedGameVideos = data;

  videoSelect.innerHTML = "";
  gameVideosListEl.innerHTML = "";

  data.forEach((video, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Video ${index + 1}`;
    videoSelect.appendChild(option);

    const row = document.createElement("p");
    row.textContent = `Video ${index + 1}: ${video.url}`;
    gameVideosListEl.appendChild(row);
  });
}

// Resolves player IDs to readable "#19 -- Name" labels using whichever
// season roster is currently loaded, for displaying database events
// in the (otherwise local-array-driven) events table below.
function buildRosterLookupFromLoadedRoster() {
  const lookup = {};
  loadedRoster.forEach((player) => {
    lookup[player.id] = `#${player.jersey_number} — ${player.name}`;
  });
  return lookup;
}

async function loadDbEventsForGame(gameId) {
  const { data, error } = await supabaseClient
    .from("events")
    .select("*, game_videos(url)")
    .eq("game_id", gameId)
    .order("created_at");

  if (error) {
    console.error("Could not load existing events for this game:", error.message);
    return;
  }

  const rosterLookup = buildRosterLookupFromLoadedRoster();
  const gameLabel = eventGameSelect.selectedOptions[0]
    ? eventGameSelect.selectedOptions[0].textContent
    : "";

  const resolveOne = (id) => (id ? rosterLookup[id] || "" : "");
  const resolveMany = (ids) =>
    (ids || []).map((id) => rosterLookup[id] || "").filter(Boolean).join(", ");

  events = data.map((dbEvent) => ({
    id: dbEvent.id,
    gameId: gameLabel,
    period: dbEvent.period,
    time: dbEvent.time_in_period,
    player: resolveOne(dbEvent.player_id),
    eventType: dbEvent.event_type,
    x: dbEvent.x,
    y: dbEvent.y,
    shotAssist: resolveOne(dbEvent.shot_assist_player_id),
    playersOnIce: resolveMany(dbEvent.players_on_ice_for),
    shotAgainstPlayers: resolveMany(dbEvent.players_on_ice_against),
    ledToShot: "",
    entryExitType: dbEvent.entry_exit_type || "",
    situation: dbEvent.situation || "",
    videoTime: dbEvent.video_time || "",
    primaryAssist: resolveOne(dbEvent.primary_assist_player_id),
    secondaryAssist: resolveOne(dbEvent.secondary_assist_player_id),
    videoUrl: dbEvent.game_videos ? dbEvent.game_videos.url : null,
  }));

  renderEvents();
}

eventGameSelect.addEventListener("change", () => {
  const gameId = eventGameSelect.value;

  document.getElementById("player").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("shotAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("primaryAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("secondaryAssist").innerHTML = `<option value="">Select player...</option>`;
  document.getElementById("playersOnIceCheckboxes").innerHTML = "";
  document.getElementById("shotAgainstCheckboxes").innerHTML = "";
  loadedGameVideos = [];
  videoSelect.innerHTML = "";
  gameVideosListEl.innerHTML = "";
  events = [];
  renderEvents();

  if (gameId) {
    loadEventGameRoster(gameId);
    loadGameVideosFromDatabase(gameId);
    loadDbEventsForGame(gameId);
  }
});

savedSeasonsSelect.addEventListener("change", () => {
  const seasonId = getSelectedSeasonId();
  rosterListEl.innerHTML = "";
  gamesListEl.innerHTML = "";
  loadedGames = [];

  if (seasonId) {
    loadRosterFromDatabase(seasonId);
    loadGamesFromDatabase(seasonId);
  }
});

refreshSavedSeasonsSelect();
refreshSavedGamesSelect();

createSeasonBtn.addEventListener("click", async () => {
  const label = newSeasonInput.value.trim();

  if (!label) {
    createSeasonStatus.textContent = "Enter a season label first.";
    return;
  }

  if (!currentTeamId) {
    createSeasonStatus.textContent = "Not logged in yet.";
    return;
  }

  createSeasonStatus.textContent = "Creating...";

  const { error } = await supabaseClient
    .from("seasons")
    .insert({ team_id: currentTeamId, label });

  if (error) {
    createSeasonStatus.textContent = `Error: ${error.message}`;
    return;
  }

  createSeasonStatus.textContent = "Season created.";
  newSeasonInput.value = "";

  // Re-read from the database rather than guessing the new list locally --
  // this also confirms the write actually landed, not just that it didn't error.
  loadSeasonsFromDatabase(currentTeamId);
});

addRosterPlayerBtn.addEventListener("click", async () => {
  const jerseyNumber = newPlayerNumber.value.trim();
  const name = newPlayerName.value.trim();
  const seasonId = getSelectedSeasonId();

  if (!seasonId) {
    addRosterStatus.textContent = "Select a season first.";
    return;
  }

  if (!jerseyNumber || !name) {
    addRosterStatus.textContent = "Enter both a jersey number and a name.";
    return;
  }

  if (!currentTeamId) {
    addRosterStatus.textContent = "Not logged in yet.";
    return;
  }

  addRosterStatus.textContent = "Adding...";

  const { error } = await supabaseClient
    .from("roster_players")
    .insert({
      team_id: currentTeamId,
      season_id: seasonId,
      jersey_number: Number(jerseyNumber),
      name,
    });

  if (error) {
    addRosterStatus.textContent = `Error: ${error.message}`;
    return;
  }

  addRosterStatus.textContent = "Player added.";
  newPlayerNumber.value = "";
  newPlayerName.value = "";

  loadRosterFromDatabase(seasonId);
});

createGameBtn.addEventListener("click", async () => {
  const gameDate = newGameDate.value;
  const seasonId = getSelectedSeasonId();
  const opponentId = gameOpponentSelect.value || null;

  if (!seasonId) {
    createGameStatus.textContent = "Select a season first.";
    return;
  }

  if (!gameDate) {
    createGameStatus.textContent = "Pick a date first.";
    return;
  }

  if (!currentTeamId) {
    createGameStatus.textContent = "Not logged in yet.";
    return;
  }

  createGameStatus.textContent = "Creating...";

  const { error } = await supabaseClient
    .from("games")
    .insert({
      team_id: currentTeamId,
      season_id: seasonId,
      game_date: gameDate,
      opponent_id: opponentId,
    });

  if (error) {
    createGameStatus.textContent = `Error: ${error.message}`;
    return;
  }

  createGameStatus.textContent = "Game created.";
  newGameDate.value = "";

  loadGamesFromDatabase(seasonId);
});

addOpponentBtn.addEventListener("click", async () => {
  const name = newOpponentName.value.trim();

  if (!name) {
    addOpponentStatus.textContent = "Enter an opponent name first.";
    return;
  }

  if (!currentTeamId) {
    addOpponentStatus.textContent = "Not logged in yet.";
    return;
  }

  addOpponentStatus.textContent = "Adding...";

  const { error } = await supabaseClient
    .from("opponents")
    .insert({ team_id: currentTeamId, name });

  if (error) {
    addOpponentStatus.textContent = `Error: ${error.message}`;
    return;
  }

  addOpponentStatus.textContent = "Opponent added.";
  newOpponentName.value = "";

  loadOpponentsFromDatabase(currentTeamId);
});

saveGameRosterBtn.addEventListener("click", async () => {
  const gameId = gameRosterGameSelect.value;

  if (!gameId) {
    saveGameRosterStatus.textContent = "Select a game first.";
    return;
  }

  if (!currentTeamId) {
    saveGameRosterStatus.textContent = "Not logged in yet.";
    return;
  }

  saveGameRosterStatus.textContent = "Saving...";

  const rowsToInsert = [];
  loadedRoster.forEach((player) => {
    const checkbox = document.getElementById(`gr-check-${player.id}`);
    if (checkbox && checkbox.checked) {
      const positionSelect = document.getElementById(`gr-pos-${player.id}`);
      rowsToInsert.push({
        team_id: currentTeamId,
        game_id: gameId,
        roster_player_id: player.id,
        player_position: positionSelect.value,
      });
    }
  });

  // Simplest correct approach: clear this game's roster, then re-insert
  // whoever's checked. Fine at this scale -- a handful of players per game.
  const { error: deleteError } = await supabaseClient
    .from("game_rosters")
    .delete()
    .eq("game_id", gameId);

  if (deleteError) {
    saveGameRosterStatus.textContent = `Error: ${deleteError.message}`;
    return;
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabaseClient
      .from("game_rosters")
      .insert(rowsToInsert);

    if (insertError) {
      saveGameRosterStatus.textContent = `Error: ${insertError.message}`;
      return;
    }
  }

  saveGameRosterStatus.textContent = "Game roster saved.";
  loadGameRoster(gameId);
});

saveVideosBtn.addEventListener("click", async () => {
  const gameId = eventGameSelect.value;

  if (!gameId) {
    saveVideosStatus.textContent = "Select an Event Game first.";
    return;
  }

  if (!currentTeamId) {
    saveVideosStatus.textContent = "Not logged in yet.";
    return;
  }

  // Skip any URL that's already saved for this game, so re-clicking
  // Save Videos with the same text still in the box doesn't create
  // duplicate rows.
  const newUrls = getYouTubeUrls().filter(
    (url) => !loadedGameVideos.some((video) => video.url === url)
  );

  if (newUrls.length === 0) {
    saveVideosStatus.textContent = "No new URLs to add.";
    return;
  }

  saveVideosStatus.textContent = "Saving...";

  const rowsToInsert = newUrls.map((url, index) => ({
    team_id: currentTeamId,
    game_id: gameId,
    url,
    sort_order: loadedGameVideos.length + index,
  }));

  const { error } = await supabaseClient.from("game_videos").insert(rowsToInsert);

  if (error) {
    saveVideosStatus.textContent = `Error: ${error.message}`;
    return;
  }

  saveVideosStatus.textContent = "Videos saved.";
  youtubeUrls.value = "";

  loadGameVideosFromDatabase(gameId);
});