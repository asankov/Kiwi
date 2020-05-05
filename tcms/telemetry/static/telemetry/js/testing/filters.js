$(document).ready(() => {
    $('#id_before').datetimepicker({
        useCurrent: false,
    });
    $('#id_after').datetimepicker({
        useCurrent: false,
    });

    $("#id_after").on("dp.change", e => $('#id_before').data("DateTimePicker").maxDate(e.date));
    $("#id_before").on("dp.change", e => $('#id_after').data("DateTimePicker").minDate(e.date));
})