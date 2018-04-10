(function(){
"use strict";

	//「入出金管理」アプリのアプリID
	var syohin_AppId = 39;

	// -----------------------------------------------------------
    // 【イベント】LU物件名が変更された時
	// 【処理】LU物件名をフィールド物件名にコピーする
    // -----------------------------------------------------------
	//LU物件名が変更されたら
	var eventsList = [
		'app.record.edit.change.LU物件名',	
		'app.record.create.change.LU物件名'
		];
		
	kintone.events.on(eventsList, function (event) {

		//物件名をコピー
		event.record['物件名']['value']= event.record['LU物件名']['value']
        return event;
    
    }); //api

})();