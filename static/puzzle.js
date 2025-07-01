// static/puzzle.js

let currentState = [];       // Array of length 9, storing tile numbers 0–8
let tileElements = [];       // DOM elements for each tile
let tileImgUrls = [];        // URLs returned from the server
let blankIndex = 8;          // Always treat index 8 as the initial blank

// On DOM load:
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnUpload").addEventListener("click", uploadImage);
  document.getElementById("btnShuffle").addEventListener("click", shufflePuzzle);
  document.getElementById("btnSolve").addEventListener("click", solvePuzzle);
});

function uploadImage() {
  const fileInput = document.getElementById("imageUpload");
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select an image first.");
    return;
  }
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("image", file);

  fetch("/upload", { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      tileImgUrls = data.tiles; // array of 9 URLs
      initializePuzzle(tileImgUrls);
      document.getElementById("btnShuffle").disabled = false;
      document.getElementById("btnSolve").disabled = false;
    })
    .catch(err => {
      console.error(err);
      alert("Failed to upload/process image.");
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
      img.width = 100;
      img.height = 100;
      tileDiv.appendChild(img);
    }
    tileDiv.addEventListener("click", () => tileClick(i));
    container.appendChild(tileDiv);
    tileElements.push(tileDiv);
  }
  document.getElementById("solutionSteps").innerText = "";
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
  // Perform a random valid shuffle by making, say, 100 random moves from the solved state.
  for (let i = 0; i < 100; i++) {
    const neighbors = getNeighborIndices(blankIndex);
    const randIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
    moveTile(randIdx, blankIndex);
  }
  document.getElementById("solutionSteps").innerText = "";
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
  // Send currentState array to server
  const algo = document.getElementById("algorithmSelect").value;
  fetch("/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: currentState, algorithm: algo })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("solutionSteps").innerText = "Error: " + data.error;
      } else {
        animateSolution(data.moves);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error solving puzzle.");
    });
}

function animateSolution(moves) {
  // Display the move list and animate one step every 500 ms
  const infoDiv = document.getElementById("solutionSteps");
  infoDiv.innerText = "Solution: " + moves.join(", ") + "\nAnimating...";
  let step = 0;
  const interval = setInterval(() => {
    if (step >= moves.length) {
      clearInterval(interval);
      infoDiv.innerText += "\nDone!";
      return;
    }
    const action = moves[step];
    performMove(action);
    step++;
  }, 500);
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
