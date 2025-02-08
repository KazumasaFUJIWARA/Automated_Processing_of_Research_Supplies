document.getElementById("asign-info-from-db").addEventListener("click", async function () {
    let projectNumber = document.getElementById("研究課題番号").value;
    if (!projectNumber) {
        alert("課題番号を入力してください");
        return;
    }

    try {
        let response = await fetch(`/getProjectInfo?projectNumber=${projectNumber}`);
        let data = await response.json();

        if (!response.ok) {
            console.error("サーバーエラー:", data.error);
            alert(`課題番号の検索中にエラーが発生しました: ${data.error}`);
            return;
        }

        console.log("取得した課題情報:", data);

        document.getElementById("課題種別").value = data.課題種別 || "DB未登録";
        document.getElementById("課題名").value = data.課題名 || "DB未登録";
        document.getElementById("納品キャンパス").value = data.納品キャンパス || "";
        document.getElementById("納品先").value = data.納品先 || "";
        document.getElementById("設置キャンパス").value = data.設置キャンパス || "";
        document.getElementById("設置先").value = data.設置先 || "";

        if (data.PI) {
            let piResponse = await fetch(`/getResearcherName?researcherId=${data.PI}`);
            let piData = await piResponse.json();
            document.getElementById("代表者").value = piData.name || "DB未登録";
        } else {
            document.getElementById("代表者").value = "DB未登録";
        }

        if (data.CI) {
            let ciResponse = await fetch(`/getResearcherName?researcherId=${data.CI}`);
            let ciData = await ciResponse.json();
            document.getElementById("分担者").value = ciData.name || "DB未登録";
        }

    } catch (error) {
        console.error("リクエストエラー:", error);
        alert("課題番号の検索中にエラーが発生しました。サーバーを確認してください。");
    }
});

