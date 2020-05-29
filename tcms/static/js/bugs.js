const bugDetailsCache = {}

function loadHyperlinks(elementSelector, filter) {
    $(elementSelector).DataTable({
        ajax: (data, callback, settings) => {
            dataTableJsonRPC('TestExecution.get_links', filter, callback);
        },
        columns: [
            {
                data: null,
                render: (data, type, full, meta) => {
                    return `<a href="${data.url}" class="bug-url">${data.url}</a>`;
                }
            },
            {
                data: null,
                render: (data, type, full, meta) => {
                    return `<a href="#bugs" data-toggle="popover" data-html="true"
                                data-content="undefined" data-trigger="focus" data-placement="top">
                                <span class="fa fa-info-circle"></span>
                           '</a>`;
                }
            },
        ],
        dom: "t",
        language: {
            loadingRecords: '<div class="spinner spinner-lg"></div>',
            processing: '<div class="spinner spinner-lg"></div>',
            zeroRecords: "No records found"
        },
        order: [[ 0, 'asc' ]],
    });

    $(elementSelector).on('draw.dt', () => {
        $(elementSelector).find('[data-toggle=popover]')
        .popovers()
        .on('show.bs.popover', element => {
            fetchBugDetails($(element.target).parents('tr').find('.bug-url')[0],
                            element.target,
                            bugDetailsCache);
        });
    });
    
    $('[data-toggle=popover]')
        .popovers()
        .on('show.bs.popover', (element) => {
            fetchBugDetails($(element.target).parents('.list-view-pf-body').find('.bug-url')[0],
                            element.target,
                            bugDetailsCache);
    });
}

function fetchBugDetails(source, popover, cache) {
    if (source.href in cache) {
        assignPopoverData(source, popover, cache[source.href]);
        return;
    }

    jsonRPC('Bug.details', [source.href], function(data) {
        cache[source.href] = data;
        assignPopoverData(source, popover, data);
    }, true);
}
