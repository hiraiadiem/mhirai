/*********************************************************************
[ソースファイル名] CtrlSubTable.js
[アプリ名] 入出金管理アプリ
[アプリURL] https://porthomes.cybozu.com/k/39/

[実装機能]
  (イベント)追加詳細画面、編集詳細画面表示
　(1)通常売上サブテーブルの入力不可制御を行う。
[アプリIDの設定] ■必要  □不要
[タイプ] ■PC用 / □スマートフォン用
[アクセス権の設定] □必要　■不要
[参照ライブラリ]
　(1)なし
 Copyright(c)　ADIEM.inc
*********************************************************************/
(function() {
    "use strict";

    // 新規作成画面表示、編集画面表示
    var eventsList = [
	    'app.record.edit.show',
		'app.record.create.show'
	];

    //DOM要素上の「通常売上Table」サブテーブル配列番号	
	var tableNo =2 ; 

    kintone.events.on(eventsList, function(event) {

        //サブテーブルの追加・削除ボタンを非表示
        [].forEach.call(document.getElementsByClassName("subtable-gaia")[tableNo].getElementsByClassName("subtable-operation-gaia"), function(button){
            button.style.display = 'none';
        });

        var record = event.record['通常売上Table']['value']; 
        //通常売上Tableを編集不可とする
        for(var i=0;i<record.length;i++){
            record[i].value.tb売上管理No.disabled =true;
            record[i].value.tb売上額.disabled =true;
            record[i].value.tb個人額.disabled =true;
            record[i].value.tb店長額.disabled =true;
            record[i].value.tb会社額.disabled =true;
            record[i].value.tb売上担当.disabled =true;
        }
        
        return event;
    });

})();


