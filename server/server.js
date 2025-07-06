// server.js

// --- Dependencies ---
// 'express' is a popular and easy-to-use web framework for Node.js.
const express = require('express');
// 'cors' is a middleware to handle Cross-Origin Resource Sharing, which is
// necessary to allow your Godot client (from a different 'origin') to
// communicate with this server.
const cors = require('cors');

// --- Initialization ---
// Create an instance of an Express application.
const app = express();
// Heroku provides a dynamic port through an environment variable. If we are
// running locally, we can use a default port like 3000.
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Use the CORS middleware to allow all cross-origin requests.
app.use(cors());
// Use Express's built-in middleware to automatically parse incoming JSON bodies.
// This is crucial for receiving data from your Godot client.
app.use(express.json());

// --- Routes ---

// A simple GET route for the root URL. This is useful for checking if the
// server is running by simply visiting the Heroku URL in a browser.
app.get('/', (req, res) => {
  res.send('Hello! This is the server for your Godot game. It is running correctly.');
});

// An example GET route that matches the one in your Godot script.
// It sends back a sample leaderboard.
app.get('/api/leaderboard', (req, res) => {
  console.log("Received a GET request for /api/leaderboard");
  const leaderboardData = {
    scores: [
      { "player": "Ada", "score": 1000 },
      { "player": "Leo", "score": 950 },
      { "player": "Zoe", "score": 800 }
    ]
  };
  res.json(leaderboardData);
});

// An example POST route that matches the one in your Godot script.
// It receives data, logs it, and sends back a success confirmation.
app.post('/api/save_character', (req, res) => {
  // The parsed JSON data from the Godot client is available in 'req.body'.
  const characterData = req.body;
  
  console.log("Received a POST request to /api/save_character with data:");
  console.log(characterData);
  
  // Here, you would typically save this data to a database (like PostgreSQL or MongoDB).
  // For this example, we'll just send back a success message.
  res.status(200).json({ 
    status: "success", 
    message: "Character data received successfully.",
    receivedData: characterData 
  });
});


// --- Start Server ---
// Start the server and make it listen for incoming connections on the specified port.
app.listen(process.env.PORT || 5000)
