/*********************************************************************
[ソースファイル名] jyuchu_procedure.js
[アプリ名] 入庫
[アプリURL] https://maintech.cybozu.com/k/26
[実装機能]
  (1)受注管理アプリへステータス【引当待ち】となった場合、
　   ・受注管理アプリから受注明細アプリへの「新規」レコード追加
　   ・在庫管理アプリの引当データを更新する。
　(2)受注アプリよりステータス【出荷済み】に変更の際
　　・在庫管理アプリへ出庫データを更新する。
　(3)取消処理、すなわちステータス【出荷待ち】→【引当待ち】の場合は
　　在庫管理アプリから引当を減算し、受注明細アプリの該当データに削除フラグ(1)更新する

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
	//「受注明細」アプリのアプリID
	var jMeisai_AppId = 30;
	
	var ret;

	// -----------------------------------------------------------
    // 【イベント】ステータスを"在庫登録済み"へ変更する時
	// 【処理】仕入登録データを在庫管理アプリに登録する
    // -----------------------------------------------------------
	var eventsList = [
		'app.record.detail.process.proceed',	//プロセス管理アクション
	];

	kintone.events.on(eventsList, function (event) {

		var searchQuery ="";
		var LotCd ="";
		var Kosu=0;

		//処理対象の在庫管理アプリを特定するため、処理年月日を取得する
		var SystemDate = new Date();
		var strY = SystemDate.getFullYear();
		var strM = ("0"+(SystemDate.getMonth() + 1)).slice(-2);
		var strYm = strY + "-" +  strM + "-01";	//在庫アプリ検索年月
		var strYmd = strY + "-" +  strM + "-" + ("0"+SystemDate.getDate()).slice(-2);
		
		//受注アプリにて設定された受注明細サブテーブル取得
    	var existing_subtable = event.record['Table受注']['value']; 

		//受注サブテーブルの数量と売価が設定されていない場合
		//エラーとする
        for (var i = 0; i < existing_subtable.length; i++) {
        	if(( existing_subtable[i].value["tb数量"].value === "0" ) || ( existing_subtable[i].value["tb数量"].value === "" )){
        			event.error= '数量の入力値が誤っています。'
        			return event;
        	}
        	if(( existing_subtable[i].value["tb売価単価"].value === "0" ) || ( existing_subtable[i].value["tb売価単価"].value === "" )){
        			event.error= '売価単価の入力値が誤っています。'
        			return event;
        	}
        }
		
		//変更後のステータス
		var nStatus = event.nextStatus.value;
		
		//検索文字列の作成
        for (var i = 0; i < existing_subtable.length; i++) {
			if(i!=0){
				//or 付与
				searchQuery = searchQuery +" or "
			}
			searchQuery = searchQuery + "(商品ロットC =\"" +　existing_subtable[i].value["tb商品ロットC"].value　+ "\"";
			searchQuery = searchQuery +" and 倉庫C=\"" + existing_subtable[i].value["tb倉庫C"].value+ "\"";
			searchQuery = searchQuery +" and 対象月= \"" + strYm + "\")";
        }
        
        //在庫アプリ検索（GET)リクエストパラメータ
		var GET_param = {
			'app': zaiko_AppId,	//「在庫管理」アプリのID
			'query': searchQuery
		};

		console.log('==========【searchQuery】==========');
		console.log(searchQuery);

		// ステータスを判定
		switch(nStatus){
			
//----------引当処理の場合（引当待ち→出荷待ち）
			case "出荷待ち":
				alert('ステータス：【引当】受注明細及び引当情報を登録します。');

				//在庫データ一括取得
				return new kintone.Promise(function(resolve,reject){
    		    	kintone.api(kintone.api.url('/k/v1/records', true), 'GET',
        				GET_param,
            			function(get_resp) {    //callback
            			
            			//在庫管理アプリより取得したレコード
            			var ZaikoRecord = get_resp['records'];
            			
            			//取得したデータ数と受注商品数が異なる場合（存在しないロットがある）
            			//エラーとする
            			if (ZaikoRecord.length != existing_subtable.length) {
							//無かった商品ロットコード検出				
							for (var i = 0; i < existing_subtable.length; i++) {
								LotCd = existing_subtable[i].value["tb商品ロットC"].value;
								for( var r =0; r<ZaikoRecord.length; r++){
									if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
										LotCd="";
									}
								}
								if( LotCd ){　//LotCdがtrue(""でない)だったらエラー
									event.error= '指定された商品ロットコード：'+ LotCd+'が「在庫管理」アプリに存在しません。'
									reject(get_resp);
								}
			                }
            			}
            			
            			//受注商品で指定された数量が有効在庫数を上回る場合、
            			//エラーとする
						for (var i = 0; i < existing_subtable.length; i++) {
							Kosu = existing_subtable[i].value["tb数量"].value;
							for( var r =0; r<ZaikoRecord.length; r++){
								if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
									//有効在庫数をうわまったロットコード検出				
									if( Number(existing_subtable[i].value["tb数量"].value) > Number(ZaikoRecord[r]['有効在庫']['value']) ){
										Kosu=0;
										LotCd = existing_subtable[i].value["tb商品ロットC"].value;
									}
								}
							}
							if( !Kosu ){	//Kosuがfalse(0)だったらアラート
								// event.error= '数量が有効在庫数を超えています。商品ロットコード'+ LotCd;
								// reject(get_resp);
								alert('数量が有効在庫数を超えています。商品ロットコード'+ LotCd);
							}
							
						}

            			//在庫管理アプリにPUT及び商品明細アプリにPOSTするデータを生成する
						var updateZaiko = [];	//最終的にPUTする在庫レコード
						var insertMeisai =[];   //最終的にPOSTする商品明細レコード

						for (var i = 0; i < existing_subtable.length; i++) {
							for( var r =0; r<ZaikoRecord.length; r++){
								if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
									
									//在庫管理アプリへの更新用データ作成
									
									var hiki_subtable = ZaikoRecord[r]['引当subTable']['value']; // 在庫アプリの引当サブテーブル
									var subtable = [];			// 最終的にPUTするサブテーブル
									var appended_subtable = []; // 追加したいサブテーブル

									subtable = hiki_subtable.concat();
				
									//引当データを追加する配列に設定
									var appended_subtable = {
        								"value": {
			    						"tb引当更新日": {"value": strYmd},
										"tb引当理由": {"value": "新規引当"},
										"tb引当数": {"value": existing_subtable[i].value["tb数量"].value},
			    						"tb引当備考": {"value":""}
        							}
        							};
        					
        							// 既存と追加分のサブテーブルを結合
									subtable = subtable.concat(appended_subtable); 
									//在庫アプリ更新配列作成
									var SyohinBody = {
										'id': ZaikoRecord[r]['$id']['value'],	//レコードのID
      									'revision':ZaikoRecord[r]['$revision']['value'],
      									'record': { 
      										"引当subTable":{ "value": subtable }
      									}
									};
									
									//受注明細アプリ追加用データ作成
        							var MeisaiBody = {
        								"依頼書No":{"value": event.record['依頼書No']['value'] },
										"納期" : { "value": event.record['納期']['value'] },
										"LU納品先C" : { "value": event.record['納品先C']['value'] },
										"LUロット商品C" : {  "value": existing_subtable[i].value['tb商品ロットC'].value },
										"数量" : {  "value": existing_subtable[i].value['tb数量'].value },
										"売価単価_kg" : {  "value": existing_subtable[i].value['tb売価単価'].value }
									};


								} //if
							}　//for 在庫アプリのサブテーブル対象
							//一括で更新するため、配列に格納
							updateZaiko = updateZaiko.concat(SyohinBody); //在庫アプリ用
							insertMeisai=insertMeisai.concat(MeisaiBody); //商品明細用
						} //for  受注アプリのサブテーブル対象          			

						//bulkAPIを利用して２アプリに一括更新
						var body = {
						"requests": [
							{
								"method": "PUT",
								"api": "/k/v1/records.json",
								"payload": {"app": zaiko_AppId,"records": updateZaiko}
							},
							{
								"method": "POST",
								"api": "/k/v1/records.json",
						    	"payload": {"app":jMeisai_AppId,"records": insertMeisai}
							}
						]
						}
						console.log('===== blukのbody  =====');
						console.log(body);

						kintone.api(kintone.api.url('/k/v1/bulkRequest', true), 'POST', body, function(bulkRequest_resp){
                    		resolve(bulkRequest_resp);  //putが成功したらthenへ
                    	},function(bulkRequest_error){
                        	reject(bulkRequest_error);  //putのエラーはcatchへ
                    	});

            		}, function(get_error) {
                		reject(get_error);   //(get)エラーはcatchへ
            		});	//function
    			}).then(function(resp){
    				alert('「在庫管理」アプリへのデータ登録に成功しました。');
        			return event;
    			}).catch(function(error){
    				if(event.error ===""){
        				event.error = '「在庫管理」アプリへのデータ登録に失敗しました。'+ error.message;
    				}
        			return event;
    			});
				break;
				
//----------出荷処理の場合（出荷待ち→出荷済み）
			case "出荷済み":
				alert('ステータス：【出荷】在庫管理アプリへ出荷情報を登録します。');

				//在庫データ一括取得
				return new kintone.Promise(function(resolve,reject){
    		    	kintone.api(kintone.api.url('/k/v1/records', true), 'GET',
        				GET_param,
            			function(get_resp) {    //callback
            			
            			//在庫管理アプリより取得したレコード
            			var ZaikoRecord = get_resp['records'];
            			
            			//取得したデータ数と受注商品数が異なる場合（存在しないロットがある）
            			//エラーとする
            			if (ZaikoRecord.length != existing_subtable.length) {
							//無かった商品ロットコード検出				
							for (var i = 0; i < existing_subtable.length; i++) {
								LotCd = existing_subtable[i].value["tb商品ロットC"].value;
								for( var r =0; r<ZaikoRecord.length; r++){
									if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
										LotCd="";
									}
								}
								if( LotCd ){　//LotCdがtrue(""でない)だったらエラー
									event.error= '指定された商品ロットコード：'+ LotCd+'が「在庫管理」アプリに存在しません。'
									reject(get_resp);
								}
			                }
            			}
				
    					//在庫管理アプリにPUTするデータを生成する
						var updateZaiko = [];	//最終的にPUTする在庫レコード
						for (var i = 0; i < existing_subtable.length; i++) {
							for( var r =0; r<ZaikoRecord.length; r++){
								if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){

									//出庫サブテーブルを処理
									var s_existing_subtable = ZaikoRecord[r]['出庫subTable']['value']; // 出庫サブテーブル
									var s_subtable = [];			// 最終的にPUTするサブテーブル
									var s_appended_subtable = []; // 追加したいサブテーブル
									s_subtable = s_existing_subtable.concat();
									//出庫データを追加する配列に設定
									var s_appended_subtable = {
        								"value": {
            							"tb出庫更新日": {"value": event.record['出荷日']['value']},
										"tb出庫理由": {"value": "出庫"},
										"tb出庫数": {"value": existing_subtable[i].value['tb数量'].value},
										"tb出庫備考": {"value":""}
        								}
        							};
									// 既存と追加分の出庫サブテーブルを結合
									s_subtable = s_subtable.concat(s_appended_subtable); 

									//引当サブテーブルを処理
									var h_existing_subtable = ZaikoRecord[r]['引当subTable']['value']; // 出庫サブテーブル
									var h_subtable = [];			// 最終的にPUTするサブテーブル
									var h_appended_subtable = [];	// 追加したいサブテーブル
									h_subtable = h_existing_subtable.concat();
									//引当データを追加する配列に設定
									var h_appended_subtable = {
        								"value": {
            							"tb引当更新日": {"value": event.record['出荷日']['value']},
										"tb引当理由": {"value": "引当to出庫"},
										"tb引当数": {"value": "-"+ existing_subtable[i].value['tb数量'].value},	//負数を設定
										"tb引当備考": {"value":""}
        								}
        							};
									// 既存と追加分の引当サブテーブルを結合
									h_subtable = h_subtable.concat(h_appended_subtable); 
									
									var updateBody = {
									'id': ZaikoRecord[r]['$id']['value'],	//レコードのID
      								'revision':ZaikoRecord[r]['$revision']['value'],
      								'record': {
      									"出庫subTable":{ "value": s_subtable },
										"引当subTable":{ "value": h_subtable }
      									}
									};
								}//if	
							}// for
							//一括で更新するため、配列に格納
							updateZaiko = updateZaiko.concat(updateBody); //在庫アプリ用
						}//for
						
						//一括更新Apiにて在庫アプリを更新
						var body = {
    						"app": zaiko_AppId,
    						"records": updateZaiko
						}
						console.log('===== 在庫updateのbody  =====');
						console.log(body);
						
						kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', body, function(put_resp) {
                    		resolve(put_resp);  //putが成功したらthenへ
                    	},function(put_error){
                        	reject(put_error);  //putのエラーはcatchへ
                    	});
            		}, function(get_error) {
                		reject(get_error);   //(get)エラーはcatchへ
            		});	//function
    			}).then(function(resp){
    				alert('「在庫管理」アプリへのデータ登録に成功しました。');
        			return event;
    			}).catch(function(error){
    				if(event.error ===""){
        				event.error = '「在庫管理」アプリへのデータ登録に失敗しました。'+ error.message;
    				}
        			return event;
    			});
				break;
				
//----------取消処理の場合（出荷待ち→新規登録中）
			case "新規登録中":
				alert('ステータス：【新規登録中】へ戻します。引当を解除し、受注明細を削除します。');

				//在庫データ一括取得
				return new kintone.Promise(function(resolve,reject){
    		    	kintone.api(kintone.api.url('/k/v1/records', true), 'GET',
        				GET_param,
            			function(get1_resp) {    //callback
            			
            			//在庫管理アプリより取得したレコード
            			var ZaikoRecord = get1_resp['records'];
            			
            			//取得したデータ数と受注商品数が異なる場合（存在しないロットがある）
            			//エラーとする
            			if (ZaikoRecord.length != existing_subtable.length) {
							//無かった商品ロットコード検出				
							for (var i = 0; i < existing_subtable.length; i++) {
								LotCd = existing_subtable[i].value["tb商品ロットC"].value;
								for( var r =0; r<ZaikoRecord.length; r++){
									if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
										LotCd="";
									}
								}
								if( LotCd ){　//LotCdがtrue(""でない)だったらエラー
									event.error= '指定された商品ロットコード：'+ LotCd+'が「在庫管理」アプリに存在しません。'
									reject(get1_resp);
								}
			                }
            			}
            			
            			//在庫管理アプリにPUT及び商品明細アプリにPUTするデータを生成する
						var updateZaiko = [];	//最終的にPUTする在庫レコード
						var updateMeisai =[];   //最終的にPOSTする商品明細レコード

						for (var i = 0; i < existing_subtable.length; i++) {
							for( var r =0; r<ZaikoRecord.length; r++){
								if( existing_subtable[i].value["tb商品ロットC"].value === ZaikoRecord[r]['商品ロットC']['value'] ){
									
									//在庫管理アプリへの更新用データ作成
									
									var hiki_subtable = ZaikoRecord[r]['引当subTable']['value']; // 在庫アプリの引当サブテーブル
									var subtable = [];			// 最終的にPUTするサブテーブル
									var appended_subtable = []; // 追加したいサブテーブル

									subtable = hiki_subtable.concat();
				
									//引当データを追加する配列に設定
									var appended_subtable = {
        								"value": {
			    						"tb引当更新日": {"value": strYmd},
										"tb引当理由": {"value": "修正"},
										"tb引当数": {"value": "-" + existing_subtable[i].value["tb数量"].value},
			    						"tb引当備考": {"value":""}
        							}
        							};
        					
        							// 既存と追加分のサブテーブルを結合
									subtable = subtable.concat(appended_subtable); 
									//在庫アプリ更新配列作成
									var SyohinBody = {
										'id': ZaikoRecord[r]['$id']['value'],	//レコードのID
      									'revision':ZaikoRecord[r]['$revision']['value'],
      									'record': { 
      										"引当subTable":{ "value": subtable }
      									}
									};
									
								} //if
							}　//for 在庫アプリのサブテーブル対象
							//一括で更新するため、配列に格納
							updateZaiko = updateZaiko.concat(SyohinBody); //在庫アプリ用
						} //for  受注アプリのサブテーブル対象      
						

						//受注明細アプリより該当データを取得する
						searchQuery =  "依頼書No =\"" + event.record['依頼書No']['value'] 　+ "\"";

        				//受注明細アプリアプリ検索（GET)リクエストパラメータ
						var GET_param = {
							'app': jMeisai_AppId,	//「在庫管理」アプリのID
							'query': searchQuery
						};

						kintone.api(kintone.api.url('/k/v1/records', true), 'GET', GET_param, function(get2_resp){

							console.log('===== get2_resp  =====');
							console.log(get2_resp);


            				//受注明細アプリより取得したレコード
            				var MaisaiRecord = get2_resp['records'];
            				for( var r =0; r<MaisaiRecord.length; r++){
								//受注明細アプリへの更新用データ作成
								var updateBody = {
									'id': MaisaiRecord[r]['$id']['value'],	//レコードのID
      								'revision':MaisaiRecord[r]['$revision']['value'],
      								'record':{"削除フラグ": {"value": '1'}}
								};
								//一括で更新するため、配列に格納
								updateMeisai = updateMeisai.concat(updateBody); //商品明細アプリ用
							}　//for 受注明細アプリ

							//bulkAPIを利用して２アプリに一括更新
							var body = {
							"requests": [
								{
									"method": "PUT",
									"api": "/k/v1/records.json",
									"payload": {"app": zaiko_AppId,"records": updateZaiko}
								},
								{
									"method": "PUT",
									"api": "/k/v1/records.json",
							    	"payload": {"app":jMeisai_AppId,"records": updateMeisai}
								}
							]
							}
							console.log('===== blukのbody  =====');
							console.log(body);

							kintone.api(kintone.api.url('/k/v1/bulkRequest', true), 'POST', body, function(bulkRequest_resp){
                    			resolve(bulkRequest_resp);  //putが成功したらthenへ
                    		},function(bulkRequest_error){
                        		reject(bulkRequest_error);  //putのエラーはcatchへ
                    		});
                    	},function(get2_error){
                        	reject(get2_error);  //受注明細getのエラーはcatchへ
                    	});
            		}, function(get1_error) {
                		reject(get1_error);   //(在庫管理getエラーはcatchへ
            		});	//function
    			}).then(function(resp){
    				alert('引当解除及び商品明細削除に成功しました。');
        			return event;
    			}).catch(function(error){
    				if(event.error ===""){
        				event.error = '引当解除及び商品明細削除に失敗しました。'+ error.message;
    				}
        			return event;
    			});
				break;
		}　//switch

		return event;
	}); //event
	

})();
