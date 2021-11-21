const fs = require("fs");

const asoiafData = JSON.parse(fs.readFileSync("asoiaf.json"));

function sanitize(str) {
    return str.replace(/"|'/g, "''")
}

function removeURL(str) {
    const urls = [
        "https://www.anapioficeandfire.com/api/houses/",
        "https://www.anapioficeandfire.com/api/characters/",
        "https://www.anapioficeandfire.com/api/books/"
    ];
    let result = str;
    if (!!result) {
        urls.forEach(url => {
            if (result.includes(url)) {
                result = result.replace(url, "");
            }
        });
    }
    return result;
}

function getColumns(data, idColumnName, skippedColumns = []) {
    return Array.from(new Set(data.flatMap(d => Object.keys(d).filter(k => skippedColumns.indexOf(k) === -1).map(key => {
        if (key === idColumnName) return 'id';
        return key;
    }))));
};


function createTable(tableName, columns) {
    const rows = columns.map(c => {
        if (c === 'id') return '\tid integer PRIMARY KEY';
        return `\t${c} varchar`;
    });

    return `\nCREATE TABLE ${tableName} (\n${rows.join(",\n")}\n);`
}

function insertData(tableName, columns, values) {
    return `\nINSERT INTO ${tableName} \n\t(${columns.join(", ")})\nVALUES${values.join(",")};`;
}

const housesColumns = getColumns(asoiafData["houses"], 'url', ['currentLord', 'heir', 'overlord', 'founder', 'cadetBranches', 'swornMembers']);
const housesValues = asoiafData["houses"].map((data) => {
    const values = Object.values(data).map(value => {
        if (typeof value === 'number') {
            return removeURL(sanitize(value.toString()));
        } else if (typeof value === 'string') {
            return removeURL(sanitize(value));
        } else {
            return value.map(v => removeURL(sanitize(v))).join(",")
        }
    })
    return `\n\t('${values.join("', '")}')`
});
const createHousesTable = createTable("houses", housesColumns);
const housesInsert = insertData("houses", housesColumns, housesValues);

const booksColumns = getColumns(asoiafData["books"], 'url', ['characters', 'povCharacters']);
const booksValues = asoiafData["books"].map((data) => {
    const values = Object.values(data).map(value => {
        if (typeof value === 'number') {
            return removeURL(sanitize(value.toString()));
        } else if (typeof value === 'string') {
            return removeURL(sanitize(value));
        } else {
            return value.map(v => removeURL(sanitize(v))).join(",")
        }
    })
    return `\n\t('${values.join("', '")}')`
});
const createBooksTable = createTable("books", booksColumns);
const booksInsert = insertData("books", booksColumns, booksValues);

const charactersInBooksValues = [];
const characterRelationsValues = [];
const characterAllegiancesValues = [];

const charactersColumns = getColumns(asoiafData["characters"], 'url', ['father', 'mother', 'spouse', 'allegiances', 'books', 'povBooks']);
const charactersValues = asoiafData["characters"].map((data) => {
    const values = [];
    const relationKeys = ['father', 'mother', 'spouse', 'allegiances', 'books', 'povBooks'];
    Object.entries(data).forEach(([key, value]) => {
        if (relationKeys.indexOf(key) !== -1) {
            if ((key === 'father' || key === 'mother') && value.length > 0 && !!value) {
                characterRelationsValues.push(`\n\t(${characterRelationsValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(value))}, '${key}')`);
            }
            if (key === 'spouse') {
                if (typeof value === 'string') {
                    if (value.length > 0) {
                        characterRelationsValues.push(`\n\t(${characterRelationsValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(value))}, '${key}')`);
                    }
                } else {
                    value.forEach(spouseId => {
                        if (!!spouseId) {
                            characterRelationsValues.push(`\n\t(${characterRelationsValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(spouseId))}, '${key}')`);
                        }
                    });
                }
            }
            if (key === 'allegiances') {
                value.forEach(houseId => {
                    if (!!houseId) {
                        characterAllegiancesValues.push(`\n\t(${characterAllegiancesValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(houseId))})`);
                    }
                });
            }
            if (key === 'books') {

                value.forEach(bookId => {
                    if (!!bookId) {
                        charactersInBooksValues.push(`\n\t(${charactersInBooksValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(bookId))}, false)`);
                    }
                });
            }
            if (key === 'povBooks') {
                value.forEach(bookId => {
                    if (!!bookId) {
                        charactersInBooksValues.push(`\n\t(${charactersInBooksValues.length}, ${parseInt(removeURL(data.url))}, ${parseInt(removeURL(bookId))}, true)`);
                    }
                });
            }
        } else {
            if (typeof value === 'number') {
                values.push(removeURL(sanitize(value.toString())));
            } else if (typeof value === 'string') {
                values.push(removeURL(sanitize(value)));
            } else {
                values.push(value.map(v => removeURL(sanitize(v))).join(","));
            }
        }
    })
    return `\n\t('${values.join("', '")}')`
});
const createCharactersTable = createTable("characters", charactersColumns);
const charactersInsert = insertData("characters", charactersColumns, charactersValues);

const charactersInBooksColumns = ["id", "characterId", "bookId", "pov"];
const charactersInBooksTable = `\nCREATE TABLE charactersInBooks (
    id integer PRIMARY KEY,
    characterId integer,
    bookId integer,
    pov boolean DEFAULT false
    );`
const charactersInBooksInsert = insertData("charactersInBooks", charactersInBooksColumns, charactersInBooksValues);

const characterRelationsColumns = ["id", "characterId", "relatedCharacterId", "relationType"];
const characterRelationsTable = `\nCREATE TABLE  characterRelations (
        id integer PRIMARY KEY,
        characterId integer,
        relatedCharacterId integer,
        relationType varchar(16)
        );`;
const characterRelationsInsert = insertData("characterRelations", characterRelationsColumns, characterRelationsValues);

const characterAllegiancesColumns = ["id", "characterId", "houseId"];
const characterAllegiancesTable = `\nCREATE TABLE characterAllegiances (
    id integer PRIMARY KEY,
    characterId integer,
    houseId integer
);`;
const characterAllegiancesInsert = insertData("characterAllegiances", characterAllegiancesColumns, characterAllegiancesValues);


const sql = [
    createHousesTable, housesInsert,
    createBooksTable, booksInsert,
    createCharactersTable, charactersInsert,
    charactersInBooksTable,
    characterRelationsTable,
    characterAllegiancesTable,
    charactersInBooksInsert,
    characterRelationsInsert,
    characterAllegiancesInsert
].join("");

fs.writeFileSync("gotData.sql", sql);