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
        
        var dataSearch = $("#txtSearch").val();
        var typeSearch = $('#ddlType').find(":selected").val();
        var jlptSearch = $('#ddlJlpt :radio:checked').val();
        var conSearch = $('#ddlCon').find(":selected").val();
        if (dataSearch === "") {
            alert("Please input something!");
        } else {
            var data = {
                'sData' : dataSearch,
                'sType' : typeSearch,
                'sJlpt' : jlptSearch,
                'sCon' : conSearch,
            };

            var url = 'http://localhost:3000/search';

            $.ajax({
                type : 'GET',
                data : data,
                contentType : 'application/json;charset=UTF-8;',
                url : url,
                success : function(returnData) {
                    $("#search_rslt").html("");
                    $("#search_rslt").append(returnData);
                }
            });
        }
    });
});