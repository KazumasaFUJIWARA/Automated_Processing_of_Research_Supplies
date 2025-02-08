document.getElementById("db-updated").addEventListener("click", async function () {
    const requestData = {
        研究課題番号: document.getElementById("研究課題番号").value,
        課題種別: document.getElementById("課題種別").value,
        課題名: document.getElementById("課題名").value,
        代表者: document.getElementById("代表者").value,
        分担者: document.getElementById("分担者").value || null,  // NULLの可能性を考慮
        納品キャンパス: document.getElementById("納品キャンパス").value,
        納品先: document.getElementById("納品先").value,
        設置キャンパス: document.getElementById("設置キャンパス").value,
        設置先: document.getElementById("設置先").value
    };

    if (!requestData.研究課題番号 || !requestData.代表者) {
        alert("課題番号と代表者の研究者番号は必須です。");
        return;
    }

    try {
        let response = await fetch('/updateProjectInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        let data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            alert("エラー: " + data.error);
        }

    } catch (error) {
        console.error("エラー:", error);
        alert("課題情報の更新に失敗しました");
    }
});

