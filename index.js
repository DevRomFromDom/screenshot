import express from "express";
import screenshot from "screenshot-desktop";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const API_KEY = "AQVN3LmfGEhWWKVNQwG0wsnRuXVPaGBp6Ahyz8KH";
const FOLDER_ID = "b1gprrr4oerbgtkha34u";

const port = process.env.PORT || 3080;
const app = express();
const re = /("text")(:)"(.*?)"/g;
const __dirname = path.resolve();

const getText = async (body) => {
    const res = await fetch("https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", Authorization: `Api-Key ${API_KEY}` },
    })
        .then((res) => res.json())
        .then((data) => {
            // const text = data.results[0].results[0].textDetection.pages
            //     .map((page) =>
            //         page.blocks.map((block) => block.lines.map((line) => line.words.map((word) => word.text).join(" ")).join("\n")).join(" ")
            //     )
            //     .join("\n");
            // return text;
            return JSON.stringify(data, null, '\t')
        });
    return res;
};

app.get("/", (req, res) => {
    res.send(
        "<div style='width:100%; height:100%; display:flex; justify-content: center; align-items:center;'><form action='/post' method='post'><button type='submit'>Screenshot</button></form></div>"
    );
});

app.post("/post", async (req, res) => {
    console.log("Submit");

    const img = await screenshot({ format: "png" }).then((img) => img);

    const resBody = {
        folderId: FOLDER_ID,
        analyze_specs: [
            {
                content: img.toString("base64"),
                features: [
                    {
                        type: "TEXT_DETECTION",
                        text_detection_config: {
                            language_codes: ["*"],
                        },
                    },
                ],
            },
        ],
    };
    const screenshotText = await getText(resBody);
    if (typeof screenshotText === "string") {
        const id = uuidv4(img);
        fs.writeFile(path.join(__dirname, `/texts/${id}.txt`), screenshotText, (err) => {
            if (err) {
                throw err;
            }
        });

        fs.writeFile(path.join(__dirname, `/imgs/${id}.png`), img, { encoding: "base64" }, (err) => {
            if (err) {
                throw err;
            }
        });
    }
    console.log("Success");
    res.redirect("/");
});

app.listen(port, () => console.log(`Server is running on ${port} port`));
