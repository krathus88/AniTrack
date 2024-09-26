const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

const port = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to find the title
const findAnimeTitle = (data) => {
    const englishTitle = data.titles.find((title) => title.type === "English");
    const defaultTitle = data.titles.find((title) => title.type === "Default");

    if (englishTitle) {
        return englishTitle.title;
    } else if (defaultTitle) {
        return defaultTitle.title;
    } else {
        return "Title not found";
    }
};

// Function to set the anime result in a cookie
function setAnimeResultCookie(res, animeResult, expirationTime) {
    const organizedAnimeResult = {
        mal_id: animeResult.data.data.mal_id,
        titles: animeResult.data.data.titles,
        synopsis: animeResult.data.data.synopsis,
        rating: animeResult.data.data.rating,
        score: animeResult.data.data.score,
        rank: animeResult.data.data.rank,
        popularity: animeResult.data.data.popularity,
        aired: animeResult.data.data.aired.string,
        episodes: animeResult.data.data.episodes,
        duration: animeResult.data.data.duration,
        image: animeResult.data.data.images.jpg.large_image_url,
        trailer: animeResult.data.data.trailer.embed_url,
    };

    // Set an expiration timer for the cookie
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expirationTime); // Expires in 1 hour

    // Set the animeResult in a cookie with an expiration time
    res.cookie("animeResult", JSON.stringify(organizedAnimeResult), {
        expires: expirationDate,
        sameSite: "None",
        secure: true,
    });
}

// Must be defined at the start of every page
let activePage; // Tracks the active page

// Animes displayed in the carousel, requires background image in ./public/images
// image's name must be set as: <animeName>-background.jpg (anime name must be separated by "-" and must be the same as title_english, sent back from the API)
const animeID = [
    "21", // One Piece
    "40748", // Jujutsu Kaisen
    "38000", // Demon Slayer
    "16498", // Attack on Titan
];

app.get("/", async (req, res) => {
    try {
        activePage = "Home";

        let animeCarouselInfo = [];

        // Check if animeCarouselInfo cookie exists
        if (req.cookies.animeCarouselInfo) {
            animeCarouselInfo = JSON.parse(req.cookies.animeCarouselInfo);
        } else {
            for (let i = 0; i < animeID.length; i++) {
                const animeSearchResult = await axios.get(
                    API_URL + "/anime/" + animeID[i]
                );

                // Truncate the synopsis to 400 characters
                const truncatedSynopsis =
                    animeSearchResult.data.data.synopsis.substring(0, 400);

                const organizedAnimeSearchResult = {
                    mal_id: animeSearchResult.data.data.mal_id,
                    title_english: animeSearchResult.data.data.title_english,
                    synopsis: truncatedSynopsis,
                };
                animeCarouselInfo.push(organizedAnimeSearchResult);

                await delay(500); // Introduce a delay between requests
            }

            // Set an expiration timer for the cookie
            const expirationDate = new Date();
            expirationDate.setHours(expirationDate.getHours() + 1); // Expires in 1 hour

            // Set the animeResult in a cookie with an expiration time
            res.cookie("animeCarouselInfo", JSON.stringify(animeCarouselInfo), {
                expires: expirationDate,
                sameSite: "None",
                secure: true,
            });
        }

        // Grab information from the API for Top Anime
        const topAnimeResult = await axios.get(API_URL + "/top/anime");

        res.render("../views/index.ejs", {
            activePage,
            animeInfo: animeCarouselInfo,
            topAnime: topAnimeResult.data.data,
        });
    } catch (error) {
        console.log("GET / error: ", error);
        res.status(500);
        await delay(3500); // In case being rate limited, wait 3.5s and then redirect to main page
        res.redirect("/");
    }
});

app.get("/search", async (req, res) => {
    try {
        const userInput = req.query.keyword;
        const page = req.query.page || 1;

        if (!userInput) {
            // Redirect to the main page if userInput is undefined
            return res.redirect("/");
        }
        activePage = "Search";

        // Grab information from the API to get a Random Anime
        const animeSearchResult = await axios.get(
            API_URL + `/anime?q=${userInput}&page=${page}`
        );

        // Extract the titles using the findAnimeTitle function
        const animeTitle = [];
        for (let i = 0; i < animeSearchResult.data.data.length; i++) {
            animeTitle.push(findAnimeTitle(animeSearchResult.data.data[i]));
        }

        res.render("search.ejs", {
            activePage,
            animeTitle,
            userInput,
            resultAnime: animeSearchResult.data.data,
            pagination: animeSearchResult.data.pagination,
        });
    } catch (error) {
        console.log("GET /search error: ", error.response);
        res.status(500).send("Internal Server Error");
        await delay(3500); // In case being rate limited, wait 3.5s and then redirect to main page
        res.redirect("/");
    }
});

app.get("/anime/:anime_title", async (req, res) => {
    try {
        activePage = "Anime";

        const animeResultCookie = JSON.parse(req.cookies.animeResult);

        // Find the English title or else use the default title
        const animeTitle = findAnimeTitle(animeResultCookie);

        res.render("anime.ejs", {
            activePage,
            animeTitle,
            resultAnime: animeResultCookie,
        });
    } catch (error) {
        console.log("GET /anime error: ", error.response);
        res.status(500);
    }
});

app.post("/anime", async (req, res) => {
    try {
        const animeID = req.body.animeID;

        // Grab information from the API to get a Random Anime
        const animeResult = await axios.get(API_URL + "/anime/" + animeID + "/full");

        // Set animeResult in a cookie
        setAnimeResultCookie(res, animeResult, 1);

        // Extract the title
        const animeTitle = findAnimeTitle(animeResult.data.data)
            .replace(/\s+/g, "-")
            .replace(/:/g, "");

        res.redirect(`/anime/${animeTitle}`);
    } catch (error) {
        console.log("POST /anime error: ", error.response);
        res.status(500).send("Internal Server Error");
        await delay(3500); // In case being rate limited, wait 3.5s and then redirect to main page
        res.redirect("/");
    }
});

app.post("/random", async (req, res) => {
    try {
        // Grab information from the API to get a Random Anime
        const animeResult = await axios.get(API_URL + "/random/anime");

        // Set animeResult in a cookie
        setAnimeResultCookie(res, animeResult, 1);

        // Extract the title
        const animeTitle = findAnimeTitle(animeResult.data.data)
            .replace(/\s+/g, "-")
            .replace(/:/g, "");

        res.redirect(`/anime/${animeTitle}`);
    } catch (error) {
        console.log("POST /random error: ", error.response);
        res.status(500);
        await delay(3500); // In case being rate limited, wait 3.5s and then redirect to main page
        res.redirect("/");
    }
});

// Catch-all route for handling unknown routes
app.get("*", (req, res) => {
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
