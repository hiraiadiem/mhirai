/*********************************************************************
[ソースファイル名] uriage_to_nyusyukkin.js
[アプリ名] 売上管理アプリ
[アプリURL] https://porthomes.cybozu.com/k/40/

[実装機能]
　(1)売上管理アプリに新規追加または変更時
　　入出金管理アプリへデータを追加または更新する。
    ※ただし、入金有無「有」の場合のみとする。
[アプリIDの設定] ■必要  □不要
[タイプ] ■PC用 / □スマートフォン用
[アクセス権の設定] □必要　■不要
[参照ライブラリ]
　(1)なし
 Copyright(c)　ADIEM.inc
*********************************************************************/

(function() {
	"use strict";
	
	//「入出金管理」アプリのアプリID
	var nyusyukkin_AppId = 39;
	var ret;
	
	// -----------------------------------------------------------
    // 【イベント】レコード編集保存前イベント
	// 【処理】売上データを入出金管理ｱﾌﾟﾘのサブテーブルに更新
	// -----------------------------------------------------------
	kintone.events.on('app.record.edit.submit', function (event) {
		console.log('(event)↓');
		console.log(event);
		
		//データ追加or更新判定用
		var add_flg = true ;
		
		//入金有無
		var nyukin_status =  event.record['入金有無']['value'] 
		//入金有無「有」でなければ、処理終了
		if( nyukin_status != "有"){
			return event;
		}

		//検索文字列の作成　入金NO=（入出金管理アプリ）レコード番号
		var searchQuery = "レコード番号 =\"" + event.record['入金No']['value'] + "\"";
		//searchQuery = searchQuery +" and 倉庫C=\"" + event.record['倉庫C']['value'] + "\"";
		//searchQuery = searchQuery +" and 対象月= \"" + strYm + "\"";

		console.log('==========【searchQuery】==========');
		console.log(searchQuery);

		//GETリクエストパラメータ
		var GET_param = {
			'app': nyusyukkin_AppId,	//「入出金管理」アプリのID
			'query': searchQuery,
		};
		
		return new kintone.Promise(function(resolve,reject){
    		kintone.api(kintone.api.url('/k/v1/records', true), 'GET',GET_param,
            function(get_resp) {    //callback
            
            	//入出金管理アプリに該当データが存在しない
				if (get_resp.records.length <= 0) {
					alert("「入出金管理」アプリに該当データが存在しません。");
					return event;
				}
				// レコード存在時には「PUT」する
				var existing_subtable = get_resp.records[0]['通常売上Table']['value']; // 通常売上サブテーブル
				var subtable = [];			// 最終的にPUTするサブテーブル
				var appended_subtable = []; // 追加したいサブテーブル
					
				// 通常売上サブテーブルの先頭配列が空データの場合、先頭配列を削除
				if(existing_subtable[0].value['tb売上管理No'].value===""){
					existing_subtable.shift() ;
				}

				//通常売上サブテーブル内に売上管理にて更新したい売上管理NOが存在するか
				for( var r= 0; r < existing_subtable .length ; r++){
					if( existing_subtable[r].value['tb売上管理No'].value  === event.record['売上管理No']['value'] ){
						//売上管理Noが一致したら、金額を更新
						existing_subtable[r].value['tb売上額'].value　= event.record['売上額税込']['value'];
						existing_subtable[r].value['tb個人額'].value　= event.record['個人税込']['value'];
						existing_subtable[r].value['tb店長額'].value　= event.record['店長']['value'];
						existing_subtable[r].value['tb会社額'].value　= event.record['会社']['value'];
						existing_subtable[r].value['tb売上担当'].value　= event.record['売上担当']['value'];
						add_flg = false;
						break;
				    }
				}

				//　既存分データをサブテーブル用配列に設定
				subtable = existing_subtable.concat();　

				//売上管理NOが不一致の場合、配列に追加
				if( add_flg === true ){
					var appended_subtable = {
        				"value": {
        					"tb売上管理No": {"value": event.record['売上管理No']['value']},
            				"tb売上額": {"value": event.record['売上額税込']['value']},
							"tb個人額": {"value": event.record['個人税込']['value']},
							"tb店長額": {"value": event.record['店長']['value']},
							"tb会社額": {"value": event.record['会社']['value']},
							"tb売上担当": {"value": event.record['売上担当']['value']}
        				}
        			};
					// 追加分データをサブテーブルに結合
					subtable = subtable.concat(appended_subtable);	//新規
				}//if

				// レコード更新用オブジェクト
				var put_record = {}; 
				put_record["通常売上Table"] = {
					value: subtable
				};
				var updateBody = {
					'app': nyusyukkin_AppId,	//入出金管理アプリの現在のID
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
            }, function(get_error) {
                reject(get_error);   //(get)エラーはcatchへ
            });	//function
    	}).then(function(resp){ //Promise
    		alert('「入出金管理」アプリへのデータ更新に成功しました。');
        	return event;
    	}).catch(function(error){
        	event.error = '「入出金管理」アプリへのデータ更新に失敗しました。'+ error.message;
        	return event;
    	});
    		
		return event;
	}); //event

	// -----------------------------------------------------------
    // 【イベント】レコード追加保存前イベント
	// 【処理】売上データを入出金管理ｱﾌﾟﾘのサブテーブルに追加
	// -----------------------------------------------------------
	kintone.events.on('app.record.create.submit', function (event) {
		console.log('(event)↓');
		console.log(event);
		
		//データ追加or更新判定用
		var add_flg = true ;
		
		//入金有無
		var nyukin_status =  event.record['入金有無']['value'] 
		//入金有無「有」でなければ、処理終了
		if( nyukin_status != "有"){
			return event;
		}

		//検索文字列の作成　入金NO=（入出金管理アプリ）レコード番号
		var searchQuery = "レコード番号 =\"" + event.record['入金No']['value'] + "\"";
		//searchQuery = searchQuery +" and 倉庫C=\"" + event.record['倉庫C']['value'] + "\"";
		//searchQuery = searchQuery +" and 対象月= \"" + strYm + "\"";

		console.log('==========【searchQuery】==========');
		console.log(searchQuery);

		//GETリクエストパラメータ
		var GET_param = {
			'app': nyusyukkin_AppId,	//「入出金管理」アプリのID
			'query': searchQuery,
		};
		
		return new kintone.Promise(function(resolve,reject){
    		kintone.api(kintone.api.url('/k/v1/records', true), 'GET',GET_param,
            function(get_resp) {    //callback
            
            	//入出金管理アプリに該当データが存在しない
				if (get_resp.records.length <= 0) {
					alert("「入出金管理」アプリに該当データが存在しません。");
					return event;
				}

				//売上管理NOを生成のため、自動採番最大をGET
				
				// クエリ文の設定
        		var query = {
            		"app": kintone.app.getId(), //自アプリID
            		"query": '入金No = "' + event.record['入金No']['value'] + '" order by 自動採番 desc limit 1'
        		};
				kintone.api(kintone.api.url('/k/v1/records', true), 'GET', query, function(get2_resp){
					
					console.log('===== get2_resp  =====');
					console.log(get2_resp);

		            var records = get2_resp.records;

        		    // 対象レコードがあった場合
            		if (records.length > 0) {
                		var rec = records[0];
                		var autono = rec['自動採番'].value;
                		autono = parseInt(autono) + 1;
                		event.record['自動採番'].value = autono;

            		// 対象レコードがなかった場合
            		} else {
                		event.record['自動採番'].value = '1';
            		}
            		//操作不可とする
            		event.record['自動採番'].disabled = true;
            		
            		//売上管理NOを生成する
            		//kintoneｱﾌﾟﾘ上、自動採番に値を設定しても保存前は
            		//売上管理NOはevent.recordに設定されないため
            		var UriageNo = event.record['入金No']['value'] + '-' + event.record['自動採番'].value

					//入出金管理アプリへ追加する準備処理
					var existing_subtable = get_resp.records[0]['通常売上Table']['value']; // 通常売上サブテーブル
					var subtable = [];			// 最終的にPUTするサブテーブル
					var appended_subtable = []; // 追加したいサブテーブル
					
					// 通常売上サブテーブルの先頭配列が空データの場合、先頭配列を削除
					if(existing_subtable[0].value['tb売上管理No'].value===""){
						existing_subtable.shift() ;
					}

					//通常売上サブテーブル内に売上管理にて更新したい売上管理NOが存在するか
					for( var r= 0; r < existing_subtable .length ; r++){
						if( existing_subtable[r].value['tb売上管理No'].value  === UriageNo ){
							//売上管理Noが一致したら、金額を更新
							existing_subtable[r].value['tb売上額'].value　= UriageNo;
							existing_subtable[r].value['tb個人額'].value　= event.record['個人税込']['value'];
							existing_subtable[r].value['tb店長額'].value　= event.record['店長']['value'];
							existing_subtable[r].value['tb会社額'].value　= event.record['会社']['value'];
							existing_subtable[r].value['tb売上担当'].value　= event.record['売上担当']['value'];
							add_flg = false;
							break;
				    	}
					}

					//　既存分データをサブテーブル用配列に設定
					subtable = existing_subtable.concat();　

					//売上管理NOが不一致の場合、配列に追加
					if( add_flg === true ){
						var appended_subtable = {
        					"value": {
        						"tb売上管理No": {"value": UriageNo},
            					"tb売上額": {"value": event.record['売上額税込']['value']},
								"tb個人額": {"value": event.record['個人税込']['value']},
								"tb店長額": {"value": event.record['店長']['value']},
								"tb会社額": {"value": event.record['会社']['value']},
								"tb売上担当": {"value": event.record['売上担当']['value']}
        					}
        				};
						// 追加分データをサブテーブルに結合
						subtable = subtable.concat(appended_subtable);	//新規
					}//if

					// レコード更新用オブジェクト
					var put_record = {}; 
					put_record["通常売上Table"] = {
						value: subtable
					};
					var updateBody = {
						'app': nyusyukkin_AppId,	//入出金管理アプリの現在のID
						'id': get_resp.records[0]['$id']['value'],	//レコードのID
      					'revision':get_resp.records[0]['$revision']['value'],
      					record: put_record
					};
		
					console.log('===== (updateBody) =====');
					console.log(updateBody);

					//入出金管理アプリへPUT
					kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', updateBody, function(put_resp){
                		resolve(put_resp);  //putが成功したらthenへ
                	},function(put_error){
                		reject(put_error);  //putのエラーはcatchへ
                	});

                },function(get2_error){
                    reject(get2_error);  //自動採番最大をGETのエラーはcatchへ
                });
            }, function(get_error) {
                reject(get_error);   //(get)エラーはcatchへ
            });	//function
    	}).then(function(resp){ //Promise
    		alert('「入出金管理」アプリへのデータ更新に成功しました。');
        	return event;
    	}).catch(function(error){
        	event.error = '「入出金管理」アプリへのデータ更新に失敗しました。'+ error.message;
        	return event;
    	});
    		
		return event;

	}); //event


})();
