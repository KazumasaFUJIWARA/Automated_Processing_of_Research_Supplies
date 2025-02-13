// Description: 研究者番号を入力し、課題番号を取得するためのスクリプト
//export async function nominateProjectNumber(researcherNumber) {
import { nominateProjectNumber } from './nominate_pnumber.js';

//{{{ document.addEventListener("DOMContentLoaded", function () {
document.addEventListener("DOMContentLoaded", function () {
	const pdfImportButton = document.getElementById("pdf-import");

	pdfImportButton.addEventListener("click", async () => {
		pdfImportButton.disabled = true;
		pdfImportButton.textContent = '⌛処理中';
		const pdfInput = document.getElementById("pdfUpload");
		const pdfFile = pdfInput.files[0];
		if (!pdfFile) {
			alert("🚨 PDFファイルを選択してください");
			return;
		}

		const formData = new FormData();
		formData.append('pdf', pdfFile);

		try {
			let response = await fetch('/api/pdf2json/', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('❎ Failed to process PDF');

			const extracted = await response.json();
			console.log('Processed JSON Data:', extracted);

			// Titleによる条件分岐
			if (extracted.title === "領収書") {
				document.getElementById("payment").value = "立替";
				document.getElementById("支払者").value = extracted.receiver_name;
			} else if (extracted.title === "納品書") {
				document.getElementById("payment").value = "業者払い";
			}

			// PDF から取得した共通項目を転記
			document.getElementById("支払先").value = extracted.issuer;
			document.getElementById("研究者氏名").value = extracted.receiver_name;

			// 研究者番号の検索（検索後に課題番号の検索も実行）
			//fetchResearcherNumberAndProjects(extracted.receiver_name);
			response = await fetch(`/api/researchers/by-name/${encodeURIComponent(extracted.receiver_name)}`);
			if (response.ok) {
				const data = await response.json();
				document.getElementById("研究者番号").value = data.研究者番号;
			} else {

			}


			// 項目情報の転記
			fillItemData(extracted.items);

			alert("✅ PDF情報をフォームに反映しました。");

		} catch(error){
			alert("🙇 PDFの処理中にエラーが発生しました。\n " + error.message);
		}
	});
});
//}}}

//{{{ function fillItemData(items) {
// JSON から項目情報を埋める
function fillItemData(items) {
	items.forEach((item, index) => {
		const rowNumber = String(index + 1).padStart(2, "0"); // 例: "01", "02"
		document.getElementById(`項目${rowNumber}`).textContent = item.product_name || "";
		document.getElementById(`メーカー${rowNumber}`).textContent = item.provider || "";
		document.getElementById(`型番${rowNumber}`).textContent = item.model || "";
		document.getElementById(`個数${rowNumber}`).textContent = item.number || "";
		document.getElementById(`単価${rowNumber}`).textContent = item.unite_price || "";
		document.getElementById(`金額${rowNumber}`).textContent = item.total_price || "";

		// 費目の自動選択
		const unitPrice = parseFloat(item.unite_price) || 0;
		const expenseTypeField = document.getElementById(`費目${rowNumber}`);
		if (unitPrice < 10000) {
			expenseTypeField.value = "消耗品";
		} else if (unitPrice >= 200000) {
			expenseTypeField.value = "備品";
		} else {
			expenseTypeField.value = "用品";
		}
	});
}
// }}}
