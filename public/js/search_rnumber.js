document.getElementById("研究者番号KAKEN検索").addEventListener("click", async function() {
	const researcherNameInput = document.getElementById("研究者氏名");
	const researcherOptions = document.getElementById("reseacrcher-options");

	const fetchButton = document.getElementById('研究者番号KAKEN検索');

	// ボタンを無効化し、テキストを変更
	fetchButton.disabled = true;
	fetchButton.textContent = '⌛ 処理中...';

	const name = researcherNameInput.value.replace(/\s+/g, "");

	if (!name) {
		alert("🚨 研究者氏名を入力してください。");
		fetchButton.disabled = false;
		fetchButton.textContent = '研究者番号KAKEN検索';
		return;
	}

	try {
		// console.log("検索リクエスト📡: ", name);
		const response = await fetch(`/api/researchers/kaken/by-name/${encodeURIComponent(name)}`);

		// 404 error はresponse.okで判定しないとcatchに入らない
		if (!response.ok) {
			const data = await response.json();
			throw new Error(response.status + ": " + data.detail);
		}

		const data = await response.json();

		// 候補のリストをクリア
		researcherOptions.innerHTML = "";

		// 検索結果がある場合
		data.researcher_number.forEach(id => {
			if (Array.isArray(id)) {
				id = id[0];  // 配列の場合は最初の要素を取得
			}
			const option = document.createElement("option");
			option.value = id.toString();
			researcherOptions.appendChild(option);
		});

		// lengthが1の場合は自動入力
		if (data.researcher_number.length === 1) {
			document.getElementById("研究者番号").value = data.researcher_number[0];
			// 検索結果をresearchersテーブルに追加
			try{
				// /api/researchers/にPOST
				// {
				//  "researcherNumber": "string",
				//  "researcherName": "string"
				// }
				const response2 = await fetch("/api/researchers/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						researcherNumber: data.researcher_number[0],
						researcherName: name,
					}),
				});

				// response2でのresultを確認
				const result2 = await response2.json();
				console.log("🖥️レスポンス: ", result2);

			} catch (error) {
				console.error("🚨:", error);
			}

		}
		// 候補が複数ある場合は throw Error
		else {
			throw new Error("🛑 候補が複数あるため, 停止します. \n 手動で情報を/api/researchers/にPOSTしてください.");
		}
	} catch (error) {
		alert("🙇 研究者番号の検索に失敗しました。 \n" + error);
	} finally {
		// ボタンを有効化し、テキストを戻す
		fetchButton.disabled = false;
		fetchButton.textContent = '研究者番号KAKEN検索';
	}
});
