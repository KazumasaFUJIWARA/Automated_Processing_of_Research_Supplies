// Description: 研究者番号を入力し、課題番号を取得するためのスクリプト
//export async function nominateProjectNumber(researcherNumber) {
import { nominateProjectNumber } from './nominate_pnumber.js';

document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("local-an-fetch");
	fetchButton.addEventListener("click", function() {

		const loadingIndicator = document.getElementById('loading-local-an-fetch');

		// ボタンを無効化し、テキストを変更
		fetchButton.disabled = true;
		fetchButton.textContent = '⌛処理中';

		const researcherNumber = document.getElementById("研究者番号").value.trim();
		nominateProjectNumber(researcherNumber);

		// ボタンを有効化し、テキストを変更
		fetchButton.disabled = false;
		fetchButton.textContent = '課題番号取得';
	});
});
