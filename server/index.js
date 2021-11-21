const express = require('express');
const { graphqlHTTP } = require("express-graphql");
const schema = require('./schema');

const PORT = process.env.PORT;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send({
        message: "hello!"
    });
});

app.use('/graphql', graphqlHTTP({ schema, graphiql: process.env.NODE_ENV === 'development' }));

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    if (process.env.NODE_ENV === 'development') {
        console.log("GraphiQL is available on:");
        console.log(`http://localhost:${PORT}/graphql`);
    }
})