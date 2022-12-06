const fs = require('fs');

if (!process.argv[2]) {
    console.error("Error: expected 1 argument (e.g., node delta.js leaderboard.json)");
    process.exit(1);
}

fs.readFile(process.argv[2], 'utf8', function(error, data) {
    calculate(JSON.parse(data));
});

function calculate(leaderboard) {
    var members = Object.values(leaderboard.members);
    var ndays = 25;

    const notCompleted = new Set([]);
    const days = [];
    /*
     * [{
     *  date: number,
     *  times: [ { name, delta } ]
     * }]
     */
    for(let i = 1; i <= ndays; i++) {
        const day = { date: i };
        const times = [];
        for(let member of members) {
            const ts = member.completion_day_level[i];
            if (!ts || !ts[2]) {
                notCompleted.add(member.name);
                // times.push( {name: member.name, delta: undefined} );
            }
            else {
                times.push( {name: member.name, delta: ts[2].get_star_ts - ts[1].get_star_ts} );
            }
        }
        day.times = times.sort((a,b) => !a.delta ? 1 : !b.delta ? -1 : a.delta - b.delta);
        days.push(day);
    }

    // Tally the points, add 0 if no delta available
    for (let day of days) {
        let points = members.length;
        day.times = day.times.map(t => { t.points = (t.delta ? points-- : 0); return t; });
    }

    let totalPointsPerMember = {}
    for(let day of days) {
        for(let time of day.times) {
            totalPointsPerMember[time.name] = (totalPointsPerMember[time.name] || 0) + time.points;
        }
    }

    let totalTimePerMember = {}
    for(let day of days) {
        for(let time of day.times) {
            totalTimePerMember[time.name] = (totalTimePerMember[time.name] || 0) + (time.delta || 0);
        }
    }

    let countPart2ByMember = {}
    for(let day of days) {
        for(let time of day.times) {
            countPart2ByMember[time.name] = (countPart2ByMember[time.name] || 0) + 1
        }
    }

    let result = [];
    for(let member of Object.keys(totalPointsPerMember)) {
        result.push({
            name: member,
            points: totalPointsPerMember[member],
            total_time_in_h: Math.round(totalTimePerMember[member] / 360) / 10,
            completed_days: countPart2ByMember[member]
        });
    }

    console.log("High Score (delta)");
    pprint(result.sort((a,b) => b.points - a.points));
    /* console.log();
    console.log("Fastest Time (delta)");
    pprint(result.sort((a,b) => a.total_time_in_h - b.total_time_in_h), notCompleted); */

}

function pprint(listOfObjects, skips) {
    skips = skips || new Set();
    let objects = JSON.parse(JSON.stringify(listOfObjects));
    let columns = Object.keys(objects[0]);
    objects.unshift(columns.reduce((p,n) => { p[n] = n; return p; }, {}));
    let maxSize = columns.reduce((p, n) => {
        p[n] = objects.reduce((max, obj) => {
            return ('' + obj[n]).length > max ? ('' + obj[n]).length : max;

        }, 0);
        return p;
    }, {});

    for(let obj of objects) {
        let row = '';
        if (skips.has(obj.name)) {
            continue;
        }
        for(let col of columns) {
            if (typeof obj[col] == 'number') {
                row += '  ' + ('' + obj[col]).padStart(maxSize[col], ' ');
            } else {
                row += '  ' + ('' + obj[col]).padEnd(maxSize[col], ' ');
            }
        }
        console.log(row);
    }
}

