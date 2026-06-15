const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello! This is the server for your Godot game. It is running correctly.');
});

app.get('/api/characters', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM characters;');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: "Failed to fetch character data." });
  }
});

app.get('/api/get_character_by_name', async (req, res) => {
  const { name, username } = req.query;

  if (!name || !username) {
    return res.status(400).json({ status: "error", message: "Name and username are required." });
  }

  try {
    const queryText = 'SELECT * FROM characters WHERE name = $1 AND username = $2 LIMIT 1;';
    const result = await pool.query(queryText, [name, username]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ status: "error", message: "Character not found." });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: "Failed to fetch character." });
  }
});

app.post('/api/save_character', async (req, res) => {
  const { name, username, bio, media_choice_index, faction, rank, unit_name, wounds } = req.body;
  
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
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: "Failed to save character data." });
  }
});

app.post('/api/log_battle', async (req, res) => {
  const { planet, battle_type, factions_involved, winning_faction, lore, participants } = req.body;

  if (!planet || !battle_type || !factions_involved || !winning_faction || !participants) {
    return res.status(400).json({ status: "error", message: "Missing required battle data." });
  }

  const queryText = `
    INSERT INTO battles (planet, battle_type, factions_involved, winning_faction, lore, participants)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    planet,
    battle_type,
    factions_involved,
    winning_faction,
    lore ?? '', 
    participants 
  ];

  try {
    const result = await pool.query(queryText, values);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: "Failed to log battle." });
  }
});

app.get('/api/battles', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  try {
    const queryText = 'SELECT * FROM battles ORDER BY created_at DESC LIMIT $1;';
    const result = await pool.query(queryText, [limit]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: "Failed to fetch battle history." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
