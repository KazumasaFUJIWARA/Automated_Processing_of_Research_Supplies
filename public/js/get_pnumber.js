// Description: 研究者番号を入力し、課題番号を取得するためのスクリプト
//export async function nominateProjectNumber(researcherNumber) {
import { nominateProjectNumber } from './module_functions.js';

document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("local-an-fetch");
	fetchButton.addEventListener("click", async function() {
		// ボタンを無効化し、テキストを変更
		fetchButton.disabled = true;
		fetchButton.textContent = '⌛処理中';

		try{
			const researcherNumber = document.getElementById("研究者番号").value.trim();
			await nominateProjectNumber(researcherNumber);
		} catch(error){
			alert("🙇 課題番号のリスト作成に失敗しました \n" + error)
		} finally {
			// ボタンを有効化し、テキストを変更
			fetchButton.disabled = false;
			fetchButton.textContent = '課題番号DB検索';
		}
	});
});
