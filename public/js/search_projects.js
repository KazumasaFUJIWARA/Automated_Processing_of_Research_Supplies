document.addEventListener("DOMContentLoaded", function () {
	const kakenButton = document.getElementById("KAKEN");
	//Buttonをdisableにする
	kakenButton.disabled = true;
	kakenButton.textContent = '⌛ 処理中...';

	if (kakenButton) {
		kakenButton.addEventListener("click", async function () {
			await handleKakenSearch();
		});
	} else {
		console.error("❎ KAKENボタンが見つかりません。");
	}

	kakenButton.disabled = false;
	kakenButton.textContent = '課題番号KAKEN検索';
});

async function handleKakenSearch() {
	const researcherNumber = document.getElementById("研究者番号").value.trim();
	if (!researcherNumber) {
		alert("🚨 研究者番号を入力してください。");
		return;
	}

	try {
		const response = await fetch(`/api/projects/kaken/${encodeURIComponent(researcherNumber)/project_numbers}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" }
		});

		if (!response.ok) {
			throw new Error(`❌ ${response.status} ${response.statusText}`);
		}

		// jsonから課題情報の配列毎にローカルDBに保存する
		const data = await response.json();

		for (const project of data.projects) {
			// /api/projectsにPOSTする
			const postResponse = {
				"projectNumber": project.awardNumber,
				"projectType": project.category,
				"projectTitle": project.title
			};

			const postOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(postResponse)
			};

			const postResult = await fetch("/api/projects", postOptions);

			if (postResult.ok) {
				console.log(`✅ 課題番号 ${project.awardNumber} を追加しました。`);
			} else if (postResult.status === 409) {
				console.error(`ℹ️  課題番号 ${project.awardNumber} は登録ずみです。`);
			} else {
				console.error(`❎ 課題番号 ${project.awardNumber} の追加に失敗しました。`);
			}

			// /api/projectsにPUTする
		}

		// Local DBで

		alert("課題番号の検索と更新が完了しました。");

	} catch (error) {
		console.error("エラー:", error);
		alert(`課題番号の検索中にエラーが発生しました: ${error.message}`);
	}
}
