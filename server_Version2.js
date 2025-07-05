const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Example endpoints
app.post('/upload', (req, res) => { /* ... */ });
app.get('/data/:user', (req, res) => { /* ... */ });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));