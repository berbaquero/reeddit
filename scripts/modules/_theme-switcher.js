/* global
 Store,
 UI,
 is
 */

let ThemeSwitcher = (() => {

	const themes = [
		'classic',
		'light',
		'dark'
	];

	let currentThemeIndex = 0;

	const el = {
		switcherButton: $('#switch-theme')
	};

	const switchTheme = () => {
		let current = getCurrentTheme(),
			next = getNextTheme();

		UI.el.body.removeClass(current);
		setTheme(next);
	};

	const setTheme = (theme) => {
		UI.el.body.addClass(theme);
		setThemeLabel(theme);
		saveTheme(theme);
	};

	const setThemeLabel = (name) => {
		el.switcherButton.text(`Theme: ${name}`);
	};

	const getCurrentTheme = () => themes[currentThemeIndex];

	const getNextTheme = () => {
		currentThemeIndex++;

		if (currentThemeIndex === themes.length) {
			currentThemeIndex = 0;
		}

		return themes[currentThemeIndex];
	};

	const saveTheme = (theme) => {
		Store.setItem('theme', theme);
	};

	const loadTheme = () => Store.getItem('theme');

	const loadInitialTheme = () => {
		let initial = loadTheme();

		if (initial) {
			updateTheme(initial);
		} else if (is.iOS7) {
			setTheme(themes[1]);
		} else {
			setTheme(themes[currentThemeIndex]);
		}
	};

	const updateTheme = (theme) => {
		if (getCurrentTheme() === theme) {
			return;
		}
		setTheme(theme);
		currentThemeIndex = themes.indexOf(theme);
	};

	const init = () => {
		loadInitialTheme();
		// Listeners
		el.switcherButton.on('click', (ev) => {
			ev.preventDefault();
			switchTheme();
		});
	};

	// Exports
	return {
		init: init
	};

})();
