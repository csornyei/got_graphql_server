# Game of Thrones Server

This is a simple GraphQL server for Game of Thrones characters, books and houses.

The data is gathered from [an API of Ice and Fire](https://anapioficeandfire.com)

I used Express, PostgreSQl.

The SQL for the database can be created with the scripts in the tools folder:

- run `node getData.js` to get the data from the endpoint
- run `node jsonToSql.js` to convert this data to SQL

The server can be started with `npm start` or with Docker.

To start the server you need to provide the following environmental variables:

```
    DATABASE_USER,
    DATABASE_HOST,
    DATABASE_DB_NAME,
    DATABASE_PASSWORD,
    DATABASE_PORT,
```
