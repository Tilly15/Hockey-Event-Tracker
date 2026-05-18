const rink = document.getElementById("rink");
const dot = document.getElementById("dot");
const coordsDisplay = document.getElementById("coords");
const eventTable = document.getElementById("eventTable");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const logBtn = document.getElementById("logBtn");
const deleteLastBtn = document.getElementById("deleteLastBtn");

let selectedLocation = null;
let events = [];


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

  events.forEach((event) => {
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
`;

    eventTable.appendChild(row);
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