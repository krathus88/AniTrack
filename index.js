import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const animeID = [
    "21", // One Piece
    "40748" // Jujutsu Kaisen
];

app.get("/", async (req, res) => {
    try {
        const topAnimeResult = await axios.get(API_URL + "/top/anime");

        const animeInfo = [];
        for (const id of animeID) {
            const animeSearchResult = await axios.get(API_URL + "/anime/" + id);
            animeInfo.push(animeSearchResult.data.data);
        }
        console.log(animeInfo);
        res.render("index.ejs", {
            animeInfo,
            topAnime: topAnimeResult.data.data,
        })
    } catch(error) {
        console.log(error.response.data);
        res.status(500);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  