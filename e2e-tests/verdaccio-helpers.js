const path = require("path");
const {runServer} = require("verdaccio");
const fsExtra = require("fs-extra");
const {name: packageName} = require("../package.json");
const os = require("os");

let portNumber;
let verdaccioInstance;
let verdaccioDataFolder;


async function createUniqueFolder() {
    const testOutputFolder = path.join(os.tmpdir(), "verdaccio-example");
    const doesPathExist = await fsExtra.pathExists(testOutputFolder);
    if (!doesPathExist) {
        await fsExtra.mkdir(testOutputFolder, {recursive: true});
    }
    return await fsExtra.mkdtemp(`${testOutputFolder}${path.sep}`);
};

function getNpmEnvironmentVariables(port) {
    return {
        // This is used in the .npmrc file
        VERDACCIO_RANDOM_PORT: port.toString(),

        // This is to require the npm operations to use our local registry
        npm_config_registry: `http://localhost:${port}`,
    };
}

async function setupVerdaccio() {
    if (verdaccioInstance) {
        if (portNumber === undefined || verdaccioDataFolder === undefined) {
            throw new Error("verdaccio initiated but no port or data folder exist");
        }

        return {
            npmEnvironmentVars: getNpmEnvironmentVariables(portNumber),
        };
    }

    verdaccioDataFolder = await createUniqueFolder();

    const config = {
        // Where verdaccio will store its data
        storage: path.join(verdaccioDataFolder, "storage"),

        packages: {
            // Making our application only go to verdaccio registry and not to the default one,
            // which also prevent it from being published to npm
            [packageName]: {
                access: ["$anonymous"],

                // Allowing the package to be published without user
                publish: ["$anonymous"],
            },

            // Have access to external packages
            "@*/*": {
                access: ["$all"],
                proxy: ["npmjs"],
            },
            "**": {
                access: ["$all"],
                proxy: ["npmjs"],
            },
        },

        // External Registries
        uplinks: {
            npmjs: {
                url: "https://registry.npmjs.org/",
            },
        },

        logs: {
            type: "stdout",
            format: "pretty",

            // For debugging, you may want to change this to `http`
            level: "fatal",
        },

        // @ts-expect-error (TS2322: [...] 'self_path' does not exist in type 'ConfigYaml'.)
        // Required otherwise we would get
        // Error: self_path is required, please provide a valid root path for storage
        self_path: verdaccioDataFolder,
        security: undefined,
    };

    verdaccioInstance = await runServer(config);
    await new Promise((resolve, reject) => {
        // Port 0 means any available local port
        const result = verdaccioInstance.listen(0, (err) =>
            err ? reject(err) : resolve()
        );

        portNumber = result.address().port;
    });

    return {
        npmEnvironmentVars: getNpmEnvironmentVariables(portNumber),
    };
}

async function teardownVerdaccio() {
    if (verdaccioInstance) {
        await verdaccioInstance.close();
        verdaccioInstance = undefined;
    }

    if (verdaccioDataFolder) {
        await fsExtra.remove(verdaccioDataFolder);
        verdaccioDataFolder = undefined;
    }

    portNumber = undefined;
}


module.exports = {
    setupVerdaccio,
    teardownVerdaccio
}
