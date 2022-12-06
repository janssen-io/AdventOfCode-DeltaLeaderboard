const fs = require('fs');
const delta = require('./delta.js');

if (!process.argv[2]) {
    console.error("Error: expected 1 argument (e.g., node delta.js leaderboard.json)");
    process.exit(1);
}

fs.readFile(process.argv[2], 'utf8', function(error, data) {
    delta.calculate(JSON.parse(data));
});