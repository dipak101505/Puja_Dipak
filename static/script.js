// Global variables
let currentState = [];       // Array of length 9, storing tile numbers 0–8
let tileElements = [];       // DOM elements for each tile
let tileImgUrls = [];        // URLs returned from the server
let blankIndex = 8;          // Always treat index 8 as the initial blank
let animationTimer = null;
let isBusy = false;

// On DOM load:
document.addEventListener("DOMContentLoaded", () => {
  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Set initial theme based on system preference or stored preference
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
    themeToggle.textContent = storedTheme === 'dark' ? '☀️' : '🌙';
  } else if (prefersDarkScheme.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }

  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
  });

  // Puzzle functionality
  document.getElementById("btnShuffle").addEventListener("click", shufflePuzzle);
  document.getElementById("btnSolve").addEventListener("click", solvePuzzle);
  document.getElementById("btnStop").addEventListener("click", stopAnimation);
  loadPresetPuzzle();
});

function setStatus(message, kind = "") {
  const el = document.getElementById("status");
  el.className = "status" + (kind ? ` ${kind}` : "");
  el.textContent = message || "";
}

function setBusy(busy, message = "") {
  isBusy = busy;
  document.getElementById("btnSolve").classList.toggle("is-loading", busy);
  document.getElementById("btnShuffle").disabled = busy || tileImgUrls.length === 0;
  document.getElementById("btnSolve").disabled = busy || tileImgUrls.length === 0;
  document.getElementById("btnStop").disabled = !busy;
  if (message) setStatus(message, "warn");
}

function loadPresetPuzzle() {
  stopAnimation();
  setBusy(true, "Loading preset puzzle…");
  fetch("/tiles")
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Load failed (${res.status})`);
      }
      return res.json();
    })
    .then(data => {
      tileImgUrls = data.tiles; // array of 9 URLs
      initializePuzzle(tileImgUrls);
      setStatus("Try Shuffle, then Solve.", "ok");
    })
    .catch(err => {
      console.error(err);
      setStatus("Failed to load preset puzzle.", "err");
      document.getElementById("solutionSteps").innerText = "Could not load SD.jpg.";
    })
    .finally(() => {
      setBusy(false);
    });
}

function initializePuzzle(urls) {
  // Reset state: solved order: [1,2,3,4,5,6,7,8,0]
  currentState = [1,2,3,4,5,6,7,8,0];
  blankIndex = 8;
  const container = document.getElementById("puzzleContainer");
  container.innerHTML = ""; // clear
  tileElements = [];

  // Create tiles in the correct order
  for (let i = 0; i < 9; i++) {
    const tileDiv = document.createElement("div");
    tileDiv.classList.add("puzzle-tile");
    tileDiv.dataset.index = i;
    if (i === 8) {
      tileDiv.classList.add("blank");
    } else {
      const img = document.createElement("img");
      // Use the correct URL for each position
      img.src = urls[i];
      img.alt = `Tile ${i + 1}`;
      img.loading = "eager";
      tileDiv.appendChild(img);
    }
    tileDiv.addEventListener("click", () => tileClick(i));
    container.appendChild(tileDiv);
    tileElements.push(tileDiv);
  }
  document.getElementById("solutionSteps").innerText = "Ready.";
  document.getElementById("btnShuffle").disabled = false;
  document.getElementById("btnSolve").disabled = false;
}

function tileClick(idx) {
  // If idx is a neighbor of blankIndex, swap them
  const r1 = Math.floor(idx / 3), c1 = idx % 3;
  const r2 = Math.floor(blankIndex / 3), c2 = blankIndex % 3;
  const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
    // valid move
    moveTile(idx, blankIndex);
  }
}

function moveTile(fromIdx, toIdx) {
  // Swap in currentState
  const tmp = currentState[fromIdx];
  currentState[fromIdx] = currentState[toIdx];
  currentState[toIdx] = tmp;
  
  // Swap DOM elements
  const tileFrom = tileElements[fromIdx];
  const tileTo = tileElements[toIdx];
  
  // Swap the images and classes
  const imgFrom = tileFrom.querySelector('img');
  const imgTo = tileTo.querySelector('img');
  
  if (imgFrom) {
    tileTo.appendChild(imgFrom);
    tileFrom.classList.add('blank');
    tileTo.classList.remove('blank');
  } else if (imgTo) {
    tileFrom.appendChild(imgTo);
    tileFrom.classList.remove('blank');
    tileTo.classList.add('blank');
  }
  
  blankIndex = fromIdx;
}

function shufflePuzzle() {
  if (isBusy) return;
  stopAnimation();
  // Perform a random valid shuffle by making, say, 100 random moves from the solved state.
  for (let i = 0; i < 100; i++) {
    const neighbors = getNeighborIndices(blankIndex);
    const randIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
    moveTile(randIdx, blankIndex);
  }
  document.getElementById("solutionSteps").innerText = "Shuffled. Click Solve when ready.";
  setStatus("Shuffled.", "ok");
}

function getNeighborIndices(zIdx) {
  const r = Math.floor(zIdx / 3), c = zIdx % 3;
  const neighbors = [];
  if (r > 0) neighbors.push(zIdx - 3);
  if (r < 2) neighbors.push(zIdx + 3);
  if (c > 0) neighbors.push(zIdx - 1);
  if (c < 2) neighbors.push(zIdx + 1);
  return neighbors;
}

function solvePuzzle() {
  if (isBusy) return;
  stopAnimation();
  // Send currentState array to server
  const algo = document.getElementById("algorithmSelect").value;
  setBusy(true, "Solving…");
  fetch("/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: currentState, algorithm: algo })
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Solve failed (${res.status})`);
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        document.getElementById("solutionSteps").innerText = "Error: " + data.error;
        setStatus(data.error, "warn");
      } else {
        animateSolution(data.moves);
        setStatus(`Found solution in ${data.moves.length} moves.`, "ok");
      }
    })
    .catch(err => {
      console.error(err);
      setStatus("Solve failed. Try shuffling again or switching algorithm.", "err");
    })
    .finally(() => {
      // Keep busy true while animating; animateSolution will clear it.
    });
}

