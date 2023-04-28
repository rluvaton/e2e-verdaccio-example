const path = require("path");
const execa = require("execa");
const {setupVerdaccio, teardownVerdaccio} = require("./verdaccio-helpers");
const fsExtra = require("fs-extra");

const packageRootToPublish = path.resolve(__dirname, '..')

beforeAll(async () => {
    // So we won't get into a different cashed version
    await fsExtra.remove(path.resolve(__dirname, './node_modules'));

    const {npmEnvironmentVars} = await setupVerdaccio();

    await execa("npm", ["publish"], {
        env: npmEnvironmentVars,
        cwd: packageRootToPublish,
    });

    await execa('npm', ['i', '--save=false'], {
        // Installing here
        cwd: __dirname,
        stdio: 'inherit',
        env: npmEnvironmentVars,
    });
}, 15000);

afterAll(async () => {
    await teardownVerdaccio();
}, 15000);

test("should succeed", async () => {
    const {favoriteQuote} = require('verdaccio-example');

    expect(favoriteQuote()).toBe('Perfectly balanced, as all things should be.');
});

test("should fail", async () => {
    // This would fail as we forgot to add the not-exported.js file to the npm package
    const {lazyFavoriteAI} = require('verdaccio-example');

    expect(lazyFavoriteAI()).toBe('J.A.R.V.I.S');
});
