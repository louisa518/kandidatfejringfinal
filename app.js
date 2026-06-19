import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js?v=3";
import { BUILT_IN_GUESTS, EVENT_INFO, normalizeUsername, expectedPassword } from "./event-data.js?v=3";

const state = {
  app: null,
  db: null,
  currentUser: null,
  extraGuests: {},
  rsvps: {},
  posts: {},
  firebaseReady: false
};

const els = {
  loginView: document.getElementById("loginView"),
  siteHeader: document.getElementById("siteHeader"),
  tabBar: document.getElementById("tabBar"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginMessage: document.getElementById("loginMessage"),
  logoutButton: document.getElementById("logoutButton"),
  tabs: [...document.querySelectorAll(".tab")],
  views: [...document.querySelectorAll(".view")],
  adminOnly: [...document.querySelectorAll(".admin-only")],
  connectionStatus: document.getElementById("connectionStatus"),
  lastLiveUpdate: document.getElementById("lastLiveUpdate"),
  rsvpGreeting: document.getElementById("rsvpGreeting"),
  myAnswerText: document.getElementById("myAnswerText"),
  myAnswerUpdated: document.getElementById("myAnswerUpdated"),
  answerButtons: [...document.querySelectorAll(".answer-button")],
  yesCount: document.getElementById("yesCount"),
  maybeCount: document.getElementById("maybeCount"),
  noCount: document.getElementById("noCount"),
  missingCount: document.getElementById("missingCount"),
  yesList: document.getElementById("yesList"),
  maybeList: document.getElementById("maybeList"),
  noList: document.getElementById("noList"),
  missingList: document.getElementById("missingList"),
  postsList: document.getElementById("postsList"),
  postForm: document.getElementById("postForm"),
  postText: document.getElementById("postText"),
  guestForm: document.getElementById("guestForm"),
  newGuestUsername: document.getElementById("newGuestUsername"),
  newGuestFullName: document.getElementById("newGuestFullName"),
  adminGuestList: document.getElementById("adminGuestList")
};

document.getElementById("eventDate").textContent = EVENT_INFO.date;
document.getElementById("eventTime").textContent = EVENT_INFO.time;
document.getElementById("eventAddress").textContent = EVENT_INFO.address;

function getAllGuests() {
  const extra = Object.entries(state.extraGuests || {}).map(([username, guest]) => ({
    username,
    fullName: guest.fullName || username,
    isAdmin: Boolean(guest.isAdmin)
  }));

  const byUsername = new Map();
  [...BUILT_IN_GUESTS, ...extra].forEach(guest => {
    byUsername.set(guest.username, guest);
  });

  return [...byUsername.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "da-DK"));
}

function findGuest(username) {
  return getAllGuests().find(guest => guest.username === username) || null;
}

function showLoginMessage(message, type = "info") {
  const color = type === "error" ? "#9b4033" : "#505f38";
  els.loginMessage.innerHTML = `<p style="margin:0;color:${color};">${message}</p>`;
}

function setConnectionStatus(text, status = "") {
  if (els.connectionStatus) {
    els.connectionStatus.textContent = text;
    els.connectionStatus.className = `connection-pill ${status}`.trim();
  }
}

function setLastLiveUpdate(text) {
  if (els.lastLiveUpdate) {
    els.lastLiveUpdate.textContent = text;
  }
}

function showApp() {
  els.loginView.classList.add("hidden");
  els.siteHeader.classList.remove("hidden");
  els.tabBar.classList.remove("hidden");
  updateAdminVisibility();
  renderCurrentUser();
  navigate("info");
}

function showLogin() {
  els.loginView.classList.remove("hidden");
  els.siteHeader.classList.add("hidden");
  els.tabBar.classList.add("hidden");
  els.views.forEach(view => view.classList.remove("active"));
}

function updateAdminVisibility() {
  const isAdmin = Boolean(state.currentUser?.isAdmin);
  els.adminOnly.forEach(el => el.classList.toggle("hidden", !isAdmin));
}

function navigate(viewName) {
  if (viewName === "admin" && !state.currentUser?.isAdmin) return;

  els.views.forEach(view => {
    view.classList.toggle("active", view.id === `${viewName}View`);
  });

  els.tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === viewName);
  });
}

function renderCurrentUser() {
  if (!state.currentUser) return;

  els.rsvpGreeting.textContent = `Skal du med, ${state.currentUser.username}?`;
  renderMyAnswer();
  renderStats();
  renderAdminGuestList();
}

