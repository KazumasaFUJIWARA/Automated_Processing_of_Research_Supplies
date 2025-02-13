/* {{{ export async function nominateProjectNumber(researcherNumber) {
researcher_numberを受け取り、
該当するプロジェクト番号を取得し、
datalistに追加する
*/

export async function nominateProjectNumber(researcherNumber) {
	if (!researcherNumber) {
		// 表示文字を減らす為に, alertしてreturn
		alert("🚨 研究者番号を入力してください.");
		return;
	}

	try {
		const response = await fetch(`/api/projects/${encodeURIComponent(researcherNumber)}/project_numbers`)

		if (!response.ok) {
			const kakenError = await response.json();
			throw new Error(response.status + ": " + kakenError.detail);
		}
		
		// data example: project_number: ['24H00024', '24K16957']
		//datalist id="projct-options"のdatalistを指定
		const projectOptions = document.getElementById("project-options");
		// Clear existing options
		projectOptions.innerHTML = "";

		const data = await response.json();
		console.log(data.project_number);

		// data.project_numberの各要素に対して以下を実行
		data.project_number.forEach(project_number => {
			// option要素を作成
			const option = document.createElement("option");
			// option要素のvalue属性にproject_numberを設定
			option.value = project_number;
			// option要素のtextContentにproject_numberを設定
			option.textContent = project_number;
			// option要素をdatalistに追加
			projectOptions.appendChild(option);
		});

		alert(`${data.project_number.length}件該当しました.プロジェクトを選択してください. プロジェクトがない場合は手入力してください.`);
	} catch (error) {
		throw new Error(error.message);
	}
}
// }}}

/* {{{ export async function searchregisterResearcherNumber() {
researcher_numberをKAKEN検索し、登録上で追記
*/
export async function searchregisterResearcherNumber(name) {
	const researcherOptions = document.getElementById("reseacrcher-options");
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
			throw new Error("❎ " + error);
		}

	}
	// 候補が複数ある場合は throw Error
	else {
		throw new Error("🛑 候補が複数あるため, 停止します. \n 手動で情報を/api/researchers/にPOSTしてください.");
	}
}
// }}}
