var Footer = {

	refreshButton: '',

	getRefreshButton: function() {
		if (!this.refreshButton) {
			this.refreshButton = document.querySelector('#main-footer .footer-refresh');
		}
		return this.refreshButton;
	}
};
