(function(){
"use strict";

	//「商品管理」アプリのアプリID
	var syohin_AppId = 20;

	// -----------------------------------------------------------
    // 【イベント】受注サブテーブルの「数量」を変更された時
	// 【処理】商品マスタより商品C＋（サブテーブル）顧客Cに該当する売価を取得する
    // -----------------------------------------------------------
	//tb数量が変更されたら
	var eventsList = [
		'app.record.edit.change.tb数量',	
		'app.record.create.change.tb数量'
		];
		
    var searchQuery ="";
    var chgCd = "";

	kintone.events.on(eventsList, function (event) {

        var changes = event.changes;
        // 数量が入力されている時
        if(changes['row'].value['tb数量'].value){
            
            //検索文字列の作成
			searchQuery =　"商品C =\"" +　changes['row'].value['tb商品C'].value　+ "\"";
			
			//変更された行を特定するために商品ロットCを退避
			chgCd = changes['row'].value['tb商品ロットC'].value;  

			//GETリクエストパラメータ
			var GET_param = {
				'app': syohin_AppId,	//「在庫管理」アプリのID
				'query': searchQuery,
			};

			//「商品マスタ」アプリにレコードの有無を確認
			//return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', GET_param).then(
			kintone.api(kintone.api.url('/k/v1/records', true), 'GET', GET_param).then(
				//GET成功時（応答が返ってきた時）の処理
				function(resp) {
					console.log('resp.records.length = ' +resp.records.length);

					//商品マスタのTable顧客別売価から顧客Cを検索し、該当すれば売価を取得する
					if (resp.records.length > 0) {
    					var subtable = resp.records[0]['Table顧客別売価']['value']; // Table顧客別売価
					    for (var i = 0; i < subtable.length; i++) {
					        if( subtable[i].value['tb顧客C'].value  === event.record['顧客C']['value']){
					            changes['row'].value['tb売価単価'].value = subtable[i].value['tb売価単価'].value ;
					            
					            //編集中のデータ取得
					            var rec = kintone.app.record.get();
					            var record = rec.record;
					            
					            //changesイベントはpromiseをサポートしておらず、return event;が反映されない。
					            //その為、record.getし、該当項目を更新し、record.setしなくてはならない。
					            //変更した数量と同一商品ロットCの売価単価に商品マスタの顧客別売価を設定

								//--修正前↓--　idは保存されないとnullのままであり、変更行を判断不能のため
					            //変更した数量と同一idの売価単価に商品マスタの顧客別売価を設定
					            
					            for( var r= 0; r < record['Table受注'].value.length ; r++){
					                //if( record['Table受注'].value[r].id === changes['row'].id ){ //修正前　2018.03.28 update
					                if( record['Table受注'].value[r].value['tb商品ロットC'].value === chgCd){
					                    record['Table受注'].value[r].value['tb売価単価'].value= subtable[i].value['tb売価単価'].value; 
					                    kintone.app.record.set(rec);
					                }
					            }
					            return event;
                            }
		                } //for
                    	// レコード不在の旨のメッセージ出力
						event.error =  '商品マスタに商品データが存在しません。マスタ情報を確認してください。。';
		                alert("商品マスタに顧客別売価データが存在しません。マスタ情報を確認してください。");
		                return event;
					} else {
						// レコード不在の旨のメッセージ出力
						event.error =  '商品マスタに商品データが存在しません。マスタ情報を確認してください。。';
						alert("商品マスタに商品データが存在しません。マスタ情報を確認してください。");
						return event;
					} //if
				},
				//GET失敗時（応答が帰ってこなかった時）の処理
				function(resp) {
					alert('「商品マスタ」アプリへのレコード有無の確認に失敗しました（GET）');
					console.log(resp.message);
					event.error =  '「商品マスタ」アプリへのレコード有無の確認に失敗しました（GET）';
					return event;
    			}
			);
        }
        
        // tb数量が未定義になった場合
        if(!changes['row'].value['tb数量'].value){
            changes['row'].value['tb売価単価'].value = null;
            //alert('数量を設定してください');
            event.error =  '数量を設定してください'
        }
        return event;
    
    }); //api

})();