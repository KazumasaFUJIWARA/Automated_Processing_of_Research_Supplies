document.addEventListener("DOMContentLoaded", function () {
	const kakenButton = document.getElementById("KAKEN");
	if (kakenButton) {
		kakenButton.addEventListener("click", async function () {
			await handleKakenSearch();
		});
	} else {
		console.error("エラー: KAKENボタンが見つかりません。");
	}
});

async function handleKakenSearch() {
	const researcherNumber = document.getElementById("研究者番号").value.trim();
	if (!researcherNumber) {
		alert("研究者番号を入力してください。");
		return;
	}

	try {
		const response = await fetch(`/projects/${encodeURIComponent(researcherNumber)/project_numbers}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" }
		});

		console.log("response", response);

		if (!response.ok) {
			throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		if (!data || !data.課題番号 || data.課題番号.length === 0) {
			alert("該当する課題番号がローカルDB内で見つかりませんでした。");
			return;
		}

		const projectOptions = document.getElementById("project-options");
		projectOptions.innerHTML = "";
		data.課題番号.forEach(async (project) => {
			const option = document.createElement("option");
			option.value = project.awardNumber;
			projectOptions.appendChild(option);

		});

		alert("課題番号の検索と更新が完了しました。");

	} catch (error) {
		console.error("エラー:", error);
		alert(`課題番号の検索中にエラーが発生しました: ${error.message}`);
	}
}
