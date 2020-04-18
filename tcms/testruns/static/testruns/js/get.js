let executionStatuses;

$(document).ready(() => {

    $('.bootstrap-switch').bootstrapSwitch();

    const testRunId = $('#test_run_pk').data('pk')

    $('#status_button').on('switchChange.bootstrapSwitch', (_event, state) => {
        if (state) {
            jsonRPC('TestRun.update', [testRunId, { 'stop_date': null }], () => { })
        } else {
            let now = new Date().toISOString().replace("T", " ")
            now = now.slice(0, now.length - 5)
            jsonRPC('TestRun.update', [testRunId, { 'stop_date': now }], () => { })
        }
    });

    $('.add-comment-btn').on('click', ensureExecutionsAreSelected)
    $('.submit-comment-btn').on('click', postComment)

    const permRemoveTag = $('#test_run_pk').data('perm-remove-tag') === 'True';

    // bind everything in tags table
    tagsCard('TestRun', testRunId, { run: testRunId }, permRemoveTag);

    jsonRPC('TestExecutionStatus.filter', {}, data => {
        executionStatuses = data
        drawPercentBar(testRunId)
        renderTestExecutions(testRunId)
    })
})

function drawPercentBar(testRunId) {

    jsonRPC('TestExecution.filter', { 'run_id': testRunId }, testExecutions => {

        let positiveCount = 0;
        let negativeCount = 0;
        let allCount = testExecutions.length;
        let statusCount = {}
        executionStatuses.forEach(s => statusCount[s.name] = { count: 0, id: s.id })

        testExecutions.forEach(testExecution => {
            const executionStatus = executionStatuses.find(s => s.id === testExecution.status_id)

            if (executionStatus.weight > 0) {
                positiveCount++
            } else if (executionStatus.weight < 0) {
                negativeCount++
            }

            statusCount[executionStatus.name].count++
        })

        renderProgressBars(positiveCount, negativeCount, allCount)
        renderCountPerStatusList(statusCount)
    })
}

function renderProgressBars(positiveCount, negativeCount, allCount) {

    const positivePercent = +(positiveCount / allCount * 100).toFixed(2)
    const positiveBar = $(".progress > .progress-completed")
    if (positivePercent) {
        positiveBar.text(`${positivePercent}%`)
    }
    positiveBar.css('width', `${positivePercent}%`)
    positiveBar.attr('aria-valuenow', `${positivePercent}`)

    const negativePercent = +(negativeCount / allCount * 100).toFixed(2)
    const negativeBar = $('.progress > .progress-failed')
    if (negativePercent) {
        negativeBar.text(`${negativePercent}%`)
    }
    negativeBar.css('width', `${negativePercent}%`)
    negativeBar.attr('aria-valuenow', `${negativePercent}`)

    const neutralPercent = +(100 - (negativePercent + positivePercent)).toFixed(2)
    const neutralBar = $('.progress > .progress-bar-remaining')
    if (neutralPercent) {
        neutralBar.text(`${neutralPercent}%`)
    }
    neutralBar.css('width', `${neutralPercent}%`)
    neutralBar.attr('aria-valuenow', `${neutralPercent}`)

    $(".total-execution-count").text(allCount)
}

function renderCountPerStatusList(statusCount) {
    for (var status in statusCount) {
        const statusId = statusCount[status].id;

        $(`#count-for-status-${statusId}`).attr('href', `?status_id=${statusId}`).text(statusCount[status].count);
    }
}

function renderTestExecutions(testRunId) {
    const container = $('#test-executions-container')
    const testExecutionRowTemplate = $('#test-execution-row')[0].content

    jsonRPC('TestExecution.filter', { 'run_id': testRunId }, testExecutions => {
        testExecutions.forEach(testExecution => {
            jsonRPC('TestCase.filter', { 'id': testExecution.case_id }, testCases => {
                jsonRPC('TestExecutionStatus.filter', { 'id': testExecution.status_id }, statuses => {
                    jsonRPC('Bug.filter', {'execution_id': testExecution.pk}, bugs => {
                        const template = $(testExecutionRowTemplate.cloneNode(true))
                        container.append(renderTestExecutionRow(template, testExecution, testCases[0], statuses[0], bugs))

                        treeViewBind();
                    })
                })
            })
        })

    })

}

function renderTestExecutionRow(template, testExecution, testCase, testExecutionStatus, bugs) {
    template.find('.test-execution-info').html(`TE-${testExecution.id} <a href="/case/${testExecution.case_id}">TC-${testExecution.case_id} ${testExecution.case}</a>`)
    template.find('.test-execution-tester').html(renderProfile(testExecution.tested_by))
    template.find('.test-execution-asignee').html(renderProfile(testExecution.assignee))

    const automatedIcon = testCase.is_automated ? 'fa-thumbs-up' : 'fa-cog'
    template.find('.test-execution-automated').addClass(automatedIcon)
    template.find('.test-execution-priority').html(testCase.priority)
    template.find('.test-execution-category').html(testCase.category)
    template.find('.test-execution-status-icon').addClass(testExecutionStatus.icon).css('color', testExecutionStatus.color)
    template.find('.test-execution-status-name').html(testExecutionStatus.name).css('color', testExecutionStatus.color)
    template.find('.test-execution-bugs-count').html(bugs.length)
    template.find('.test-execution-select-checkbox').data('execution-id', testExecution.id)

    return template
}

const renderProfile = user => user ? `<a href="/accounts/${user}/profile">${user}</a>` : '-'

function ensureExecutionsAreSelected() {
    const selectedExecutions = $('.test-execution-select-checkbox:checked')
    if (selectedExecutions.length === 0) {
        // TODO: this may be yet another modal
        alert('Select at least one test execution')
        return false
    }
    return true
}

function postComment() {
    const comment = $('#comment-box').val()
    if (!comment) {
        return
    }

    const selectedExecutions = $('.test-execution-select-checkbox:checked')
    selectedExecutions.each((_index, execution) => {
        const executionId = $(execution).data('execution-id')
        console.log(executionId)

        // TODO: make a jsonRPC call to add comment
    })
}