document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("dbs-update");
	fetchButton.addEventListener("click", async function() {
		const requestData = {
			pnumber: document.getElementById('研究課題番号').value,
			ptype: document.getElementById('課題種別').value,
			ptitle: document.getElementById('課題名').value || 'NONE',
			PIname: document.getElementById('代表者').value || 'NONE',
			CIname: document.getElementById('分担者').value || 'NONE',
			delivered_campus: document.getElementById('納品キャンパス').value,
			delivered_location: document.getElementById('納品先').value,
			installed_campus: document.getElementById('設置キャンパス').value,
			installed_location: document.getElementById('設置先').value
		};

		async function fetchResearcherNumber(name) {
			if (!name) return 'NONE';

			try {
				const response = await fetch(`/researchers/get/rnumber?rname=${encodeURIComponent(name)}`);
				if (!response.ok) {
					console.log('local dbに研究者が見つかりませんでした');
					return 'NONE';
				}

				const result = await response.json();
				return result.rnumber || 'NONE';
			} catch (error) {
				console.error('研究者番号の取得に失敗:', error);
				return 'NONE';
			}
		}

		let PI = 'NONE';
		let CI = 'NONE';

		if (requestData.PIname !== 'NONE') {
			PI = await fetchResearcherNumber(requestData.PIname);
		}

		if (requestData.CIname !== 'NONE') {
			CI = await fetchResearcherNumber(requestData.CIname);
		}

		try {
			const response = await fetch('/updateProject', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					pnumber: requestData.pnumber,
					ptype: requestData.ptype,
					ptitle: requestData.ptitle
				})
			});

			if (!response.ok) {
				console.log('プロジェクト情報の更新に失敗しました');
				console.log( JSON.stringify({
					pnumber: requestData.pnumber,
					ptype: requestData.ptype,
					pname: requestData.ptitle
				}));
			} else {
				console.log('プロジェクト情報を更新しました');
			}

			const allocationsRecord = {
				projectNumber: requestData.pnumber,
				PI: PI,
				CI: CI,
				distributedCampus: requestData.delivered_campus,
				distributedLocation: requestData.delivered_location,
				installedCampus: requestData.installed_campus,
				installedLocation: requestData.installed_location
			};

			const response2 = await fetch('/updateAllocation', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(allocationsRecord)
			});

			if (!response2.ok) {
				console.log('割り当て情報の更新に失敗しました');
				console.log( JSON.stringify(allocationsRecord));
			} else {
				console.log('割り当て情報を更新しました');
			}
		} catch (error) {
			console.error('更新プロセス中にエラーが発生しました:', error);
		}
	});
});
