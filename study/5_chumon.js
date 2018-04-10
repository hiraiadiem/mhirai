(function() {

    "use strict";

    // 在庫アプリ操作
    var zaikoDao = {};
    // 売上アプリ操作
    var uriageDao = {};

    var eventName = ["app.record.create.show", "app.record.edit.show"];
    // 追加画面、編集画面の表示後イベント
    kintone.events.on(eventName, function(e) {
        if (e['reuse'] === true) {
            // 再利用の場合は制御項目を初期化
            e.record['制御項目_在庫反映状況']['value'] = '未';
        }
        // 制御項目の非表示
        kintone.app.record.setFieldShown('制御項目_在庫反映状況', false);
        return e;
    });

    // 詳細画面のプロセス管理のアクションイベント
    kintone.events.on( "app.record.detail.process.proceed" , function(e) {
        if (e['nextStatus']['value'] === '納品済') {
            e['record']['制御項目_在庫反映状況']['value'] = '未';
        }

        return e;
    });

    // 詳細画面の表示後イベント
    kintone.events.on("app.record.detail.show", function(e) {
        // 制御項目の非表示
        kintone.app.record.setFieldShown('制御項目_在庫反映状況', false);
        // レコード情報取得
        var record = e.record;
        // 在庫反映状況確認
        if (record['制御項目_在庫反映状況']['value'] !== '未') {
            return e;
        }
        // 関連する在庫レコードを取得
        zaikoDao.select(record).then(function(resp) {
            var resultRecord = resp['records'];
            if (resultRecord.length !== 0) {
                if (record['ステータス']['value'] === '受注') {
                    // レコード新規登録時
                    // 在庫アプリのレコードを更新（引当数加算）
                    zaikoDao.updateNew(resultRecord, record);
                } else {
                    // 納品時
                    // 在庫アプリのレコードを更新（在庫数、引当数減算）
                    zaikoDao.updateDeli(resultRecord, record);
                    // 売上アプリに商品別の売上レコードを登録
                    uriageDao.insert(record);
                }
            } else {
                alert("在庫レコードの更新に失敗しました。");
            }
        }, function(resp) {
            // 失敗時
            alert("在庫レコードの更新に失敗しました。");
        });

        return e;
    });

    // 「5章_在庫」アプリのアプリ番号
    zaikoDao.APP_ID = 470;

    // 「5章_売上」アプリのアプリ番号
    uriageDao.APP_ID = 471;

    // 在庫レコード取得処理
    zaikoDao.select = function(recordInf) {
        // query文字列作成
        var queryString = [];
        var tableLength = recordInf['商品リスト']['value'].length;
        queryString.push('商品コード in (');
        for (var i = 0; i < tableLength; i++) {
            if (i !== 0) {
                queryString.push(',');
            }
            queryString.push('"');
            queryString.push(recordInf['商品リスト']['value'][i]['value']['商品コード']['value']);
            queryString.push('"');
        }
        queryString.push(')');

        // 検索パラメータ
        var params = {
            // 在庫アプリ番号
            "app": zaikoDao.APP_ID,
            // 検索条件
            "query": queryString.join(''),
            // 取得項目
            "fields": ['$id', '$revision', '商品コード', '在庫数', '引当数']
        };

        return kintone.api(kintone.api.url('/k/v1/records', true),'GET', params);
    };

    // 在庫レコード更新処理（登録時）
    zaikoDao.updateNew = function(zaikoRecordInf, recordInf) {
        // REST APIパラメータ
        var params = {
            // 在庫アプリ番号
            "app": zaikoDao.APP_ID,
            "records": []
        };
        // 商品数分の情報を生成
        var length = zaikoRecordInf.length;
        for (var i = 0; i < length; i++) {
            // 対象在庫の商品と一致する商品情報を取得
            var shohinRec = zaikoDao.getTargetRecord(zaikoRecordInf[i]['商品コード']['value'], recordInf);
            var record = {
                "id": zaikoRecordInf[i]['$id']['value'],
                "revison": zaikoRecordInf[i]['$revision']['value'],
                "record": {
                    "引当数": {
                        "value": Number(zaikoRecordInf[i]['引当数']['value']) +
                            Number(shohinRec['数量']['value'])
                    }
                }
            };
            params.records.push(record);
        }

        // 在庫レコードを更新
        kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', params).then(function(resp) {
            // 成功時
            // 制御項目_在庫反映状況の更新
            kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                "app": kintone.app.getId(),
                "id": recordInf['$id']['value'],
                "record": {
                    "制御項目_在庫反映状況": {
                        "value": '済'
                    }
                }
            }, function(resp2) {
                // 成功時
                // 画面リフレッシュ
                location.reload();
            }, function(resp2) {
                // 失敗時
                alert("制御項目_在庫反映状況の更新に失敗しました。");
            });
        }, function(resp) {
            // 失敗時
            alert("在庫レコードの更新に失敗しました。");
        });
    };

    // 在庫レコード更新処理（納品時）
    zaikoDao.updateDeli = function(zaikoRecordInf, recordInf) {
        // REST APIパラメータ
        var params = {
            // 在庫アプリ番号
            "app": zaikoDao.APP_ID,
            "records": []
        };
        // 商品数分の情報を生成
        var length = zaikoRecordInf.length;
        for (var i = 0; i < length; i++) {
            // 対象在庫の商品と一致する商品情報を取得
            var shohinRec = zaikoDao.getTargetRecord(zaikoRecordInf[i]['商品コード']['value'], recordInf);
            var record = {
                "id": zaikoRecordInf[i]['$id']['value'],
                "revison": zaikoRecordInf[i]['$revision']['value'],
                "record": {
		 	        "引当数": {
				        "value":zaikoRecordInf[i].引当数.value - recordInf.商品リスト.value[i].value.数量.value
			        },
                     "在庫数": {
                       	 "value":zaikoRecordInf[i].在庫数.value - recordInf.商品リスト.value[i].value.数量.value
                    }
                }
            };
	    }
            params.records.push(record);
    //};

        // 在庫レコードを更新
        kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', params).then(function(resp) {
            // 成功時
            // 制御項目_在庫反映状況の更新
            kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                "app": kintone.app.getId(),
                "id": recordInf['$id']['value'],
                "record": {
                    "制御項目_在庫反映状況": {
                        "value": '済'
                    }
                }
            }, function(resp2) {
                // 成功時
                // 画面リフレッシュ
                location.reload();
            }, function(resp2) {
                // 失敗時
                alert("制御項目_在庫反映状況の更新に失敗しました。");
            });
        }, function(resp) {
            // 失敗時
            alert("在庫レコードの更新に失敗しました。");
        });
    };

    // 対象在庫の商品と一致する商品情報を取得
    zaikoDao.getTargetRecord = function(shohinCd, recordInf) {
        var length = recordInf['商品リスト']['value'].length;
        var result;
        for (var i = 0; i < length; i++) {
            if (recordInf['商品リスト']['value'][i]['value']['商品コード']['value'] === shohinCd) {
                result = recordInf['商品リスト']['value'][i]['value'];
            }
        }
        return result;
    };

    // 売上レコード登録処理
    uriageDao.insert = function(recordInf) {
        // REST APIパラメータ
        var params = {
            // 売上アプリ番号
            "app": uriageDao.APP_ID,
            // 登録データ
            "records": []
        };
        // 当日日付
        var nowDate = new Date();
        // 商品数分の情報を生成
        var length = recordInf['商品リスト']['value'].length;
        for (var i = 0; i < length; i++) {
            var record = {
                "売上日": {
                    "value": nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate()
                },
                "注文番号": {
                     "value": recordInf.注文番号.value
                },
                "商品コード": {
                     "value": recordInf.商品リスト.value[i].value.商品コード.value
                 },
                "売上金額": {
                     "value": Number(recordInf.商品リスト.value[i].value.小計金額.value)
                }     
            };
            params.records.push(record);
        }
        // 売上レコードを登録
        kintone.api(kintone.api.url('/k/v1/records', true), 'POST', params).then(function(resp) {
            // 成功時
        }, function(resp) {
            // 失敗時
            alert("売上レコードの登録に失敗しました。");
        });
    };
})();
