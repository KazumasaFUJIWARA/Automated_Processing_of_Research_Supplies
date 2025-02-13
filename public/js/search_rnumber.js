import { searchregisterResearcherNumber } from './module_functions.js';

document.getElementById("研究者番号KAKEN検索").addEventListener("click", async function() {
	const researcherNameInput = document.getElementById("研究者氏名");

	const fetchButton = document.getElementById('研究者番号KAKEN検索');

	// ボタンを無効化し、テキストを変更
	fetchButton.disabled = true;
	fetchButton.textContent = '⌛ 処理中';

	const name = researcherNameInput.value.replace(/\s+/g, "");

	if (!name) {
		alert("🚨 研究者氏名を入力してください。");
		fetchButton.disabled = false;
		fetchButton.textContent = '研究者番号KAKEN検索';
		return;
	}

	try {
		searchregisterResearcherNumber(name);
	} catch (error) {
		alert("🙇 研究者番号の検索に失敗しました。 \n" + error);
	} finally {
		// ボタンを有効化し、テキストを戻す
		fetchButton.disabled = false;
		fetchButton.textContent = '研究者番号KAKEN検索';
	}
});
