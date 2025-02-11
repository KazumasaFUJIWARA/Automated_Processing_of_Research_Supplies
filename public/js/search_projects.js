// Description: 研究者番号を入力し、課題番号を取得するためのスクリプト
//export async function nominateProjectNumber(researcherNumber) {
import { nominateProjectNumber } from './nominate_pnumber.js';

//{{{ async function handleKakenSearch(researcherNumber) {
//KAKEN APIを呼び出して、課題番号を取得し, Local DBに保存する
async function handleKakenSearch(researcherNumber) {
	if (!researcherNumber) {
		throw new Error("❎ No researcher number provided.");
	}

	try {
		const response = await fetch(`/api/projects/kaken/${encodeURIComponent(researcherNumber)}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" }
		});

		if (!response.ok) {
			throw new Error(`❎ ${response.status} ${response.statusText}`);
		}

		// jsonから課題情報の配列毎にローカルDBに保存する
		const data = await response.json();

		for (const project of data.projects) {
			//{{{ /api/researchers/にPOSTする
			// project.researcherNameの空白を削除
			const postResearcherResponse = {
				"researcherNumber": project.researcherId,
				"researcherName": project.researcherName.replace(/\s+/g, "")
			};

			const postResearcherOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(postResearcherResponse)
			};

			const postResearcherResult = await fetch("/api/researchers/", postResearcherOptions);
			//}}}

			//{{{ /api/projectsにPOSTする
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
			//}}}

			//{{{ /api/projects/allocations/にPOSTする
			// project.researcherId=researcherNumberなら
			//PI=researcherNumber, CI="NONE"
			// project.researcherId!=researcherNumberなら
			// PI=project.researcherId, CI=researcherNumber
			if (project.researcherId === researcherNumber) {
				const postAllocationResponse = {
					"projectNumber": project.awardNumber,
					"PI": researcherNumber,
					"CI": "NONE",
					"deliveredCampus": "",
					"deliveredLocation": "",
					"installedCampus": "",
					"installedLocation": ""
				};
				const postAllocationOptions = {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(postAllocationResponse)
				};
				const postAllocationResult = await fetch("/api/projects/allocations/", postAllocationOptions);
			} else {
				const postAllocationResponse = {
					"projectNumber": project.awardNumber,
					"PI": project.researcherId,
					"CI": researcherNumber,
					"deliveredCampus": "",
					"deliveredLocation": "",
					"installedCampus": "",
					"installedLocation": ""
				};
				const postAllocationOptions = {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(postAllocationResponse)
				};
				const postAllocationResult = await fetch("/api/projects/allocations/", postAllocationOptions);
			}
			//}}}
		}
	} catch (error) {
		throw new Error(`❎ ${error.message}`);
	}
}
//}}}

//{{{ document.addEventListener("DOMContentLoaded", async function () {
document.addEventListener("DOMContentLoaded", async function () {
	const kakenButton = document.getElementById("KAKEN");
	kakenButton.addEventListener("click", async function () {
		//Buttonを処理中無効化
		kakenButton.disabled = true;
		kakenButton.textContent = '⌛ 処理中...';

		try {
			const researcherNumber = document.getElementById("研究者番号").value.trim();
			//handleKakenSearchが終わるまで, nominateProjectNumberを実行しない
			await handleKakenSearch(researcherNumber);
			await nominateProjectNumber(researcherNumber);
		} catch (error) {
			console.error("エラー:", error);
			alert(`🙇 課題番号の処理中にエラーが発生しました\n ${error.message}`);
		} finally {
			kakenButton.disabled = false;
			kakenButton.textContent = '課題番号KAKEN検索';
		}
	});
});
//}}}
