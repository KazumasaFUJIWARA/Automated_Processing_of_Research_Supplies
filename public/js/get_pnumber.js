document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("local-an-fetch");
	fetchButton.addEventListener("click", function() {

		const loadingIndicator = document.getElementById('loading-local-an-fetch');

		// ボタンを無効化し、テキストを変更
		fetchButton.disabled = true;
		fetchButton.textContent = '処理中...';
		loadingIndicator.style.display = 'inline-block'; // ローディング表示

		const researcherNumber = document.getElementById("研究者番号").value.trim();
		if (!researcherNumber) {
			alert("研究者番号を入力してください。");
			return;
		}

		fetch(`/api/projects/${encodeURIComponent(researcherNumber)}/project_numbers`)
			.then(response => response.json())
			// 返り値の形式は { project_number: [課題番号1, 課題番号2, ...] }
			.then(data => {
				// data example: project_number: ['24H00024', '24K16957']
				//datalist id="projct-options"のdatalistを指定
				const projectOptions = document.getElementById("project-options");
				// Clear existing options
				projectOptions.innerHTML = "";

				console.log(data.project_number);

				// data.project_number=[pnum1, pnum2, ...]が存在し、その要素数が1以上の場合
				if (data.project_number && data.project_number.length > 0) {
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
					console.log(`${data.project_number.length} projects added to the datalist.`);
				} else {
					console.log("No projects found.");
					alert("該当するプロジェクトが見つかりませんでした.");
				}
			})
			.catch(error => {
				console.error("Error fetching data: ", error);
			});
		// ボタンを有効化し、テキストを戻す
		fetchButton.disabled = false;
		fetchButton.textContent = '課題番号DB検索';
		loadingIndicator.style.display = 'none'; // ローディング非表示
	});
});

