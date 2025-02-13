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
	
	if (!requestData.pnumber) {
		alert('🚨 研究課題番号を入力してください');
		return;
	}

		// {{{ async function fetchResearcherNumber(name) {
		async function fetchResearcherNumber(name) {
			if (!name) return 'NONE';
			if (name === 'NONE') return 'NONE';

			try {
				const response = await fetch(`/api/researchers/by-name/${encodeURIComponent(name)}`);
				if (!response.ok) {
					console.log('local dbに研究者が見つかりませんでした');
					return 'NONE';
				}

				const result = await response.json();
				return result.研究者番号 || 'NONE';
			} catch (error) {
				console.error('研究者番号の取得に失敗:', error.message);
				return 'NONE';
			}
		}
		// }}}

		let PI = await fetchResearcherNumber(requestData.PIname);
		let CI = await fetchResearcherNumber(requestData.CIname);

		PI = PI ? String(PI) : "";
		CI = CI ? String(CI) : "";

		try {
			let response = await fetch('/api/projects/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					projectNumber: requestData.pnumber,
					projectType: requestData.ptype,
					projectTitle: requestData.ptitle
				})
			});

			// 衝突（Conflict: 409）の場合、PUT に切り替え
			if (response.status === 409) {
				response = await fetch(`/api/projects/${encodeURIComponent(requestData.pnumber)}/`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						projectType: requestData.ptype,
						projectTitle: requestData.ptitle
					})
				});
			}

			if (!response.ok) {
				alert(`🙇 課題DBの更新に失敗しました : ${requestData.pnumber}`);
			} else {
				alert(`✅ 課題DBを更新しました : ${requestData.pnumber}`);
			}

			let response2 = await fetch('/api/projects/allocations/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					projectNumber: requestData.pnumber,
					PI: PI,
					CI: CI,
					deliveredCampus: requestData.delivered_campus,
					deliveredLocation: requestData.delivered_location,
					installedCampus: requestData.installed_campus,
					installedLocation: requestData.installed_location
				})
			});

			if (response2.status === 409) {
				response2 = await fetch(`/api/projects/${encodeURIComponent(requestData.pnumber)}/allocations/`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						PI: PI,
						CI: CI,
						deliveredCampus: requestData.delivered_campus,
						deliveredLocation: requestData.delivered_location,
						installedCampus: requestData.installed_campus,
						installedLocation: requestData.installed_location
					})
				});
			}

			if (!response2.ok) {
				alert(`🙇 配分DBの更新に失敗しました : ${requestData.pnumber}`);
			} else {
				alert(`✅ 配分DBを更新しました : ${requestData.pnumber}`);
			}
		} catch (error) {
			alert(`🙇 DBの更新に失敗しました\n ❎ + ${error.message}`);
		}
	});
});
