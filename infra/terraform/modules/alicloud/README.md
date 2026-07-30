# Alibaba Cloud modules

ここは複数の Alibaba Cloud stack から再利用できる小さな module の置き場
です。現在は provider 設定と state backend の scaffold のみを提供し、単一
resource を包むだけの形式的な module は作りません。

module を追加する場合は、クラウド資源の責務をこの配下へ閉じ込め、入力と
出力の description、利用例、state への影響を README に記載してください。
アプリの domain、service、repository、runtime entrypoint から provider 固有
処理を呼び出さない方針は維持します。
