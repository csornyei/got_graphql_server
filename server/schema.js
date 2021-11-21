const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLSchema, GraphQLList, GraphQLNonNull } = require('graphql');
const pool = require('./db');
const joinMonster = require('join-monster')

const Character = new GraphQLObjectType({
    name: "Character",
    extensions: {
        joinMonster: {
            sqlTable: 'characters',
            uniqueKey: 'id'
        }
    },
    description: "Represents a character from Game of Thrones",
    fields: () => ({
        id: {
            type: GraphQLInt,
            extensions: {
                joinMonster: {
                    sqlColumn: 'id'
                }
            }
        },
        name: {
            type: GraphQLString
        },
        gender: {
            type: GraphQLString
        },
        culture: {
            type: GraphQLString
        },
        born: {
            type: GraphQLString
        },
        died: {
            type: GraphQLString
        },
        titles: {
            type: GraphQLString
        },
        aliases: {
            type: GraphQLString
        },
        tvseries: {
            type: GraphQLString
        },
        playedby: {
            type: GraphQLString
        },
        povBooks: {
            type: GraphQLList(Book),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "charactersinbooks",
                        where: inBooksTable => `${inBooksTable}.pov = true`,
                        sqlJoins: [
                            (charactersTable, inBooksTable) => `${charactersTable}.id = ${inBooksTable}.characterid`,
                            (inBooksTable, booksTable) => `${inBooksTable}.bookid = ${booksTable}.id`
                        ]
                    }
                }
            }
        },
        books: {
            type: GraphQLList(Book),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "charactersinbooks",
                        sqlJoins: [
                            (charactersTable, inBooksTable) => `${charactersTable}.id = ${inBooksTable}.characterid`,
                            (inBooksTable, booksTable) => `${inBooksTable}.bookid = ${booksTable}.id`
                        ]
                    }
                }
            }
        },
        allegiances: {
            type: GraphQLList(House),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "characterallegiances",
                        sqlJoins: [
                            (charactersTable, characterAllegiancesTable) => `${charactersTable}.id = ${characterAllegiancesTable}.characterid`,
                            (characterAllegiancesTable, housesTable) => `${characterAllegiancesTable}.houseid = ${housesTable}.id`
                        ]
                    }
                }
            }
        },
        father: {
            type: GraphQLList(Character),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "characterrelations",
                        where: charRelationTable => `${charRelationTable}.relationtype = 'father'`,
                        sqlJoins: [
                            (charactersTable, charRelationTable) => `${charactersTable}.id = ${charRelationTable}.characterid`,
                            (charRelationTable, charactersTable) => `${charRelationTable}.relatedcharacterid = ${charactersTable}.id`
                        ]
                    }
                }
            }
        },
        mother: {
            type: GraphQLList(Character),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "characterrelations",
                        where: charRelationTable => `${charRelationTable}.relationtype = 'mother'`,
                        sqlJoins: [
                            (charactersTable, charRelationTable) => `${charactersTable}.id = ${charRelationTable}.characterid`,
                            (charRelationTable, charactersTable) => `${charRelationTable}.relatedcharacterid = ${charactersTable}.id`
                        ]
                    }
                }
            }
        },
        spouse: {
            type: GraphQLList(Character),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "characterrelations",
                        where: charRelationTable => `${charRelationTable}.relationtype = 'spouse'`,
                        sqlJoins: [
                            (charactersTable, charRelationTable) => `${charactersTable}.id = ${charRelationTable}.characterid`,
                            (charRelationTable, charactersTable) => `${charRelationTable}.relatedcharacterid = ${charactersTable}.id`
                        ]
                    }
                }
            }
        }
    })
});

const Book = new GraphQLObjectType({
    name: "Book",
    description: "Represents a Game of Thrones related book",
    extensions: {
        joinMonster: {
            uniqueKey: "id",
            sqlTable: "books"
        }
    },
    fields: () => ({
        id: { type: GraphQLInt },
        name: { type: GraphQLString },
        isbn: { type: GraphQLString },
        author: { type: GraphQLString },
        numberofpages: { type: GraphQLString },
        publisher: { type: GraphQLString },
        country: { type: GraphQLString },
        ediatype: { type: GraphQLString },
        released: { type: GraphQLString },
        characters: {
            type: GraphQLList(Book),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "charactersinbooks",
                        sqlJoins: [
                            (booksTable, inBooksTable) => `${inBooksTable}.bookid = ${booksTable}.id`,
                            (inBooksTable, charactersTable) => `${charactersTable}.id = ${inBooksTable}.characterid`
                        ]
                    }
                }
            }
        }
    })
});

const House = new GraphQLObjectType({
    name: "House",
    description: "Represents a House in the Game of Thrones",
    extensions: {
        joinMonster: {
            uniqueKey: "id",
            sqlTable: "houses"
        }
    },
    fields: () => ({
        id: { type: GraphQLInt },
        name: { type: GraphQLString },
        region: { type: GraphQLString },
        coatofarms: { type: GraphQLString },
        words: { type: GraphQLString },
        titles: { type: GraphQLString },
        seats: { type: GraphQLString },
        founded: { type: GraphQLString },
        diedout: { type: GraphQLString },
        ancestralweapons: { type: GraphQLString },
        allignedCharacters: {
            type: GraphQLList(Character),
            extensions: {
                joinMonster: {
                    junction: {
                        sqlTable: "characterallegiances",
                        sqlJoins: [
                            (housesTable, characterAllegiancesTable) => `${characterAllegiancesTable}.houseid = ${housesTable}.id`,
                            (characterAllegiancesTable, charactersTable) => `${charactersTable}.id = ${characterAllegiancesTable}.characterid`
                        ]
                    }
                }
            }
        },
    })
});

const Query = new GraphQLObjectType({
    name: "Query",
    description: "This is the root query",
    fields: () => {
        return {
            characters: {
                type: new GraphQLList(Character),
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster.default(resolveInfo, {}, sql => {
                        return pool.query(sql)
                    })
                }
            },
            character: {
                type: Character,
                args: { id: { type: GraphQLNonNull(GraphQLInt) } },
                where: (playerTable, args) => `${playerTable}.id = ${args.id}`,
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster(resolveInfo, {}, sql => {
                        return pool.query(sql);
                    })
                }
            },
            books: {
                type: new GraphQLList(Book),
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster.default(resolveInfo, {}, sql => {
                        return pool.query(sql)
                    })
                }
            },
            book: {
                type: Book,
                args: { id: { type: GraphQLNonNull(GraphQLInt) } },
                where: (booksTable, args) => `${booksTable}.id = ${args.id}`,
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster(resolveInfo, {}, sql => {
                        return pool.query(sql);
                    })
                }
            },
            houses: {
                type: new GraphQLList(House),
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster.default(resolveInfo, {}, sql => {
                        return pool.query(sql)
                    })
                }
            },
            house: {
                type: House,
                args: { id: { type: GraphQLNonNull(GraphQLInt) } },
                where: (housesTable, args) => `${housesTable}.id = ${args.id}`,
                resolve: (parent, args, context, resolveInfo) => {
                    return joinMonster(resolveInfo, {}, sql => {
                        return pool.query(sql);
                    })
                }
            },
        }
    }
});

module.exports = new GraphQLSchema({
    query: Query
});
