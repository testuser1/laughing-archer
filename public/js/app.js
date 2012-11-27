/*
 * TODO
 	 
 - params
 - input/output, pipes?

 - execute javascript
 - google suggestions
 - commands history
 - macro recording?
 - simple url based commands like yubnub

 - don't repeat same preview

 - APIs http://www.programmableweb.com/apis/directory
 - yahoo pipes http://pipes.yahoo.com/pipes/search?r=tag:business
 */


var commands = [];
var names = {};

var _ = function(s){ return s;};
var CreateCommand = function(cmd) {
	commands.push(cmd);
	for (var i=0; i<cmd.names.length; i++) 
		names[cmd.names[i]] = cmd;
}

var CmdUtils = { 
	CreateCommand: CreateCommand, 
	setSelection: function(str) { $('#preview').html(str); } 
};

function find(words) {
	var out = [];
	console.log(words);
	for (var i in names) {
		var score = i.score(words[0]);
		if (score > 0) {
			out.push({ score: score, name: i });
		}
		//console.log(val, i, );
	}
	return out.sort(function(a, b){
		return b.score - a.score;
	});
	// console.log('--');
}

function exec() {

}

function preview() {
	if (lastSuggest.length == 0) return;
	var cmd = lastSuggest[0];
	var command = names[cmd.name];
	var params = words.slice(1);
	params.unshift($('#preview')[0]);

	command.preview.apply(command, params);
}

var delayed_timeout, delay = 500;

function delayed(func) {
	if (delayed_timeout) clearTimeout(delayed_timeout);
	delayed_timeout = setTimeout(func, delay);
}

var lastSuggest = [];
var words = [];

$(function(){
	
	$('#search').val('').focus();
	$('#search').on('keyup', function(e){
		words = this.value.split(' ');
		lastSuggest = find(words);

		var html = '';
		for (var i=0; i<lastSuggest.length; i++) {
			html += lastSuggest[i].score+' '+lastSuggest[i].name+'<br/>';
		}
		$('#suggest').html(html);

		
		var key;
		if (e.keyCode) key = e.keyCode;
    	else if (e.which) key = e.which;
    	
		if (!/[^A-Za-z0-9 ]/.test(String.fromCharCode(key)) )
			delayed(preview);

		if (key == 13) exec();
	});
});

var noun_type_command = 1;

CmdUtils.CreateCommand({
	names: ["help", "about", "?"],
	icon: "chrome://ubiquity/skin/icons/help.png",
	description: "Takes you to the Ubiquity <a href={Help}>main help page</a>.<br/>\
			Or, enter the name of a command to get help on that command.)",
	argument: noun_type_command,
	preview: function(pblock, data) {
		pblock.innerHTML = data ? data.previewDefault() : this.description;
	},
	execute: function(data) {
		if (data)
			Utils.openUrlInBrowser(CmdList + "#" + data.id);
		else
			Utils.focusUrlInBrowser(Help);
	}
});

CmdUtils.CreateCommand({
	names: ["say hello", "greet"],
	execute: function hello_execute() {
		displayMessage("Hello, World!");
	},
	preview: function(pblock) {
		pblock.innerHTML = _("This will show until the AJAX request returns");
		CmdUtils.previewGet(pblock, "http://example.com", function (htm) {
			pblock.innerHTML = htm;
		});
	},
	homepage: "http://azarask.in/",
	author: { name: "Aza Raskin", email: "aza@mozilla.com"},
	contributors: ["Atul Varma"],
	license: "MPL"    
});

CmdUtils.CreateCommand({
	names: ["map"],
	
	_getMapUrl: function(address) {
		console.log('_getMapUrl', address)
		//var loc = CmdUtils.getGeoLocation();
		var mapUrl = "http://maps.google.com/staticmap?";

		mapUrl = "http://maps.googleapis.com/maps/api/staticmap?";

		var params = {
			center: address, // loc.lat + "," + loc.long,
			size: "500x400",
			zoom: 14,
			key: "ABQIAAAAGZ11mh1LzgQ8-8LRW3wEShQeSuJunOpTb3RsLsk00-MAdzxmXhQoiCd940lo0KlfQM5PeNYEPLW-3w",
			maptype: "roadmap",
			sensor: true
		};


		return mapUrl + jQuery.param( params );
	},
	
	preview: function( pblock, address ) {
		if (!address) return;
		var msg = "Inserts a map of your current location: <br/>" +
							"<img src='"+this._getMapUrl(address)+"'/>";
		pblock.innerHTML = msg;//_(msg, {url: this._getMapUrl()});
	},
	
	execute: function(data) {
		CmdUtils.getImageSnapshot( this._getMapUrl(data), function(imgData) {
			CmdUtils.setSelection( "<img src='" + imgData +"'/>");
		})
	}
});

CmdUtils.CreateCommand({
	names: ["google", "search", "g"],
	
	preview: function( pblock, query ) {
		console.log('google', arguments);
		if (!query) return;

		var q = []; 
		for (var i=1; i<arguments.length; i++) q.push(arguments[i]);
		q = q.join(' ');
		var url = "http://ajax.googleapis.com/ajax/services/search/web";
    	var params = {v: "1.0", q: q, rsz: "big", callback: 'test' };

    	$.get(url, params, function success(response) {
    		pblock.innerHTML = '<pre>'+JSON.stringify(response, false, 2)+'</pre>';//_(msg, {url: this._getMapUrl()});
    	}, 'jsonp');
	},
	
	execute: function(data) {
		var url = "http://www.google.com/search?q="+data;
		$('#hidden').html('<a id="new-window" target="_blank" href="'+url+'"></a>');
		$('#new-window').click();
	}
});

// MS translate API
// http://api.microsofttranslator.com/V2/Ajax.svc/Translate?text=Hello%20world&from=en&to=fi&appId=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9
// Freebase search
//https://www.googleapis.com/freebase/v1/search?query=nirvana&indent=true&callback=test

// https://github.com/joshaven/string_score/blob/master/tests/comparisons/jaro-winkler.js
jaro = function(str1, str2){
	var lenStr1 = str1.length,
			lenStr2 = str2.length,
			matchWindow = Math.max(lenStr1, lenStr2)/2-1,
			transpositions=0,
			matches=0,
			letter='';
			
	// Test if swapping strX & lenStrX if stra is longer then str2 for proformance ??
	// another option is to bail out of the stepping once we are outside of the context of the other string
	// the issue is that with string lengths of 11 & 2 you wouldn't want to go through the loop 11 times
	
	/* find matches & transpositions */
	for (var i in str2) {
		letter = str2[i];
		if(str1.slice(i,i+matchWindow).indexOf(letter) > -1) { /* match */
			matches++;
		} else if(str1.slice(i-matchWindow,i).indexOf(letter) > -1) { /* transposition */
			matches++; transpositions++;
		}
	};
	
	return (1/3*(matches/lenStr1+matches/lenStr2+(matches-transpositions)/matches));
};

jaroWinkler = function(str1, str2, p){
	p = p || 0.1;
	var dj = jaro(str1,str2), l=0; 
	
	for(var i=0; i<4; i++) { /* find length of prefix match (max 4) */
		if(str1[i]==str2[i]){ l++; } else { break; } 
	}
	if (str1.length == str2.length == 1 && str1 == str2) return 1;
	
	return dj+(l*p*(1-dj));
};

String.prototype.score = function(abbreviation) {
	return jaroWinkler(this.toLowerCase(),abbreviation.toLowerCase());
};