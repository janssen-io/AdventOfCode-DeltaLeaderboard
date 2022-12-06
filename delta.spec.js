const leaderboard = {
    "event": "2022",
    "owner_id": 123123,
    "members": {
        "1": {
            "global_score": 0,
            "id": "m1",
            "last_star_ts": 0,
            "stars": 0,
            "name": "User 1",
            "local_score": 0,
            "completion_day_level": {}
        },
        "2": {
            "stars": 10,
            "last_star_ts": 2,
            "name": "User 2",
            "local_score": 129,
            "completion_day_level": {
                "4": {
                    "1": {
                        "get_star_ts": 1670143706,
                        "star_index": 915094
                    }
                },
                "2": {
                    "2": {
                        "get_star_ts": 1669972510,
                        "star_index": 359847
                    },
                    "1": {
                        "star_index": 350753,
                        "get_star_ts": 1669970944
                    }
                },
                "1": {
                    "1": {
                        "get_star_ts": 1669884304,
                        "star_index": 58500
                    },
                    "2": {
                        "get_star_ts": 1669885004,
                        "star_index": 61552
                    }
                },
                "3": {
                    "2": {
                        "star_index": 654711,
                        "get_star_ts": 1670060639
                    },
                    "1": {
                        "star_index": 652906,
                        "get_star_ts": 1670060214
                    }
                }
            },
            "global_score": 0,
            "id": "m2"
        },
        "3": {
            "stars": 10,
            "last_star_ts": 2,
            "name": "User 3",
            "local_score": 129,
            "completion_day_level": {
                "2": {
                    "1": {
                        "star_index": 350753,
                        "get_star_ts": 1669970944
                    }
                },
                "1": {
                    "1": {
                        "get_star_ts": 1669884304,
                        "star_index": 58500
                    },
                    "2": {
                        "get_star_ts": 1669885004,
                        "star_index": 61552
                    }
                },
                "3": {
                    "2": {
                        "star_index": 654711,
                        "get_star_ts": 1670060639
                    },
                    "1": {
                        "star_index": 652906,
                        "get_star_ts": 1670060214
                    }
                }
            },
            "global_score": 0,
            "id": "m3"
        }
    }
}

const delta = require('./delta.js')
String.prototype.red = function() { return this.colour(31); }
String.prototype.green = function() { return this.colour(32); }
String.prototype.yellow = function() { return this.colour(33); }

String.prototype.colour = function(colourCode) {
    return `\x1b[${colourCode}m${this}\x1b[0m`;
}

Object.prototype.equals = function(other) {
    return JSON.stringify(this) === JSON.stringify(other);
}

const expect = a => {
    return {
        toBeEqualTo: (b, msg) => {
            if (typeof(a.equals) !== 'function') {
                a.equals = b => a === b;
            }
            if (!a.equals(b)) {
                console.error("❌", msg.red(), a, b);
            }
            else {
                console.debug("✅", msg.green())
            }
        }
    }
}

const membersToDays_1 = delta.member_to_day(leaderboard.members["1"])
let expected_1 = []
expect(membersToDays_1).toBeEqualTo(expected_1, "Members without days return an empty object")

const membersToDays_2 = delta.member_to_day(leaderboard.members["2"])
let expected_2 = [ 
  { m2: { part1: 1669884304, part2: 1669885004 }, day: '1' },
  { m2: { part1: 1669970944, part2: 1669972510 }, day: '2' },
  { m2: { part1: 1670060214, part2: 1670060639 }, day: '3' },
  { m2: { part1: 1670143706, part2: undefined }, day: '4' } ]
expect(membersToDays_2).toBeEqualTo(expected_2, "Members with days return an object with days as keys")

const byMemberToByDay_1 = delta.byMember_to_byDay(leaderboard.members);
const expected_byMemberToByDay_1 = { '1':
   { m3: { part1: 1669884304, part2: 1669885004 },
     m2: { part1: 1669884304, part2: 1669885004 } },
  '2':
   { m3: { part1: 1669970944, part2: undefined },
     m2: { part1: 1669970944, part2: 1669972510 } },
  '3':
   { m3: { part1: 1670060214, part2: 1670060639 },
     m2: { part1: 1670060214, part2: 1670060639 } },
  '4': { m2: { part1: 1670143706, part2: undefined } } };

expect(byMemberToByDay_1).toBeEqualTo(expected_byMemberToByDay_1, "Mapping members to days return all days and parts")

expect(delta.numberOfCompletedDays(leaderboard.members["1"])).toBeEqualTo(0, "numberOfCompletedDays: none");
expect(delta.numberOfCompletedDays(leaderboard.members["2"])).toBeEqualTo(3, "numberOfCompletedDays: some");








console.log(delta.calc(leaderboard))