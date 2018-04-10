/*
※kintoneでの検索の注意点！！
1, １文字では検索出来ない(最低でも２文字以上)
2, 英数字検索が単語単位(cyで、cybozeがヒットしない！)
https://help.cybozu.com/ja/k/user/search_details.html

*/

// 設定値
const FIELD_CODE1 = "会社名";
const FIELD_CODE_NAME = "会社名";

const FIELD_CODE2 = "会社名_カナ";
const FIELD_CODE2_NAME = "会社名_カナ";

const FIELD_CODE3 = "略称";
const FIELD_CODE3_NAME = "略称";

const FIELD_CODE4  = "事業所種別";
const FIELD_CODE4_NAME = "略称";

const OR_CONST = "or";  // 必ず小文字
const AND_CONST = "and";  // 必ず小文字


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


    //事業所種別ラジオボタン
    var $myDiv2 = $("<div>",{ addClass: "myRadio"}).css({
                  "display": 'inline-block',
                  "margin-left": '30px',
                  "vertical-align": 'top',
                  "margin-bottom":'0'
    });
    var $myListHeaderDiv2 = $("<p>", { text: '会社規模' }).css({"margin-top":'0',"margin-bottom": '0' });
    var $myRadio =
      $('<div>').addClass('kintoneplugin-input-radio').append(
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-0').val('法人').prop('checked', true),
          $('<label>').prop('for', 'radio-0').html('法人')
        ),
        $('<span>').addClass('kintoneplugin-input-radio-item').append(
          $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-1').val('個人'),
          $('<label>').prop('for', 'radio-1').html('個人')
        ),
        // $('<span>').addClass('kintoneplugin-input-radio-item').append(
        //   $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-2').val('150人未満'),
        //   $('<label>').prop('for', 'radio-2').html('150人未満')
        // ),
        // $('<span>').addClass('kintoneplugin-input-radio-item').append(
        //   $('<input>').prop('type', 'radio').prop('name', 'radio').prop('id', 'radio-3').val('50人未満'),
        //   $('<label>').prop('for', 'radio-3').html('50人未満')
        // )
      );

      if(result[ FIELD_CODE4_NAME ] != undefined){
        var key_string4 = result[ FIELD_CODE4_NAME ].substr(2,6).replace('"', '');

        $('input:radio[name="radio"]').ready(function() {
          // GET引数内に直前の検索キーワードがあったら格納しておく
          $('input:radio[name="radio"]').val([key_string4]);　　
        });
      }

    // 検索ボタン
    var $myDiv3 = $("<div>",{ addClass: "mybutton"}).css({"margin-top":'0px',"margin-bottom": '20px' });
    var $myButton = $("<button>").addClass('kintoneplugin-button-normal').text('検索');
    $($myButton).click(function(){
      keyword_search();
    });

    // キーワード検索の関数
    function keyword_search(){
      var keyword1 = $myInput.val();
      var keyword2 = $("input:radio[name='radio']:checked").val();

      //クエリ生成
      var str_query = '?query=';

      //会社名入力判定によりクエリ生成
      if( keyword1 ==="" ){
        //会社名空白
        //何もしない
      }else{
          //会社名
          str_query = str_query +  FIELD_CODE1 +' like "' + keyword1 + '" '+ OR_CONST +' '+ FIELD_CODE2 +' like "' + keyword2 + '" ' + OR_CONST +' '+ FIELD_CODE3 +' like "' + keyword3 + '" ';
      }

      //会社規模選択判定によりクエリ追加
      if ( str_query !== '?query='){
        str_query = str_query + AND_CONST +' ';
      }
      str_query = str_query + FIELD_CODE4_NAME + ' in("'+ keyword2 + '")';

      console.log(str_query);

      // GET変数を使って、検索結果へジャンプ！
      document.location = location.origin + location.pathname + str_query;
    }

    // キーワード入力部品を、kintoneヘッダ部分に埋め込む(重複を避けるため、最初に要素をクリアしておく)
    var aNode = kintone.app.getHeaderMenuSpaceElement()
    //var aNode = kintone.app.getHeaderSpaceElement();
    for (var i =aNode.childNodes.length-1; i>=0; i--) {
        aNode.removeChild(aNode.childNodes[i]);
    }

    var HeaderSpace = kintone.app.getHeaderMenuSpaceElement()

    //会社名
    $(HeaderSpace).html($myDiv);
    $($myDiv).append($myListHeaderDiv);
    $($myDiv).append($myInput);

    //事業所種別ラジオボタン
    $($myDivUnder).append($myDiv2);
    $($myDiv2).append($myListHeaderDiv2);
    $($myDiv2).append($myRadio);

    //検索ボタン
    $(HeaderSpace).append($myDiv3);
    $($myDiv3).append($myButton);

    return event;
  });

})((jQuery));
