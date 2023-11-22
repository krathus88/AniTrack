import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4/";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const animeName = ["ONE PIECE", "JUJUTSU KAISEN"];
const animeInfo = ["Some representative placeholder content for the first lide of the carousel", "Some representative placeholder content for the first lide of the carousel"];

app.get("/", (req, res) => {
    res.render("index.ejs", {
        animeName,
        animeInfo,
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  