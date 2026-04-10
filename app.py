# app.py

import os
from urllib.request import urlopen
from flask import Flask, render_template, url_for, jsonify, request
from PIL import Image
import cv2
from solver import astar, bfs, dfs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
PRESET_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/cloud-profiler-demo-399610.appspot.com/o/PartnerImage%2FS%26D.jpg?alt=media&token=29b51357-e884-4ccb-badf-dab8f16ef915"
PRESET_CACHE_NAME = "preset_source.jpg"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def resolve_preset_image_path():
    """Download preset image from URL and return local cache path."""
    cache_path = os.path.join(UPLOAD_FOLDER, PRESET_CACHE_NAME)

    # Reuse cache if already downloaded in this runtime.
    if os.path.exists(cache_path):
        return cache_path

    if not PRESET_IMAGE_URL:
        return None

    try:
        with urlopen(PRESET_IMAGE_URL, timeout=20) as response:
            data = response.read()
        with open(cache_path, "wb") as outfile:
            outfile.write(data)
        return cache_path
    except Exception:
        return None

def slice_image_to_tiles(image_path):
    """
    Given the path to an uploaded image, load it, resize to 300×300 px (if needed),
    then slice into nine 100×100 tiles. Return a list of PIL Image objects (row-major),
    and designate one tile as the "blank" (we'll make it a white box).
    """
    # Load using OpenCV, convert to RGB for PIL
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Cannot read image.")
    # Resize so that width and height are multiples of 3 (we choose 300×300 for simplicity)
    img = cv2.resize(img, (300, 300))
    tiles = []
    tile_size = 100
    for row in range(3):
        for col in range(3):
            x, y = col * tile_size, row * tile_size
            tile = img[y : y + tile_size, x : x + tile_size]
            tile_rgb = cv2.cvtColor(tile, cv2.COLOR_BGR2RGB)
            pil_tile = Image.fromarray(tile_rgb)
            tiles.append(pil_tile)
    # Make the last tile (bottom-right) a blank white square
    blank = Image.new("RGB", (tile_size, tile_size), color=(255, 255, 255))
    tiles[-1] = blank
    return tiles

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/tiles", methods=["GET"])
def tiles():
    """Slice the preset Firebase image and return tile URLs."""
    preset_image_path = resolve_preset_image_path()
    if preset_image_path is None:
        return jsonify({"error": "Preset image could not be downloaded from Firebase Storage."}), 500

    try:
        tiles = slice_image_to_tiles(preset_image_path)
    except ValueError:
        return jsonify({"error": "Preset image is invalid."}), 500

    # Save each tile into UPLOAD_FOLDER/sd_tile_<i>.png
    tile_urls = []
    for i, tile in enumerate(tiles):
        tile_filename = f"sd_tile_{i}.png"
        tile_path = os.path.join(app.config["UPLOAD_FOLDER"], tile_filename)
        tile.save(tile_path)
        tile_urls.append(url_for("static", filename=f"uploads/{tile_filename}"))

    return jsonify({"tiles": tile_urls})

@app.route("/solve", methods=["POST"])
def solve():
    """
    Expects JSON payload:
    {
      "state": [a list of length 9, zero-based indexing, zero is blank],
      "algorithm": "astar" or "bfs" or "dfs"
    }
    Returns: { "moves": ["Up","Left",...] } or { "error": "..." }
    """
    data = request.get_json()
    state = data.get("state", None)
    algorithm = data.get("algorithm", "astar")

    if state is None or len(state) != 9:
        return jsonify({"error": "Invalid state"}), 400

    print(f"Solving puzzle with {algorithm}:")
    print(f"Initial state: {state}")
    
    start_state = tuple(state)
    if algorithm == "astar":
        result = astar(start_state)
    elif algorithm == "bfs":
        result = bfs(start_state)
    elif algorithm == "dfs":
        result = dfs(start_state, depth_limit=50)
    else:
        return jsonify({"error": "Unknown algorithm"}), 400

    if result is None:
        print(f"No solution found with {algorithm}")
        return jsonify({"error": "No solution found"}), 200
    else:
        print(f"Found solution with {algorithm}: {len(result)} moves")
        return jsonify({"moves": result})

if __name__ == "__main__":
    app.run(debug=True)
