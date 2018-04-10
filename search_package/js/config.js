jQuery.noConflict();

(function($, PLUGIN_ID) {
    'use strict';

    // プラグインIDの設定
    var KEY = PLUGIN_ID;
    var CONF = kintone.plugin.app.getConfig(KEY);
    // 入力モード
    // var MODE_ON = '1'; // 変更後チェック実施
    // var MODE_OFF = '0'; // 変更後チェック未実施
    function escapeHtml(htmlstr) {
        return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&quot;').replace(/'/g, '&#39;');
    }

    function setDropdown() {
        // フォーム設計情報を取得し、選択ボックスに代入する
        kintone.api(kintone.api.url('/k/v1/preview/form', true), 'GET', {'app': kintone.app.getId()}, function(resp) {

            for (var i = 0; i < resp.properties.length; i++) {
                var prop = resp.properties[i];
                var $option = $('<option>');

                switch (prop.type) {
                    // 文字列と数値が対象(変更前イベントの対象、テキスト入力可能)
                    case 'SINGLE_LINE_TEXT':
                      $option.attr('value', escapeHtml(prop.label));
                      $option.text(escapeHtml(prop.label));
                      $('#select_field_txt1').append($option.clone());
                      $('#select_field_txt2').append($option.clone());
                      break;

                    case 'DROP_DOWN':
                      $option.attr('value', escapeHtml(prop.label));
                      $option.text(escapeHtml(prop.label));
                      $('#select_field_pulldown').append($option.clone());

                    case 'RADIO_BUTTON':
                        $option.attr('value', escapeHtml(prop.label));
                        $option.text(escapeHtml(prop.label));
                        $('#select_field_radio').append($option.clone());
                        break;

                    default :
                        break;
                }
            }
            // 初期値を設定する
            $('#select_field_txt1').val(CONF['txt1']);
            $('#select_field_txt2').val(CONF['txt2']);
            $('#select_field_pulldown').val(CONF['pulldown']);
            $('#select_field_radio').val(CONF['radio']);
        });
    }

    $(document).ready(function() {

        // 既に値が設定されている場合はフィールドに値を設定する
        if (CONF) {
            // ドロップダウンリストを作成する
            setDropdown();
            $('#check-plugin-change_mode').prop('checked', false);
            // changeイベント有り
            // if (CONF['mode'] === MODE_ON) {
            //     $('#check-plugin-change_mode').prop('checked', true);
            // }
        }

        // 「保存する」ボタン押下時に入力情報を設定する
        $('#check-plugin-submit').click(function() {
            var config = [];
            var txt1 = $('#select_field_txt1').val();
            //var txt2 = $('#select_field_txt2').val();
            var pulldown = $('#select_field_pulldown').val();
            var radio = $('#select_field_radio').val();
            var mode = $('#check-plugin-change_mode').prop('checked');
            // 必須チェック
            //if (txt1 === '' || txt2 === '' || pulldown === '' || radio === '') {
            if (txt1 === '' && pulldown === '' && radio === '') {
                alert('検索項目を１項目以上指定して下さい');
                return;
            }
            config['txt1'] = txt1;
            //config['txt2'] = txt2;
            config['pulldown'] = pulldown;
            config['radio'] = radio;
            // 重複チェック
            //var uniqueConfig = [txt1, txt2, pulldown, radio];
            var uniqueConfig = [txt1, pulldown, radio];
            var uniqueConfig2 = $.grep(uniqueConfig, function(e){return e !== "";}); //空白データ削除
            var uniqueConfig3 = uniqueConfig2.filter(function(value, index, self) {
                return self.indexOf(value) === index; //重複項目削除
            });
            if (uniqueConfig2.length !== uniqueConfig3.length) {
                alert('選択肢が重複しています');
                return;
            }

            // config['mode'] = MODE_OFF;
            // if (mode) {
            //     config['mode'] = MODE_ON;
            // }
            kintone.plugin.app.setConfig(config);
        });

        // 「キャンセル」ボタン押下時の処理
        $('#check-plugin-cancel').click(function() {
            history.back();
        });
    });

})(jQuery, kintone.$PLUGIN_ID);
