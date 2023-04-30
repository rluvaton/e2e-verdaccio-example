module.exports = {
    function1() {
        return 1;
    },

    lazyFunction2() {
        // The not-exported file in not inside the package.json files list which means it won't be published
        // and won't be available to the user
        return require('./not-exported').function2();
    }
}
