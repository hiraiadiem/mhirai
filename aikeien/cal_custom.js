/*
 *   カレンダー機能試作
 */

(function() {
  "use strict";

  // カレンダー上でイベントの時間を変更した時の更新処理
  function putRecord(event) {
      var evTitle = '作業内容';
      var stdtKey = '開始日時';
      var eddtKey = '終了日時';
      var evPlant = '工場名';
      var evLine = 'ライン名';
      var evBudget = '予実管理';

      kintone.api('/k/v1/record', 'PUT', {
          'app': kintone.app.getId(),
          'id': event.rec,
          'record': (function() {
              var param = {};
              param[stdtKey] = {
                  'value': moment(event.start).add(-9, 'hours').format('YYYY-MM-DDTHH:mm:ssZ').replace(/^(.{10})./,"$1T")
                  //'value': event.start.format('YYYY-MM-DDTHH:mm:ssZ').replace(/^(.{10})./,"$1T")
              };
              param[eddtKey] = {
                  'value': moment(event.end).add(-9, 'hours').format('YYYY-MM-DDTHH:mm:ssZ').replace(/^(.{10})./,"$1T")
                  //'value': event.end.format('YYYY-MM-DDTHH:mm:ssZ').replace(/^(.{10})./,"$1T")
              };
              param[evPlant] = {
                  'value': event.resourceId.substr(0,event.resourceId.search("ライン"))　//工場名を切り出し
              };
              param[evLine] = {
                  'value': event.resourceId.substr(event.resourceId.search("ライン"),5)  //ライン名を切り出し
              };
              param[evBudget] = {
                  'value': event.resourceId.substr(-2,2)  //リソースＩＤの後ろから２文字切り出し（予定・実績）
              };
              return param;
          })()
      });
  }

  // 全件取得関数
  function fetchRecords(appId, query, opt_offset, opt_limit, opt_records) {
      var offset = opt_offset || 0;
      var limit = opt_limit || 500;
      var allRecords = opt_records || [];
      var params = {app: appId, query: query + ' limit ' + limit + ' offset ' + offset};
      return kintone.api('/k/v1/records', 'GET', params).then(function(resp) {
          allRecords = allRecords.concat(resp.records);
          if (resp.records.length === limit) {
              return fetchRecords(appId, query, offset + limit, limit, allRecords);
          }
          return allRecords;
      });
  }


      function initCalendar() {

      var evTitle = '作業内容';
      var evStart = '開始日時';
      var evEnd = '終了日時';
      var evPlant = '工場名';
      var evLine = 'ライン名';
      var evBudget = '予実管理';
      var evStatus = 'ステータス';
      var mastarAppId = '603';

      // リソース格納用配列
      var resources = [];
      // リソースラベル格納用変数
      var resourceLabel = '';

      var startDate;
      var endDate;
      var editable;
      var backgroundColor;
      var txtColor;

      //工場・ライン情報を取得する
      kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {'app': mastarAppId, "fields": [evPlant, evLine] }, function(resp) {

        //console.log('******resp.records.length = ' +resp.records.length);

        // var rescouce_i =0;　//リソース用配列に親子並列で設定するための添え字
        // for(var i= 0 ; i<resp.records.length; i++){
        //   //まず工場名（親）をリソースに設定
        //   resources[rescouce_i] = { "id":resp.records[i][evPlant]['value'], "title":resp.records[i][evPlant]['value'] };
        //   //for( var k=0; k<resp.records[i][evLine]['value'].length;k++){
        //   for( var k=0; k<resp.records[i][evLine]['value'].length;k++){
        //     //ライン名（子）をリソースに設定
        //     resouce_i++; //リソース用配列の添え字インクリメント（子のため）
        //     resources[rescouce_i] = {
        //       "id":  resp.records[i].evPlant.value+resp.records[i][evLine]['value'][k], //工場名＋ライン名結合
        //       "parentId": resp.records[i][evPlant]['value'], //工場名
        //       "title": resp.records[i][evLine]['value'][k] //ライン名
        //     };
        //   }
        //   resouce_i++;  //リソース用配列の添え字インクリメント（次の親のため）
        // }

        resources = [
    {
      id: '埼玉工場ライン#1予定',
      plant: '埼玉工場',
      line : 'ライン#1',
      BudgetControl: '予定'
    },
    {
      id: '埼玉工場ライン#1実績',
      plant: '埼玉工場',
      line : 'ライン#1',
      BudgetControl: '実績'
    },
    {
      id: '埼玉工場ライン#2予定',
      plant: '埼玉工場',
      line : 'ライン#2',
      BudgetControl: '予定'
    },
    {
      id: '埼玉工場ライン#2実績',
      plant: '埼玉工場',
      line : 'ライン#2',
      BudgetControl: '実績'
    },
    {
      id: '横浜工場ライン#1予定',
      plant: '横浜工場',
      line : 'ライン#1',
      BudgetControl: '予定'
    },
    {
      id: '横浜工場ライン#1実績',
      plant: '横浜工場',
      line : 'ライン#1',
      BudgetControl: '実績'
    },
    {
      id: '横浜工場ライン#2予定',
      plant: '横浜工場',
      line : 'ライン#2',
      BudgetControl: '予定'
    },
    {
      id: '横浜工場ライン#2実績',
      plant: '横浜工場',
      line : 'ライン#2',
      BudgetControl: '実績'
    },
    {
      id: '茨木工場ライン#1予定',
      plant: '茨木工場',
      line : 'ライン#1',
      BudgetControl: '予定'
    },
    {
      id: '茨木工場ライン#1実績',
      plant: '茨木工場',
      line : 'ライン#1',
      BudgetControl: '実績'
    },
    {
      id: '茨木工場ライン#2予定',
      plant: '茨木工場',
      line : 'ライン#2',
      BudgetControl: '予定'
    },
    {
      id: '茨木工場ライン#2実績',
      plant: '茨木工場',
      line : 'ライン#2',
      BudgetControl: '実績'
    }
    ]; //resource

  }); //GET

      fetchRecords(kintone.app.getId(), '').then(function(calRecords) {

        var records = calRecords;
        var recEvents = [];
        // アプリにレコードがある場合のみループ
        if (records.length !== 0) {
            for (var i = 0; i < records.length; i++) {
                startDate = moment(records[i][evStart].value);
                endDate = moment(records[i][evEnd].value);

                //ステータスによってスロット表示・編集条件を変更する
                switch (records[i][evStatus].value) {
                  case "確定":
                    editable = false; //ドロップ＆ドラッグ不可
                    backgroundColor = '#FF0000';  //赤
                    txtColor = '#FFFFFF';
                    break;
                  case "完了":
                    editable = false; //ドロップ＆ドラッグ不可
                    backgroundColor = '#000000';  //黒
                    txtColor = '#FFFFFF';
                    break;
                  default:
                    backgroundColor = '#2CC0DE';  //青
                    txtColor = '#FFFFFF';
                    editable = true; //ドロップ＆ドラッグ可
                }

                recEvents.push({
                    title: records[i][evTitle].value,
                    start: startDate.format('YYYY-MM-DD HH:mm:ss'),
                    end: endDate.format('YYYY-MM-DD HH:mm:ss'),
                    url: location.protocol + '//' + location.hostname + '/k/' +
                        kintone.app.getId() + '/show#record=' + records[i].$id.value,
                    rec: records[i].$id.value,
                    resourceId:records[i][evPlant].value+records[i][evLine].value+records[i][evBudget].value,
                    editable: editable,
                    // durationEditable: true,
                    // startEditable: true,
                    // unselectAuto: true,
                    // unselectCancel: '',
                    // dragRevertDuration: 100,
                    // // 終日予定は表示しない
                    // allDaySlot: false,
                    backgroundColor:backgroundColor,
                    textColor:txtColor

                });
            } //for
        } //if



        // カレンダーの設定
        $('#calendar').fullCalendar({
          lang: 'ja',
          // 上部のボタンやタイトル
          header: {
            left: 'prev,next, today',
            center: 'title',
            //right: ' month,agendaWeek,agendaDay'
            //right: 'month,agendaWeek,agendaDay,timelineMonth,timelineWeek,timelineDay'
            right: 'month,timelineDay'

          },
          // 各カレンダーの1日毎の表記方法
          // columnFormat: {
          //     month: 'ddd',
          //     week: 'M/D[(]ddd[)]',
          //     day: 'M/D[(]ddd[)]'
          // },
          // // 各カレンダーのタイトル
          // views: {
          //   timelineMonth: { // name of view
          //     titleFormat: 'YYYY年M月'// other view-specific options here
          //   }
          // },
          // titleFormat: {
          //     month: 'YYYY年M月',
          //     week: 'YYYY年 M月 D日',
          //     day: 'YYYY年 M月 D日[(]ddd[)]'
          // },
          // ボタン文字列の表記
          buttonText: {
            prev: '＜',
            next: '＞',
            today: '今日',
            month: '月',
            week: '週',
            day: '日'
          },
          // 月曜開始のカレンダーとする
          firstDay: '1',
          // 週末（土日）を表示
          weekends: true,
          // デフォルトは月カレンダー
          //defaultView: 'month',
          defaultView:'timelineDay',
          // 月の表記
          monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          // 曜日の表記
          dayNames: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'],
          dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
          // 各カレンダーの各時間の表記
          slotLabelFormat:'HH時',
          //timeFormat: 'HH時',
          // イベントをカレンダー上から編集する
          editable: true,
          durationEditable: true,
          startEditable: true,
          unselectAuto: true,
          unselectCancel: '',
          dragRevertDuration: 100,
          // 終日予定は表示しない
          allDaySlot: false,
          // 0時区切りのカレンダーとする
          nextDayThreshold: '00:00:00',
          // カレンダーの高さ
          height: 500,
          contentHeight: 400,
          // 時間軸の単位
          slotDuration: '01:00:00',
          // 何分刻みでバーを動かすか
          snapDuration: '01:00:00',
          // 日カレンダーのみ詳細に表示するための設定
          views: {
            day: {
                slotDuration: '00:10:00',
                snapDuration: '00:10:00',
                scrollTime: '06:00:00',
                titleFormat: 'YYYY年M月D日(ddd)'
            }
          },
          minTime: '07:00:00',
          maxTime: '20:00:00',
          // 初期時間位置
          scrollTime: '07:00:00',
          // イベントオーバーラップ不可
          eventOverlap: false,
          // 月カレンダーでイベントが多い場合に表所を省略する
          eventLimit: true,   //タイムラインビューだけなら必要なし
          eventLimitText: 'もっと',　//タイムラインビューだけなら必要なし
          eventResize: function(ev, delta, revertFunc, jsEvent, ui, view) {
            putRecord(ev);
            $('#calendar').fullCalendar('unselect');
          },
          eventDrop: function(ev, delta, revertFunc, jsEvent, ui, view) {
            putRecord(ev);
            $('#calendar').fullCalendar('unselect');
          },
          eventClick: function(calEvent, jsEvent, view) {
            swal("処理を選択して下さい", {
              buttons: {
                cancel: "戻る",
                goDetail: {
                  text: "予定を編集する",
                  value: "goDatail",
                },
                copyDetail:  {
                  text: "予定から実績を作成",
                  value: "copyDetail",
                },
              },
            })
            .then((value) => {
              switch (value) {

                case "goDatail":
                  swal("ここで詳細へ遷移");
                  break;

                case "copyDetail":
                  swal("ここで実績を作る処理を実行して詳細へ遷移");
                  break;

                default:
                  swal("何もしない");
              }
            });

            /*****　swalバージョン１対応**********/
              // var titleInput = function(){
      				// 	swal({
      				// 		title: "処理を選択して下さい",
      				// 		//text: strDateTime,
      				// 		//type: "input",
      				// 		showCancelButton: true,
      				// 		showLoaderOnConfirm: true,
      				// 		animation: "slide-from-top"
      				// 	},
      				// 	//function(inputValue){
              //   function(){
              //
              //     alert("ここに入ってほしい");
      				// 		// if (inputValue === false){
              //     //   return false;
              //     // }else{
              //     //   //registEvent(null, start, end, (typeof start._i == 'string'), inputValue, (resource) ? resource.id : null);
              //     //   alert("hahahahaha");
              //     // }
      				// 	});
      				// };
      				// titleInput();

            /*****　swalバージョン１対応**********/

          }, //eventclick
          eventSources: [{
            events: recEvents
          }],
          //スケジューラー
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
          resourceAreaWidth: '25%',
          resourceColumns: [
                  {
                      group: true,
                      labelText: evPlant,
                      field: 'plant'
                  },
                  {
                      group: true,
                      labelText: evLine,
                      field: 'line'
                  },
                  {
                      labelText: evBudget,
                      field: 'BudgetControl'
                  }
              ],
          resources: resources
        }); //fullCalendar
      });   //fetchRecords
    } //init function

    kintone.events.on(['app.record.index.show'], function(event) {

      //ヘッダースペースにタイムラインを表示
      if (document.getElementById('calendar') !== null) {
        return;
      }
      var HeaderSpace = kintone.app.getHeaderSpaceElement();
      var $myDiv = $("<div>", { id : "calendar"});
      $(HeaderSpace).html($myDiv);

      initCalendar();
      return event;

  });     //kintone events on
})();
