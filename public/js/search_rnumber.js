document.getElementById("研究者番号CiNii検索").addEventListener("click", async function() {
    const researcherNameInput = document.getElementById("研究者氏名");
    const researcherOptions = document.getElementById("reseacrcher-options");

    const name = researcherNameInput.value.trim();
    if (!name) {
        alert("研究者氏名を入力してください。");
        return;
    }

    try {
        console.log("検索リクエスト送信: ", name);
        const response = await fetch(`/searchResearcherNumber?name=${encodeURIComponent(name)}`);
        console.log("レスポンス受信: ", response);
        const data = await response.json();
        console.log("APIレスポンスデータ: ", data);

        // 候補のリストをクリア
        researcherOptions.innerHTML = "";

        if (data.totalResults > 0 && Array.isArray(data.researcherIds) && data.researcherIds.length > 0) {
            data.researcherIds.forEach(id => {
                if (Array.isArray(id)) {
                    id = id[0];  // 配列の場合は最初の要素を取得
                }
                const option = document.createElement("option");
                option.value = id.toString();
                researcherOptions.appendChild(option);
            });

				// totalResults が 1 の場合は自動でセット
				if (data.totalResults === 1) {
					document.getElementById("研究者番号").value = data.researcherIds[0].toString();
				}
				// 候補が複数ある場合はalert
				else {
					alert("候補が複数あります。");
				}
        } else {
            alert("検索結果なし。");
        }
    } catch (error) {
        console.error("エラー発生:", error);
        alert("研究者番号の検索に失敗しました。");
    }
});

