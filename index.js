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

// Must be defined at the start of every page
let activePage; // Tracks the active page

// Must be reset if not being rendered on that page
let animeResult; // Saves or Deletes the anime result given previously
let randomAnimeResult; // Saves or Deletes the random anime result given previously

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
        animeResult = "";
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
        console.log(error.response);
        res.status(500);
    }
});

app.get("/anime/:anime_id/:anime_title", (req, res) => {
    try {
        // Check if animeResult has a value
        if (!animeResult) {
            // Redirect to the main page if randomAnimeResult is undefined
            return res.redirect("/");
        }
        activePage = "Anime";
        randomAnimeResult = "";

        // Find the English title or else use the default title
        const animeTitle = findAnimeTitle(animeResult.data.data);

        res.render("anime.ejs", {
            activePage,
            animeTitle,
            resultAnime: animeResult.data.data,
        })
    } catch(error) {
        console.log(error.response);
        res.status(500);
    }
});

app.post("/anime", async (req, res) => {
    try {
        const animeID = req.body.animeID;
        animeResult = await axios.get(API_URL + "/anime/" + animeID + "/full");
        // Extract title using your findAnimeTitle function
        const animeTitle = findAnimeTitle(animeResult.data.data).replace(/\s+/g, '_').replace(/:/g, '');
        // Handle the post request
        res.redirect(`/anime/${animeID}/${animeTitle}`);
    } catch (error) {
        console.log(error.response);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/random/:anime_id/:anime_title", (req, res) => {
    try {
        // Check if randomAnimeResult has a value
        if (!randomAnimeResult) {
            // Redirect to the main page if randomAnimeResult is undefined
            return res.redirect("/");
        }
        activePage = "Random";
        animeResult = "";

        // Find the English title or else use the default title
        const animeTitle = findAnimeTitle(randomAnimeResult.data.data);

        res.render("anime.ejs", {
            activePage,
            animeTitle,
            resultAnime: randomAnimeResult.data.data,
        })
    } catch(error) {
        console.log(error.response);
        res.status(500);
    }
});

app.post("/random", async (req, res) => {
    try {
        // Grab information from the API to get a Random Anime
        randomAnimeResult = await axios.get(API_URL + "/random/anime");
        
        // Grabs the animeID and animeTitle to use in the URL of the page
        const animeID = randomAnimeResult.data.data.mal_id;
        const animeTitle = findAnimeTitle(randomAnimeResult.data.data).replace(/\s+/g, '_').replace(/:/g, '');
        
        // Handle the post request
        res.redirect(`/random/${animeID}/${animeTitle}`);
    } catch(error) {
        console.log(error.response);
        res.status(500);
    }
});

// Catch-all route for handling unknown routes
app.get("*", (req, res) => {
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  