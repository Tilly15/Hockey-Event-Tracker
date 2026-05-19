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
const youtubeUrl = document.getElementById("youtubeUrl");
const loadYoutubeBtn = document.getElementById("loadYoutubeBtn");
const saveGameBtn = document.getElementById("saveGameBtn");
const loadGameBtn = document.getElementById("loadGameBtn");
const savedGamesSelect = document.getElementById("savedGamesSelect");
const openSelectedGameBtn = document.getElementById("openSelectedGameBtn");

let selectedLocation = null;
let events = [];

let youtubePlayer = null;

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

function getYouTubeVideoId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : url;
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
  <td>
    <button class="goto-btn" data-index="${index}">
      Go To
    </button>
  </td>
`;

    eventTable.appendChild(row);

    const goToBtn = row.querySelector(".goto-btn");

goToBtn.addEventListener("click", () => {
  if (youtubePlayer && event.videoTime) {
    youtubePlayer.seekTo(Number(event.videoTime), true);
    youtubePlayer.playVideo();
  } else if (gameVideo && event.videoTime) {
    gameVideo.currentTime = Number(event.videoTime);
    gameVideo.play();
  }
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

const loggedEvent = {
  ...formValues,
  x: selectedLocation.x,
  y: selectedLocation.y,
  videoTime: youtubePlayer
  ? Number(youtubePlayer.getCurrentTime().toFixed(2))
  : document.getElementById("manualVideoTime").value ||
    Number(gameVideo.currentTime.toFixed(2)),
};

  events.push(loggedEvent);
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
  loadYouTubeVideo(youtubeUrl.value);
});

function getSavedGames() {
  return JSON.parse(localStorage.getItem("savedGames") || "[]");
}

function saveSavedGames(savedGames) {
  localStorage.setItem("savedGames", JSON.stringify(savedGames));
}

function refreshSavedGamesSelect() {
  const savedGames = getSavedGames();

  savedGamesSelect.innerHTML = `<option value="">Select saved game...</option>`;

  savedGames.forEach((game) => {
    const option = document.createElement("option");
    option.value = game.gameId;
    option.textContent = game.gameId;
    savedGamesSelect.appendChild(option);
  });
}

function saveCurrentGame() {
  const gameId = document.getElementById("gameId").value.trim();

  if (!gameId) {
    alert("Please enter a Game ID first.");
    return;
  }

  const gameData = {
    gameId,
    youtubeUrl: youtubeUrl.value,
    events,
  };

  localStorage.setItem(`hockey-game-${gameId}`, JSON.stringify(gameData));

  const savedGames = getSavedGames();
  const alreadyExists = savedGames.some((game) => game.gameId === gameId);

  if (!alreadyExists) {
    savedGames.push({ gameId });
    saveSavedGames(savedGames);
  }

  refreshSavedGamesSelect();
  alert("Game saved.");
}

function openGame(gameId) {
  const savedGame = localStorage.getItem(`hockey-game-${gameId}`);

  if (!savedGame) {
    alert("Saved game not found.");
    return;
  }

  const gameData = JSON.parse(savedGame);

  document.getElementById("gameId").value = gameData.gameId;
  youtubeUrl.value = gameData.youtubeUrl || "";
  events = gameData.events || [];

  renderEvents();

  if (gameData.youtubeUrl) {
    loadYouTubeVideo(gameData.youtubeUrl);
  }

  alert("Game loaded.");
}

function loadYouTubeVideo(url) {
  const videoId = getYouTubeVideoId(url);

  youtubePlayer = new YT.Player("youtubePlayer", {
    height: "450",
    width: "800",
    videoId,
  });
}

saveGameBtn.addEventListener("click", saveCurrentGame);

openSelectedGameBtn.addEventListener("click", () => {
  const selectedGameId = savedGamesSelect.value;

  if (!selectedGameId) {
    alert("Please select a saved game first.");
    return;
  }

  openGame(selectedGameId);
});

refreshSavedGamesSelect();