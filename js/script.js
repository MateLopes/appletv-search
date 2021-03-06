const form = document.getElementById("AppleTVSearch");

String.prototype.format = function(args) {
    let text = this;
    for(var attr in args){
        text = text.split('{' + attr + '}').join(args[attr]);
    }
    return text;
}

function copyClipboard(target) {
    const text = target.textContent;
    navigator.clipboard.writeText(target.innerHTML);
    target.textContent = 'Copied!';
    setTimeout(function() {
        target.textContent = text
    }, 500);
}

class Client {
    constructor(query, storefront, contentType) {
        this.apiUrl = "https://uts-api.itunes.apple.com/uts/v2/search/incremental?";
        this.Locales = {
            '143503': 'pt-BR',
            '143441': 'en-US',
            '143444': 'en-GB'
        };
        this.resultMessageError = "<h2>No results found.</h2>";
        this.query = query;
        this.storefront = storefront;
        this.contentType = contentType;
        this.LanguageLocale = this.Locales[this.storefront] || navigator.language || navigator.userLanguage;
        this.divResults = document.getElementById("results");
    }

    async fetchAsync() {
        const response = await fetch(this.apiUrl + new URLSearchParams({
            sf: this.storefront,
            locale: this.LanguageLocale,
            caller: 'wta',
            utsk: '6e3013c6d6fae3c2::::::09ca1e325e2be8ff',
            v: '58',
            pfm: 'desktop',
            q: this.query
        }));
        return await response.json();
    }

    htmlBase() {
        let html = '{div}{href}{h2}';
        let div = '<div class="movie-result"><div class="title-year"><h1>{title}{year}</h1></div>';
        let href = '<a href="{href}" target="_blank" class="imglink"><img src="{src}" alt="Artwork for {title}{year}"></a>';
        let h2 = '<h2 class="apple-id" title="Copy Apple Id to Clipboard" onclick="copyClipboard(this)">{id}</h2>';
        return html.format({'div': div, 'href': href, 'h2': h2});
    }

    renderResult(data={}) {
        if(!data.canvas.shelves.length){
            this.divResults.innerHTML = this.resultMessageError;
            return;
        }
        this.divResults.innerHTML = "";
        data.canvas.shelves.forEach(shelve => {
            if(shelve.id.toLowerCase() === this.contentType){
                shelve.items.forEach(item => {
                    let releaseYear = new Date(item.releaseDate).getFullYear();
                    releaseYear = releaseYear ? ' ' + releaseYear : '';
                    let image_url = item.images.coverArt16X9.url.format(
                        {'w': '1920', 'h': '1080', 'f': 'jpg'}
                    );
                    this.divResults.innerHTML += this.htmlBase().format({
                        'href': item.url, 'src': image_url, 'id': item.id, 'title': item.title, 'year': releaseYear
                    });
                });
            }
        });
        if(!this.divResults.innerHTML){
            this.divResults.innerHTML = this.resultMessageError;
        }
        return;
    }
}

window.addEventListener("load", function() {
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        let query = document.getElementById("query").value;
        let storefront = document.getElementById("storefront").value;
        let contentType = document.getElementById("content-type").value;
        const client = new Client(query, storefront, contentType);
        client.fetchAsync()
        .then(response => client.renderResult(response.data)
        )
        .catch(reason => console.log(reason.message))
    });
});
