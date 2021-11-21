const axios = require('axios');
const fs = require("fs");

function getLinks(links) {
    return links.split(',').map(l => {
        const [link, rel] = l.split("; rel=");
        return { link: link.replace(/<|>/g, "").trim(), rel: rel.replace(/"/g, "") }
    });
}

const getData = async (url) => {
    const { headers, data } = await axios.get(url);
    const links = getLinks(headers["link"])
    const nextLink = links.find(({ rel }) => rel === "next");
    if (nextLink) {
        console.log("calling get data with", nextLink);
        return [...data, ...await getData(nextLink.link)];
    } else {
        console.log("finished");
        return data;
    }
}

const writeData = async () => {
    fs.writeFileSync("asoiaf.json", JSON.stringify({
        houses: await getData("https://www.anapioficeandfire.com/api/houses?pageSize=50"),
        books: await getData("https://www.anapioficeandfire.com/api/books?pageSize=50"),
        characters: await getData("https://www.anapioficeandfire.com/api/characters?pageSize=50")
    }, null, 2));
}

writeData();
