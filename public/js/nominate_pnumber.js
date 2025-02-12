/*
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
