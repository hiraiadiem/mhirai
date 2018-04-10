/*********************************************************************
[ソースファイル名] nyuko_to_zaiko.js
[アプリ名] 入庫
[アプリURL] https://maintech.cybozu.com/k/23/

[実装機能]
　(1)入庫アプリよりステータス：入庫確定の際、
　　在庫管理アプリへデータを追加または更新する。

[アプリIDの設定] ■必要  □不要
[タイプ] ■PC用 / □スマートフォン用
[アクセス権の設定] □必要　■不要
[参照ライブラリ]
　(1)なし
 Copyright(c)　ADIEM.inc
*********************************************************************/

(function() {
	"use strict";

	//「在庫管理」アプリのアプリID
	var zaiko_AppId = 25;
	var ret;

	// -----------------------------------------------------------
    // 【イベント】ステータスを"在庫登録済み"へ変更する時
	// 【処理】仕入登録データを在庫管理アプリに登録する
    // -----------------------------------------------------------
	var eventsList = [
		'app.record.detail.process.proceed',	//プロセス管理アクション
	];

	kintone.events.on(eventsList, function (event) {
		console.log('(event)↓');
		console.log(event);

        //変更後のステータス
		var nStatus = event.nextStatus.value;
		if( nStatus ==="入庫登録済み" ){
			
			//検索文字列の作成
		
			//該当月の取得
			var strYm = event.record['入庫年月日']['value'].substr( 0, 7 );
			strYm = strYm + "-01";
		
			var searchQuery = "商品ロットC =\"" + event.record['LU商品ロットC']['value'] + "\"";
			searchQuery = searchQuery +" and 倉庫C=\"" + event.record['倉庫C']['value'] + "\"";
			searchQuery = searchQuery +" and 対象月= \"" + strYm + "\"";
		
			console.log('==========【searchQuery】==========');
			console.log(searchQuery);

			//GETリクエストパラメータ
			var GET_param = {
				'app': zaiko_AppId,	//「在庫管理」アプリのID
				'query': searchQuery,
			};

			return new kintone.Promise(function(resolve,reject){
    		    kintone.api(kintone.api.url('/k/v1/records', true), 'GET',
        			GET_param,
            		function(get_resp) {    //callback
            		//ここでデータ有無判定
            		if (get_resp.records.length > 0) {
						// レコード存在時には「PUT」する
						var existing_subtable = get_resp.records[0]['入庫subTable']['value']; // 入庫サブテーブル
						var subtable = [];			// 最終的にPUTするサブテーブル
						var appended_subtable = []; // 追加したいサブテーブル

						subtable = existing_subtable.concat();

						//入庫データを追加する配列に設定
						var appended_subtable = {
        				"value": {
            				"tb入庫更新日": {"value": event.record['入庫年月日']['value']},
							"tb入庫理由": {"value": "入庫"},
							"tb入庫数": {"value": event.record['個数']['value']},
							"tb入庫備考": {"value":""}
        				}
        				};

						// 既存と追加分のサブテーブルを結合
						subtable = subtable.concat(appended_subtable); 

						// レコード更新用オブジェクト
						var put_record = {}; 
						put_record["入庫subTable"] = {
							value: subtable
						};
						var updateBody = {
							'app': zaiko_AppId,	//在庫管理アプリの現在のID
							'id': get_resp.records[0]['$id']['value'],	//レコードのID
      						'revision':get_resp.records[0]['$revision']['value'],
      						record: put_record
						};
		
						console.log('===== (updateBody) =====');
						console.log(updateBody);

						kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', updateBody, function(put_resp){
                    	    resolve(put_resp);  //putが成功したらthenへ
                    	},function(put_error){
                        	reject(put_error);  //putのエラーはcatchへ
                    	});
					}else{
						// レコード不在時には「POST」する
						// 入庫サブテーブルのデータ設定
        				var N_subtable = {
        				"value": {
            				"tb入庫更新日": {"value": event.record['入庫年月日']['value']},
							"tb入庫理由": {"value": "入庫"},
							"tb入庫数": {"value": event.record['個数']['value']},
							"tb入庫備考": {"value":""}
        				}
        				};
        
    					// 出庫サブテーブルのデータ設定
        				var S_subtable = {"value": {"tb出庫数": {"value": '0'}}};

						// 引当サブテーブルのデータ設定
        				var H_subtable = {"value": {"tb引当数": {"value": '0'}}};

						// サブテーブルの明細は配列渡しのためレコード更新用オブジェクト
						var N_put_record = []; 
						N_put_record.push(N_subtable);
						var S_put_record = []; 
						S_put_record.push(S_subtable);
						var H_put_record = []; 
						H_put_record.push(H_subtable);

						var insertBody = {
							'app': zaiko_AppId,	//在庫管理アプリの現在のID
							'record': {
							"LU商品ロットC" : { "value": event.record['LU商品ロットC']['value'] },
							"対象月" : { "value": strYm },
							"LU倉庫C":{"value": event.record['倉庫C']['value']},
							"前月繰越" : {  "value": "0" },
							"入庫subTable":{ "value": N_put_record },
							"出庫subTable":{ "value": S_put_record },
							"引当subTable":{ "value": H_put_record }
						}
						};

						console.log('===== (insertBody) =====');
						console.log(insertBody);

						kintone.api(kintone.api.url('/k/v1/record', true), 'POST', insertBody, function(post_resp)
						{
                        	resolve(post_resp);  //postが成功したらthenへ
                    	},function(post_error){
                        	reject(post_error);  //postエラーはcatchへ
                    	});
					} //if
            	}, function(get_error) {
                	reject(get_error);   //(get)エラーはcatchへ
            	});	//function
    		}).then(function(resp){
    			alert('「在庫管理」アプリへのデータ登録に成功しました。');
        		return event;
    		}).catch(function(error){
        		event.error = '「在庫管理」アプリへのデータ登録に失敗しました。'+ error.message;
        		return event;
    		});
    
    
		}//if ステータス判定
		return event;
	}); //event

})();
