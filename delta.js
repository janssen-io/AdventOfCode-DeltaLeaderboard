
// fn = (previousValue, currentValue, currentKey, originalObject) -> newValue
Object.prototype.reduce = function(fn, initialValue = {}) {
    const self = this;
    for(let key of Object.keys(self)) {
        initialValue = fn(initialValue, self[key], key, self);
    }
    return initialValue;
}

// apply a function every value of the object 
Object.prototype.map = function(fn) {
    const result = {};
    for(let key of Object.keys(this)) {
        result[key] = fn(this[key]);
    }
    return result;
}

Array.prototype.without = function(other) {
    return this.filter(x => !other.includes(x));
}

Object.prototype.combine = function(other, fn) {
    const result = {};
    for(let key of this.keys()) {
        result[key] = fn(this[key], other[key]);
    }
    for(let key of other.keys().without(this.keys())) {
        result[key] = fn(undefined, other[key]);
    }
    return result;
}

// remove all keys for which the filter does not apply to the value
Object.prototype.filter = function(fn) {
    const result = {};
    for(let key of this.keys()) {
        if (fn(this[key])) result[key] = this[key];
    }
    return result;
}

Object.prototype.keys = function() {
    return Object.keys(this);
}
/*
"1547317": {
    "stars": 10,
    "last_star_ts": 1670234968,
    "name": "MaxdenHartog",
    "local_score": 129,
    "completion_day_level": {
        "4": {
            "1": {
                "get_star_ts": 1670143706,
                "star_index": 915094
            },
            "2": {
                "star_index": 915720,
                "get_star_ts": 1670143856
            }
        },
*/

/*
    from:
        { completion_day_level: { "1": { ... }, "2": { ... }}}
    to:
        [ { day: number, [memberId]: { part1: number, part2: number }}]
*/
function member_to_day(member) {
    return member.completion_day_level.reduce((days, day, dayNumber) => {
        days[dayNumber] = days[dayNumber] || {};
        days[dayNumber][member.id] = days[dayNumber][member.id] || {};
        days[dayNumber][member.id].part1 = day["1"] && day["1"].get_star_ts
        days[dayNumber][member.id].part2 = day["2"] && day["2"].get_star_ts
        return days;
    }).reduce((days, day, dayNumber) => {
        day.day = dayNumber;
        days.push(day);
        return days;
    }, [])
}

/*
    transform the leaderboard from:
        { [memberId]: { completion_level: { [day]: {[part]: time }}}} 
    to:
        [ { day: number, [memberId]: {[part]: time }} ]
 */
function byMember_to_byDay(members) {
    return members.reduce((byDay, member) => {
        const memberDays = member_to_day(member);
        const mergedDays = memberDays.reduce((days, ms, dayNumber) => {
            days[dayNumber] = Object.assign(ms, byDay[dayNumber]);
            return days;
        }, byDay || []);
        return mergedDays;
    });
}

function delta(memberDay) {
    if (memberDay.part2 && memberDay.part1) {
        return memberDay.part2 - memberDay.part1;
    }
    return null;
}

function numberOfCompletedDays(member) {
    return member.completion_day_level
        .filter(day => Object.values(day).length == 2)
        .keys()
        .length;
}

function calc(leaderboard) {
    const byDay = byMember_to_byDay(leaderboard.members);
    const numberOfMembers = leaderboard.members.keys().length;
    const deltaByDay = byDay.map(members => members.map(delta));
    const completedDaysByMember = leaderboard.members.map(numberOfCompletedDays);
    const timeSpentByMember = deltaByDay.reduce((sumByMember, day) => {
        return sumByMember.combine(day, (a,b) => {
            return a && b ? a + b : a ? a : b ? b : 0;
        });
    }, {}).map(time => Math.round(time / 360) / 10);

    const sortedDeltaByDay = deltaByDay.map(day => {
        return day.reduce((deltas, member, id) => {
            if (member)
                deltas.push({ id, delta: member });
            return deltas;
        }, []).sort((a, b) => b.delta - a.delta);
    });
    const pointsByDay = sortedDeltaByDay.map(day => {
        let lastDelta = -1;
        let points = numberOfMembers + 1;
        let pointsDelta = 1;
        return day.map((member) => {
            if (member.delta !== lastDelta) {
                points -= pointsDelta;
                pointsDelta = 1
            }
            else {
                pointsDelta += 1;
            }
            lastDelta = member.delta;
            return {[member.id]: points }
        });
    });

    const pointsByMember = pointsByDay.reduce((points, day) => {
        return day
            .reduce((pointsByM, member) => Object.assign(pointsByM, member) , {})
            .combine(points, (a, b) => a && b ? a + b : a ? a : b ? b : 0)
    });
    return pointsByMember;
    return timeSpentByMember;
}

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
            const part = member.completion_day_level[i];
            if (!part || !part[2]) {
                notCompleted.add(member.name);
            }
            else {
                times.push( {name: member.name, delta: part[2].get_star_ts - part[1].get_star_ts} );
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
            time_spent: Math.round(totalTimePerMember[member] / 360) / 10,
            gold_stars: countPart2ByMember[member]
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


module.exports = { 
    calculate
    , pprint
    , member_to_day
    , byMember_to_byDay
    , calc
    , numberOfCompletedDays
}