function renderMyAnswer() {
  if (!state.currentUser) return;

  const rsvp = state.rsvps?.[state.currentUser.username];
  const answer = rsvp?.answer || "";

  els.answerButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.answer === answer);
  });

  if (!answer) {
    els.myAnswerText.textContent = "Du har ikke svaret endnu.";
    els.myAnswerUpdated.textContent = "";
    return;
  }

  els.myAnswerText.textContent = `Du svarede: ${answer}`;
  els.myAnswerUpdated.textContent = rsvp?.updatedAtText || "";
}

function addListItem(list, text) {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

function renderStats() {
  const guests = getAllGuests();
  const groups = { Ja: [], Måske: [], Nej: [], missing: [] };

  guests.forEach(guest => {
    const answer = state.rsvps?.[guest.username]?.answer || "";
    if (answer === "Ja") groups.Ja.push(guest);
    else if (answer === "Måske") groups.Måske.push(guest);
    else if (answer === "Nej") groups.Nej.push(guest);
    else groups.missing.push(guest);
  });

  els.yesCount.textContent = groups.Ja.length;
  els.maybeCount.textContent = groups.Måske.length;
  els.noCount.textContent = groups.Nej.length;
  els.missingCount.textContent = groups.missing.length;

  [els.yesList, els.maybeList, els.noList, els.missingList].forEach(list => { list.innerHTML = ""; });

  groups.Ja.forEach(guest => addListItem(els.yesList, guest.fullName));
  groups.Måske.forEach(guest => addListItem(els.maybeList, guest.fullName));
  groups.Nej.forEach(guest => addListItem(els.noList, guest.fullName));
  groups.missing.forEach(guest => addListItem(els.missingList, guest.fullName));

  if (!groups.Ja.length) addListItem(els.yesList, "Ingen endnu");
  if (!groups.Måske.length) addListItem(els.maybeList, "Ingen endnu");
  if (!groups.Nej.length) addListItem(els.noList, "Ingen endnu");
  if (!groups.missing.length) addListItem(els.missingList, "Alle har svaret");

  renderMyAnswer();
}

function renderPosts() {
  const posts = Object.values(state.posts || {}).sort((a, b) => {
    const aTime = a.createdAt || 0;
    const bTime = b.createdAt || 0;
    return bTime - aTime;
  });

  els.postsList.innerHTML = "";

  if (!posts.length) {
    const empty = document.createElement("article");
    empty.className = "post";
    empty.innerHTML = `<p class="muted" style="margin:0;">Der er ingen opslag endnu.</p>`;
    els.postsList.appendChild(empty);
    return;
  }

  posts.forEach(post => {
    const article = document.createElement("article");
    article.className = "post";
    const date = post.createdAt ? new Date(post.createdAt).toLocaleString("da-DK") : "";
    article.innerHTML = `
      <p style="margin:0;">${escapeHtml(post.text || "")}</p>
      <time>${date ? `${date} · ` : ""}${escapeHtml(post.author || "Louisa")}</time>
    `;
    els.postsList.appendChild(article);
  });
}

function renderAdminGuestList() {
  if (!els.adminGuestList) return;

  els.adminGuestList.innerHTML = "";
  getAllGuests().forEach(guest => {
    const answer = state.rsvps?.[guest.username]?.answer || "Mangler svar";
    const li = document.createElement("li");
    li.textContent = `${guest.fullName} · login: ${guest.username} · kode: ${expectedPassword(guest.username)} · ${answer}`;
    els.adminGuestList.appendChild(li);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function saveRsvp(answer) {
  if (!state.currentUser) return;

  if (!state.firebaseReady || !state.db) {
    alert("Firebase er ikke forbundet endnu. Tjek firebase-config.js og Firebase Rules.");
    return;
  }

  const now = new Date();
  const payload = {
    username: state.currentUser.username,
    fullName: state.currentUser.fullName,
    answer,
    updatedAt: now.toISOString(),
    updatedAtText: `Senest opdateret ${now.toLocaleString("da-DK")}`
  };

  await set(ref(state.db, `rsvps/${state.currentUser.username}`), payload);
}

async function publishPost(text) {
  if (!state.currentUser?.isAdmin) return;
  if (!state.firebaseReady || !state.db) throw new Error("Firebase er ikke forbundet");

  await push(ref(state.db, "posts"), {
    text,
    author: state.currentUser.fullName,
    createdAt: Date.now(),
    serverCreatedAt: serverTimestamp()
  });
}

async function addExtraGuest(username, fullName) {
  if (!state.currentUser?.isAdmin) return;
  if (!state.firebaseReady || !state.db) throw new Error("Firebase er ikke forbundet");

  await set(ref(state.db, `guests/${username}`), {
    username,
    fullName,
    isAdmin: false,
    createdAt: Date.now()
  });
}

function wireUi() {
  els.loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const username = normalizeUsername(els.loginUsername.value);
    const password = els.loginPassword.value.trim();
    const guest = findGuest(username);

    if (!guest) {
      showLoginMessage("Kun inviterede kan logge ind. Tjek, at du kun har skrevet dit fornavn.", "error");
      return;
    }

    if (password !== expectedPassword(username)) {
      showLoginMessage("Forkert kode. Koden er dit fornavn med stort begyndelsesbogstav efterfulgt af 123.", "error");
      return;
    }

    state.currentUser = guest;
    localStorage.setItem("event-user", JSON.stringify(guest));
    showApp();
  });

  els.logoutButton.addEventListener("click", () => {
    localStorage.removeItem("event-user");
    state.currentUser = null;
    showLogin();
  });

  els.tabs.forEach(tab => {
    tab.addEventListener("click", () => navigate(tab.dataset.view));
  });

  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.jump));
  });

  els.answerButtons.forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await saveRsvp(button.dataset.answer);
      } catch (error) {
        console.error(error);
        alert("Svaret kunne ikke gemmes. Tjek Firebase-konfigurationen og rules.");
      }
    });
  });

  els.postForm.addEventListener("submit", async event => {
    event.preventDefault();
    const text = els.postText.value.trim();
    if (!text) return;

    try {
      await publishPost(text);
      els.postText.value = "";
    } catch (error) {
      console.error(error);
      alert("Opslaget kunne ikke gemmes.");
    }
  });

  els.guestForm.addEventListener("submit", async event => {
    event.preventDefault();
    const username = normalizeUsername(els.newGuestUsername.value);
    const fullName = els.newGuestFullName.value.trim();

    if (!username || !fullName) return;

    try {
      await addExtraGuest(username, fullName);
      els.newGuestUsername.value = "";
      els.newGuestFullName.value = "";
      alert(`${fullName} er tilføjet. Login: ${username}, kode: ${expectedPassword(username)}`);
    } catch (error) {
      console.error(error);
      alert("Gæsten kunne ikke tilføjes.");
    }
  });
}

