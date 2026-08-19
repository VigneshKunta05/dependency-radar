const packageSelect = document.getElementById("packageSelect");
const analyzeButton = document.getElementById("analyzeButton");

const dependencyCount = document.getElementById("dependencyCount");
const blastCount = document.getElementById("blastCount");
const contributorCount = document.getElementById("contributorCount");

const dependenciesContainer =
    document.getElementById("dependencies");

const blastRadiusContainer =
    document.getElementById("blastRadius");

const contributorsContainer =
    document.getElementById("contributors");

const dependencyChainContainer =
    document.getElementById("dependencyChain");

const status = document.getElementById("status");

let packages = [];

async function loadPackages() {
    try {
        status.textContent = "Loading packages...";

        const response = await fetch("/api/packages");

        if (!response.ok) {
            throw new Error("Failed to load packages");
        }

        packages = await response.json();

        packageSelect.innerHTML = "";

        packages.forEach(pkg => {
            const option = document.createElement("option");

            option.value = pkg.name;
            option.textContent = `${pkg.name} ${pkg.version}`;

            packageSelect.appendChild(option);
        });

        status.textContent = "Packages loaded successfully.";

        if (packages.length > 0) {
            analyzePackage();
        }

    } catch (error) {
        console.error(error);

        status.textContent =
            "Unable to connect to the application database.";
    }
}

async function analyzePackage() {

    const packageName = packageSelect.value;

    if (!packageName) {
        return;
    }

    status.textContent = `Analyzing ${packageName}...`;

    try {

        const [
            dependencyResponse,
            blastResponse,
            contributorResponse,
            chainResponse
        ] = await Promise.all([

            fetch(`/api/packages/${packageName}/dependencies`),

            fetch(`/api/packages/${packageName}/blast-radius`),

            fetch(`/api/packages/${packageName}/contributors`),

            fetch(`/api/packages/${packageName}/chain`)
        ]);

        if (
            !dependencyResponse.ok ||
            !blastResponse.ok ||
            !contributorResponse.ok ||
            !chainResponse.ok
        ) {
            throw new Error("Failed to analyze package");
        }

        const dependencies =
            await dependencyResponse.json();

        const blastRadius =
            await blastResponse.json();

        const contributors =
            await contributorResponse.json();

        const chain =
            await chainResponse.json();

        displayDependencies(dependencies.dependencies);

        displayBlastRadius(blastRadius.affected);

        displayContributors(contributors.contributors);

        displayChain(chain.chain);

        createGraph(
            packageName,
            dependencies.dependencies
        );

        dependencyCount.textContent =
            dependencies.dependencies.length;

        blastCount.textContent =
            blastRadius.affected.length;

        contributorCount.textContent =
            contributors.contributors.length;

        status.textContent =
            `Analysis complete for ${packageName}.`;

    } catch (error) {

        console.error(error);

        status.textContent =
            "Unable to analyze package.";
    }
}

function displayDependencies(items) {

    if (items.length === 0) {

        dependenciesContainer.innerHTML =
            "<p>No direct dependencies found.</p>";

        return;
    }

    dependenciesContainer.innerHTML =
        items
            .map(
                item =>
                    `<div class="item">
                        <strong>${item.name}</strong>
                        <br>
                        Version: ${item.version}
                    </div>`
            )
            .join("");
}

function displayBlastRadius(items) {

    if (items.length === 0) {

        blastRadiusContainer.innerHTML =
            "<p>No dependent packages found.</p>";

        return;
    }

    blastRadiusContainer.innerHTML =
        items
            .map(
                item =>
                    `<div class="item">
                        ${item.name}
                    </div>`
            )
            .join("");
}

function displayContributors(items) {

    if (items.length === 0) {

        contributorsContainer.innerHTML =
            "<p>No contributors found.</p>";

        return;
    }

    contributorsContainer.innerHTML =
        items
            .map(
                item =>
                    `<div class="contributor">
                        <span>
                            <strong>${item.name}</strong>
                            <br>
                            @${item.username}
                        </span>
                        <span>${item.role}</span>
                    </div>`
            )
            .join("");
}

function displayChain(items) {

    if (items.length === 0) {

        dependencyChainContainer.innerHTML =
            "<p>No dependency chain found.</p>";

        return;
    }

    dependencyChainContainer.innerHTML =
        items
            .map(
                item =>
                    `<div class="chain">
                        ${item.chain.join(" → ")}
                    </div>`
            )
            .join("");
}

function createGraph(packageName, dependencies) {

    const nodes = [
        {
            id: packageName,
            label: packageName,
            shape: "box"
        }
    ];

    const edges = [];

    dependencies.forEach((dependency, index) => {

        nodes.push({
            id: dependency.name,
            label: dependency.name
        });

        edges.push({
            from: packageName,
            to: dependency.name,
            arrows: "to"
        });
    });

    const container =
        document.getElementById("graph");

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        physics: {
            enabled: true
        },
        interaction: {
            hover: true
        }
    };

    new vis.Network(
        container,
        data,
        options
    );
}

analyzeButton.addEventListener(
    "click",
    analyzePackage
);

loadPackages();