function animateSolution(moves) {
  // Display the move list and animate one step every 500 ms
  const infoDiv = document.getElementById("solutionSteps");
  const speed = Number(document.getElementById("speedSelect").value || 500);
  infoDiv.innerText = `Moves (${moves.length}): ${moves.join(", ")}\n\nAnimating…`;
  let step = 0;
  animationTimer = setInterval(() => {
    if (step >= moves.length) {
      stopAnimation(false);
      infoDiv.innerText += "\nDone!";
      return;
    }
    const action = moves[step];
    performMove(action);
    step++;
  }, speed);
}

function performMove(action) {
  // Given a string action ("Up","Down","Left","Right"), slide the appropriate tile into the blank
  const r = Math.floor(blankIndex / 3), c = blankIndex % 3;
  let targetIdx = null;
  if (action === "Up" && r < 2) {
    targetIdx = (r + 1) * 3 + c;  // Move tile below blank up
  } else if (action === "Down" && r > 0) {
    targetIdx = (r - 1) * 3 + c;  // Move tile above blank down
  } else if (action === "Left" && c < 2) {
    targetIdx = r * 3 + (c + 1);  // Move tile right of blank left
  } else if (action === "Right" && c > 0) {
    targetIdx = r * 3 + (c - 1);  // Move tile left of blank right
  }
  if (targetIdx !== null) {
    moveTile(targetIdx, blankIndex);
  }
}

function stopAnimation(showMessage = true) {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  if (isBusy) {
    isBusy = false;
    document.getElementById("btnSolve").classList.remove("is-loading");
    document.getElementById("btnShuffle").disabled = tileImgUrls.length === 0;
    document.getElementById("btnSolve").disabled = tileImgUrls.length === 0;
    document.getElementById("btnStop").disabled = true;
  }
  if (showMessage) setStatus("Stopped.", "warn");
}