const express = require('express');
const path = require('path');
const app = express();
const PORT = 8000;

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// Fallback to index.html for single page application styling, if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend Server successfully started!`);
  console.log(`🔗 Access URL: http://localhost:${PORT}/`);
});
