const { driver } = require("./db");

const packages = [
    {
        name: "express",
        version: "4.21.2",
        description: "Fast, minimalist web framework for Node.js",
        language: "JavaScript"
    },
    {
        name: "axios",
        version: "1.7.9",
        description: "Promise based HTTP client for Node.js and browsers",
        language: "JavaScript"
    },
    {
        name: "dotenv",
        version: "16.4.7",
        description: "Loads environment variables from a .env file",
        language: "JavaScript"
    },
    {
        name: "lodash",
        version: "4.17.21",
        description: "Utility library for JavaScript",
        language: "JavaScript"
    },
    {
        name: "jsonwebtoken",
        version: "9.0.2",
        description: "JSON Web Token implementation",
        language: "JavaScript"
    },
    {
        name: "cors",
        version: "2.8.5",
        description: "Express middleware for enabling CORS",
        language: "JavaScript"
    },
    {
        name: "morgan",
        version: "1.10.0",
        description: "HTTP request logger middleware",
        language: "JavaScript"
    },
    {
        name: "uuid",
        version: "11.0.5",
        description: "Generate RFC-compliant UUIDs",
        language: "JavaScript"
    }
];

const developers = [
    {
        username: "alice_dev",
        name: "Alice Johnson",
        experience: 8
    },
    {
        username: "bob_codes",
        name: "Bob Williams",
        experience: 6
    },
    {
        username: "charlie_js",
        name: "Charlie Brown",
        experience: 5
    },
    {
        username: "diana_dev",
        name: "Diana Miller",
        experience: 7
    },
    {
        username: "ethan_npm",
        name: "Ethan Davis",
        experience: 4
    }
];

const dependencies = [
    ["express", "lodash"],
    ["express", "body-parser"],
    ["express", "path-to-regexp"],
    ["express", "qs"],
    ["express", "cors"],
    ["axios", "form-data"],
    ["axios", "follow-redirects"],
    ["axios", "proxy-from-env"],
    ["jsonwebtoken", "jws"],
    ["jsonwebtoken", "jose"],
    ["morgan", "on-finished"],
    ["morgan", "debug"],
    ["cors", "object-assign"],
    ["uuid", "crypto"],
    ["dotenv", "lodash"]
];

const contributions = [
    ["alice_dev", "express", "maintainer"],
    ["alice_dev", "cors", "contributor"],
    ["bob_codes", "axios", "maintainer"],
    ["bob_codes", "dotenv", "contributor"],
    ["charlie_js", "lodash", "maintainer"],
    ["charlie_js", "express", "contributor"],
    ["diana_dev", "jsonwebtoken", "maintainer"],
    ["diana_dev", "axios", "contributor"],
    ["ethan_npm", "morgan", "maintainer"],
    ["ethan_npm", "uuid", "contributor"],
    ["bob_codes", "express", "contributor"],
    ["diana_dev", "cors", "contributor"]
];

const follows = [
    ["alice_dev", "bob_codes"],
    ["alice_dev", "charlie_js"],
    ["bob_codes", "diana_dev"],
    ["charlie_js", "alice_dev"],
    ["diana_dev", "ethan_npm"],
    ["ethan_npm", "bob_codes"]
];

async function seedDatabase() {
    const session = driver.session();

    try {
        console.log("Clearing existing graph...");

        await session.run(`
            MATCH (n)
            DETACH DELETE n
        `);

        console.log("Creating packages...");

        await session.run(
            `
            UNWIND $packages AS pkg
            CREATE (:Package {
                name: pkg.name,
                version: pkg.version,
                description: pkg.description,
                language: pkg.language
            })
            `,
            { packages }
        );

        console.log("Creating developers...");

        await session.run(
            `
            UNWIND $developers AS dev
            CREATE (:Developer {
                username: dev.username,
                name: dev.name,
                experience: dev.experience
            })
            `,
            { developers }
        );

        console.log("Creating dependency relationships...");

        await session.run(
            `
            UNWIND $dependencies AS dep
            MATCH (source:Package {name: dep[0]})
            MATCH (target:Package {name: dep[1]})
            CREATE (source)-[:DEPENDS_ON]->(target)
            `,
            { dependencies }
        );

        console.log("Creating contribution relationships...");

        await session.run(
            `
            UNWIND $contributions AS contribution
            MATCH (dev:Developer {username: contribution[0]})
            MATCH (pkg:Package {name: contribution[1]})
            CREATE (dev)-[:CONTRIBUTES_TO {
                role: contribution[2]
            }]->(pkg)
            `,
            { contributions }
        );

        console.log("Creating follow relationships...");

        await session.run(
            `
            UNWIND $follows AS follow
            MATCH (source:Developer {username: follow[0]})
            MATCH (target:Developer {username: follow[1]})
            CREATE (source)-[:FOLLOWS]->(target)
            `,
            { follows }
        );

        const result = await session.run(`
            MATCH (n)
            RETURN labels(n)[0] AS type, count(n) AS count
            ORDER BY type
        `);

        console.log("\nDatabase seeded successfully!");
        console.log("\nNode counts:");

        result.records.forEach(record => {
            console.log(
                `${record.get("type")}: ${record.get("count").toNumber()}`
            );
        });

    } catch (error) {
        console.error("Seed failed:");
        console.error(error.message);
    } finally {
        await session.close();
        await driver.close();
    }
}

seedDatabase();