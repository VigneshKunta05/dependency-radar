const express = require("express");
const path = require("path");
require("dotenv").config();

const {
    getAllPackages,
    getDependencies,
    getDependencyChain,
    getBlastRadius,
    getContributors,
    findCollaborationPath
} = require("./queries");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Get all packages
app.get("/api/packages", async (req, res) => {
    try {
        const packages = await getAllPackages();
        res.json(packages);
    } catch (error) {
        console.error("Error fetching packages:", error.message);

        res.status(500).json({
            error: "Unable to fetch packages",
            message: "Database may be unavailable."
        });
    }
});

// Get direct dependencies
app.get("/api/packages/:name/dependencies", async (req, res) => {
    try {
        const dependencies = await getDependencies(req.params.name);

        res.json({
            package: req.params.name,
            dependencies
        });
    } catch (error) {
        console.error("Error fetching dependencies:", error.message);

        res.status(500).json({
            error: "Unable to fetch dependencies"
        });
    }
});

// Get multi-hop dependency chain
app.get("/api/packages/:name/chain", async (req, res) => {
    try {
        const chain = await getDependencyChain(req.params.name);

        res.json({
            package: req.params.name,
            chain
        });
    } catch (error) {
        console.error("Error fetching dependency chain:", error.message);

        res.status(500).json({
            error: "Unable to fetch dependency chain"
        });
    }
});

// Get blast radius
app.get("/api/packages/:name/blast-radius", async (req, res) => {
    try {
        const affected = await getBlastRadius(req.params.name);

        res.json({
            package: req.params.name,
            affected
        });
    } catch (error) {
        console.error("Error calculating blast radius:", error.message);

        res.status(500).json({
            error: "Unable to calculate blast radius"
        });
    }
});

// Get package contributors
app.get("/api/packages/:name/contributors", async (req, res) => {
    try {
        const contributors = await getContributors(req.params.name);

        res.json({
            package: req.params.name,
            contributors
        });
    } catch (error) {
        console.error("Error fetching contributors:", error.message);

        res.status(500).json({
            error: "Unable to fetch contributors"
        });
    }
});

// Find collaboration path
app.get("/api/collaboration", async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                error: "Both 'from' and 'to' usernames are required."
            });
        }

        const collaborationPath = await findCollaborationPath(from, to);

        res.json({
            from,
            to,
            path: collaborationPath
        });
    } catch (error) {
        console.error("Error finding collaboration path:", error.message);

        res.status(500).json({
            error: "Unable to find collaboration path"
        });
    }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dependencnpm starty Radar running on port ${PORT}`);
});