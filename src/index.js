module.exports = {
    favoriteQuote() {
        return 'Perfectly balanced, as all things should be.';
    },

    lazyFavoriteAI() {
        return require('./not-exported').favoriteAI();
    }
}
