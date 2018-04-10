"use strict";
 
(function() {
  // レコード登録画面の保存時
  kintone.events.on('app.record.create.submit', function(event) {
    var record = event.record;
 
    return new kintone.Promise(function(resolve,reject){
        kintone.api("/k/v1/record","POST",     //コピー先アプリ
            {
                app : 113,  //コピー先アプリのアプリID
                record : {
                    連携項目１ : { value : record['連携項目１']['value'] },
                    連携項目２ : { value : record['連携項目２']['value'] }
                }
            },
            function(post_resp) {    //callback
                kintone.api('/k/v1/record','GET',
                    {
                        app : 113,  //コピー元アプリのアプリID
                        id : post_resp['id']     //作成したレコードのレコードID
                    },function(get_resp){
                        resolve(get_resp);  //thenへ
                    },function(get_error){
                        reject(get_error);  //エラーはcatchへ
                    });
            }, function(post_error) {
                reject(post_error);   //エラーはcatchへ
            });
    }).then(function(resp){
        record['連携先アプリのレコード番号']['value'] = resp['record']['レコード番号']['value'];   //レコード番号を「連携先アプリのレコード番号」フィールドにセット
        return event;
 
    }).catch(function(error){
        event.error = 'エラーが発生しました。';
        return event;
    });
  });
 
})();