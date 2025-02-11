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

			if (postResearcherResult.ok) {
				console.log(`✅ a研究者番号 ${project.researcherId} を追加しました。`);
			} else if (postResearcherResult.status === 409) {
				console.error(`ℹ️  研究者番号 ${project.researcherId} は登録ずみです。`);
			} else {
				console.error(`❎ 研究者番号 ${project.researcherId} の追加に失敗しました。`);
			}
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

			if (postResult.ok) {
				console.log(`✅ 課題番号 ${project.awardNumber} を追加しました。`);
			} else if (postResult.status === 409) {
				console.error(`aiee  課題番号 ${project.awardNumber} は登録ずみです。`);
			} else {
				console.error(`❎ 課題番号 ${project.awardNumber} の追加に失敗しました。`);
			}
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

				if (postAllocationResult.ok) {
					console.log(`✅ PI ${project.researcherId} を追加しました。`);
				} else if (postAllocationResult.status === 409) {
					console.error(`ℹ️  PI ${project.researcherId} は登録ずみです。`);
				} else {
					console.error(`❎ PI ${project.researcherId} の追加に失敗しました。`);
				}

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

				if (postAllocationResult.ok) {
					console.log(`✅ CI ${project.researcherId} を追加しました。`);
				} else if (postAllocationResult.status === 409) {
					console.error(`ℹ️  CI ${project.researcherId} は登録ずみです。`);
				} else {
					console.error(`❎ CI ${project.researcherId} の追加に失敗しました。`);
				}
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
