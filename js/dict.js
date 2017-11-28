$(function() {
    $('.a-rad').click(function(){
        var txtData = $("#txtSearch").val();
        if (txtData === "") {
            $("#txtSearch").val(this.text);
        } else {
            $("#txtSearch").val(txtData + ", " + this.text);
        }
    });
    
    $('#ddlType').change(function(){
        if (this.value === "parts") {
            $("#ddlCon").removeAttr('disabled');
            $("#radicalLst").removeClass('ui-disabled');
        } else {
            $("#ddlCon").val("or").change();
            $("#ddlCon").attr('disabled','disabled');
            $("#radicalLst").addClass('ui-disabled');
            $("#radicalLst").collapsible({ collapsed: true });
        };
    });
    
    $('#select_link').click(function(e) {
        e.preventDefault();
        $("#radicalLst").collapsible({ collapsed: true });
        
        var dataSearch = $('#txtSearch').val().toUpperCase();
        var typeSearch = $('#ddlType').find(":selected").val();
        var jlptSearch = $('#ddlJlpt :radio:checked').val();
        var conSearch = $('#ddlCon').find(":selected").val();
        var smpNumSearch = parseInt($('#sampleNum').val());
        var langSearch = $('#ddlLang').find(":selected").val();
        if (dataSearch === "") {
            alert("Please input something!");
        } else {
            var data = {
                'sData' : dataSearch,
                'sType' : typeSearch,
                'sJlpt' : jlptSearch,
                'sCon' : conSearch,
                'sNum' : smpNumSearch,
                'sLang': langSearch,
            };

            $.ajax({
                type : 'GET',
                data : data,
                contentType : 'application/json;charset=UTF-8;',
                url : '/search',
                success : function(returnData) {
                    $("#search_rslt").html("");
                    $("#search_rslt").append(returnData);
                }
            });
        }
    });
    
    $('#search_rslt').on('click','.a-vkan, .a-part, .a-kun, .a-on',function(e) {
        e.preventDefault();
        var dataInName = $(this).attr("name");
        var jsonData = JSON.parse(dataInName);
        jsonData.sJlpt = "";
        jsonData.sCon = "or";
        $("#txtSearch").val(jsonData.sData);
        $('#ddlType').val(jsonData.sType).change();
        $("#ddlCon").val(jsonData.sCon).change();
        $("#ddlJlpt").val(jsonData.sJlpt).change();

        $.ajax({
            type : 'GET',
            data : jsonData,
            contentType : 'application/json;charset=UTF-8;',
            url : '/search',
            success : function(returnData) {
                $("#search_rslt").html("");
                $("#search_rslt").append(returnData);
            }
        });
        
    });
    
    $(".header").click(function () {
        $header = $(this);
        //getting the next element
        $content = $header.next();
        //open up the content needed - toggle the slide- if visible, slide up, if not slidedown.
        $content.slideToggle(500, function () {
        });
    });
});
