(function(){
"use strict";

	//「ロット管理」アプリのアプリID
	var syohin_AppId = 21;

	// -----------------------------------------------------------
    // 【イベント】追加または編集画面が表示された時
	// 【処理】商品ロットCを編集不可とする。
    // -----------------------------------------------------------
	var eventsList = [
		'app.record.edit.show',
		'app.record.create.show'
		];
		
	kintone.events.on(eventsList, function (event) {

		//ユーザー編集不可項目（disable）とする
		event.record['商品ロットC']['disabled'] = true;
		return event;
    
    }); //api

})();