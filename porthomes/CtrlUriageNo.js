/*********************************************************************
[ソースファイル名] CtrlUriageNo.js
[アプリ名] 売上管理アプリ
[アプリURL] https://porthomes.cybozu.com/k/40/

[実装機能]
　(1)自動採番フィールドの操作不可を制御する。
[アプリIDの設定] ■必要  □不要
[タイプ] ■PC用 / □スマートフォン用
[アクセス権の設定] □必要　■不要
[参照ライブラリ]
　(1)なし
 Copyright(c)　ADIEM.inc
*********************************************************************/
(function() {
    "use strict";

    // 新規作成画面表示
    kintone.events.on('app.record.create.show', function(event) {
        var record = event.record;
        //フィールドを非活性にする
        record['自動採番'].disabled = true;
        return event;
    });

    // 編集画面表示
    kintone.events.on(['app.record.edit.show', 'app.record.index.edit.show'], function(event) {
        var record = event.record;
        //フィールドを非活性にする
        record['自動採番'].disabled = true;
        return event;
    });

})();