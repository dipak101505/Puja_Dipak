# app.py

import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np
from solver import astar, bfs, dfs

UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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

@app.route("/upload", methods=["POST"])
def upload():
    """
    Handle image upload. Save the file, slice into 9 tiles, save those tiles
    into static/uploads/tiles_<timestamp>_<i>.png, and return JSON with tile URLs.
    The front end will load these 9 tile images in a 3×3 grid and treat the last tile as blank.
    """
    if "image" not in request.files:
        return redirect(request.url)
    file = request.files["image"]
    if file.filename == "" or not allowed_file(file.filename):
        return redirect(request.url)

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    # Slice into tiles
    try:
        tiles = slice_image_to_tiles(filepath)
    except ValueError:
        return "Invalid image.", 400

    # Save each tile into UPLOAD_FOLDER/tiles_<base>_<i>.png
    base, _ = os.path.splitext(filename)
    tile_urls = []
    for i, tile in enumerate(tiles):
        tile_filename = f"{base}_tile_{i}.png"
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
