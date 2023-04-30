module.exports = {
    function1() {
        return 1;
    },

    lazyFunction2() {
        return require('./not-exported').function2();
    }
}
