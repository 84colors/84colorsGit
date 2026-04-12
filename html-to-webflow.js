const fs = require("fs");
const { parse } = require("node-html-parser");
const { v4: uuidv4 } = require("uuid");

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const INLINE_TAGS = new Set(["span", "em", "strong"]);

function getNodeType(tag) {
    if (tag === "section") return "Section";
    if (HEADING_TAGS.has(tag)) return "Heading";
    if (tag === "p") return "Paragraph";
    if (tag === "a") return "Link";
    if (tag === "img") return "Image";
    if (tag === "ul" || tag === "ol") return "List";
    if (tag === "li") return "ListItem";
    if (INLINE_TAGS.has(tag)) return "DOM";
    return "Block";
}

function processElement(el, styleMap, nodes) {
    const tag = el.tagName.toLowerCase();
    const id = uuidv4();

    // Map class names to stable style IDs
    const classNames = (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean);
    const classIds = classNames.map((name) => {
        if (!styleMap[name]) styleMap[name] = uuidv4();
        return styleMap[name];
    });

    // Collect data attributes and any non-class/id attrs as xattr
    const xattr = Object.entries(el.attributes)
        .filter(([k]) => k !== "class" && k !== "id")
        .map(([name, value]) => ({ name, value: value ?? "" }));

    const type = getNodeType(tag);

    // Build node — push parent first so order matches Webflow's format
    const node = {
        _id: id,
        type,
        tag,
        classes: classIds,
        children: [],
        data:
            type === "DOM"
                ? // Inline elements use a different data shape in Webflow
                  {
                      tag,
                      attributes: xattr,
                      slot: "",
                      text: false,
                      visibility: {
                          conditions: [],
                          keepInHtml: { tag: "False", val: {} },
                      },
                  }
                : {
                      text: false,
                      tag,
                      devlink: { runtimeProps: {}, slot: "" },
                      displayName: "",
                      attr: { id: el.getAttribute("id") || "" },
                      xattr,
                      search: { exclude: false },
                      visibility: {
                          conditions: [],
                          keepInHtml: { tag: "False", val: {} },
                      },
                      ...(type === "Section"
                          ? { grid: { type: "section" } }
                          : {}),
                  },
    };

    nodes.push(node);

    // Process children after pushing parent
    for (const child of el.childNodes) {
        if (child.nodeType === 3) {
            const text = child.text.trim();
            if (text) {
                const tid = uuidv4();
                node.children.push(tid);
                nodes.push({ _id: tid, text: true, v: text });
            }
        } else if (child.nodeType === 1) {
            const cid = processElement(child, styleMap, nodes);
            node.children.push(cid);
        }
    }

    return id;
}

function loadSourceStyles(sourceFile) {
    let content = fs.readFileSync(sourceFile, "utf8");
    // If it's an HTML file, extract the JSON from the body text
    if (sourceFile.endsWith(".html")) {
        const match = content.match(/(\{"type":"@webflow[\s\S]*\})/);
        if (!match) throw new Error(`No Webflow JSON found in ${sourceFile}`);
        content = match[1];
    }
    const raw = JSON.parse(content);
    const payload = raw.payload ?? raw;
    const map = {};
    for (const style of payload.styles ?? []) {
        map[style.name] = style;
    }
    return map;
}

function buildStyles(styleMap, sourceStyles) {
    return Object.entries(styleMap).map(([name, id]) => {
        const source = sourceStyles[name];
        if (source) {
            // Reuse full style definition from source, but assign the new ID
            return { ...source, _id: id };
        }
        return {
            _id: id,
            fake: false,
            type: "class",
            name,
            namespace: "",
            comb: "",
            styleLess: "",
            variants: {},
            children: [],
            createdBy: "",
            origin: null,
            selector: null,
        };
    });
}

function htmlToWebflow(inputFile, outputFile, sourceFile) {
    const html = fs.readFileSync(inputFile, "utf8");
    const root = parse(html);
    const body = root.querySelector("body") || root;
    const sourceStyles = sourceFile ? loadSourceStyles(sourceFile) : {};

    const nodes = [];
    const styleMap = {};
    const rootIds = [];

    for (const child of body.childNodes) {
        if (child.nodeType === 1) {
            rootIds.push(processElement(child, styleMap, nodes));
        }
    }

    // If multiple root elements, wrap them in a div
    if (rootIds.length > 1) {
        const wrapperId = uuidv4();
        nodes.unshift({
            _id: wrapperId,
            type: "Block",
            tag: "div",
            classes: [],
            children: rootIds,
            data: {
                text: false,
                tag: "div",
                devlink: { runtimeProps: {}, slot: "" },
                displayName: "",
                attr: { id: "" },
                xattr: [],
                search: { exclude: false },
                visibility: {
                    conditions: [],
                    keepInHtml: { tag: "False", val: {} },
                },
            },
        });
    }

    const output = JSON.stringify({
        type: "@webflow/XscpData",
        payload: {
            nodes,
            styles: buildStyles(styleMap, sourceStyles),
            assets: [],
            ix1: [],
            ix2: { interactions: [], events: [], actionLists: [] },
        },
    });

    fs.writeFileSync(outputFile, output);
    console.log(`Converted ${inputFile} → ${outputFile}`);
    console.log(
        `  ${nodes.length} nodes, ${Object.keys(styleMap).length} classes`,
    );
    console.log(`\nTo use: copy the contents of ${outputFile} and paste into Webflow (Cmd+V in the canvas)`);
}

const args = process.argv.slice(2);
const inputFile = args.find((a) => !a.startsWith("--") && a.endsWith(".html"));
const outputFile =
    args.find((a) => !a.startsWith("--") && a.endsWith(".json")) ||
    inputFile?.replace(/\.html$/, ".webflow.json");
const stylesIdx = args.indexOf("--styles");
const sourceFile = stylesIdx !== -1 ? args[stylesIdx + 1] : null;

if (!inputFile) {
    console.error(
        "Usage: node html-to-webflow.js <input.html> [output.json] [--styles source.json]",
    );
    process.exit(1);
}

htmlToWebflow(inputFile, outputFile, sourceFile);
