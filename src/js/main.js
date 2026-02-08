// BOOKMARKS
var IGNORED = ["SAP IT Links", "SAP Links", "Concur Links"]

var getBookmarks = function () {
    var _getBookmarks = new Promise(function (resolve) {
        chrome.bookmarks.getTree(function (b) {
            resolve(b.length ? b[0] : []);
        });
    });

    var _getHistory = new Promise(function(resolve) {
        chrome.history.search({
            text: '',
            startTime: 0,
            maxResults: 10
        }, function (data) {
            resolve(data);
        });
    });

    var _getFolders = function(tree) {
        var folders = [];
        var links = [];

        if (IGNORED.indexOf(tree.title) > -1) {
            return {folders: [], links : []}
        }

        if (tree.children) {
            var _links = [];

            tree.children.forEach(function (subtree) {
                if (!subtree.children) {
                    _links.push(subtree);
                } else {
                    folders = folders.concat(_getFolders(subtree).folders);
                }
            });

            if (_links.length) {
                links = links.concat(_links);
                folders.unshift({
                    info: tree,
                    links: _links
                });
            }
        }

        return {
            folders: folders,
            links: links
        };
    }

    return Promise.all([_getBookmarks, _getHistory]).then(function (values) {
        var folders = _getFolders(values[0]);

        /* folders.folders.unshift({
            info: {
                title: "Recently Visited"
            },
            links: values[1].slice(0, 10)
        }); */

        return folders;
    });
};

var faviconUrl = function(u) {
    var url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
};


// RENDERING
var renderLinks = function (links, $container) {
    links.forEach(function (link) {
        var $link = $("<a>" + link.title + "</a>");
        var $favicon = $("<img height='16' width='16'>");
        $favicon.attr("src", faviconUrl(link.url));
        $link.prepend($favicon);
        $link.attr("href", link.url);
        $container.append($link);
    });
};

var _renderFolders = function (folders, $container) {
    folders.forEach(function (folder) {
        var $folder = $("<nav></nav>");
        var $title = $("<h1>" + folder.info.title + "</h1>");
        $folder.append($title);

        renderLinks(folder.links, $folder);

        $container.append($folder);
    });
}

var renderFolders = function(folders) {
    jQuery("main#main").empty();
    _renderFolders(folders, jQuery("main#main"));
};

// SEARCH
var initSearch = function (bookmarks) {
    // init fuzzy search
    var fuse = new Fuse(bookmarks.folders, {
        keys: ['links.title', 'links.url'],
        threshold: 0.3
    });

    var searchTitle = function (text) {
        return !text ? bookmarks.folders : fuse.search(text).map(function (folder) {
            return {
                info : folder.info,
                links: new Fuse(folder.links, {
                    keys: ['title', 'url'],
                    threshold: 0.3
                }).search(text)
            };
        });
    };

    var startFirstLink = function () {
        var el = jQuery("nav>a").get(0);
        if (el) {
            el.click();
        }
    };

    var _$search = $("#site-search");
    _$search.on("input", function () {
        renderFolders(searchTitle(this.value));
    }).on('keypress', function (e) {
        if (e.which === 13) {
            startFirstLink();
        }
    });
};
 
//INIT
$(function() {
    getBookmarks().then(function (bookmarks) {
        // GLOBAL VARIABLES
        _folders = bookmarks.folders;
        _links = bookmarks.links;
        // !GLOBAL VARIABLES

        renderFolders(bookmarks.folders);

        initSearch(bookmarks);
    });
});

