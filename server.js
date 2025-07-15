// server.js

// --- Dependencies ---
const express = require('express');
const cors = require('cors');
// Import the Pool object from the 'pg' library to manage database connections.
const { Pool } = require('pg');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
// Create a new Pool instance. On Render, it will automatically use the DATABASE_URL
// environment variable. For local development, you need to set this variable.
// It includes SSL configuration required for most remote database connections.
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

// Route to handle saving character data to the database.
app.post('/api/save_character', async (req, res) => {
  // Destructure the data from the request body for clarity.
  const { name, username, bio, media_choice_index, faction, rank, unit_name } = req.body;
  
  console.log("Received a POST request to /api/save_character with data:");
  console.log(req.body);

  // This SQL query performs an "UPSERT".
  // It tries to INSERT a new character. If a character with the same 'name' AND 'username'
  // already exists (based on the UNIQUE constraint), it will UPDATE the existing row instead.
  const queryText = `
    INSERT INTO characters (name, username, bio, media_choice_index, faction, rank, unit_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
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

  // Use parameterized values to prevent SQL injection.
  // Provide default empty strings or 0 for any potentially missing data.
  const values = [
    name || '',
    username || '',
    bio || '',
    media_choice_index || 0,
    faction || '',
    rank || '',
    unit_name || ''
  ];

  try {
    // Get a client from the connection pool and execute the query.
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
