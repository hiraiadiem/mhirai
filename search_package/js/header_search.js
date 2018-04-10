/*
※kintoneでの検索の注意点！！
1, １文字では検索出来ない(最低でも２文字以上)
2, 英数字検索が単語単位(cyで、cybozeがヒットしない！)
https://help.cybozu.com/ja/k/user/search_details.html

*/
jQuery.noConflict();

// 設定値
//const OR_CONST = "or";  // 必ず小文字
const AND_CONST = "and";  // 必ず小文字

// 一覧表示のタイミングで実行
(function($, PLUGIN_ID) {
  "use strict";

  //プラグイン設定にて指定された項目名を取得する
  var config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!config) {
      return false;
  }
  var txt1_name = config.txt1;
  var pulldown_name = config.pulldown;
  var radio_name = config.radio;

  var list= { init : '指定なし'};      //プルダウン用オプション項目格納連想配列
  var radio_opt=[];                   //ラジオボタン用オプション項目格納配列


  //一覧表示イベント
  kintone.events.on('app.record.index.show', function(event) {

      // GET引数に格納された直前の検索キーワードを取得して再表示する
      var result = {};
      var query = window.location.search.substring( 7 );  // URL固定部分(?query=)は無視

      // クエリ検索条件の区切り記号 (and/or) で分割
      var parameters = query.split( /or|and/ );

      // フィールドコード名と検索キーワードに分割する
      for( var i = 0; i < parameters.length; i++ ){
        var element = parameters[ i ].split( /like|in/ );
        var paramName = decodeURIComponent( element[ 0 ] );
        var paramValue = decodeURIComponent( element[ 1 ] );

        // スペースと""をtrimして、文字列だけにしてから、配列に格納
        result[ paramName.replace(/^\s+|\s+$/g, "") ] = paramValue.replace(/^[\s|\"]+|[\s|\"]+$/g, "");
      }

      if(txt1_name!=="" && typeof txt1_name !== "undefined"){
        //テキストボックス
        var $myDiv = $("<div>",{ addClass: "kintoneplugin-input-outer"}).css({
                      "padding-top": '0px',
                      "margin-bottom": '10px',
                      "display": 'inline-block'
                    });
        var $myListHeaderDiv = $("<p>", { text: txt1_name,addClass:"kintoneplugin-title"}).css({
                      "margin-top":'0',"margin-bottom": '0'
                    });
        var $myInput = $("<input>", { addClass:"kintoneplugin-input-text",
                                      id: "input1",
                                      type: 'text'});
        if(result[ txt1_name ] != undefined){
          var key_string1 = result[ txt1_name ];
          $myInput.val(key_string1);　　// GET引数内に直前の検索キーワードがあったら格納しておく
        }
      }
      //OR文言
      // var $myDiv1 = $("<div>",{ addClass: "myDiv1"}).css({
      //                 "display": 'inline-block',
      //                 "height": "80",
      //                 "vertical-align":'middle'
      // });
      // var $myListHeaderDiv1 = $("<p>", { text: '　　OR　　'});
      //
      // //会社名カナ
      // var $myDiv2 = $("<div>",{ addClass: "kintoneplugin-input-outer"}).css({
      //                 "display": 'inline-block'
      // });
      // var $myListHeaderDiv2 = $("<p>", { text: txt2_name, addClass:"kintoneplugin-title" }).css({
      //                 "margin-top":'0',"margin-bottom": '0'
      // });
      // var $myInput2 = $("<input>", { addClass:"kintoneplugin-input-text",
      //                                  id : "input2",
      //                                  type: 'text'});
      //
      // if(result[ txt2_name ] != undefined){
      //   var key_string2 = result[ txt2_name ];
      //   $myInput2.val(key_string2);　　// GET引数内に直前の検索キーワードがあったら格納しておく
      // }


      new kintone.Promise(function(resolve, reject) {

        var appid = kintone.app.getId();
        getFormInfo(appid).then(function(formInfo) {
          console.log("フォーム情報取得　正常");
          console.log(formInfo);

          // success
          for(let i = 0; i < formInfo.properties.length; i++) {
            //該当するプルダウン項目からオプションを取得する。
            if(formInfo.properties[i].label === pulldown_name){
              for (var j in formInfo.properties[i].options) {
                list[formInfo.properties[i].options[j]]=formInfo.properties[i].options[j];
              }
            }
            //該当するラジオ項目からオプションを取得する。
            if(formInfo.properties[i].label === radio_name){
              var count= 0;
              for (var j in formInfo.properties[i].options) {
                radio_opt[count] = formInfo.properties[i].options[j];
                count++;
              }
            }
          }  //for

          if( pulldown_name !== "" && typeof pulldown_name !== "undefined" ){
            //プルダウン設定
            // var $myDivUnder =  $("<div>",{ addClass: "DivUnder"}).css({
            //                   "padding-left":'30px',
            //                   "padding-top": '0px',
            //                   "height":'80px',
            //                   "margin-bottom": '0',
            //                   "display": 'inline-block'
            //                 });
            var $myDiv3 = $("<div>",{ addClass: "myPull"}).css({
                                "padding-left":'30px',
                                "padding-top": '0px',
                                "margin-bottom": '0',
                                "display": 'inline-block'
                            });

            var options, $option;
            //フォーム情報から取得した値をプルダウンに設定
            options = $.map(list, function (item, key) {
              $option = $('<option>', { value: key, text: item });
              return $option;
            });
            var $myListHeaderDiv3 = $("<p>", { text: pulldown_name ,addClass:"kintoneplugin-title" }).css({
                              "margin-top":'0',"margin-bottom": '0' });
            var $myPullDown = $('<div>').addClass('kintoneplugin-select-outer').append(
                                    $('<div>').addClass('kintoneplugin-select').append(
                                      $('<select>').attr('id', 'custm_select').append(
                                        options )
                                    )
                              );
          }

          if(radio_name!=="" && typeof pulldown_name !== "undefined" ){
            //ラジオボタン設定
            var $myDiv4 = $("<div>",{ addClass: "myRadio"}).css({
                      "padding-left": '30px',
                      "padding-top": '0px',
                      "margin-bottom": '0',
                      "display": 'inline-block',
                      "vertical-align": 'top'
                    });
            var $myListHeaderDiv4 = $("<p>", { text: radio_name  }).css({"margin-top":'0',"margin-bottom": '0' });
            var $myRadio =  $('<div>').addClass('kintoneplugin-input-radio');

            //オプションの値を設定
            for( let i=0; i< radio_opt.length; i++){
              var radio_id = 'radio-' + i ;
              if( i === 0){
                //最初の値にcheckedを設定
                $myRadio = $myRadio.append($('<span>').addClass('kintoneplugin-input-radio-item').append(
                          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', radio_id).val(radio_opt[i]).prop('checked', true),
                          $('<label>').prop('for', radio_id).html(radio_opt[i]))
                        );
              }else{
                $myRadio = $myRadio.append($('<span>').addClass('kintoneplugin-input-radio-item').append(
                          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', radio_id).val(radio_opt[i]),
                          $('<label>').prop('for', radio_id).html(radio_opt[i]))
                        );
              }　//if
            } //for
          }

          // 検索ボタン
          var $myDiv5 = $("<div>",{ addClass: "mybutton"}).css({
            //"margin-top":'0px',
            "margin-left": '30px',
            "margin-bottom": '10px',
            //"height":'80px',
            "display": 'inline-block'
           });
          var $myButton = $("<button>").addClass('kintoneplugin-button-normal_adiem').text('検索');
          $($myButton).click(function(){
            keyword_search();
          });

          // クリアボタン
          var $myDiv6 = $("<div>",{ addClass: "clbutton"}).css({
            //"margin-top":'0px',
            "margin-left": '30px',
            "margin-bottom": '10px',
            //"height":'80px',
            "display": 'inline-block'
           });
          var $clButton = $("<button>").addClass('kintoneplugin-button-normal_adiem').text('クリア');
          $($clButton).click(function(){
            keyword_clear();
          });


          // キーワード入力部品を、kintoneヘッダ部分に埋め込む(重複を避けるため、最初に要素をクリアしておく)
          //var aNode = kintone.app.getHeaderMenuSpaceElement()
          var aNode = kintone.app.getHeaderSpaceElement();
          for (var i =aNode.childNodes.length-1; i>=0; i--) {
            aNode.removeChild(aNode.childNodes[i]);
          }

          var HeaderSpace = kintone.app.getHeaderSpaceElement();

          //テキスト
          if(txt1_name!=="" && typeof txt1_name !== "undefined"){

            $(HeaderSpace).html($myDiv);
            $($myDiv).append($myListHeaderDiv);
            $($myDiv).append($myInput);
          }
          // //OR文字
          // $(HeaderSpace).append($myDiv1);
          // $($myDiv1).append($myListHeaderDiv1);
          //
          // //会社名カナ
          // $(HeaderSpace).append($myDiv2);
          // $($myDiv2).append($myListHeaderDiv2);
          // $($myDiv2).append($myInput2);

          if(pulldown_name !== "" && typeof pulldown_name !== "undefined"){
            //プルダウン
            // $(HeaderSpace).append($myDivUnder);
            // $($myDivUnder).append($myDiv3);
            $(HeaderSpace).append($myDiv3);
            $($myDiv3).append($myListHeaderDiv3);
            $($myDiv3).append($myPullDown);
            if(result[ pulldown_name ] != undefined){
              //クエリ文からデータ部分のみ抽出 in("")の余計な文字列削除
              var key_string3 = result[ pulldown_name ];
              $("#custm_select").ready(function() {
                key_string3 = key_string3.substr(2);  //("を削除
                key_string3 = key_string3.substr(0,key_string3.length-2); //")閉じかっこを削除
                console.log(key_string3);
                $("#custm_select").val(key_string3); // GET引数内に直前の検索キーワードがあったら格納しておく
              });
            }else{
                $("#custm_select").val("init"); // 初期値
            }
          }

          if(radio_name!=="" && typeof pulldown_name !== "undefined" ){
            //ラジオボタン
            //$($myDivUnder).append($myDiv4);
            $(HeaderSpace).append($myDiv4);
            $($myDiv4).append($myListHeaderDiv4);
            $($myDiv4).append($myRadio);
            if(result[ radio_name ] != undefined){
              //クエリ文からデータ部分のみ抽出 in("")の余計な文字列削除
              var key_string4 = result[ radio_name ];
              $('input:radio[name="radio"]').ready(function() {
                // GET引数内に直前の検索キーワードがあったら格納しておく
                key_string4 = key_string4.substr(2);  //("を削除
                key_string4 = key_string4.substr(0,key_string4.length-2); //")閉じかっこを削除
                $('input:radio[name="radio"]').val([key_string4]);　　
              });
            }
          }

          //検索ボタン
          $(HeaderSpace).append($myDiv5);
          $($myDiv5).append($myButton);

          //クリアボタン
          $(HeaderSpace).append($myDiv6);
          $($myDiv6).append($clButton);


          resolve(event);
        });   //getFormInfo
      }).then(function() {
          return event;
      });     //new promise
  });   //event.on


  // フォーム情報取得
  function getFormInfo(appid) {
      var body={ app: appid };
      return kintone.api(kintone.api.url('/k/v1/form', true), 'GET', body).then(function(resp) {
          if (resp.properties.length === 0) {
              console.log("フォーム情報取得　異常");
          }
          return resp;
      });
  }

  //キーワードのクリア
  function keyword_clear(){

    //各要素が存在したら、データクリア
    if($("#input1").length){
      //テキストボックスクリア
      $("#input1").val("");
    }
    if($("#custm_select").length){
      //プルダウン初期値選択
      $("#custm_select").val("init");
    }
    if($("#radio-0").length){
      //ラジオボタン最左辺オプション選択
      $('input[name=radio]:eq(0)').prop('checked', true);
    }
  }

  // キーワード検索の関数
  function keyword_search(){

    if($("#input1").length){
      var keyword1 = $("#input1").val();
    }else{
      var keyword1 = "";
    }
    //var keyword2 = $("#input2").val();
    if($("#custm_select").length){
      var keyword3 = $("#custm_select").val();
    }else{
      var keyword3 ="";
    }

    if($("#radio-0").length){
      var keyword4 = $("input:radio[name='radio']:checked").val();
    }else{
      var keyword4 = "";
    }

    //クエリ生成
    var str_query = '?query=';


    //テキストボックス入力判定によりクエリ追加
    if( keyword1 !==""){
      str_query = str_query +  txt1_name +' like "' + keyword1 + '"';
    }

    //会社名入力判定によりクエリ生成
    // if( keyword1 ==="" ){
    //   //会社名１空白
    //   if( keyword2 === ""){
    //     //会社名２空白
    //     //何もしない
    //   }else{
    //     //会社名2のみ指定
    //     str_query = str_query +  txt2_name +' like "' + keyword2 + '"';
    //   }
    // }else{
    //   if( keyword2 === ""){
    //     //会社名1のみ指定
    //     str_query = str_query +  txt1_name +' like "' + keyword1 + '"';
    //   }else{
    //     //会社名１及び会社名２指定
    //     str_query = str_query +  txt1_name +' like "' + keyword1 + '" '+ OR_CONST +' '+ txt2_name +' like "' + keyword2 + '"';
    //   }
    // }

    //プルダウン入力判定によりクエリ追加
    if( keyword3 !== "init" &&  keyword3 !== "") {
      if ( str_query !== '?query='){
        str_query = str_query + AND_CONST +' ';
      }
      str_query = str_query + pulldown_name + ' in("'+ keyword3 + '")';
    }

    //ラジオボタン入力判定によりクエリ追加
    if( keyword4 !== "指定なし" &&  keyword4 !== "") {
      if ( str_query !== '?query='){
        str_query = str_query + AND_CONST +' ';
      }
      str_query = str_query + radio_name + ' in("'+ keyword4 + '")';
    }

    console.log(str_query);

    // GET変数を使って、検索結果へジャンプ！
    document.location = location.origin + location.pathname + str_query;
  }

})(jQuery, kintone.$PLUGIN_ID);
