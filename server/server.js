const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, callback) {
        callback(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Handle character uploads
app.post('/upload-character', upload.single('character'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }
    
    try {
        // Read and parse the JSON file
        const jsonData = JSON.parse(
            fs.readFileSync(req.file.path, 'utf8')
        );

        // Validate character data
        if (!jsonData.name || !jsonData.attributes) {
            return res.status(400).send({ 
                message: 'Invalid character data' 
            });
        }

        // Save to database or process further
        res.send({
            status: 'success',
            fileName: req.file.filename,
            data: jsonData
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Handle game state updates
app.post('/update-game-state', (req, res) => {
    const { gameId, state } = req.body;
    // Update game state logic here
    res.send({ status: 'success' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
