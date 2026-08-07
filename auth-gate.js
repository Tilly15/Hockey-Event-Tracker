// ---- Fill these in from: Supabase Dashboard -> Settings -> API ----
const SUPABASE_URL = "https://hfmluhdoeebukxqgbrzw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbWx1aGRvZWVidWt4cWdicnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTAwMjEsImV4cCI6MjEwMTQ2NjAyMX0.LrNt_9Uba1gpGnzW9x2loMwTo5B0aw2uhPN2NHpqpOg";
// ---------------------------------------------------------------

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginGate = document.getElementById("loginGate");
const appContent = document.getElementById("appContent");
const loginEmailInput = document.getElementById("loginEmailInput");
const sendLoginLinkBtn = document.getElementById("sendLoginLinkBtn");
const loginStatusMsg = document.getElementById("loginStatusMsg");
const loggedInEmailEl = document.getElementById("loggedInEmail");
const loggedInTeamEl = document.getElementById("loggedInTeam");
const logoutBtn = document.getElementById("logoutBtn");

function showApp() {
  loginGate.style.display = "none";
  appContent.style.display = "block";
}

function showLoginGate() {
  loginGate.style.display = "block";
  appContent.style.display = "none";
}

let currentTeamId = null;

async function loadTeamInfo(userId) {
  const { data, error } = await supabaseClient
    .from("team_members")
    .select("team_id, role, teams(name)")
    .eq("user_id", userId)
    .single();

  if (error) {
    loggedInTeamEl.textContent = "(no team linked yet)";
    return;
  }

  currentTeamId = data.team_id;
  loggedInTeamEl.textContent = `${data.teams.name} — ${data.role}`;

  if (typeof loadSeasonsFromDatabase === "function") {
    loadSeasonsFromDatabase(currentTeamId);
  }

  if (typeof loadOpponentsFromDatabase === "function") {
    loadOpponentsFromDatabase(currentTeamId);
  }
}

// Fires once on page load, and again automatically whenever login
// state changes -- including after clicking a magic link in email.
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    showApp();
    loggedInEmailEl.textContent = session.user.email;
    loadTeamInfo(session.user.id);
  } else {
    showLoginGate();
  }
});

sendLoginLinkBtn.addEventListener("click", async () => {
  const email = loginEmailInput.value.trim();
  if (!email) {
    loginStatusMsg.textContent = "Enter an email first.";
    return;
  }

  loginStatusMsg.textContent = "Sending...";

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });

  loginStatusMsg.textContent = error
    ? `Error: ${error.message}`
    : "Check your email for the login link.";
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});
