
var pcchu = {

	PAGES : [ "mental"
	],
	getFile : function(fileid) {
		var filename = "page/" + fileid + ".txt";
		var text =  $.ajax({ url: filename, async: false }).responseText;
		return (text ? text : "COULD NOT SOURCE '" + filename + "'" );
	},
	createSectionHeader: function(text) {
		return text
			.replace(/[ \t\n]*\[section\] *([^\n]*)/gi,"<h1>$1</h1>");
			;
	},	
	createHeader: function(text) {
		return text
			.replace(/[ \t\n]*\[header\] *([^\n]*)/gi,"</div><div data-role='collapsible'><h3>$1</h3>")
			.replace(/\<\/div\>\<div data-role='collapsible'\>\<h3\>/i,"<div data-role='collapsible-set'><div data-role='collapsible'><h3>")
			+ "</div></div>"
			;
	},
	createSubHeader: function(text) {
		return text.replace(/[ \t\n]*\[sub header\] *([^\n]*)/gi,"<h4>$1</h4>");
	},
	createList: function(text) {
		return text
			.replace(/([\n^]).\t([^\n]*)/gi,"$1<ul><li>$2</li></ul>")
			.replace(/\<\/li\>\<\/ul\>\n\<ul\>\<li\>/gi,"</li>\n<li>")
			.replace(/(\<\/li\>\<\/ul\>)/gi,"$1\n")
			;
	},
	autoCreateLinks: function(text) {
		return text
			.replace(/([\^\b\n \t])http:([^ \n\t\<\>]*)/gi,"$1<a href='http:$2'>http:$2</a>\n")	// auto add hyper link
			.replace(/([\^\b\n \t])(1?[\- ]?\(? ?[0-9]{3}[\) \-\.]*[0-9]{3}[\-\. ]*[0-9]{4})/gi,"$1<a href='tel:$2'>$2</a>\n")	// auto add clickable phone number
			.replace(/([\^\b\n \t])([a-z0-9_\-\.]+\@[a-z0-9_\-]+\.[a-z0-9_\-]+)/gi,"$1<a href='mailto:$2'>$2</a>\n")	// auto add clickable e-mail
			.replace(/([\^\b\n \t])([a-z][0-9][a-z]) ?([0-9][a-z][0-9])([^a-z0-9])/gi,"$1<a href='http://maps.google.com/maps?q=$2$3'>$2 $3</a>\n$4")	// auto add maps
			.replace(/"\[([^\]]+)\]"/gi,"<img src='img/$1.jpg'>\n")	// auto add images
			;
	},
	addLineBreaks: function(text) {
		return text
			.replace(/\n/g,"<br>\n")						// convert carriage returns into html line breaks returns
			.replace(/(\>[ \t]*)\<br\>\n/gi,"$1 ")			// remove html line breaks from lines that already end in html
			;
	},
	switchAllLinksToExternalLinks: function(text) {
		return text
			.replace(/href/gi," class='new-link' external-href")				// make hrefs jump to a new browser
			;
	},
	escapeSpecialCharacters: function(text) {
		return text
			.replace(/\$/g,"&#36;")							// convert the "$" into the html &#36; sequence
			;
	},
	ractiveExternalLinks: function() {
		$("a[page-href]").unbind("click");
		$("a[page-href]").on("click",function () {$.mobile.changePage( $(this).attr("page-href") ) });
		$("a[external-href]").unbind("click");
		$("a[external-href]").on("click", function() {
			var location = $(this).attr("external-href");
			if( /Android/i.test(navigator.userAgent) ) {
				navigator.app.loadUrl(location, {openExternal: true});
			} else if( /iPhone|iPad|iPod|webOS|BlackBerry/i.test(navigator.userAgent) ) {
				window.open(location, "_system");
			} else {
				window.open(location,'_blank');
			}
		});
	}

}

function loadPages() {
	$.mobile.changePage( "#start" );
	var list = $( "#main a[page-href]" );
	for( var index = 0 , num = list.length ; index < num ; index++ ) {
		var page = $(list[index]).attr("page-href").replace(/#/,"");
		var text = pcchu.getFile(page);
		text = pcchu.createSectionHeader(text);
		text = pcchu.createHeader(text);
		text = pcchu.createSubHeader(text);
		text = pcchu.createList(text);
		text = pcchu.autoCreateLinks(text);
		text = pcchu.addLineBreaks(text);
		text = pcchu.switchAllLinksToExternalLinks(text);
		text = pcchu.escapeSpecialCharacters(text);
		$("#" + page +" div[data-role*='content']").html(text);
	}
	pcchu.ractiveExternalLinks();
	$.mobile.changePage( "#main" );
};

$(document).ready(function($) {
	$(document).on("click","img", function() {
		var hasClass = $(this).hasClass("big");
		
		$("img").removeClass("big");
		if (hasClass) {
			$("body").css({"overflow-x":"hidden"});
		} else {
			$(this).addClass("big");
			$("body").css({"overflow-x":"visible"});
		}		
		
	});

	var recalculateTotal = function() {
		var list = $("table.flowCalculator1 tr > td:nth-child(5)");
		var total = 0;
		for( var index = 0 , size = list.length ; index < size ; index++ ) {
			if ( $(list[index]).prev().html().match(/TOTAL/) != null ) {
				$(list[index]).html(total);
				index = size;
			} else {
				var num = eval( $(list[index]).html().replace(/[^0-9]/g,"") );
				if ( num > 0 ) { total += num; }
			}
		}			
	}

	$(document).on("change","table.flowCalculator1 tr > td input", function() {
		var td = $(this).closest("td");
		var num = $(this).val().replace(/[^0-9]/g,"");
		var vol = td.prev().html().replace(/[^0-9]/g,"");
		num = (num ? num : 0);
		td.next().html( (eval(num) + 0) * (eval(vol) + 0) );						
		recalculateTotal();
	});

	$(document).on("click","table.flowCalculator1 .reset", function() {
		var list = $("table.flowCalculator1 tr > td input");
		var temp = recalculateTotal;
		recalculateTotal = function() {};
		for( index = 0 ; index < list.length ; index++ ) {
			$(list[index]).val("");
			$(list[index]).change();
		}
		recalculateTotal = temp;
		recalculateTotal();
	});
	
	loadPages();
	
	$("table.flowCalculator1 tr > td:nth-child(4)").each( function() {
		if ( eval( $(this).prev().html().replace(/[^0-9]/g,"") ) > 0 ) {
			$(this).html($("<input size=3>"));
		}
	});

});