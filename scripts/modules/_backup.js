/* global
 $,
 $$,
 is,
 UI,
 Modal,
 Dropbox,
 tappable,
 Store
 */

var Backup = (function() {

	var update = 1,
		gists = {
			url: "https://api.github.com/gists",
			fileURL: ''
		};

	const template = {
		exportData: `
		<div class='new-form move-data'>
			<div class='close-form'>&times;</div>
			<div class='move-data-exp'>
				<h3>Export Data</h3>
				<p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p>
				<button class='btn-simple btn-block--full hide' id='btn-save-dbx'>Save to Dropbox</button>
				<a class="btn-simple btn-block--full hide" id="btn-download-data" download="reedditdata.json">Download Data</a>
			</div>
		</div>`,
		importData: `
		<div class='new-form move-data'>
			<div class='close-form'>&times;</div>
			<div class='move-data-imp'>
				<h3>Import Data</h3>
				<p>Load the subscriptions from another Reeddit instance.</p>
				<p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p>
				<button class='btn-simple btn-block--full hide' id='btn-dbx-imp'>Import from Dropbox</button>
				<button class='btn-simple btn-block--full hide' id='btn-trigger-file'>Choose Backup file</button>
				<input id='file-chooser' type="file" accept="application/json" style="display: none"/>
			</div>
		</div>`
	};

	var shouldUpdate = function() {
		update = 1;
	};

	var createBackup = function() {
		if (update) {
			Modal.show(template.exportData, function() {
				var files = {},
					content = "{\"channels\": " + Store.getItem("channels") + ", \"subreddits\": " + Store.getItem("subreeddits") + "}";

				files["reedditdata.json"] = {
					"content": content
				};

				if (is.linkDownloadable) {
					let buttonDownload = $$.id('btn-download-data');
					buttonDownload.href = "data:text/json;charset=utf-8," + encodeURIComponent(content);
					UI.switchDisplay(buttonDownload, false);
				}

				if (is.mobile || !is.mozStandalone) {
					$.ajax({
						url: gists.url,
						type: "POST",
						data: JSON.stringify({
							"description": "Reeddit User Data",
							"public": true,
							"files": files
						}),
						headers: {
							'Content-Type': 'application/json; charset=UTF-8'
						},
						success: function(response) {
							var resp = JSON.parse(response);
							UI.switchDisplay($$.id("btn-save-dbx"), false);
							gists.fileURL = resp.files["reedditdata.json"].raw_url;
							update = 0;
						},
						error: function() {
							$("#btn-save-dbx").remove();
							$(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>");
							Modal.remove();
						}
					});
				}
			});
		} else if (gists.fileURL) {
			Modal.show(template.exportData, function() {
				UI.switchDisplay($$.id("btn-save-dbx"), false);
			});
		}
	};

	var chooseFromDropbox = function() {
		Dropbox.choose({
			success: function(file) {
				$.ajax({
					url: file[0].link,
					success: function(data) {
						try {
							loadData(data);
						} catch(e) {
							alert("Oops! Wrong file, maybe? - Try choosing another one.");
						}
					}
				});
			},
			linkType: "direct",
			extensions: [".json"]
		});
	};

	var loadData = (data) => {
		let refresh = false;

		if (typeof data === "string") {
			data = JSON.parse(data);
		}

		if (data.subreddits) {
			refresh = true;
			Store.setItem("subreeddits", JSON.stringify(data.subreddits));
		}
		if (data.channels) {
			refresh = true;
			Store.setItem("channels", JSON.stringify(data.channels));
		}
		if (refresh) {
			window.location.reload();
		}
	};

	let readFile = (file) => {
		let reader = new FileReader();
		reader.onload = function() {
			loadData(reader.result);
		};
		reader.readAsText(file);
	};

	var initListeners = function() {

		// On Menu
		tappable("#exp-data", {
			onTap: createBackup
		});

		tappable("#imp-data", {
			onTap: function() {
				Modal.show(template.importData, () => {
					if (!is.iOS) {
						UI.switchDisplay($$.id('btn-trigger-file'), false);
					}

					if (is.mobile || !is.mozStandalone) {
						UI.switchDisplay($$.id('btn-dbx-imp'), false);
					}
				});
			}
		});

		// Forms
		if (is.mobile || !is.mozStandalone) {
			tappable("#btn-save-dbx", {
				onTap: function() {
					if (!gists.fileURL) {
						alert("Err. There's no backup file created...");
						return;
					}
					var options = {
						files: [{
							url: gists.fileURL,
							filename: "reedditdata.json"
						}],
						success: Modal.remove
					};
					Dropbox.save(options);
				},
				activeClass: "btn-general-active"
			});

			tappable("#btn-dbx-imp", {
				onTap: chooseFromDropbox,
				activeClass: "btn-general-active"
			});
		}

		if (!is.iOS) {
			UI.el.body.on('change', '#file-chooser', function() {
				let file = this.files[0];
				readFile(file);
			});

			UI.el.body.on('click', '#btn-trigger-file', () => {
				$$.id('file-chooser').click();
			});
		}
	};

	// Exports
	return {
		initListeners: initListeners,
		shouldUpdate: shouldUpdate
	};

})();
