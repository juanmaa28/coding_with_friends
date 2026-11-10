// Loads the tournament CSV files and parses them into objects
import teamsCsv from "../data/tournaments/teams.csv?raw";
import tournamentsCsv from "../data/tournaments/tournaments.csv?raw";
import standingsCsv from "../data/tournaments/standings.csv?raw";
import matchesCsv from "../data/tournaments/matches.csv?raw";
import photosCsv from "../data/tournaments/photos.csv?raw";
import upcomingCsv from "../data/tournaments/upcoming_tournaments.csv?raw";

const numericFields = new Set([
    "position",
    "played",
    "wins",
    "draws",
    "losses",
    "points",
    "points_for",
    "points_against",
    "point_difference",
    "sets_won",
    "sets_lost",
    "set_difference",
    "goals_for",
    "goals_against",
    "goal_difference",
    "tournament_points",
    "score_a",
    "score_b",
]);

function splitCsvLine(line) {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && nextChar === '"') {
            current += '"';
            index += 1;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

export function parseCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    const headers = splitCsvLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        return headers.reduce((row, header, index) => {
            const value = values[index] ?? "";
            row[header] = numericFields.has(header) && value !== "" ? Number(value) : value;
            return row;
        }, {});
    });
}

export function loadTournamentData() {
    return {
        teams: parseCsv(teamsCsv),
        tournaments: parseCsv(tournamentsCsv),
        standings: parseCsv(standingsCsv),
        matches: parseCsv(matchesCsv),
        photos: parseCsv(photosCsv),
        upcoming: parseCsv(upcomingCsv),
    };
}
