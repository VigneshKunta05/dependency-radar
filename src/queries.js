const { driver } = require("./db");

// 1. Get all packages
async function getAllPackages() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (p:Package)
            RETURN p
            ORDER BY p.name
        `);

        return result.records.map(record => record.get("p").properties);
    } finally {
        await session.close();
    }
}

// 2. Get direct dependencies of a package
async function getDependencies(packageName) {
    const session = driver.session();

    try {
        const result = await session.run(
            `
            MATCH (p:Package {name: $packageName})
                  -[:DEPENDS_ON]->(dependency:Package)
            RETURN dependency
            ORDER BY dependency.name
            `,
            { packageName }
        );

        return result.records.map(
            record => record.get("dependency").properties
        );
    } finally {
        await session.close();
    }
}

// 3. Multi-hop dependency chain
async function getDependencyChain(packageName, maxDepth = 5) {
    const session = driver.session();

    try {
        const result = await session.run(
            `
            MATCH path =
                (p:Package {name: $packageName})
                -[:DEPENDS_ON*1..5]->
                (dependency:Package)
            RETURN
                [node IN nodes(path) | node.name] AS chain,
                length(path) AS depth
            ORDER BY depth
            `,
            { packageName }
        );

        return result.records.map(record => ({
            chain: record.get("chain"),
            depth: record.get("depth").toNumber()
        }));
    } finally {
        await session.close();
    }
}

// 4. Blast radius
async function getBlastRadius(packageName) {
    const session = driver.session();

    try {
        const result = await session.run(
            `
            MATCH (affected:Package)
                  -[:DEPENDS_ON*1..5]->
                  (target:Package {name: $packageName})
            RETURN DISTINCT affected
            ORDER BY affected.name
            `,
            { packageName }
        );

        return result.records.map(
            record => record.get("affected").properties
        );
    } finally {
        await session.close();
    }
}

// 5. Get contributors for a package
async function getContributors(packageName) {
    const session = driver.session();

    try {
        const result = await session.run(
            `
            MATCH (dev:Developer)
                  -[c:CONTRIBUTES_TO]->
                  (p:Package {name: $packageName})
            RETURN
                dev.username AS username,
                dev.name AS name,
                c.role AS role
            ORDER BY dev.name
            `,
            { packageName }
        );

        return result.records.map(record => ({
            username: record.get("username"),
            name: record.get("name"),
            role: record.get("role")
        }));
    } finally {
        await session.close();
    }
}

// 6. Find a collaboration path between developers
async function findCollaborationPath(fromUsername, toUsername) {
    const session = driver.session();

    try {
        const result = await session.run(
            `
            MATCH path =
                (start:Developer {username: $fromUsername})
                -[:FOLLOWS|CONTRIBUTES_TO*1..5]-
                (target:Developer {username: $toUsername})
            RETURN
                [node IN nodes(path) |
                    CASE
                        WHEN node:Developer THEN node.username
                        WHEN node:Package THEN node.name
                    END
                ] AS path
            LIMIT 1
            `,
            {
                fromUsername,
                toUsername
            }
        );

        if (result.records.length === 0) {
            return null;
        }

        return result.records[0].get("path");
    } finally {
        await session.close();
    }
}

module.exports = {
    getAllPackages,
    getDependencies,
    getDependencyChain,
    getBlastRadius,
    getContributors,
    findCollaborationPath
};