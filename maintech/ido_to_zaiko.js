/*********************************************************************
[ソースファイル名] ido_to_zaiko.js
[アプリ名] 入庫
[アプリURL] https://maintech.cybozu.com/k/46/

[実装機能]
　(1)在庫の倉庫間移動を行う。
　	　在庫管理アプリに該当データが存在しない場合は新規入庫と同様に
　	　レコードを新規作成する。
　	　該当データが存在する場合は、移動元データから指定された個数を出庫し、
　	　移動先データには入庫する。

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
    // 【イベント】新規追加の保存ボタン押下イベント
	// 【処理】移動データを在庫管理アプリに登録する
    // -----------------------------------------------------------
	var eventsList = [
		'app.record.create.submit',	//新規追加の保存ボタン押下イベント
	];

	kintone.events.on(eventsList, function (event) {
		
		
		console.log('(event)↓');
		console.log(event);
		
		var SokoCd = "";	//倉庫C格納
		var StrMethod = "";	//bulk用メソッド格納
		var OutZaiko = [];	//最終的にPUTする移動元在庫レコード
		var InZaiko = [];	//最終的にPUT/POSTする移動先在庫レコード

		//入力チェック
		if( Number(event.record['移動個数']['value']) < 1 ){
			event.error = "移動個数に１以下の数値が指定されています。"
			return event;
		}
		if( Number(event.record['有効在庫']['value']) <  Number(event.record['移動個数']['value']) ){
			event.error = "有効在庫を超える個数が指定されています。"
			return event;
		}
		if( event.record['倉庫C']['value'] === event.record['移動先倉庫C']['value'] ){
			event.error = "移動元倉庫と移動先倉庫が同一指定されていています。"
			return event;
		}

		//検索文字列の作成
		
		//処理対象の在庫管理アプリを特定するため、処理年月日を取得する
		var SystemDate = new Date();
		var strY = SystemDate.getFullYear();
		var strM = ("0"+(SystemDate.getMonth() + 1)).slice(-2);
		var strYm = strY + "-" +  strM + "-01";	//在庫アプリ検索年月
		var strYmd = strY + "-" +  strM + "-" + ("0"+SystemDate.getDate()).slice(-2);
		
		//在庫管理アプリより移動先、移動元のデータ取得クエリ生成
		var searchQuery = "商品ロットC =\"" + event.record['商品ロットC']['value'] + "\"";
			searchQuery = searchQuery +" and 倉庫C=\"" + event.record['倉庫C']['value'] + "\"";
			searchQuery = searchQuery +" and 対象月= \"" + strYm + "\"";
			searchQuery = searchQuery + " or "
			searchQuery = searchQuery + "商品ロットC =\"" + event.record['商品ロットC']['value'] + "\"";
			searchQuery = searchQuery +" and 倉庫C=\"" + event.record['移動先倉庫C']['value'] + "\"";
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
            
            	//移動元、移動先の倉庫コードが同じならエラー
				if (event.record['倉庫C']['value'] === event.record['移動先倉庫C']['value'] ){
					event.error = '移動元、移動先倉庫コードが同じ倉庫です';
					reject(get_resp);
				}			

            	//該当データが存在しなければエラー（データ矛盾）
            	if (get_resp.records.length === 0 ) {
            		event.error = "在庫管理アプリに処理対象データが存在しません。";
            		reject(get_resp);
            	}
            	
            //移動元の該当データ存在確認
	           	for (var i = 0; i < get_resp.records.length; i++) {
	           		SokoCd=event.record['倉庫C']['value'];
            		if(event.record['倉庫C']['value'] === get_resp.records[i]['倉庫C']['value']){
            			
            			SokoCd=""; //一致したのでクリア
            			
            			//移動元在庫管理アプリの更新用配列作成
						var existing_subtable = get_resp.records[i]['出庫subTable']['value']; // 出庫サブテーブル
						var subtable = [];			// 最終的にPUTするサブテーブル
						var appended_subtable = []; // 追加したいサブテーブル

						subtable = existing_subtable.concat();
						//出庫データを追加する配列に設定
						var appended_subtable = {
        				"value": {
            				"tb出庫更新日": {"value": strYmd},
							"tb出庫理由": {"value": "出庫"},
							"tb出庫数": {"value": event.record['移動個数']['value']},
							"tb出庫備考": {"value":"倉庫移動先：" +　event.record['移動先倉庫名']['value']}
        					}
        				};

						// 既存と追加分のサブテーブルを結合
						subtable = subtable.concat(appended_subtable); 

						// レコード更新用オブジェクト
						var putOut_record = {}; 
						putOut_record["出庫subTable"] = {
							value: subtable
						};
						var StrOutId = get_resp.records[i]['$id']['value'];
						var StrOutRiv = get_resp.records[i]['$revision']['value']
						
						break; //for抜け

            		} //if
            	} //for
				if( SokoCd ){　//SokoCd(""でない)だったらエラー
					event.error= '在庫管理アプリに移動元倉庫コード：'+ SokoCd+'が存在しません。'
					reject(get_resp);
				}

            	//移動先倉庫の該当データ存在判定
            	//あればPUT用配列、無ければPOST用配列を作成する
            	for (var i = 0; i < get_resp.records.length; i++) {
					SokoCd=event.record['移動先倉庫C']['value'];
            		if(event.record['移動先倉庫C']['value'] === get_resp.records[i]['倉庫C']['value']){
            			SokoCd=""; //一致
            			
            			//在庫アプリにデータありのため　【PUT】　用配列を生成する
						var existing_subtable = get_resp.records[i]['入庫subTable']['value']; // 入庫サブテーブル
						var subtable = [];			// 最終的にPUTするサブテーブル
						var appended_subtable = []; // 追加したいサブテーブル

						subtable = existing_subtable.concat();

						//入庫データを追加する配列に設定
						var appended_subtable = {
        					"value": {
            				"tb入庫更新日": {"value": strYmd},
							"tb入庫理由": {"value": "入庫"},
							"tb入庫数": {"value": event.record['移動個数']['value']},
							"tb入庫備考": {"value":"倉庫移動元：" +　event.record['倉庫名']['value']}
        					}
        				};

						// 既存と追加分のサブテーブルを結合
						subtable = subtable.concat(appended_subtable); 

						// レコード更新用オブジェクト
						var putIn_record = {}; 
						putIn_record["入庫subTable"] = {
							value: subtable
						};
						
						var updateBodyIn = {
      						record: putIn_record
						};
		
						console.log('===== (updateBodyIn) =====');
						console.log(updateBodyIn);
						var StrInId = get_resp.records[i]['$id']['value'];
						var StrInRiv = get_resp.records[i]['$revision']['value']
						StrMethod = "PUT"; //メソッド名設定
						break; //for抜け
            		} //if
            	} //for
            	
				if( SokoCd ){　
					//在庫アプリにデータなしのため　【POST】　用配列を作成する
        			var N_subtable = {
        				"value": {
            				"tb入庫更新日": {"value": strYmd},
							"tb入庫理由": {"value": "入庫"},
							"tb入庫数": {"value": event.record['移動個数']['value']},
							"tb入庫備考": {"value":"倉庫移動元：" +　event.record['倉庫名']['value']}
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

					var putIn_record = {
						"LU商品ロットC" : { "value": event.record['商品ロットC']['value'] },
						"対象月" : { "value": strYm },
						"LU倉庫C":{"value": event.record['移動先倉庫C']['value']},
						"前月繰越" : {  "value": "0" },
						"入庫subTable":{ "value": N_put_record },
						"出庫subTable":{ "value": S_put_record },
						"引当subTable":{ "value": H_put_record }
					};
					StrMethod = "POST"; //メソッド名設定
				}　//if
	

				//bulkAPIを利用して２アプリに一括更新
				var body = {
				"requests": [
					{
						"method": "PUT",
						"api": "/k/v1/record.json",
						"payload": {
							"app": zaiko_AppId,
							'id': StrOutId,
      						'revision':StrOutRiv,
							"record":putOut_record
						}
					},
					{
						"method": StrMethod,
						"api": "/k/v1/record.json",
						"payload": {
							"app":zaiko_AppId,
							'id': StrInId,
      						'revision':StrInRiv,
							"record":putIn_record
						}
					}
				]
				}
				
				console.log('===== blukのbody  =====');
				console.log(body);
				
				kintone.api(kintone.api.url('/k/v1/bulkRequest', true), 'POST', body, function(bulkRequest_resp){
					resolve(bulkRequest_resp);  //postが成功したらthenへ
                },function(bulkRequest_error){
                    reject(bulkRequest_error);  //postエラーはcatchへ
                });
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
		return event;
	}); //event

})();
