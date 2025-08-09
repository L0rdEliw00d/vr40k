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
    console.error('Error executing query', err.stack);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch character data." 
    });
  }
});

// --- MODIFIED SAVE ROUTE ---
// Route to handle saving character data to the database.
app.post('/api/save_character', async (req, res) => {
  // Added 'wounds' to the destructured properties
  const { name, username, bio, media_choice_index, faction, rank, unit_name, wounds } = req.body;
  
  console.log("Received a POST request to /api/save_character with data:");
  console.log(req.body);

  // The SQL query now includes the 'wounds' column for new entries
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
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  // The values array now includes the 'wounds' value with a default
  const values = [
    name || '',
    username || '',
    bio || '',
    media_choice_index || 0,
    faction || '',
    rank || '',
    unit_name || '',
    // If 'wounds' is provided in the request, use it. Otherwise, default to 3.
    wounds || 3 
  ];

  try {
    const result = await pool.query(queryText, values);
    console.log('Database operation successful:', result.rows[0]);
    res.status(200).json({ 
      status: "success", 
      message: "Character data saved to database successfully.",
      data: result.rows[0] 
    });
  } catch (err) {
    console.error('Error executing query', err.stack);
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
