const questNames = {
  "1": "Шерлок",
  "2": "Зазеркалье",
  "3": "В плену Дэвида Джонса",
  "4": "Тайна фараонов",
  "5": "Тайна Гарри"
};

const screens = [...document.querySelectorAll(".screen")];
const questCards = [...document.querySelectorAll(".quest-card")];
const questNext = document.getElementById("quest-next");
const questNote = document.getElementById("quest-note");
const questError = document.getElementById("quest-error");
const dateInput = document.getElementById("date");
const dateError = document.getElementById("date-error");
const sendButton = document.getElementById("send-answer");
const musicToggle = document.getElementById("music-toggle");
const musicLabel = document.getElementById("music-label");
const mainMusic = document.getElementById("background-music");
const finalMusic = document.getElementById("final-music");
const toast = document.getElementById("toast");

let chosenQuest = null;
let toastTimer = null;
let musicStarted = false;

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("screen--active", screen.id === id));
  document.querySelector(".shell").scrollIntoView({ behavior: "smooth", block: "start" });
  questError.textContent = "";
  dateError.textContent = "";
}

document.getElementById("open-story").addEventListener("click", () => {
  showScreen("screen-love");
  tryStartMusic();
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.back));
});
document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.next));
});

questCards.forEach((card) => {
  card.addEventListener("click", () => {
    chosenQuest = card.dataset.quest;
    questCards.forEach((item) => {
      const selected = item === card;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    questNext.disabled = false;
    questNote.textContent = `✦ Твой выбор — ${questNames[chosenQuest]} ✦`;
    questError.textContent = "";
  });
});

questNext.addEventListener("click", () => {
  if (!chosenQuest) {
    questError.textContent = "Сначала выбери квест, который тебе нравится.";
    return;
  }
  showScreen("screen-date");
});

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
dateInput.min = localDateString();
dateInput.value = localDateString();

sendButton.addEventListener("click", async () => {
  dateError.textContent = "";
  if (!chosenQuest) {
    showScreen("screen-quest");
    questError.textContent = "Сначала выбери квест.";
    return;
  }
  if (!dateInput.value) {
    dateError.textContent = "Выбери дату, пожалуйста.";
    dateInput.focus();
    return;
  }
  if (dateInput.value < localDateString()) {
    dateError.textContent = "Выбери сегодняшний день или дату в будущем.";
    return;
  }

  sendButton.disabled = true;
  sendButton.querySelector("span").textContent = "Отправляем...";
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId: chosenQuest, date: dateInput.value })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || "Не удалось отправить ответ.");
    await switchToFinalMusic();
    showScreen("screen-final");
  } catch (error) {
    dateError.textContent = error.message || "Не получилось отправить ответ. Проверь соединение и попробуй ещё раз.";
  } finally {
    sendButton.disabled = false;
    sendButton.querySelector("span").textContent = "Отправить ответ";
  }
});

document.getElementById("restart").addEventListener("click", async () => {
  chosenQuest = null;
  questCards.forEach((card) => {
    card.classList.remove("is-selected");
    card.setAttribute("aria-pressed", "false");
  });
  questNext.disabled = true;
  questNote.textContent = "✦ Выбери одну карточку — и продолжим ✦";
  dateInput.value = localDateString();
  dateInput.min = localDateString();
  await switchToMainMusic();
  showScreen("screen-hero");
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function tryStartMusic() {
  if (musicStarted) return;
  try {
    mainMusic.volume = 0.25;
    await mainMusic.play();
    musicStarted = true;
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

async function switchToFinalMusic() {
  if (!musicStarted) return;
  try {
    mainMusic.pause();
    finalMusic.volume = 0.3;
    await finalMusic.play();
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

async function switchToMainMusic() {
  finalMusic.pause();
  finalMusic.currentTime = 0;
  if (!musicStarted) {
    updateMusicButton(false);
    return;
  }
  try {
    mainMusic.volume = 0.25;
    await mainMusic.play();
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

musicToggle.addEventListener("click", async () => {
  const activeAudio = !finalMusic.paused ? finalMusic : mainMusic;
  if (!activeAudio.paused) {
    mainMusic.pause();
    finalMusic.pause();
    musicStarted = false;
    updateMusicButton(false);
    return;
  }
  try {
    activeAudio.volume = activeAudio === finalMusic ? 0.3 : 0.25;
    await activeAudio.play();
    musicStarted = true;
    updateMusicButton(true);
  } catch {
    showToast("Добавь музыкальные файлы в папку public/music.");
    updateMusicButton(false);
  }
});

function updateMusicButton(playing) {
  musicToggle.classList.toggle("is-playing", playing);
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.setAttribute("aria-label", playing ? "Выключить музыку" : "Включить музыку");
  musicLabel.textContent = playing ? "Музыка играет" : "Включить музыку";
}

function makeAtmosphere() {
  const stars = document.getElementById("stars");
  const leaves = document.getElementById("leaves");
  for (let i = 0; i < 42; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${2.5 + Math.random() * 3}s`;
    stars.appendChild(star);
  }
  const symbols = ["🍂", "🍁", "🍃"];
  for (let i = 0; i < 17; i++) {
    const leaf = document.createElement("span");
    leaf.className = "falling-leaf";
    leaf.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.fontSize = `${12 + Math.random() * 15}px`;
    leaf.style.animationDelay = `${Math.random() * 15}s`;
    leaf.style.animationDuration = `${12 + Math.random() * 15}s`;
    leaves.appendChild(leaf);
  }
}

makeAtmosphere();