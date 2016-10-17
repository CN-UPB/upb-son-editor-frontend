$(document).ready(function(){
	$('#show-ns').slideUp('slow', function() {
			$('#show-infrastructure').slideUp('slow');
			$('#show-vnfs').slideToggle('slow');
        });
	$('.nav li').click(function(e) {
        $('.nav li').removeClass('active');
        var $this = $(this);
        if (!$this.hasClass('active')) {
            $this.addClass('active');
        }
    });
	
	$('#toggle-panel-left-vnf').click(function(){
		$('#show-ns').slideUp('slow', function() {
			$('#show-infrastructure').slideUp('slow');
			$('#show-vnfs').slideToggle('slow');
        });
    });
	
	$('#toggle-panel-left-ns').click(function(){
        $('#show-vnfs').slideUp('slow', function() {
			$('#show-infrastructure').slideUp('slow');
			$('#show-ns').slideToggle('slow');
        });
    });
    $('#toggle-panel-left-infrastructure').click(function(){
		$('#show-vnfs').slideUp('slow', function() {
			$('#show-ns').slideUp('slow');
			$('#show-infrastructure').slideToggle('slow');
		});	
	});
});