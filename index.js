import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const animeName = ["ONE PIECE", "JUJUTSU KAISEN"];
const animeInfo = ["Some representative placeholder content for the first lide of the carousel", "Some representative placeholder content for the first lide of the carousel"];

app.get("/", async (req, res) => {
    try {
        const result = await axios.get(API_URL + "/top/anime");
        res.render("index.ejs", {
            anime: result.data.data,
            animeName,
            animeInfo,
        })
    } catch(error) {
        console.log(error.response.data);
        res.status(500);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  