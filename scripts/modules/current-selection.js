/* global
 Store
 */

var CurrentSelection = (function() {

	var name = '',
		type = '';

	const Types = {
		SUB: 1,
		CHANNEL: 2
	};

	const storeKey = 'currentSelection';

	var getName = () => name;

	var getType = () => type;

	var set = function(newName, newType) {
		name = newName;
		type = newType;
		Store.setItem(storeKey, JSON.stringify({name, type}));
	};

	var loadSaved = function() {
		var loadedSelection = Store.getItem(storeKey);

		if (loadedSelection) {
			loadedSelection = JSON.parse(loadedSelection);
		}

		name = loadedSelection ? loadedSelection.name : 'frontPage';
		type = loadedSelection ? loadedSelection.type : Types.SUB;
	};

	var setSubreddit = function(sub) {
		set(sub, Types.SUB);
	};

	var setChannel = function(channel) {
		set(channel.name, Types.CHANNEL);
	};

	var execute = function(caseSub, caseChannel) {
		switch(type) {
			case Types.SUB:
				caseSub();
				break;
			case Types.CHANNEL:
				caseChannel();
				break;
		}
	};

	// Exports
	return {
		getName: getName,
		getType: getType,
		Types: Types,
		loadSaved: loadSaved,
		setSubreddit: setSubreddit,
		setChannel: setChannel,
		execute: execute
	};

})();
