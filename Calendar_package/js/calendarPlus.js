/*
kintoneプラグイン カレンダーPlus
kintoneに素敵なカレンダー機能をプラスするプラグイン

■依存ライブラリ
https://js.cybozu.com/jquery/2.1.4/jquery.min.js
https://js.cybozu.com/sweetalert/v1.1.3/sweetalert.min.js
https://js.cybozu.com/momentjs/2.10.6/moment.min.js
https://js.cybozu.com/fullcalendar/v3.4.0/fullcalendar.min.js
https://js.cybozu.com/jstree/3.3.4/jstree.min.js
js/scheduler.min.js
js/locale-all.js
js/RB_activation_v3.js

https://js.cybozu.com/fullcalendar/v3.4.0/fullcalendar.min.css
https://js.cybozu.com/sweetalert/v1.1.3/sweetalert.css
https://js.cybozu.com/jstree/3.3.4/themes/default/style.min.css
css/calendarPlus.css
css/scheduler.min.css
css/51-us-default.css

Ver.1   2015/9/26 Radical Bridge
Ver.2   2015/12/25 Radical Bridge
Ver.2.1 2016/2/3 Radical Bridge
Ver.2.2 2016/5/18 Radical Bridge
Ver.3.0 2016/6/5 Radical Bridge
Ver.4.0 2016/8/31 Radical Bridge
Ver.4.1 2016/12/6 Radical Bridge
Ver.5.0 2017/9/15 Radical Bridge
*/