function initFirebase() {
  if (!isFirebaseConfigured()) {
    state.firebaseReady = false;
    setConnectionStatus("Firebase mangler config", "error");
    console.warn("Firebase er ikke konfigureret. Udfyld firebase-config.js med din rigtige config.");
    return;
  }

  try {
    state.app = initializeApp(firebaseConfig);
    state.db = getDatabase(state.app);
    state.firebaseReady = true;
    setConnectionStatus("Forbundet", "ok");

    onValue(ref(state.db, "rsvps"), snapshot => {
      state.rsvps = snapshot.val() || {};
      setLastLiveUpdate(`Live-opdateret: ${new Date().toLocaleTimeString("da-DK")}`);
      renderStats();
      renderAdminGuestList();
    }, error => {
      console.error(error);
      setConnectionStatus("Fejl i RSVP", "error");
      setLastLiveUpdate(`Firebase-fejl: ${error.message}`);
    });

    onValue(ref(state.db, "posts"), snapshot => {
      state.posts = snapshot.val() || {};
      renderPosts();
    }, error => {
      console.error(error);
      setConnectionStatus("Fejl i news", "error");
    });

    onValue(ref(state.db, "guests"), snapshot => {
      state.extraGuests = snapshot.val() || {};
      renderStats();
      renderAdminGuestList();
    }, error => {
      console.error(error);
      setConnectionStatus("Fejl i gæster", "error");
    });
  } catch (error) {
    console.error(error);
    state.firebaseReady = false;
    setConnectionStatus("Firebase fejl", "error");
  }
}

function restoreSession() {
  const raw = localStorage.getItem("event-user");
  if (!raw) {
    showLogin();
    return;
  }

  try {
    const storedUser = JSON.parse(raw);
    const guest = findGuest(storedUser.username) || storedUser;
    state.currentUser = guest;
    showApp();
  } catch {
    localStorage.removeItem("event-user");
    showLogin();
  }
}

wireUi();
initFirebase();
renderPosts();
renderStats();
restoreSession();
