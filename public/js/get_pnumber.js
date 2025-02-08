document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("local-an-fetch");
	fetchButton.addEventListener("click", function() {
		const researcherNumber = document.getElementById("研究者番号").value.trim();
		if (!researcherNumber) {
			alert("研究者番号を入力してください。");
			return;
		}

		fetch(`/allocations:get:pnumber?rnumber=${encodeURIComponent(researcherNumber)}`)
			.then(response => response.json())
			// 返り値の形式は { pnumbers: [課題番号1, 課題番号2, ...] }
			.then(data => {
				// data example: pnumbers: ['24H00024', '24K16957']
				//datalist id="projct-options"のdatalistを指定
				const projectOptions = document.getElementById("project-options");
				// Clear existing options
				projectOptions.innerHTML = "";

				console.log(data.pnumbers);

				// data.pnumbers=[pnum1, pnum2, ...]が存在し、その要素数が1以上の場合
				if (data.pnumbers && data.pnumbers.length > 0) {
					// data.pnumbersの各要素に対して以下を実行
					data.pnumbers.forEach(pnumbers => {
						// option要素を作成
						const option = document.createElement("option");
						// option要素のvalue属性にpnumbersを設定
						option.value = pnumbers;
						// option要素のtextContentにpnumbersを設定
						option.textContent = pnumbers;
						// option要素をdatalistに追加
						projectOptions.appendChild(option);
					});

					alert(`${data.pnumbers.length}件該当しました.プロジェクトを選択してください. プロジェクトがない場合は手入力してください.`);
					console.log(`${data.pnumbers.length} projects added to the datalist.`);
				} else {
					console.log("No projects found.");
					alert("該当するプロジェクトが見つかりませんでした.");
				}
			})
			.catch(error => {
				console.error("Error fetching data: ", error);
			});
	});
});

