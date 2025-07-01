# 8-Puzzle Solver Web Application

A modern web-based 8-puzzle solver that allows users to upload custom images, automatically generates puzzle tiles, and solves the puzzle using multiple search algorithms including A*, BFS, and DFS.

**Repository:** <https://github.com/edgarvelr/8-puzzle-solver>

## Features

* **Custom Image Upload**: Upload any image to create a personalized 8-puzzle
* **Automatic Tile Generation**: Automatically slices uploaded images into 9 tiles (3x3 grid)
* **Three Search Algorithms**: A* (Manhattan), BFS, and DFS with depth limiting
* **Modern Web Interface**: Beautiful, responsive design with dark/light theme toggle
* **Real-time Puzzle Solving**: Watch the solution steps in action
* **Interactive Controls**: Shuffle, solve, and visualize puzzle solutions

## Installation

1. **Clone or download the project files**
2. **Install Python dependencies**:  
   ```
   pip install -r requirements.txt
   ```
3. **Run the application**:  
   ```
   python app.py
   ```
4. **Open your browser** and navigate to:  
   ```
   http://localhost:5000
   ```

## How to Use

### Puzzle Creation

1. **Upload an Image**: Click "Choose File" and select any image (PNG, JPG, JPEG, BMP)
2. **Generate Puzzle**: Click "Upload & Generate" to create your custom 8-puzzle
3. **View Tiles**: The image will be automatically sliced into 9 tiles in a 3x3 grid

### Solving the Puzzle

1. **Choose Algorithm**: Select your preferred solving algorithm from the dropdown
   * **A* (Manhattan)**: Optimal solution with Manhattan distance heuristic
   * **BFS**: Breadth-first search for shortest path
   * **DFS**: Depth-first search with depth limit of 50
2. **Shuffle**: Click "Shuffle" to randomize the puzzle tiles
3. **Solve**: Click "Solve" to watch the AI find the solution
4. **Watch**: Observe the step-by-step solution animation

### AI Algorithms

* **A* Search**: Uses Manhattan distance heuristic for optimal performance and shortest solution path
* **Breadth-First Search (BFS)**: Uninformed search that guarantees shortest path but may be slower
* **Depth-First Search (DFS)**: Limited depth search (50 moves) that may not find the shortest solution

### Controls

* Upload any image to create a custom puzzle
* Use "Shuffle" to randomize the puzzle state
* Use "Solve" to find the optimal solution
* Toggle between dark and light themes
* Choose different search algorithms

## Technical Details

### Files Structure

```
8-puzzle-solver/
├── solver.py             # Core puzzle logic and search algorithms
├── app.py               # Flask web application
├── templates/
│   └── index.html       # Web interface
├── static/
│   ├── style.css        # Styling and themes
│   ├── script.js        # Frontend JavaScript logic
│   ├── puzzle.js        # Puzzle game logic
│   └── uploads/         # Generated puzzle tiles
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Algorithm Performance

* **A* Search**: Most efficient with Manhattan distance heuristic, guarantees optimal solution
* **BFS**: Guarantees shortest path but explores more nodes
* **DFS**: Fast for simple states but may not find optimal solution

## Troubleshooting

### Common Issues

1. **"Import flask could not be resolved"**  
   * Make sure you've installed the requirements: `pip install -r requirements.txt`
2. **Port already in use**  
   * Change the port in `app.py` or kill the existing process
3. **AI solving is slow**  
   * This is normal for complex puzzle states  
   * Try A* algorithm for better performance
4. **Image upload fails**  
   * Ensure the image is in supported format (PNG, JPG, JPEG, BMP)
   * Check file size and image dimensions

### Performance Tips

* A* algorithm is significantly faster than BFS for complex puzzles
* DFS may not find solutions for difficult puzzle states
* The web interface provides visual feedback during solving process

## Development

The application is built with:

* **Backend**: Python Flask
* **Frontend**: HTML5, CSS3, JavaScript
* **Image Processing**: OpenCV, Pillow
* **AI**: Custom A*, BFS, and DFS implementations

## License

This project is for educational purposes. Feel free to use and modify as needed.

## About

A modern web-based 8-puzzle solver featuring multiple search algorithms and custom image upload functionality. 