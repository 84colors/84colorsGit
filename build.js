const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const BITS_DIR = path.join(__dirname, "bits");
const OUT_FILE = path.join(__dirname, "scripts84.js");
const MIN_FILE = path.join(__dirname, "scripts84.min.js");

// Matches an optional comment line + the DOMContentLoaded block at end of file
const domReadyRegex =
    /(?:\/\/[^\n]*\n)?document\.addEventListener\(["']DOMContentLoaded["'][^{]*\{([\s\S]*?)\}\s*\)\s*;?\s*$/;

function build() {
    const files = fs
        .readdirSync(BITS_DIR)
        .filter((f) => f.endsWith(".js"))
        .sort();

    if (files.length === 0) {
        console.log("No .js files found in bits/");
        return;
    }

    const sections = [];
    const initCalls = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(BITS_DIR, file), "utf8");
        const match = content.match(domReadyRegex);

        if (match) {
            initCalls.push(match[1].trim());
            sections.push(content.replace(domReadyRegex, "").trimEnd());
        } else {
            sections.push(content.trimEnd());
        }
    }

    const initBlock =
        initCalls.length > 0
            ? `\ndocument.addEventListener("DOMContentLoaded", () => {\n${initCalls.map((c) => `    ${c}`).join("\n")}\n});\n`
            : "\n";

    const source = sections.join("\n\n") + "\n" + initBlock;
    fs.writeFileSync(OUT_FILE, source);

    minify(source).then(({ code }) => {
        fs.writeFileSync(MIN_FILE, code);
        console.log(
            `Built scripts84.js + scripts84.min.js from ${files.length} file(s): ${files.join(", ")}`,
        );
    });
}

build();

if (process.argv.includes("--watch")) {
    console.log("Watching bits/ for changes...");
    fs.watch(BITS_DIR, (eventType, filename) => {
        if (filename && filename.endsWith(".js")) {
            console.log(`Change detected in ${filename}, rebuilding...`);
            build();
        }
    });
}