jQuery.noConflict();
(function($, PLUGIN_ID) {

	"use strict";

	// プラグインIDの設定
	var KEY = PLUGIN_ID;
	var conf = kintone.plugin.app.getConfig(KEY);

	// グローバル変数
	var appId = kintone.app.getId();
	var appPathArray = location.pathname.split('/');
	appPathArray.splice(-1);
	var appPath = appPathArray.join('/') + '/';
	var uiVer = kintone.getUiVersion();
	var storage = sessionStorage;
	var tzOffset = (new Date()).getTimezoneOffset();
	var lang = kintone.getLoginUser().language;
	var loginUser = kintone.getLoginUser();
	var langs = ["ja", "en", "zh"];
	var colorValue = {
		"green": "#006400",
		"blue": "#0040D4",
		"red": "#A40000",
		"gray": "#646464",
		"orange": "#F0670F",
		"brown": "#8B4513",
		"purple": "#800080",
		"pink": "#eb6ea0",
		"lightBlue": "#2ca9e1",
		"yellow": "#f8b500",
		"yellowGreen": "#9cbb1c",
		"deepBlue": "#223a70"
	};
	var schedulerLicenseKey = '0107951809-fcs-1472106715';

	// 言語別リソース定義
	var res = {
		"configErrorMessage": {
			"ja": "カレンダーPlus プラグインの設定を行ってください。",
			"en": "Please set the Calendar Plus plug-ins.",
			"zh": "请设置 日历 Plus 插件"
		},
		"delButtonLabel": {
			"ja": "削除",
			"en": "Delete",
			"zh": "删除"
		},
		"delConfirm" : {
			"ja": "削除してもよろしいですか？",
			"en": "Are you sure you want to delete?",
			"zh": "你确定要删除？"
		},
		"delErrorMessage" : {
			"ja": "削除処理に失敗しました。",
			"en": "Failed to delete processing.",
			"zh": "它无法删除处理"
		},
		"saveErrorMessage" : {
			"ja": "保存処理に失敗しました。",
			"en": "Failed to save processing.",
			"zh": "它没能挽救处理"
		},
		"unsetText" : {
			"ja": "（未設定）",
			"en": "(Not set)",
			"zh": "（未设置）"
		},
		"eventDataAcquisitionErrorMessage" : {
			"ja": "イベントデータ取得エラー",
			"en": "Event data acquisition error",
			"zh": "事件数据采集错误"
		},
		"noticeMessage" : {
			"ja": 'BasicまたはProライセンスをご購入いただき<br />アクティベーションキーを設定していただくと<br />この警告は表示されなくなります。<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Basic または Proライセンスを購入する</a>',
			"en": 'If you purchase a Basic or Pro license and set the activation key,<br />this warning will no longer appear .<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Buy a Basic or Pro license</a>',
			"zh": 'If you purchase a Basic or Pro license and set the activation key,<br />this warning will no longer appear .<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Buy a Basic or Pro license</a>'
		},
		"schedulerNoticeMessage" : {
			"ja": 'この表示形式はカレンダーPlus Proでお使いいただける機能です。<br />Proのご購入、またはBasicからProへのアップグレードで<br />この警告は表示されなくなります。<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Proライセンスを購入 または Proにアップグレードする</a>',
			"en": 'If you purchase a license and set the activation key,<br />this warning will no longer appear .<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Buy a Pro license or upgrade to the Pro</a>',
			"zh": 'If you purchase a license and set the activation key,<br />this warning will no longer appear .<br /><br /><a href="http://radical-bridge.com/product/calendarPlus.html" target="_blank" style="color: blue;">Buy a Pro license or upgrade to the Pro</a>'
		},
		"NO_RESOURCE_TITLE" : {
			"ja": "（未設定）",
			"en": "(Not set)",
			"zh": "(Not set)"
		},
		"timelineMonthButtonText" : {
			"ja": "#月",
			"en": "#month",
			"zh": "#month"
		},
		"timelineWeekButtonText" : {
			"ja": "#週",
			"en": "#week",
			"zh": "#week"
		},
		"timelineDayButtonText" : {
			"ja": "#日",
			"en": "#day",
			"zh": "#day"
		}
	};



	// calendarPlus設定情報読み込み
	if (!conf) {
		alert(res['configErrorMessage'][lang]);
		return false;
	}

	// プラグイン設定による言語別リソース定義
	var pluginRes = {};
	pluginRes["titleFieldLabel"] = {};
	pluginRes["allDayFieldValue"] = {};
	pluginRes["privateSettingFieldValue"] = {};
	pluginRes["USER_SELECT_resourceLabel"] = {};
	for (var i = 0; i < langs.length; i++) {
		pluginRes["titleFieldLabel"][langs[i]] = conf['titleFieldLabel_' + langs[i]];
		pluginRes["allDayFieldValue"][langs[i]] = conf['allDayFieldValue_' + langs[i]];
		pluginRes["privateSettingFieldValue"][langs[i]] = conf['privateSettingFieldValue_' + langs[i]];
		pluginRes["USER_SELECT_resourceLabel"][langs[i]] = conf['USER_SELECT_resourceLabel_' + langs[i]];
		for (var key in colorValue) {
			if (!pluginRes["bgColor_" + key]) {
				pluginRes["bgColor_" + key] = {};
			}
			pluginRes["bgColor_" + key][langs[i]] = conf['bgColor_' + key + '_' + langs[i]];
		}
	}


	// アクティベーションフラグ
	var activation = false;
	// アクティベーションキー
	var activationKey = conf['activationKey'];

	// スケジューラーアクティベーションフラグ
	var schedulerActivation = false;

	// カレンダーPlusを表示するビューID
	var viewId;

	// 初期表示形式（月別：month, 週別：agendaWeek, 日別：agendaDay）
	var defaultViewName = conf['defaultViewName'];

	// 予定クリック時の動作（詳細画面：detail, 編集画面：edit）
	var detailMode = conf['detailMode'];

	// カレンダーに登録するタイトルのフィールドコード
	var refTitleFieldName = conf['title'];
	// カレンダーに表示するタイトルのフィールドラベル
	var refTitleFieldLabel = pluginRes["titleFieldLabel"][lang];
	// カレンダーに表示するタイトルのフィールドコード
	var refTitleForDispFieldName = conf['titleForDisp'];
	// カレンダーに表示する開始日時のフィールドコード
	var refStartDateFieldName = conf['startDateTime'];
	// カレンダーに表示する終了日時のフィールドコード
	var refEndDateFieldName = conf['endDateTime'];
	// 終日かどうかを指定するチェックボックスのフィールドコード
	var refAllDayFieldName = conf['allDay'];
	// 終日かどうかを指定するチェックボックスのフィールド値
	var refAllDayFieldValue = pluginRes["allDayFieldValue"][lang];
	// 表示開始日時
	var minTime = conf['minTime'];
	// 表示終了日時
	var maxTime = conf['maxTime'];
	// 週の開始曜日
	var firstDay = conf['firstDay'];
	// 営業曜日（予定を登録できる曜日）
	var dow = (conf['dow']) ? conf['dow'].split(',') : [];
	// 予定の重複禁止設定
	var allowOverlap = !(conf['allowOverlap'] === 'disallowOverlap');
	// ドラッグ操作の許可・禁止設定
	var allowEditable = !(conf['allowEditable'] === 'disallowEditable');
	// 公開・非公開を指定するラジオボタンのフィールドコード
	var refPrivateSettingFieldName = conf['privateSetting'];
	// 非公開を表すラジオボタンのフィールド値
	var refPrivateSettingFieldValue = pluginRes["privateSettingFieldValue"][lang];
	// カレンダーの色分けに使用する項目のフィールドコード
	var refColorFieldName = conf['bgColor'];
	// カレンダー色の定義
	var refColor = {};
	for (var key in colorValue) {
		refColor[pluginRes['bgColor_' + key][lang]] = colorValue[key];
	}
	// スケジューラーオプションを使用するするかどうか
	var enableSchedulerOpt = (conf['schedulerOpt'] === 'enableSchedulerOpt');
	// リソースとして使用するフィールドのフィールドコード（ドロップダウン、ラジオボタン、ユーザー選択）
	var refResourceFieldName = conf['resource'];
	// リソースとして使用するフィールドのフィールドタイプ（ドロップダウン、ラジオボタン、ユーザー選択）
	var refResourceFieldType = conf['resourceFieldType'];
	// リソースがユーザー選択の場合にリソースとして表示させるグループコード
	var resourceGroupCode = conf['resourceGroupCode'];
	// （未設定）欄を非表示にするかどうか
	var hideNoResource = (conf['noResourceSetting'] === 'hideNoResource');
	// 日表示をリソース別表示にするかどうか
	var enableVerticalResourceView = (conf['verticalResourceView'] === 'enableVerticalResourceView');
	// 時刻間隔（週・日・TL日にのみ適用）5分,10分,15分,20分,30分
	var slotDurationForTime = conf['slotDurationForTime'];

	// リソース格納用配列
	var resources = [];
	// リソース未設定のシンボル文字列
	var NO_RESOURCE_SYMBOL = 'no-resource';
	// リソースラベル格納用変数
	var resourceLabel = '';

	// 組織情報格納用配列
	var organizations = [];
	// 選択中の組織コード格納用
	var selectedNodeCode = null;
	// 選択中の組織名格納用
	var selectedNodeName = null;

	// グループ情報格納用配列
	var groups = [];

	// イベントデータ格納用配列
	var evt = [];

	// アクティベーションチェック後の処理
	var activationCheckResult = function (res_activation, res_schedulerActivation) {
		storage.setItem("activation_" + appId, res_activation.toString());
		activation = res_activation;
		storage.setItem("schedulerActivation_" + appId, res_schedulerActivation.toString());
		schedulerActivation = res_schedulerActivation;
		if (!activation) {
			showNoticeMessage();
		}
	};

	//############### Main ###############

	// レコード一覧画面表示時の処理
	kintone.events.on(['app.record.index.show'], function (event) {

		// カレンダーPlus描画領域が無い場合は何もしない
		if ($("#calendarPlus").length == 0) {
			storage.removeItem('viewId');
			return event;
		}

		//// アクティベーションチェック
		var activationStr = storage.getItem("activation_" + appId);
		var schedulerActivationStr = storage.getItem("schedulerActivation_" + appId);
		if (!activationStr) {
			if (!activationKey) {
				showNoticeMessage();
				storage.setItem("activation_" + appId, "false");
				activation = false;
				storage.setItem("schedulerActivation_" + appId, "false");
				schedulerActivation = false;
			} else {
				activation = true;
				schedulerActivation = true;
				activationCheck(KEY, activationCheckResult);
			}
		} else {
			activation = (activationStr == 'true') ? true : false;
			schedulerActivation = (schedulerActivationStr == 'true') ? true : false;
		}

		// viewId取得
		viewId = event.viewId;

		// リソースの取得
		if (enableSchedulerOpt) {
			if (refResourceFieldType === 'USER_SELECT') {
				var nodeCode = storage.getItem('calendarPlus_selectedNodeCode');
				var nodeName = storage.getItem('calendarPlus_selectedNodeName');
				if (resourceGroupCode === 'CALENDARPLUS_RESOURCE_ORGANIZATION') {
					// 表示中リソースの取得
					var userCode;
					if (nodeCode) {
						userCode = null;
						selectedNodeCode = nodeCode;
						selectedNodeName = nodeName;
						storage.removeItem('calendarPlus_selectedNodeCode');
						storage.removeItem('calendarPlus_selectedNodeName');
					} else {
						userCode = loginUser.code;
					}

					getUserOrganizationData(userCode, function() {
						resources = [];
						getOrganizationUserResource(0, function() {
							initCalendarPlus(new Date());
						});
					});

				} else {
					if (nodeCode) {
						selectedNodeCode = nodeCode;
						storage.removeItem('calendarPlus_selectedNodeCode');
					} else {
						selectedNodeCode = resourceGroupCode;
					}
					getGroupData(function() {
						resources = [];
						getGroupUserResource(0, function() {
							initCalendarPlus(new Date());
						});
					});
				}

			} else {
				kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {'app': appId, 'lang': lang}, function(resp) {
					resourceLabel = resp.properties[refResourceFieldName].label;
					var options = resp.properties[refResourceFieldName].options;
					for (var key in options) {
						resources[parseInt(options[key].index)] = {"id": options[key].label, "title": options[key].label};
					}
					if (!hideNoResource) {
						resources.unshift({"id": NO_RESOURCE_SYMBOL, "title": res['NO_RESOURCE_TITLE'][lang]});
					}
		
					// カレンダー初期化
					initCalendarPlus(new Date());
				});
			}
		
		} else {
			// カレンダー初期化
			initCalendarPlus(new Date());
		}

		return event;
	});



	// レコード詳細画面表示時の処理
	kintone.events.on(['app.record.detail.show'], function (event) {

		viewId = storage.getItem('viewId');
		if (detailMode == 'edit' && viewId) {
			location.href = (viewId && !isNaN(viewId)) ? appPath + '?view=' + viewId : appPath;;
		}

		return event;
	});


	// レコード編集画面表示時の処理
	kintone.events.on(['app.record.edit.show'], function (event) {

		var elm = kintone.app.record.getHeaderMenuSpaceElement();

		var del_str = res['delButtonLabel'][lang];
		if (uiVer === 1) {
			elm.style.display = 'table-cell';
			elm.style.verticalAlign = 'middle';
			elm.style.padding = '1px 10px 0px';
			$(elm).append($('<a>').prop({'href': '#', 'id': 'delLink'}).css({fontWeight: 'bold', color: '#A4A4A4'}).text(del_str));
		} else {
			$(elm).append($('<button class="kintoneplugin-button-normal">').prop({'id': 'delLink'}).css({
				float: 'right', margin: '16px'
			}).text(del_str));

			$('#delLink').hover(function(){
				$(this).css({backgroundColor: '#d0e0ee', boxShadow: '0px 0px 0px #fff inset'});
			}, function(){
				$(this).css({backgroundColor: '#f7f9fa', boxShadow: '1px 1px 1px #fff inset'});
			});
		}

		$('#delLink').click(function(){
			deleteRecord();
			return false;
        });

		return event;
	});



	////// function //////////////////////////////////////

	// 警告表示
	function showNoticeMessage() {
		swal({
			title: "Notice",
			text: res['noticeMessage'][lang],
			type: "warning",
			html: true
		});
	}

	// ユーザーの所属組織情報取得
	function getUserOrganizationData(userCode, callback) {
		if (!userCode) {
			callback();
		} else {
			kintone.api(kintone.api.url('/v1/users', true), 'GET', {'codes':[userCode]}, function(resp) {
				var users = resp.users;
				if (users.length > 0) {
					var primaryOrganizationId = users[0]['primaryOrganization'];
					if (primaryOrganizationId) {
						kintone.api(kintone.api.url('/v1/organizations', true), 'GET', {'ids':[primaryOrganizationId]}, function(resp) {
							var orgs = resp.organizations;
							if (orgs.length > 0) {
								var org = orgs[0];
								selectedNodeCode = org['code'];
								selectedNodeName = (org.localNameLocale == lang && org.localName !== '') ? org.localName : org.name;
							}
							callback();
						});
					} else {
						callback();
					}
				} else {
					callback();
				}
			});
		}
	}

	// 組織所属ユーザーの取得
	function getOrganizationUserResource(offset, callback) {
		if (!selectedNodeCode) {
			callback();
		} else {
			// 本人
			resources.push({
				"id": loginUser.code,
				"title": loginUser.name
			});

			// 組織メンバー
			var limit = 100;
			var param = {
				'code': selectedNodeCode,
				'offset': offset,
				'size': limit
			};
			kintone.api(kintone.api.url('/v1/organization/users', true), 'GET', param, function(resp) {
				var users = resp.userTitles;
				for (var i = 0; i < users.length; i++) {
					if (users[i].user.valid) {
						if (users[i].user.code !== loginUser.code) {
							var resource = {
								"id": users[i].user.code,
								"title": users[i].user.name
							};
							resources.push(resource);
						}
					}
				}

				if (users.length == limit) {
					getOrganizationUserResource(offset + limit, callback);
				} else {
					resourceLabel = pluginRes["USER_SELECT_resourceLabel"][lang];
					resources = $.grep(resources, function(e){return e;});
					if (!hideNoResource) {
						resources.unshift({"id": NO_RESOURCE_SYMBOL, "title": res['NO_RESOURCE_TITLE'][lang]});
					}
					callback();
				}

			});
		}		
	}


	// グループ所属ユーザーの取得
	function getGroupUserResource(offset, callback) {
		var size = 100;
		var body = {
			'code': (selectedNodeCode) ? selectedNodeCode : resourceGroupCode,
			'offset': offset,
			'size': size
		};
		kintone.api(kintone.api.url('/v1/group/users', true), 'GET', body, function(resp) {
			var users = resp.users;
			users.forEach(function(user) {
				if (user.valid) {
					resources.push({
						"id": user.code,
						"title": user.name
					});
				}	
			});

			if (users.length == size) {
				getGroupUserResource(offset + size, callback);
			} else {
				resourceLabel = pluginRes["USER_SELECT_resourceLabel"][lang];
				resources = $.grep(resources, function(e){return e;});
				if (!hideNoResource) {
					resources.unshift({"id": NO_RESOURCE_SYMBOL, "title": res['NO_RESOURCE_TITLE'][lang]});
				}
				callback();
			}
		});
	}

	//// グループデータ取得
	function getGroupData(callback) {
		kintone.api(kintone.api.url('/v1/groups', true), 'GET', {}, function(resp) {
			groups = resp.groups;
			callback();
		});
	}


	//// 組織選択メニュー
    function showOrganizetionSelectMenu() {

        $('#organizationSelectElm').remove();

		organizations = [];
		getOrganizationData(0, function() {
			var $background = $('<div>').prop('id', 'background');
			var $organizationSelectElm = $('<div>').prop('id', 'organizationSelectElm').append(
				$('<div>').prop('id', 'organizationTree')
			);
			$background.css({
				'position': 'fixed',
				'display': 'none',
				'top': '0px',
				'z-index': '500',
				'width': '100%',
				'height': $(window).height() + 'px',
				'background-color': '#000',
				'opacity': '0.5',
				'filter': 'alpha(opacity=50)',
				'-ms-filter': "alpha(opacity=50)"
			});
			$organizationSelectElm.css({
				'display': 'none',
				'position': 'fixed',
				'top': '0',
				'right': '0',
				'bottom': '0',
				'left': '0',
				'margin': 'auto',
				'padding': '2% 5%',
				'width': '400px',
				'height': '50%',
				'background-color': '#ffffff',
				'border-radius': '10px',
				'z-index': '510',
				'font-size': '16px',
				'overflow-x': 'auto',
				'overflow-y': 'auto'
			});
			$(document.body).append($background);
			$(document.body).append($organizationSelectElm);
			$("#background").fadeIn();
			$("#organizationSelectElm").fadeIn();

			$('#background').on('click', function() {
				$("#background").fadeOut();
				$("#organizationSelectElm").fadeOut();
			});

			$('#organizationTree').jstree({
				'core' : {
					'multiple' : false,
					'data' : organizations
				},
				'plugins': [
					'wholerow'
				]
			});

			$('#organizationTree').on("select_node.jstree", function (node, selected, event) {
				selectedNodeCode = selected.node.id;
				selectedNodeName = selected.node.text;
				$("#background").fadeOut();
				$("#organizationSelectElm").fadeOut();

				resources = [];
				getOrganizationUserResource(0, function() {
					initCalendarPlus(new Date());
				});

			});
		});

    }

	// 組織データ取得
	function getOrganizationData(offset, callback) {

		// 組織
		var limit = 100;
		var param = {
			'offset': offset,
			'size': limit
		};
		kintone.api(kintone.api.url('/v1/organizations', true), 'GET', param, function(resp) {
			var orgs = resp.organizations;
			orgs.forEach(function(org) {
				var organization = {
					'id' : org.code,
					'parent' : (org.parentCode) ? org.parentCode : "#",
					'text' : (org.localNameLocale == lang && org.localName !== '') ? org.localName : org.name,
					'state': {
						'selected': (org.code === selectedNodeCode)
					}
				};
				organizations.push(organization);
			});

			if (orgs.length == limit) {
				getOrganizationData(offset + limit, callback);
			} else {
			    callback();
			}
		});
	}

	// レコード削除
	function deleteRecord(e) {

		if (window.confirm(res['delConfirm'][lang])) {

			var rec = kintone.app.record.get();
			var id = rec['record']['$id']['value'];

			var param = {
				"app": appId,
				"ids": [id]
			};

			kintone.api(kintone.api.url('/k/v1/records', true), "DELETE", param, function(resp) {
				//console.log(resp);
				viewId = storage.getItem('viewId');
				location.href = (viewId && !isNaN(viewId)) ? appPath + '?view=' + viewId : appPath;
			}, function(resp) {
				console.log(resp);
				alert(res['delErrorMessage'][lang]);
				return false;
			});
			return false;
		}
		return false;
	}


	// カレンダーデータ取得
	function getEventsData(startDate, endDate, callback, offset) {
		var limit = 500;
		var s_startDate, s_endDate;
		s_startDate = $.fullCalendar.moment(startDate).add(tzOffset, 'minutes').format();
		s_endDate = $.fullCalendar.moment(endDate).add(tzOffset, 'minutes').format();

		var condition= kintone.app.getQueryCondition();

		// カレンダー表示レコードの検索
		if (condition) {
			condition += " and ";
		}

		//var query = condition + '((' + refStartDateFieldName + ' >= "' + s_startDate + '" and ' + refStartDateFieldName + ' <= "' + s_endDate + '") or (' + refEndDateFieldName + ' >= "' + s_startDate + '" and ' + refEndDateFieldName + ' <= "' + s_endDate + '") or (' + refStartDateFieldName + ' < "' + s_startDate + '" and ' + refEndDateFieldName + ' > "' + s_endDate + '")) order by ' + refStartDateFieldName + ' asc limit ' + limit + ' offset ' + offset;
		var query = condition + '((' + refStartDateFieldName + ' >= "' + s_startDate + '" and ' + refStartDateFieldName + ' <= "' + s_endDate + '") or (' + refEndDateFieldName + ' >= "' + s_startDate + '" and ' + refEndDateFieldName + ' <= "' + s_endDate + '") or (' + refStartDateFieldName + ' < "' + s_startDate + '" and ' + refEndDateFieldName + ' > "' + s_endDate + '")) limit ' + limit + ' offset ' + offset;

		kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {app: appId, query: query}, function(resp) {
			for (var i = 0; i < resp.records.length; i++) {
				var record = resp.records[i];
				var refStartDate = record[refStartDateFieldName]['value'];
				var refEndDate = record[refEndDateFieldName]['value'];
				var allDay = record[refAllDayFieldName]['value'];
				if (refPrivateSettingFieldName) {
					var privateSetting = record[refPrivateSettingFieldName]['value'];
				}
				if (refColorFieldName) {
					var status = record[refColorFieldName]['value'];
				}
				var color = '';
				if (status) {
					color = refColor[status];
				}
				if (allDay.indexOf(refAllDayFieldValue) != -1) {
					refStartDate = moment(refStartDate).format("YYYY-MM-DD");
					if (moment(refEndDate).format("HH:mm") === '00:00') {
						refEndDate = moment(refEndDate).format("YYYY-MM-DD");
					} else {
						refEndDate = moment(refEndDate).add(1, 'days').format("YYYY-MM-DD");
					}
				} else {
					refStartDate = moment(refStartDate).format();
					refEndDate = moment(refEndDate).format();
				}

				var borderColor = "#FFF";
				if (privateSetting && (privateSetting == refPrivateSettingFieldValue)) {
					borderColor = "#F00";
				}

				if (!refStartDate) {
					// do nothing
				} else {
					var url = appPath + 'show#record=' + record['$id']['value'];
					var resourceValues = [];
					if (enableSchedulerOpt) {
						var refResourceFieldValue = record[refResourceFieldName]['value'];
						if (refResourceFieldType === 'USER_SELECT') {
							if (refResourceFieldValue.length > 0) {
								refResourceFieldValue.forEach(function(value) {
									resourceValues.push(value.code);
								});
							} else {
								resourceValues.push(NO_RESOURCE_SYMBOL);
							}
						} else {
							if (!refResourceFieldValue) {
								resourceValues.push(NO_RESOURCE_SYMBOL);
							} else {
								resourceValues.push(refResourceFieldValue);
							}
						}
					}

					var obj = {
						id: record['$id']['value'],
						resourceIds: resourceValues,
						title: (record[refTitleForDispFieldName]['value']) ? record[refTitleForDispFieldName]['value'] : res['unsetText'][lang],
						start: refStartDate,
						end: refEndDate,
						color: color,
						borderColor: borderColor,
						url: (detailMode == 'detail') ? url : url + '&mode=edit',
						resourceEditable: (allowEditable) ? (resourceValues.length <= 1) : false
					};
					evt.push(obj);
				}
			}

			if (resp.records.length == limit) {
				getEventsData(startDate, endDate, callback, offset + limit);
			} else {
			    callback(evt);
			}

		}, function(resp) {
			alert(res['eventDataAcquisitionErrorMessage'][lang]);
			console.log(resp);
			return false;
		});
		
	}


	// カレンダーデータ登録
	function registEvent(id, start, end, allDay, title, resourceId) {

		var obj_startDate, obj_endDate;
		var s_startDate, s_endDate;

		obj_startDate = $.fullCalendar.moment(start._d).add(tzOffset, 'minutes').utc();
		s_startDate = obj_startDate.format();
		if (!end) {
			s_endDate = (allDay) ? obj_startDate.clone().add(1, 'days').format() : obj_startDate.clone().add(2, 'hours').format();
		} else {
			obj_endDate = $.fullCalendar.moment(end._d).add(tzOffset, 'minutes').utc();
			s_endDate = obj_endDate.format();
		}

		var url = kintone.api.url('/k/v1/record', true);
		var param = {
			"app": appId,
			"record": {}
		};

		param.record[refStartDateFieldName] = {};
		param.record[refStartDateFieldName]['value'] = s_startDate;
		param.record[refEndDateFieldName] = {};
		param.record[refEndDateFieldName]['value'] = s_endDate;
		param.record[refAllDayFieldName] = {};
		param.record[refAllDayFieldName]['value'] = [];
		if (allDay) {
			param.record[refAllDayFieldName]['value'][0] = refAllDayFieldValue;
		}

		var method;
		if (!id) {
			method = "POST";
			if (title) {
				param.record[refTitleFieldName] = {};
				param.record[refTitleFieldName]['value'] = title;
			}
		} else {
			method = "PUT";
			param.id = id;
		}

		if (resourceId) {
			param.record[refResourceFieldName] = {};
			param.record[refResourceFieldName]['value'] = (resourceId === NO_RESOURCE_SYMBOL) ? (refResourceFieldType === 'USER_SELECT') ? [] : null : (refResourceFieldType === 'USER_SELECT') ? [{'code': resourceId}] : resourceId;
		}

		kintone.api(url, method, param, function(resp) {
			//console.log(resp);
			if (method == "POST") {
				$('#calendarPlus').fullCalendar('refetchEvents');
			}
		}, function(resp) {
			console.log(resp);
			alert(res['saveErrorMessage'][lang]);
			return false;
		});

	}


	// カレンダー初期化
	function initCalendarPlus(defDate) {

		var viewName = storage.getItem('view');
		if (!viewName) {
			viewName = defaultViewName;
		}

		var viewDate = storage.getItem('date');
		if (!viewDate) {
			viewDate = $.fullCalendar.moment(defDate).format("YYYY-MM-DD");
		}

		var allDay = (refAllDayFieldName != '') ? true : false;

		$('#calendarPlus').fullCalendar('destroy');
		$('#calendarPlus').fullCalendar({
			header: {
				'left': 'prev,next today',
				'center': 'title',
				'right': (enableSchedulerOpt) ? 'month,agendaWeek,agendaDay,timelineMonth,timelineWeek,timelineDay' : 'month,agendaWeek,agendaDay'
			},
			defaultView: viewName,
			defaultDate: viewDate,
			views: {
				month: {
					slotDuration: slotDurationForTime,
				},
				agendaWeek: {
					slotDuration: slotDurationForTime,
					slotLabelFormat: 'H:mm',
					columnFormat: 'D [(]dd[)]'
				},
				agendaDay: {
					slotDuration: slotDurationForTime,
					slotLabelFormat: 'H:mm',
					groupByDateAndResource: enableVerticalResourceView
				},
				timelineMonth: {
					type: 'timeline',
					displayEventEnd: false,
					slotLabelFormat: 'D dd',
					buttonText: res['timelineMonthButtonText'][lang]
				},
				timelineWeek: {
					type: 'timeline',
					duration: { days: 7 },
					slotDuration: { days: 1 },
					slotLabelFormat: 'D [(]dd[)]',
					buttonText: res['timelineWeekButtonText'][lang]
				},
				timelineDay: {
					type: 'timeline',
					slotDuration: slotDurationForTime,
					slotLabelFormat: 'H:mm',
					buttonText: res['timelineDayButtonText'][lang]
				}
			},
			locale: lang,
			allDaySlot: allDay,
			nextDayThreshold: "00:00:00",
			lazyFetching: false,
			aspectRatio: 1.78,
			height: 'auto',
			contentHeight: 'auto',
			minTime: minTime,
			maxTime: maxTime,
			displayEventTime: true,
			displayEventEnd: true,
			editable: allowEditable,
			selectable: true,
			timeFormat: 'H:mm',
			nowIndicator: true,
			navLinks: true,
			eventColor: '#3A8733',
			eventTextColor: '#FFF',
			eventLimit: false,
			longPressDelay: 500,
			eventOverlap: allowOverlap,
			selectOverlap: allowOverlap,
			firstDay: firstDay,
			businessHours: {start: '00:00', end: '24:00', dow: dow},
			schedulerLicenseKey: schedulerLicenseKey,
			groupByDateAndResource: false,
			groupByResource: false,
			resourceLabelText: resourceLabel,
			resourceAreaWidth: '15%',
			resources: resources,
			eventResourceEditable: allowEditable,
			events: function(start, end, timezone, callback) {
				evt = [];
				getEventsData(start._d, end._d, callback, 0);
			},
			eventClick: function(event, jsEvent, view) {
				var url = appPath + 'show#record=' + event.id;
				location.href = (detailMode == 'detail') ? url : url + '&mode=edit';

				return false;
			},
			navLinkDayClick: function(date, jsEvent) {
				var navLinkDest = {
					"month": "agendaDay",
					"agendaWeek": "agendaDay",
					"timelineMonth": "timelineDay",
					"timelineWeek": "timelineDay",
				};
				var view = $('#calendarPlus').fullCalendar('getView');
				$('#calendarPlus').fullCalendar('gotoDate', date);
				$('#calendarPlus').fullCalendar('changeView', navLinkDest[view.name]);
			},
			eventDrop: function(event, delta, revertFunc) {
				var id = event.id;
				var start = event.start;
				var end = (!event.end) ? null : event.end;
				var resourceId = event.resourceId;
				registEvent(id, start, end, event.allDay, null, resourceId);
			},
			eventResize: function(event, delta, revertFunc) {
				var id = event.id;
				var start = event.start;
				var end = (!event.end) ? null : event.end;
				var resourceId = event.resourceId;
				registEvent(id, start, end, event.allDay, null, resourceId);
			},
			select: function(start, end, jsEvent, view, resource) {
				var strDateTime = start.format('YYYY/M/D H:mm') + ' - ' + end.format('YYYY/M/D H:mm');
				var titleInput = function(){
					swal({
						title: refTitleFieldLabel,
						text: strDateTime,
						type: "input",
						showCancelButton: true,
						showLoaderOnConfirm: true,
						animation: "slide-from-top"
					},
					function(inputValue){
						if (inputValue === false) return false;
						registEvent(null, start, end, (typeof start._i == 'string'), inputValue, (resource) ? resource.id : null);
					});
				};
				
				if (!activation) {
					swal({
						title: "Notice",
						text: res['noticeMessage'][lang],
						type: "warning",
						showCancelButton: true,
						closeOnConfirm: false,
						html: true
					},
					function(isConfirm){
						if (isConfirm) {
							titleInput();
						} else {
							return false;
						}
					});
				} else {
					titleInput();
				}
			},
			eventMouseover: function(event, jsEvent, view) {
				$(this).prop('title', event.title);
			},
			eventMouseout: function(event, jsEvent, view) {
				$(this).removeProp('title');
			},
			eventAfterAllRender: function(view) {
				/*
				if (view.type == 'month') {
					$('#calendarPlus').fullCalendar('option', 'height', '');
					$('#calendarPlus').fullCalendar('option', 'contentHeight', '');
				} else {
					$('#calendarPlus').fullCalendar('option', 'height', 'auto');
					$('#calendarPlus').fullCalendar('option', 'contentHeight', 'auto');
				}
				*/
				//$('.fc-title').css('font-size', '1.2em');
				//$('#calendarPlus .fc-toolbar h2').css({fontSize: "16pt", fontWeight: "bold"});

				var schedulerViewTypes = ["timelineMonth", "timelineWeek", "timelineDay"];
				if (schedulerViewTypes.indexOf(view.type) != -1 || (view.type === 'agendaDay' && enableSchedulerOpt && enableVerticalResourceView)) {
					if (!schedulerActivation) {
						swal({
							title: "Information",
							text: res['schedulerNoticeMessage'][lang],
							type: "info",
							html: true
						});
					}
				}
			},
			eventRender: function(event, element, view) {
				var viewType = view.type;
				if (viewType == 'month' || viewType == 'timelineMonth' || viewType == 'timelineWeek' || viewType == 'timelineDay') {
					element.find('.fc-time').after($('<br>'));
				}
			},
			viewRender: function(view, element) {
				var viewType = view.type;

				/*
				if (enableSchedulerOpt && enableVerticalResourceView) {
					var cur_groupByDateAndResource = $('#calendarPlus').fullCalendar('option', 'groupByDateAndResource');
					var groupByDateAndResource = (view.name === 'agendaDay') ? true : false;
					if (cur_groupByDateAndResource !== groupByDateAndResource) {
						$('#calendarPlus').fullCalendar('option', 'groupByDateAndResource', groupByDateAndResource);
					}
				}
				*/

				// 週表示のタイトル調整
				if (viewType == 'timelineWeek' || viewType == 'agendaWeek') {
					var start = view.start;
					var end = start.clone().add(1, 'weeks').add(-1, 'days');
					var startDate = start.format('YYYY/M/D [(]dd[)]');
					var endDate = end.format('YYYY/M/D [(]dd[)]');
					$('.fc-toolbar .fc-center').empty();
					$('.fc-toolbar .fc-center').append($('<h2>').text(startDate + "～ " + endDate));
				}

				// 日表示のタイトル調整
				if (viewType == 'timelineDay' || viewType == 'agendaDay') {
					var start = view.start;
					var dow = start.format('dd');
					var defaultText = $('.fc-toolbar .fc-center h2').text();
					$('.fc-toolbar .fc-center').empty();
					$('.fc-toolbar .fc-center').append($('<h2>').text(defaultText + '(' + dow + ')'));
				}

				// 日表示（リソース別）で当日の背景がクリーム色にならない問題の対処
				if (viewType == 'timelineDay') {
					if (view.start.format() == moment().format('YYYY-MM-DD')) {
						$('.fc-body .fc-time-area').addClass('fc-today');
					} else {
						$('.fc-body .fc-time-area').removeClass('fc-today');
					}
				}

				// 週表示（リソース別）で横スクロールバーが表示される問題の対処
				if (viewType == 'timelineWeek') {
					$('.fc-body .fc-scroller').css({
						'overflow-x': 'hidden'
					});
				}

				// 本人スケジュールの下線処理
				if (refResourceFieldType === 'USER_SELECT' && resourceGroupCode === 'CALENDARPLUS_RESOURCE_ORGANIZATION') {
					if (viewType == 'timelineMonth' || viewType == 'timelineWeek' || viewType == 'timelineDay') {
						$('[data-resource-id="' + loginUser.code + '"]').css({
							'border-bottom': '3px solid gray'
						});
					}
					if (enableSchedulerOpt && enableVerticalResourceView && viewType == 'agendaDay') {
						$('[data-resource-id="' + loginUser.code + '"]').css({
							'border-right': '3px solid gray'
						});
					}
				}

				// 組織・グループ選択要素表示
				if (viewType == 'timelineMonth' || viewType == 'timelineWeek' || viewType == 'timelineDay' || (enableSchedulerOpt && enableVerticalResourceView && viewType == 'agendaDay')) {
					if (refResourceFieldType === 'USER_SELECT') {
						if (resourceGroupCode === 'CALENDARPLUS_RESOURCE_ORGANIZATION') {
							if ($('#organizationSelectBtn').length == 0) {
								$('.fc-toolbar').append(
									$('<div id="organizationSelectBtnElm">').append(
										$('<button id="organizationSelectBtn">').text(selectedNodeName).addClass('kintoneplugin-button-normal').css({
											'height': '30px',
											'line-height': 'normal',
											'z-index': 5
										})
									)
								);
								$('#organizationSelectBtn').on('click', function(){
									showOrganizetionSelectMenu();
								});
							}
						} else {
							if ($('#groupSelectDropdown').length == 0) {
								$('.fc-toolbar').append(
									$('<div id="groupSelectDropdownElm">').append(
										$('<div class="kintoneplugin-select-outer">').append(
											$('<div class="kintoneplugin-select">').append(
												$('<select id="groupSelectDropdown">').css({
													'height': '30px',
													'z-index': 5
												})
											).css({
												'height': '30px',
											})
										)
									).css({
										'margin-bottom': '30px'
									})
								);

								groups.forEach(function(group) {
									$('#groupSelectDropdown').append($('<OPTION>').html(group.name).val(group.code));
								});

								if (selectedNodeCode){
									$('#groupSelectDropdown').val(selectedNodeCode);
								}

								$('#groupSelectDropdown').on('change', function(){
									selectedNodeCode = $('#groupSelectDropdown').val();
									resources = [];
									getGroupUserResource(0, function() {
										initCalendarPlus(new Date());
									});
								});
							}
						}
					}
				} else {
					$('#organizationSelectBtnElm').remove();
					$('#groupSelectDropdownElm').remove();
				}


				// ヘッダー部分の固定対応
				var viewHeader, viewHeaderAllDayForAgendaDay;
				if (viewType == 'month') {
					viewHeader = $('.fc-head .fc-head-container');
				} else if (viewType == 'agendaDay' || viewType == 'agendaWeek') {
					viewHeader = $('.fc-head .fc-head-container');
					viewHeaderAllDayForAgendaDay = $('.fc-body .fc-day-grid');
				} else if (viewType == 'timelineMonth' || viewType == 'timelineWeek' || viewType == 'timelineDay') {
					viewHeader = $('.fc-head .fc-time-area');
				}

				var viewHeaderTop = viewHeader.offset().top;
				$(window).resize(function() {
					viewHeaderTop = viewHeader.offset().top;
					$(window).trigger('scroll');
				});
				$(window).scroll(function () {
					var winTop = $(this).scrollTop() + 47;
					var newTop = (winTop - viewHeaderTop) + 'px';
					if (winTop >= viewHeaderTop) {
						viewHeader.addClass('fixed').css('top', newTop);
						viewHeader.children('.fc-scroller-clip').css({'border-top': '1px solid #ddd', 'border-bottom': '1px solid #ddd'});
						viewHeader.children('.fc-row').css({'border-top': '1px solid #ddd', 'border-bottom': '1px solid #ddd'});
						if (viewHeaderAllDayForAgendaDay) {
							viewHeaderAllDayForAgendaDay.addClass('fixedAllDayForAgendaDay').css('top', newTop);
						}
					} else if (winTop <= viewHeaderTop) {
						viewHeader.removeClass('fixed').css('top', '');
						viewHeader.children('.fc-scroller-clip').css('border', '');
						viewHeader.children('.fc-row').css({'border-top': '', 'border-bottom': ''});
						if (viewHeaderAllDayForAgendaDay) {
							viewHeaderAllDayForAgendaDay.removeClass('fixedAllDayForAgendaDay').css('top', '');
						}
						viewHeaderTop = viewHeader.offset().top;
					}
				});

				// セッションストレージ保存
				storage.setItem('view', view.name);
				storage.setItem('date', view.intervalStart.format());
				storage.setItem('viewId', viewId);
				if (selectedNodeCode) {
					storage.setItem('calendarPlus_selectedNodeCode', selectedNodeCode);
					storage.setItem('calendarPlus_selectedNodeName', selectedNodeName);
				}
			},
		});
		$('#calendarPlus').css({padding: "0px 4px 4px"});
		$('#calendarPlus .fc-toolbar h2').css({fontSize: "16pt", fontWeight: "bold"});

		// 外部JSから参照可能にする
		window.kintonePlugin = {};
		window.kintonePlugin.calendarPlus = $('#calendarPlus').fullCalendar('getCalendar');

	}

})(jQuery, kintone.$PLUGIN_ID);



