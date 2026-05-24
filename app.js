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

let selectedLocation = null;
let events = [];
let editingIndex = null;

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
  return {
    gameId: document.getElementById("gameId").value,
    period: document.getElementById("period").value,
    time: document.getElementById("time").value,
    player: document.getElementById("player").value,
    eventType: document.getElementById("eventType").value,
    shotAssist: document.getElementById("shotAssist").value,
    playersOnIce: document.getElementById("playersOnIce").value,
    shotAgainstPlayers: document.getElementById("shotAgainstPlayers").value,
    ledToShot: document.getElementById("ledToShot").value,
    entryExitType: document.getElementById("entryExitType").value,
    situation: document.getElementById("situation").value,
    primaryAssist: document.getElementById("primaryAssist").value,
    secondaryAssist: document.getElementById("secondaryAssist").value,
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
  refreshVideoSelect();

  const urls = getYouTubeUrls();
  const selectedIndex = Number(videoSelect.value || 0);

  if (!urls[selectedIndex]) {
    alert("Please add at least one YouTube URL.");
    return;
  }

  loadYouTubeVideo(urls[selectedIndex]);
});

videoSelect.addEventListener("change", () => {
  const urls = getYouTubeUrls();
  const selectedIndex = Number(videoSelect.value);

  if (!urls[selectedIndex]) {
    return;
  }

  loadYouTubeVideo(urls[selectedIndex]);
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

refreshSavedSeasonsSelect();
refreshSavedGamesSelect();