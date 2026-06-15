// server.js

// --- Dependencies ---
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---

// Root route for checking server status.
app.get('/', (req, res) => {
  res.send('Hello! This is the server for your Godot game. It is running correctly.');
});

// A GET route to fetch all characters from the database.
app.get('/api/characters', async (req, res) => {
  console.log("Received a GET request for /api/characters");
  
  try {
    const result = await pool.query('SELECT * FROM characters;');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching characters:', err.message);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch character data." 
    });
  }
});

// --- NEW GET ROUTE: Fetch by name and username ---
app.get('/api/get_character_by_name', async (req, res) => {
  console.log("Received a GET request for /api/get_character_by_name", req.query);
  
  // Extract parameters from the query string (e.g., ?name=Bob&username=Bob123)
  const { name, username } = req.query;

  if (!name || !username) {
    return res.status(400).json({ 
      status: "error", 
      message: "Name and username are required." 
    });
  }

  try {
    const queryText = 'SELECT * FROM characters WHERE name = $1 AND username = $2 LIMIT 1;';
    const result = await pool.query(queryText, [name, username]);

    if (result.rows.length > 0) {
      // Send the raw row back so Godot can easily read data["id"]
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ 
        status: "error", 
        message: "Character not found." 
      });
    }
  } catch (err) {
    console.error('Error fetching character by name:', err.message);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch character." 
    });
  }
});

// --- MODIFIED SAVE ROUTE ---
app.post('/api/save_character', async (req, res) => {
  const { name, username, bio, media_choice_index, faction, rank, unit_name, wounds } = req.body;
  
  console.log("Received a POST request to /api/save_character with data:", req.body);

  // Added 'wounds = EXCLUDED.wounds' to ensure updates actually save health changes
  const queryText = `
    INSERT INTO characters (name, username, bio, media_choice_index, faction, rank, unit_name, wounds)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (name, username) 
    DO UPDATE SET
      bio = EXCLUDED.bio,
      media_choice_index = EXCLUDED.media_choice_index,
      faction = EXCLUDED.faction,
      rank = EXCLUDED.rank,
      unit_name = EXCLUDED.unit_name,
      wounds = EXCLUDED.wounds, 
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
// --- BATTLE LOGGING ROUTES ---

// POST route to log a new battle
app.post('/api/log_battle', async (req, res) => {
  console.log("Received a POST request to /api/log_battle with data:", req.body);

  const { planet, battle_type, factions_involved, participants } = req.body;

  // Basic validation to make sure Godot sent the required data
  if (!planet || !battle_type || !factions_involved || !participants) {
    return res.status(400).json({ 
      status: "error", 
      message: "Missing required battle data." 
    });
  }

  const queryText = `
    INSERT INTO battles (planet, battle_type, factions_involved, participants)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  // We pass the arrays/objects directly; the 'pg' library handles converting them for Postgres
  const values = [
    planet,
    battle_type,
    factions_involved,
    participants 
  ];

  try {
    const result = await pool.query(queryText, values);
    console.log('Battle successfully logged on planet:', result.rows[0].planet);
    
    // Return the raw row so Godot can confirm the save and read the new battle 'id'
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error logging battle:', err.message);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to log battle to database." 
    });
  }
});

// GET route to fetch recent battles (Useful for a global history board in-game)
app.get('/api/battles', async (req, res) => {
  console.log("Received a GET request for /api/battles");
  
  // You can use req.query to limit how many battles you pull, defaulting to 50
  const limit = parseInt(req.query.limit) || 50;

  try {
    // Fetches the battles ordered by the newest first
    const queryText = 'SELECT * FROM battles ORDER BY created_at DESC LIMIT $1;';
    const result = await pool.query(queryText, [limit]);
    
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching battles:', err.message);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch battle history." 
    });
  }
});
  // Swapped || for ?? to prevent 0 from being overwritten by defaults
  const values = [
    name ?? '',
    username ?? '',
    bio ?? '',
    media_choice_index ?? 0,
    faction ?? '',
    rank ?? '',
    unit_name ?? '',
    wounds ?? 3 
  ];

  try {
    const result = await pool.query(queryText, values);
    console.log('Database operation successful:', result.rows[0].name);
    
    // MODIFIED: Return just the raw database row so Godot can parse `response_data["id"]` directly
    res.status(200).json(result.rows[0]);
    
  } catch (err) {
    console.error('Error executing query:', err.message);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to save character data to database." 
    });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
