/* global
 $,
 $$,
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
		exportData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-exp'><h3>Export Data</h3><p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p><div class='btn-general' id='btn-save-dbx'>Save to Dropbox</div></div></div>",
		importData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-imp'><h3>Import Data</h3><p>Load the subscriptions from another Reeddit instance.</p><p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p><div class='btn-general' id='btn-dbx-imp'>Import from Dropbox</div></div></div>"
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
						$$.id("btn-save-dbx").style.display = "block"; // Show "Save to Dropbox" button only when the gist's created
						gists.fileURL = resp.files["reedditdata.json"].raw_url;
						update = 0;
					},
					error: function() {
						$("#btn-save-dbx").remove();
						$(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>");
						Modal.remove();
					}
				});
			});
		} else if (gists.fileURL) {
			Modal.show(template.exportData, function() {
				$$.id("btn-save-dbx").style.display = "block";
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
							var refresh = false;
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

	var initListeners = function() {

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
	};

	// Exports
	return {
		initListeners: initListeners,
		chooseFromDropbox: chooseFromDropbox,
		createBackup: createBackup,
		shouldUpdate: shouldUpdate,
		templateImportData: template.importData
	};

})();
