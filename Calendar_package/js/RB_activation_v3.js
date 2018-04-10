function activationCheck(PLUGIN_ID, callback) {

	var dev = false;

	var url = (!dev) ? 'https://crwzq7pxf9.execute-api.ap-northeast-1.amazonaws.com/prod/activationcheck'
					: 'https://napsesq9y9.execute-api.ap-northeast-1.amazonaws.com/dev/activationcheck';

	if (PLUGIN_ID === '') {
		// DEBUG
		kintone.proxy(url, 'GET', {}, {}, function(body, status, headers) {
			callback(true, true);
		});
		return;
	} else {
		kintone.plugin.app.proxy(PLUGIN_ID, url, 'GET', {}, {}, function(body, status, headers) {
			if (status !== 200) {
				callback(false, false);
			} else {
				var json_body = JSON.parse(body);
				if (json_body.result === 'OK') {
					callback(true, false);
				} else if (json_body.result === 'OK_PRO') {
					callback(true, true);
				} else {
					callback(false, false);
				}
			}
		}, function(body) {
			console.log(body);
			callback(false, false);
		});
	}
}

