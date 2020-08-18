const corsAPI = "http://cors-anywhere.herokuapp.com/"
const tibiaWikiAPI = "https://tibiawiki.dev/api/"

let creatures, exp, time, balance, damage, healing, lines;

let creatureObject = {
    name: "",
    exp: "",
    count: ""
}

document.getElementById("btn-calculate").addEventListener("click", parseHunt);
populateHuntingPlaces();

function parseHunt() {
    lines = document.getElementById("dataInput").value.split("\n");
    lines.forEach((line, index, array) => array[index] = line.trim());

    time = getTime("Session:");
    exp = getInt("XP Gain:");

    getCreatures()
        .then(() => {
            console.log(creatures);

            calcXP = calculateXP(creatures) * 1.5;

            document.getElementById("xp/h").innerText;

            console.log("exp from analyzer: " + exp);
            console.log("exp calculated from session (at 150%): " + calcXP);
        })
        .catch(err => console.log(err));
}

function getInt(key) {
    line = getLine(key);
    line = line.replace(/,/g, "");
    return parseInt(line.substring(key.length + 1, line.length));
}

function getTime(key) {
    line = getLine(key);
    let hours = line.substring(key.length + 1, key.length + 3);
    let minutes = line.substring(key.length + 4, key.length + 6);
    return new Date(parseInt(hours) * 3600000 + parseInt(minutes) * 60000);
}

function getLine(key) {
    let line = lines.find(o => o.includes(key));
    return line;
}

function getCreatures() {
    let idx1, idx2;
    idx1 = lines.findIndex(line => line.includes("Killed Monsters:")) + 1;
    idx2 = lines.findIndex(line => line.includes("Looted items:"));
    let creatureLines = lines.slice(idx1, idx2);
    return new Promise((resolve, reject) =>
        getCreaturesMap(creatureLines)
            .then(creaturesMap => {
                creatures = creaturesMap;
                resolve();
            })
            .catch(err => reject(err)));
}

function getCreaturesMap(creatureLines) {
    let creaturesMap = new Map();
    function getKeyValuePair(creatureLine) {
        let idx = creatureLine.indexOf("x");
        let count = creatureLine.substring(0, idx);
        let name = creatureLine.substring(idx + 2);
        name = capitalizeWords(name);
        let creature = Object.create(creatureObject);
        creaturesMap.set(name, creature);

        creature.name = name;
        creature.count = count;
        return new Promise((resolve, reject) => {
            getExp(name)
                .then(exp => {
                    creature.exp = exp;
                    resolve(creaturesMap);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    let promises = [];
    creatureLines.forEach(creatureLine => promises.push(getKeyValuePair(creatureLine)));

    return new Promise((resolve, reject) =>
        Promise.all(promises)
            .then(results => resolve(creaturesMap))
            .catch(err => reject(err)));
}

function getExp(creature_name) {
    return new Promise((resolve, reject) => {
        fetch(corsAPI + tibiaWikiAPI + "creatures/" + creature_name)
            .then(result => {
                return result.json();
            })
            .then(json => resolve(json.exp))
            .catch(err => reject(err));
    });
}

function capitalizeWords(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function calculateXP(creatures) {
    let xp = 0;
    creatures.forEach(creature => xp = xp + creature.exp * creature.count);
    return xp;
}

function populateHuntingPlaces() {
    let select = document.getElementById("huntingplaces");
    let hunting_places;
    fetch(tibiaWikiAPI + "huntingplaces")
        .then(result => result.json())
        .then(json => {
            hunting_places = json;
            hunting_places.forEach(place => select.options.add(new Option(place)));
        })
        .catch(err => console.log(err));
}