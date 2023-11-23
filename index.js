import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to find the title
const findAnimeTitle = (data) => {
    const englishTitle = data.titles.find(title => title.type === "English");
    const defaultTitle = data.titles.find(title => title.type === "Default");

    if (englishTitle) {
        return englishTitle.title;
    } else if (defaultTitle) {
        return defaultTitle.title;
    } else {
        return "Title not found";
    }
};

// Tracks the active page
let activePage;
let randomAnimeResult;

// Animes displayed in the carousel, requires background image in ./public/images
const animeID = [
    "21", // One Piece
    "40748", // Jujutsu Kaisen
    "38000", // Demon Slayer
    "16498", // Attack on Titan
];

app.get("/", async (req, res) => {
    try {
        activePage = "Home";
        randomAnimeResult = "";
        // Grab information from the API for the Carousel
        const animeInfo = [];
        for (const id of animeID) {
            const animeSearchResult = await axios.get(API_URL + "/anime/" + id);
            await delay(500); // Introduce a 1-second delay between requests
            animeInfo.push(animeSearchResult.data.data);
        }

        // Grab information from the API for Top Anime 
        const topAnimeResult = await axios.get(API_URL + "/top/anime");

        res.render("index.ejs", {
            activePage,
            animeInfo,
            topAnime: topAnimeResult.data.data,
        })
    } catch(error) {
        console.log(error.response.data);
        res.status(500);
    }
});

app.get("/random", (req, res) => {
    try {
        activePage = "Random";

        // Check if randomAnimeResult has a value
        if (!randomAnimeResult) {
            // Redirect to the main page if randomAnimeResult is undefined
            return res.redirect("/");
        }

        // Find the English title or else use the default title
        const animeTitle = findAnimeTitle(randomAnimeResult.data.data);

        res.render("random-anime.ejs", {
            activePage,
            randomAnime: randomAnimeResult.data.data,
            animeTitle
        })
    } catch(error) {
        console.log(error.response.data);
        res.status(500);
    }
});

app.post("/random", async (req, res) => {
    try {
        activePage = "Random";
        // Grab information from the API to get a Random Anime
        randomAnimeResult = await axios.get(API_URL + "/random/anime");

        res.redirect("/random");
    } catch(error) {
        console.log(error.response.data);
        res.status(500);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  