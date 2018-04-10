/*
※kintoneでの検索の注意点！！
1, １文字では検索出来ない(最低でも２文字以上)
2, 英数字検索が単語単位(cyで、cybozeがヒットしない！)
https://help.cybozu.com/ja/k/user/search_details.html

*/

// 設定値
const FIELD_CODE1 = "会社名";
const FIELD_CODE_NAME = "会社名";
const OR_CONST = "or";  // 必ず小文字
const AND_CONST = "and";  // 必ず小文字

const FIELD_CODE2 = "会社名カナ";
const FIELD_CODE2_NAME = "会社名カナ";

const PULLDOWN_CODE = "顧客関係性";
const PULLDOWN_CODE_NAME = "顧客関係性ランク";

const RADIO_CODE_NAME = "会社規模";


// 一覧表示のタイミングで実行
(function ($) {
  "use strict";
  kintone.events.on("app.record.index.show", function (event) {
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

    //会社名
    var $myDiv = $("<div>",{ addClass: "kintoneplugin-input-outer"}).css({
                  "display": 'inline-block'

    });
    var $myListHeaderDiv = $("<p>", { text: '会社名',addClass:"kintoneplugin-title"}).css({
                  "margin-top":'0',"margin-bottom": '0'
    });
    var $myInput = $("<input>", { addClass:"kintoneplugin-input-text",
                                  id: "input1",
                                  type: 'text'});

    if(result[ FIELD_CODE1 ] != undefined){
      var key_string1 = result[ FIELD_CODE1 ];
      $myInput.val(key_string1);　　// GET引数内に直前の検索キーワードがあったら格納しておく
    }

    //OR文言
    var $myDiv1 = $("<div>",{ addClass: "myDiv1"}).css({
                  "display": 'inline-block',
                  "height": "80",
                  "vertical-align":'middle'
    });
    var $myListHeaderDiv1 = $("<p>", { text: '　　OR　　'});

    //会社名カナ
    var $myDiv2 = $("<div>",{ addClass: "kintoneplugin-input-outer"}).css({
                  "display": 'inline-block'
    });
    var $myListHeaderDiv2 = $("<p>", { text: '会社名カナ', addClass:"kintoneplugin-title" }).css({
                  "margin-top":'0',"margin-bottom": '0'
    });
    var $myInput2 = $("<input>", { addClass:"kintoneplugin-input-text",
                                   id : "input2",
                                   type: 'text'});

    if(result[ FIELD_CODE2 ] != undefined){
      var key_string2 = result[ FIELD_CODE2 ];
      $myInput2.val(key_string2);　　// GET引数内に直前の検索キーワードがあったら格納しておく
    }

    var $myDivUnder =  $("<div>",{ addClass: "DivUnder"}).css({
                  "padding-left":'30px',
                  "padding-top": '0px',
                  "height":'80px',
                  "margin-bottom": '0',
                  "display": 'inline-block'
    });
    var $myDiv3 = $("<div>",{ addClass: "myPull"}).css({
                  "display": 'inline-block'
    });

    var options, $option;
    var list = {
      0: '-',
      A: 'A(パートナー顧客)',
      B: 'B(リピート顧客)',
      C: 'C(体験顧客)'
    };

    options = $.map(list, function (item, key) {
      $option = $('<option>', { value: key, text: item });
      return $option;
    });
    var $myListHeaderDiv3 = $("<p>", { text: '顧客関係性',addClass:"kintoneplugin-title" }).css({"margin-top":'0',"margin-bottom": '0' });
    var $myPullDown = $('<div>').addClass('kintoneplugin-select-outer').append(
                        $('<div>').addClass('kintoneplugin-select').append(
                          $('<select>').attr('id', 'custm_select').append(
                            options )
                          )
                        );

    if(result[ PULLDOWN_CODE_NAME ] != undefined){
      //クエリ文からランクの部分（A,B,C～）のみ抽出 in("")の余計な文字列削除
      var key_string3 = result[ PULLDOWN_CODE_NAME ].substr(2,1);
      $("#custm_select").ready(function() {
　       $("#custm_select").val(key_string3); // GET引数内に直前の検索キーワードがあったら格納しておく
      });
    }

    var $myDiv4 = $("<div>",{ addClass: "myRadio"}).css({
                  "display": 'inline-block',
                  "margin-left": '30px',
                  "vertical-align": 'top',
                  "margin-bottom":'0'
    });
    var $myListHeaderDiv4 = $("<p>", { text: '会社規模' }).css({"margin-top":'0',"margin-bottom": '0' });
    var $myRadio =
      $('<div>').addClass('kintoneplugin-input-radio').append(
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-0').val(0).prop('checked', true),
          $('<label>').prop('for', 'radio-0').html('指定なし')
        ),
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-1').val('300人未満'),
          $('<label>').prop('for', 'radio-1').html('300人未満')
        ),
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-2').val('150人未満'),
          $('<label>').prop('for', 'radio-2').html('150人未満')
        ),
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-3').val('50人未満'),
          $('<label>').prop('for', 'radio-3').html('50人未満')
        )
      );

      if(result[ RADIO_CODE_NAME ] != undefined){
        var key_string4 = result[ RADIO_CODE_NAME ].substr(2,6).replace('"', '');

        $('input:radio[name="radio"]').ready(function() {
          // GET引数内に直前の検索キーワードがあったら格納しておく
          $('input:radio[name="radio"]').val([key_string4]);　　
        });
      }

    // 検索ボタン
    var $myDiv5 = $("<div>",{ addClass: "mybutton"}).css({"margin-top":'0px',"margin-bottom": '20px' });
    var $myButton = $("<button>").addClass('kintoneplugin-button-normal').text('検索');
    $($myButton).click(function(){
      keyword_search();
    });

    // キーワード検索の関数
    function keyword_search(){
      var keyword1 = $myInput.val();
      var keyword2 = $myInput2.val();
      var keyword3 = $("#custm_select").val();
      var keyword4 = $("input:radio[name='radio']:checked").val();

      //クエリ生成
      var str_query = '?query=';

      //会社名入力判定によりクエリ生成
      if( keyword1 ==="" ){
        //会社名１空白
        if( keyword2 === ""){
          //会社名２空白
          //何もしない
        }else{
          //会社名2のみ指定
          str_query = str_query +  FIELD_CODE2 +' like "' + keyword2 + '"';
        }
      }else{
        if( keyword2 === ""){
          //会社名1のみ指定
          str_query = str_query +  FIELD_CODE1 +' like "' + keyword1 + '"';
        }else{
          //会社名１及び会社名２指定
          str_query = str_query +  FIELD_CODE1 +' like "' + keyword1 + '" '+ OR_CONST +' '+ FIELD_CODE2 +' like "' + keyword2 + '"';
        }
      }

      //顧客関係性判定によりクエリ追加
      if( keyword3 !== "0") {
        if ( str_query !== '?query='){
          str_query = str_query + AND_CONST +' ';
        }
        str_query = str_query + PULLDOWN_CODE_NAME + ' in("'+ keyword3 + '")';
      }

      //会社規模選択判定によりクエリ追加
      if( keyword4 !== "0") {
        if ( str_query !== '?query='){
          str_query = str_query + AND_CONST +' ';
        }
        str_query = str_query + RADIO_CODE_NAME + ' in("'+ keyword4 + '")';
      }

      console.log(str_query);

      // GET変数を使って、検索結果へジャンプ！
      document.location = location.origin + location.pathname + str_query;
    }

    // キーワード入力部品を、kintoneヘッダ部分に埋め込む(重複を避けるため、最初に要素をクリアしておく)
    //var aNode = kintone.app.getHeaderMenuSpaceElement()
    var aNode = kintone.app.getHeaderSpaceElement();
    for (var i =aNode.childNodes.length-1; i>=0; i--) {
        aNode.removeChild(aNode.childNodes[i]);
    }

    var HeaderSpace = kintone.app.getHeaderSpaceElement();

    //会社名
    $(HeaderSpace).html($myDiv);
    $($myDiv).append($myListHeaderDiv);
    $($myDiv).append($myInput);

    //OR文字
    $(HeaderSpace).append($myDiv1);
    $($myDiv1).append($myListHeaderDiv1);

    //会社名カナ
    $(HeaderSpace).append($myDiv2);
    $($myDiv2).append($myListHeaderDiv2);
    $($myDiv2).append($myInput2);

    //顧客関連性プルダウン
    $(HeaderSpace).append($myDivUnder);
    $($myDivUnder).append($myDiv3);
    $($myDiv3).append($myListHeaderDiv3);
    $($myDiv3).append($myPullDown);

    //規模ラジオボタン
    $($myDivUnder).append($myDiv4);
    $($myDiv4).append($myListHeaderDiv4);
    $($myDiv4).append($myRadio);

    //検索ボタン
    $(HeaderSpace).append($myDiv5);
    $($myDiv5).append($myButton);

    return event;
  });

})((jQuery));
