/* global
 $,
 $$,
 is,
 UI,
 Modal,
 Store
 */

var Backup = (function() {

	var update = 1;

	const el = {
		buttonExportData: $('#exp-data'),
		buttonImportData: $('#imp-data')
	};

	const template = {
		exportData: `
		<div class='new-form move-data'>
			${UI.template.closeModalButton}
			<div class='move-data-exp'>
				<h3>Export Data</h3>
				<p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p>
				<a class="btn no-ndrln txt-cntr blck w-100 mrgn-y pad-y"
				   id="btn-download-data"
				   download="reedditdata.json">Download Data</a>
			</div>
		</div>`,
		importData: `
		<div class='new-form move-data'>
			${UI.template.closeModalButton}
			<div class='move-data-imp'>
				<h3>Import Data</h3>
				<p>Load the subscriptions from another Reeddit instance.</p>
				<p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p>
				<button class='btn w-100 mrgn-y pad-y'
						    id='btn-trigger-file'>Choose Backup file</button>
				<input id='file-chooser'
							 class="hide"
					     type="file"
					     accept="application/json"/>
			</div>
		</div>`
	};

	var shouldUpdate = function() {
		update = 1;
	};

	var getBackupData = () => {
		return "{\"channels\": " + Store.getItem("channels") + ", \"subreddits\": " + Store.getItem("subreeddits") + "}";
	};

	var prepareDownloadButton = (data) => {
		let buttonDownload = $$.id('btn-download-data');
		buttonDownload.href = "data:text/json;charset=utf-8," + encodeURIComponent(data);
	};

  var createBackup = function() {
    if (!update) {
      return;
    }

    Modal.show(template.exportData, function() {
      prepareDownloadButton(getBackupData());
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
		el.buttonExportData.on('click', (ev) => {
			ev.preventDefault();
			createBackup();
		});

		el.buttonImportData.on('click', (ev) => {
			ev.preventDefault();
			Modal.show(template.importData, () => {
				if (is.iOS) {
					UI.switchDisplay($$.id('btn-trigger-file'), true);
					UI.switchDisplay($$.id('file-chooser'), false);
				}
			});
		});

		// Forms
    UI.el.body.on('change', '#file-chooser', function() {
      let file = this.files[0];
      readFile(file);
    });

    UI.el.body.on('click', '#btn-trigger-file', () => {
      $$.id('file-chooser').click();
    });
	};

	// Exports
	return {
		initListeners: initListeners,
		shouldUpdate: shouldUpdate
	};

})();
