const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
    process.env.COGNODB_URI,
    neo4j.auth.basic(
        process.env.COGNODB_USERNAME,
        process.env.COGNODB_PASSWORD
    )
);

async function testConnection() {
    const session = driver.session();

    try {
        const result = await session.run(
            "RETURN 'CognoDB connection successful!' AS message"
        );

        console.log(result.records[0].get("message"));
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
    } finally {
        await session.close();
        await driver.close();
    }
}

module.exports = {
    driver,
    testConnection
};