document.getElementById('Json-export').addEventListener('click', function () {
	// 全ての input と select を取得
	const inputs = document.querySelectorAll('.right-panel input, .right-panel select, .right-panel td[contenteditable="true"]');
	// const inputs = document.querySelectorAll('.right-panel input, .right-panel select');
	const data = {};

	// 各 input, select の値を data に格納
	inputs.forEach(input => {
		const id = input.id; // 各要素の id
		// const value = input.value; // 各要素の値
		const value = input.tagName === 'TD' ? input.textContent.trim() : input.value; // td の場合は textContent
		if (id) { // id がある場合のみ格納
			data[id] = value;
		}
	});

	// JSON 文字列に変換
	const json = JSON.stringify(data, null, 2);

	// JSON ファイルを作成しダウンロード
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;

	// json名は APRSYYYYMMDDHHMMSS.json
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const day = now.getDate();
	const hour = now.getHours();
	const minute = now.getMinutes();
	const second = now.getSeconds();
	const filename = 'APRS' + year + ('0' + month).slice(-2) + ('0' + day).slice(-2) + ('0' + hour).slice(-2) + ('0' + minute).slice(-2) + ('0' + second).slice(-2) + '.json';
	link.download = filename; // ダウンロードするファイル名
	// link.download = 'data.json'; // ダウンロードするファイル名
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
});
