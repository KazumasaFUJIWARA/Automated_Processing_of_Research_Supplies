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
		const response = await fetch(`/searchProject?rnumber=${encodeURIComponent(researcherNumber)}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" }
		});

		if (!response.ok) {
			throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		if (!data || !data.projects || data.projects.length === 0) {
			alert("該当する課題番号が見つかりませんでした。");
			return;
		}

		console.log("取得した課題番号:", data.projects);

		const projectOptions = document.getElementById("project-options");
		projectOptions.innerHTML = "";
		data.projects.forEach(async (project) => {
			const option = document.createElement("option");
			option.value = project.awardNumber;
			projectOptions.appendChild(option);

			// サーバーに課題情報を保存
			await insertProjectAndAllocation(project, researcherNumber);
		});

		alert("課題番号の検索と更新が完了しました。");

	} catch (error) {
		console.error("エラー:", error);
		alert(`課題番号の検索中にエラーが発生しました: ${error.message}`);
	}
}

async function insertProjectAndAllocation(project, researcherNumber) {
	try {
		// 課題情報をデータベースに更新
		await fetch("/insertProject", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				projectNumber: project.awardNumber,
				projectType: project.category,
				projectTitle: project.title
			})
		});

		//課題の割り当て情報をデータベースに更新
		// Poject.researcherId が researcherNumber と一致する場合は 
		// CI に "None" を入れる
		// 念のため, project.researcherId と researcherNumber は整数型に変換して比較
		if(parseInt(project.researcherId) === parseInt(researcherNumber)){
			await fetch("/insertAllocation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectNumber: project.awardNumber,
					distributedCampus: null,
					distributedLocation: null,
					installedCampus: null,
					installedLocation: null,
					PI: project.researcherId,
					CI: "NONE"
				})
			});
		}else{
			await fetch("/insertAllocation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectNumber: project.awardNumber,
					distributedCampus: null,
					distributedLocation: null,
					installedCampus: null,
					installedLocation: null,
					PI: project.researcherId,
					CI: researcherNumber
				})
			});
		}

		console.log(`プロジェクト ${project.awardNumber} をデータベースに更新しました。`);
	} catch (error) {
		console.error("プロジェクト更新エラー:", error);
	}
}

