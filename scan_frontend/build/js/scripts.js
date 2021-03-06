/**
 * Utility functions
 */
const Utils = {
    /**
     * Update url string with http if not present.
     *
     * @returns {string}
     */
    urlWithPrefix(url) {
        const defaultPrefix = 'http://';

        url = encodeURI(url)

        // Prepend http if http|https is not present
        if (!url.startsWith('http') && !url.startsWith('https')) {
            url = defaultPrefix + url;
        }

        return url;
    },

    /**
     * Make sure we have a valid URL.
     *
     * @param str
     * @returns {boolean}
     */
    isValidURL(str) {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

        return !!pattern.test(str);
    },

    /**
     * Converts a string to html entities.
     * @param str
     * @returns {string}
     */
    htmlEntities(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

/**
 * A11y Website Checker
 *
 * @param $el
 * @constructor
 */
var A11yWebsiteChecker = function( $el ) {
    this.$form = $el;
    this.$loadingText = $('.loading-text');
    this.$loadingBar = $('.a11y-website-checker-loading-bar');
    this.$initialScreen = $('#a11yFormScreen');
    this.$results = $('#a11yResults');
    this.appHasError = false;
    this.loadingAnimationComplete = false;

    this.resultData = {};
    this.websiteUrl = '';
    this.score = 0;
}

/**
 * A11yWebsiteChecker Methods
 */
A11yWebsiteChecker.prototype = {

    /**
     * Maybe show loading text.
     * @param text
     */
    maybeShowLoadingText(text) {
        // interrupt loading if app has an error
        if (this.appHasError) {
            this.$form.addClass('shown');
            this.$loadingBar.hide();
            return;
        }
        this.$loadingText.text(text);
    },

    /**
     * Initialize loading sequence and animations.
     */
    initLoading() {
        this.$initialScreen.removeClass('shown');
        this.$loadingBar.show().focus();

        setTimeout(() => {
            this.maybeShowLoadingText('Analyzing website...');
        }, 2000);

        setTimeout(() => {
            this.maybeShowLoadingText('Checking for sufficient color contrast...');
        }, 4000);

        setTimeout(() => {
            this.maybeShowLoadingText('Processing results...');
        }, 6000);

        setTimeout(() => {
            if (!this.appHasError) {
                this.loadingAnimationComplete = true;
                this.showResultsScreen();
            }
        }, 8000);

        // For debug
        // this.$loadingBar.hide();
        // this.$results.addClass('shown').find('.results-content').focus();

    },

    /**
     * Update placeholder image in results panel
     */
    swapPlaceholderImg(src) {
        this.$results.find('.results-overview-image img').attr('src', src).attr('alt', 'screenshot for ' + this.websiteUrl);
    },

    /**
     * Calculate the score.
     *
     * @returns {{output: string, raw: number}}
     */
    calcScore() {
        const valPasses = this.resultData.passes.length,
            valFails = this.resultData.violations.length,
            total = valPasses + valFails,
            score = (valPasses / total) * 100;

        let label = 'bad';

        if (score === 100) {
            label = 'perfect';
        } else if (score >= 90) {
            label = 'good';
        } else if (score < 90 && score >= 80) {
            label = 'average';
        }

        this.score = {
            raw: score,
            label,
            output: parseInt(score) + '%',
        };

        return this.score;
    },

    /**
     * Show the results screen.
     */
    showResultsScreen() {
        this.$loadingBar.hide();
        this.$results.addClass('shown').find('.results-content').focus();
    },

    /**
     * Display all the results and update the UI.
     */
    displayResults() {
        const score = this.calcScore(),
            resultsText = wwA11yVars.resultsText[score.label];

        // Check if loading animation is complete
        if ( this.loadingAnimationComplete ) {
            this.showResultsScreen();
        }

        // Run methods
        this.swapPlaceholderImg(this.resultData.screenshots.desktop);
        this.formatResultCategories();

        // append text
        this.$results.addClass('score-' + score.label);
        this.$results.find('.results-website-name').text(this.websiteUrl);
        this.$results.find('.results-score').text(score.output);
        this.$results.find('.results-description').html(resultsText.label);
        this.$results.find('.instructions').html(resultsText.text);
    },

    /**
     * Get result item html for report table.
     * @param data
     * @returns {string}
     */
    getResultItemHtml(data, impactOverride = null) {
        const desc = Utils.htmlEntities(data.description),
            impact = impactOverride ? impactOverride : Utils.htmlEntities(data.impact),
            link = Utils.htmlEntities(data.helpUrl),
            iconLinkOffsite = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/></svg>`,
            html = '';

        return `<li>
            <span class="impact-label ${impact}">${impact} </span>
            ${desc}
            <a href="${link}" class="link-offsite" target="_blank" rel="noopener">
                <span class="visually-hidden">Learn more (offsite)</span>
                ${iconLinkOffsite}
            </a>
        </li>`;
    },

    /**
     * Format result category data table.
     */
    formatResultCategories() {
        this.resultData.violations.forEach(item => {
            $('#violations ul').append(this.getResultItemHtml(item));
        });

        this.resultData.passes.forEach(item => {
            $('#passes ul').append(this.getResultItemHtml(item, 'pass'));
        });

        this.resultData.incomplete.forEach(item => {
            $('#incomplete ul').append(this.getResultItemHtml(item));
        });
    },

    /**
     * Kick off the analysis with an ajax request to the server.
     */
    runAnalysis(url) {
        const localServer = 'http://localhost:3000';
        const server = 'https://a11y-testing.herokuapp.com';

        // do ajax request to server to scrape website and return html
        $.ajax( server + '/accessibility/scan/' + encodeURIComponent(url), {
            method: 'GET',
        }).done((data) => {
            this.appHasError = false;
            this.resultData = data;
            this.websiteUrl = url;
            this.displayResults();
        }).fail(error => {
            console.log(error);
            this.appHasError = true;
            alert('Apologies, there has been an error. Please try again later.');
            location.reload();
        });
    }

}

/**
 * jQuery on document ready
 */
$(document).ready(function() {

    /**
     * Initialize App
     * @type {A11yWebsiteChecker}
     */
    const App = new A11yWebsiteChecker( $('#a11yWebsiteChecker') );

    /**
     * Listen for form submit to kickoff the app.
     */
    App.$form.on('submit', function(e) {
        const url = Utils.urlWithPrefix( $('.form-input').val() );

        e.preventDefault();

        // return early if URL is not valid
        if ( ! Utils.isValidURL(url) ) {
            alert('It appears there is something wrong with the URL you entered. Please check and try again.');
            return;
        }

        // start loading animations
        App.initLoading();

        // start analysis
        App.runAnalysis(url) ;
    });

    /**
     * Load App to window variable for ease of interaction.
     * @type {A11yWebsiteChecker}
     */
    window.A11yWebsiteChecker = App;

});