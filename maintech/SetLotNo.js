(function(){
"use strict";

	//「ロット管理」アプリのアプリID
	var syohin_AppId = 21;

	// -----------------------------------------------------------
    // 【イベント】追加または編集画面にて保存ボタンを押下された時
	// 【処理】指定された商品C+ロット番号計算用を商品ロットCへコピーする。
    // -----------------------------------------------------------
	var eventsList = [
		'app.record.create.submit',	
		'app.record.edit.submit'
		];
		
	kintone.events.on(eventsList, function (event) {

		//event.record['商品ロットC']['disabled'] = false;
		event.record['商品ロットC']['value'] =event.record['商品ロットC_計算用']['value']
		return event;
    
    }); //api

})();