document.addEventListener("DOMContentLoaded", function () {
    const importButton = document.getElementById("Json-import");

    importButton.addEventListener("click", function () {
        // JSONファイルを選択するダイアログを開く
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";

        input.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    try {
                        // JSONデータを読み込む
                        const jsonData = JSON.parse(e.target.result);

                        // JSONデータをフォームに適用
                        Object.keys(jsonData).forEach((key) => {
                            const element = document.getElementById(key);
                            const value = jsonData[key];

                            if (element) {
                                if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                                    element.value = value;
                                } else if (element.tagName === "SELECT") {
                                    element.value = value;
                                } else if (element.tagName === "TD" && element.hasAttribute("contenteditable")) {
                                    element.textContent = value;
                                }
                            }
                        });

                        console.log("Imported JSON Data:", jsonData); // デバッグ用
                    } catch (error) {
                        console.error("JSONの読み込みに失敗しました:", error);
                        alert("不正なJSONファイルです。");
                    }
                };

                reader.readAsText(file);
            }
        });

        input.click();
    });
});

