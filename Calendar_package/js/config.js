/*
kintoneプラグイン カレンダーPlus
kintoneに素敵なカレンダー機能をプラスするプラグイン（設定画面用JS）

■依存ライブラリ
https://js.cybozu.com/jquery/2.1.4/jquery.min.js

css/51-jp-default.css
css/config.css

Ver.1 2015/9/26 Radical Bridge
Ver.2 2015/12/25 Radical Bridge
Ver.2.1 2016/2/3 Radical Bridge
Ver.3.0 2016/6/5 Radical Bridge
Ver.4.0 2016/8/31 Radical Bridge
Ver.5.0 2017/9/15 Radical Bridge
*/

jQuery.noConflict();

(function($, PLUGIN_ID) {
	"use strict";

	var dev = false;
	
	////// プラグインIDの設定
	var KEY = PLUGIN_ID;
	var conf = kintone.plugin.app.getConfig(KEY);

	////// グローバル変数
	var appId = kintone.app.getId();
	var storage = sessionStorage;
	var activationUrl = (!dev) ? 'https://crwzq7pxf9.execute-api.ap-northeast-1.amazonaws.com/'
								: 'https://napsesq9y9.execute-api.ap-northeast-1.amazonaws.com/';

	//// フォーム設計情報一時保管変数
	var form;
	var fieldInfo = {};
	var langs = ["ja", "en", "zh"];
	var colors = ["green", "blue", "red", "gray", "orange", "brown", "purple", "pink", "lightBlue", "yellow", "yellowGreen", "deepBlue"];
	var fields_ja, fields_en, fields_zh;

	////// 定数
	//// 選択可能なフィールドタイプ
	var fieldObj = {
		"activationKey": [],
//		"viewId": [],
		"defaultViewName": [],
		"detailMode": [],
		"title": [
			'SINGLE_LINE_TEXT'
		],
		"titleForDisp": [
			'SINGLE_LINE_TEXT',
			'NUMBER',
			'CALC',
			'RADIO_BUTTON',
			'DROP_DOWN'
		],
		"startDateTime": [
			'DATETIME'
		],
		"endDateTime": [
			'DATETIME'
		],
		"allDay": [
			'CHECK_BOX'
		],
		"allDayFieldValue": [],
		"privateSetting": [
			'RADIO_BUTTON',
			'DROP_DOWN'
		],
		"minTime": [],
		"maxTime": [],
		"firstDay": [],
		"dow": [],
		"allowOverlap": [],
		"allowEditable": [],
		"privateSettingFieldValue": [],
		"bgColor": [
			'RADIO_BUTTON',
			'DROP_DOWN'
		],
		"slotDurationForTime": [],
		"schedulerOpt": [],
		"resource": [
			'RADIO_BUTTON',
			'DROP_DOWN',
			'USER_SELECT'
		],
		"resourceFieldType": [],
		"resourceGroupCode": [],
		"noResourceSetting": [],
		"verticalResourceView": []
	};
	for (var i = 0; i < langs.length; i++) {
		fieldObj["titleFieldLabel_" + langs[i]] = [];
		fieldObj["allDayFieldValue_" + langs[i]] = [];
		fieldObj["privateSettingFieldValue_" + langs[i]] = [];
		fieldObj["USER_SELECT_resourceLabel_" + langs[i]] = [];
		for (var j = 0; j < colors.length; j++) {
			fieldObj["bgColor_" + colors[j]] = [];
			fieldObj["bgColor_" + colors[j] + "_" + langs[i]] = [];
		}
	}

	var requiredFieldArray = [
//		"viewId",
		"defaultViewName",
		"detailMode",
		"title",
		"titleForDisp",
		"startDateTime",
		"endDateTime",
		"allDay",
		"allDayFieldValue",
		"minTime",
		"maxTime",
		"allowOverlap",
		"allowEditable",
		"slotDurationForTime"
	];

	var fieldName = {
		"defaultViewName": "既定のカレンダー表示形式",
		"detailMode": "予定クリック時の動作",
		"title": "タイトルの登録先フィールド",
		"titleForDisp": "表示用タイトルのフィールド",
		"startDateTime": "開始日時のフィールド",
		"endDateTime": "終了日時のフィールド",
		"allDay": "終日指定のフィールド",
		"allDayFieldValue": "[終日]を表す値",
		"minTime": "表示開始時刻",
		"maxTime": "表示終了時刻",
		"allowOverlap": "予定の重複禁止設定",
		"allowEditable": "ドラッグ操作の許可・禁止設定",
		"slotDurationForTime": "時刻間隔"
	};

	var timelineViews = [
		{
			"view": "timelineMonth",
			"name": "月別表示（リソース別）"
		},
		{
			"view": "timelineWeek",
			"name": "週別表示（リソース別）"
		},
		{
			"view": "timelineDay",
			"name": "日別表示（リソース別）"
		}
	];

	// タイトルの登録先フィールドのラベル、終日の値、非公開の値、ユーザー選択フィールドのラベル、各色の値を格納する要素
	for (var i = 0; i < langs.length; i++) {
		$(document.body).append($("<input>", {id: "titleFieldLabel_" + langs[i], style: "display: none"}));
		$(document.body).append($("<input>", {id: "allDayFieldValue_" + langs[i], style: "display: none"}));
		$(document.body).append($("<input>", {id: "privateSettingFieldValue_" + langs[i], style: "display: none"}));
		$(document.body).append($("<input>", {id: "USER_SELECT_resourceLabel_" + langs[i], style: "display: none"}));
		for (var j = 0; j < colors.length; j++) {
			$(document.body).append($("<input>", {id: "bgColor_" + colors[j] + "_" + langs[i], style: "display: none"}));
		}
	}
	// リソースとして利用するフィールドのフィールドタイプを格納する要素
	$(document.body).append($("<input>", {id: "resourceFieldType", style: "display: none"}));


	// リソース別スケジュールオプション関連設定項目を非表示
	$('#resource_block').hide();
	$('#resourceGroupCode_block').hide();
	$('#noResourceSetting_block').hide();
	$('#verticalResourceView_block').hide();


	// フォームの設定の取得（各言語ごと）
	var langs_tmp = langs.concat();
	getFormSetting(langs_tmp);
	function getFormSetting(langs_tmp) {
		if (langs_tmp.length != 0) {
			var lang = langs_tmp.shift();
			kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {'app': kintone.app.getId(), 'lang': lang}, function(resp) {
				eval('fields_' + lang + ' = resp;');
				getFormSetting(langs_tmp);
			});
		} else {
			configInit();
		}
	}


	////// 設定画面生成
	var configInit = function () {
		kintone.api(kintone.api.url('/k/v1/preview/form', true), 'GET', {'app': kintone.app.getId()}, function(resp) {

			// フォーム設計情報を一時保管
			form = resp;
	
			// フィールドコードのドロップダウン値を生成
			for (var p = 0; p < resp.properties.length; p++) {
				var prop = resp.properties[p];
				for (var key in fieldObj) {
					if ($.inArray(prop['type'], fieldObj[key]) >= 0) {
						$('#' + key).append($('<OPTION>').html(prop['label']).val(prop['code']));
					}
				}
				// フィールドのラベルとタイプを格納
				if (prop['code']) {
					fieldInfo[prop['code']] = {
						"label": prop['label'],
						"type": prop['type']
					};
				}
			}


			// 既定のカレンダー表示形式の選択肢追加
			if (conf && conf['schedulerOpt']) {
				for (var i = 0; i < timelineViews.length; i++) {
					var timelineView = timelineViews[i];
					$('#defaultViewName').append($('<OPTION>').html(timelineView.name).val(timelineView.view));
				}
			}

	
			// 既に値が設定されている場合はフィールドに値を設定する
			if (conf){
				for (var key in fieldObj) {
					if (key === 'dow') {
						if (conf['dow']) {
							var dowArray = conf['dow'].split(',');
							for (var i = 0; i < 7; i++) {
								$('#dow-' + i).prop('checked', (dowArray.indexOf(i.toString()) !== -1));
							}
						}
					} else if (key === 'schedulerOpt') {
						if (conf['schedulerOpt']) {
							$('#schedulerOpt').prop('checked', (conf['schedulerOpt'] === 'enableSchedulerOpt')).change();
						}
					} else if (key === 'noResourceSetting') {
						if (conf['noResourceSetting']) {
							$('#noResourceSetting').prop('checked', (conf['noResourceSetting'] === 'hideNoResource')).change();
						}
					} else if (key === 'verticalResourceView') {
						if (conf['verticalResourceView']) {
							$('#verticalResourceView').prop('checked', (conf['verticalResourceView'] === 'enableVerticalResourceView')).change();
						}
					} else {
						if (conf[key]) {
							$('#' + key).val(conf[key]).change();
						}
					}
				}
				// タイトルの登録先フィールドの各国語のラベルを格納
				setLocalLabel($('#title'), 'titleFieldLabel');
			}
	
			// 終日を表す値のドロップダウン値を生成＆既に値が設定されている場合は値を設定
			generateValueOptions($('#allDay'), $('#allDayFieldValue'), false);
			if (conf['allDayFieldValue']){
				$('#allDayFieldValue').val(conf['allDayFieldValue']);
			}
	
			// 非公開を表す値のドロップダウン値を生成＆既に値が設定されている場合は値を設定
			generateValueOptions($('#privateSetting'), $('#privateSettingFieldValue'), false);
			if (conf['privateSettingFieldValue']){
				$('#privateSettingFieldValue').val(conf['privateSettingFieldValue']);
			}
	
			// 各色を表す値のドロップダウン値を生成＆既に値が設定されている場合は値を設定
			for (var i = 0; i < colors.length; i++) {
				generateValueOptions($('#bgColor'), $('#bgColor_' + colors[i]), true);
				if (conf['bgColor_' + colors[i]]){
					$('#bgColor_' + colors[i]).val(conf['bgColor_' + colors[i]]);
				}
			}
	
			// グループのドロップダウン値を生成＆既に値が設定されている場合は値を設定
			kintone.api(kintone.api.url('/v1/groups', true), 'GET', {}, function(resp) {
				for (var g = 0; g < resp.groups.length; g++) {
					var group = resp.groups[g];
					$('#resourceGroupCode').append($('<OPTION>').html(group.name).val(group.code));
				}
				if (conf['resourceGroupCode']){
					$('#resourceGroupCode').val(conf['resourceGroupCode']);
				}
			});
	
		});
	};

	////// タイトルの登録先フィールド選択時に各国語のラベルを格納
	$('#title').change(function() {
		// 各国語の値に置換
		setLocalLabel($('#title'), 'titleFieldLabel');
	});

	////// 各国語の値に置換して格納する関数（ラベル用）
	function setLocalLabel(srcElm, dstElmId) {
		for (var l = 0; l < langs.length; l++) {
			var lang = langs[l];
			if (srcElm.val()) {
				var resp = eval('fields_' + lang);
				var label = resp.properties[srcElm.val()].label;
				$('#' + dstElmId + '_' + lang).val(label);
			} else {
				$('#' + dstElmId + '_' + lang).val('');
			}	
		}
	}

	////// リソースとして利用するフィールド選択時にそのフィールドタイプを格納
	$('#resource').change(function() {
		$('#resourceFieldType').val(($(this).val()) ? fieldInfo[$(this).val()]['type'] : '');
		// 各国語の値に置換
		setLocalLabel($('#resource'), 'USER_SELECT_resourceLabel');
	});


	////// 終日フィールド選択時に終日を表す値のドロップダウン値を生成
	$('#allDay').change(function() {
		generateValueOptions(this, $('#allDayFieldValue'), false);
		// 各国語の値に置換
		setLocalValue($('#allDay'), 'allDayFieldValue', false);
	});

	$('#allDayFieldValue').change(function() {
		// 各国語の値に置換
		setLocalValue($('#allDay'), 'allDayFieldValue', false);
	});


	////// 共有設定フィールド選択時に非公開を表す値のドロップダウン値を生成
	$('#privateSetting').change(function() {
		generateValueOptions(this, $('#privateSettingFieldValue'), false);
		// 各国語の値に置換
		setLocalValue($('#privateSetting'), 'privateSettingFieldValue', false);
	});

	$('#privateSettingFieldValue').change(function() {
		// 各国語の値に置換
		setLocalValue($('#privateSetting'), 'privateSettingFieldValue', false);
	});


	////// 色フィールド選択時に各色を表す値のドロップダウン値を生成
	$('#bgColor').change(function() {

		for (var i = 0; i < colors.length; i++) {
			generateValueOptions(this, $('#bgColor_' + colors[i]), true);
			// 各国語の値に置換
			setLocalValue($('#bgColor'), 'bgColor_' + colors[i], true);
		}
	});

	for (var i = 0; i < colors.length; i++) {
		$('#bgColor_' + colors[i]).change(function() {
			// 各国語の値に置換
			setLocalValue($('#bgColor'), this.id, true);
		});
	}


	////// 値のドロップダウン値生成関数
	function generateValueOptions(srcElm, dstElm, unset) {
		var srcFieldCode = $(srcElm).val();
		dstElm.children().remove();
		if (srcFieldCode) {
			for (var p = 0; p < form.properties.length; p++) {
				var prop = form.properties[p];
				if (prop.code === srcFieldCode) {
					if (unset) {
						dstElm.append($('<OPTION>').html('---').val(''));
					}
					for (var o = 0; o < prop.options.length; o++) {
						dstElm.append($('<OPTION>').html(prop.options[o]).val(prop.options[o]));
					}
				}
			}
		}
	}

	////// 各国語の値に置換して格納する関数（選択肢用）
	function setLocalValue(srcElm, dstElmId, unset) {
		for (var l = 0; l < langs.length; l++) {
			var lang = langs[l];
			if ($('#' + dstElmId).val()) {
				var index = $('#' + dstElmId).prop('selectedIndex') - (unset * 1);
				var resp = eval('fields_' + lang);
				var options = resp.properties[srcElm.val()].options;
				for (var key in options) {
					if (options[key].index == index) {
						$('#' + dstElmId + '_' + lang).val(options[key].label);
						break;
					}
				}
			} else {
				$('#' + dstElmId + '_' + lang).val('');
			}
		}
	}

	////// リソース別スケジュールオプションの利用設定のオンオフ時の制御
	$('#schedulerOpt').change(function() {
		var checked = $(this).prop('checked');
		var speed = 300;
		if (!checked) {
			$('#resource_block').hide(speed);
			$('#noResourceSetting_block').hide(speed);
			$('#verticalResourceView_block').hide(speed);
			$('#resource').prop('selectedIndex', 0).change();
			$('#noResourceSetting').prop('checked', false);
			$('#verticalResourceView').prop('checked', false);
		} else {
			$('#resource_block').show(speed);
			$('#noResourceSetting_block').show(speed);
			$('#verticalResourceView_block').show(speed);
		}
		for (var i = 0; i < timelineViews.length; i++) {
			var timelineView = timelineViews[i];
			if (!checked) {
				$('#defaultViewName').prop('selectedIndex', 1).change();
				$('#defaultViewName option[value=' + timelineView.view + ']').remove();
			} else {
				if($('#defaultViewName option[value=' + timelineView.view + ']').size() === 0) {
					$('#defaultViewName').append($('<OPTION>').html(timelineView.name).val(timelineView.view));
				}
			}
		}
	});

	////// リソース選択時の制御
	$('#resource').change(function() {
		var isUserSelect = (($(this).val()) && (fieldInfo[$(this).val()]['type'] === 'USER_SELECT'));
		var speed = 300;
		if (!isUserSelect) {
			$('#resourceGroupCode_block').hide(speed);
			$('#resourceGroupCode').prop('selectedIndex', 0);
		} else {
			$('#resourceGroupCode_block').show(speed);
		}
	});


	////// 「保存する」ボタン押下時に入力情報を設定する
	$('#submit').click(function() {

		//// 必須項目チェック
		for (var i = 0; i < requiredFieldArray.length; i++) {
			if ($("#" + requiredFieldArray[i]).val() === '') {
				alert("必須項目が入力されていません： " + fieldName[requiredFieldArray[i]]);
				return;
			}
		}

		//// リソース別スケジュールオプションを有効にした時の必須項目チェック
		if ($('#schedulerOpt').prop('checked')) {
			if ($("#resource").val() === '') {
				alert("必須項目が入力されていません： リソースとして利用するフィールド");
				return;
			}
		}

		//// リソースとして利用するフィールドがユーザー選択の時の必須項目チェック
		if (($('#resource').val()) && (fieldInfo[$('#resource').val()]['type'] === 'USER_SELECT')) {
			if ($("#resourceGroupCode").val() === '') {
				alert("必須項目が入力されていません： リソースとして表示するグループ（ロール）");
				return;
			}
		}

		//// 開始日時のフィールドと終了日時のフィールドが同じ場合はエラー
		if ($("#startDateTime").val() === $("#endDateTime").val()) {
			alert("開始日時と終了日時は別のフィールドを選択してください");
			return;
		}

		//// アクティベーション状態のリセット
		storage.removeItem('activation_' + appId);
		storage.removeItem('view');
		storage.removeItem('calendarPlus_selectedNodeCode');
		storage.removeItem('calendarPlus_selectedNodeName');


		//// 設定情報の保存
		var config = [];
		for (var key in fieldObj) {
			if (key === 'dow') {
				var dowArray = [];
				$('[name="dow"]:checked').each(function(){
					dowArray.push($(this).val());
				});
				config[key] = dowArray.join(',')
			} else {
				var val;
				if (key === 'schedulerOpt' || key === 'verticalResourceView' || key === 'noResourceSetting') {
					val = ($("#" + key).prop('checked') ? $("#" + key).val() : '');
				} else {
					val = $("#" + key).val();
				}
				if (val) {
					config[key] = val;
				}
			}
		}

		kintone.plugin.app.setConfig(config, function(){
			kintone.plugin.app.setProxyConfig(activationUrl, 'GET', {'key': $("#activationKey").val()}, {});
		});

	});


	////// 「キャンセル」ボタン押下時の処理
	$('#cancel').click(function() {
			history.back();
	});

})(jQuery, kintone.$PLUGIN_ID);
