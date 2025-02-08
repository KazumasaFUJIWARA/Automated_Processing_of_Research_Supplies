document.addEventListener("DOMContentLoaded", function () {
    const pdfUpload = document.getElementById("pdfUpload");
    const pdfPreview = document.getElementById("pdfPreview");

    let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.0; // 初期スケール

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js';

    function createZoomControls() {
        const zoomControls = document.createElement("div");
        zoomControls.className = "zoom-controls";
        zoomControls.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.8);
            padding: 5px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        const zoomInBtn = document.createElement("button");
        zoomInBtn.innerHTML = "+";
        zoomInBtn.style.cssText = `
            margin: 0 5px;
            padding: 5px 10px;
            cursor: pointer;
        `;
        zoomInBtn.onclick = () => {
            if (pdfDoc) {
                scale += 0.1;
                renderPage(currentPage, scale);
            }
        };

        const zoomOutBtn = document.createElement("button");
        zoomOutBtn.innerHTML = "-";
        zoomOutBtn.style.cssText = `
            margin: 0 5px;
            padding: 5px 10px;
            cursor: pointer;
        `;
        zoomOutBtn.onclick = () => {
            if (pdfDoc) {
                scale = Math.max(scale - 0.1, 0.1);
                renderPage(currentPage, scale);
            }
        };

        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(zoomInBtn);
        return zoomControls;
    }

    function renderPage(pageNumber, scale) {
        pdfDoc.getPage(pageNumber).then(function (page) {
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            pdfPreview.innerHTML = ""; // プレビュー領域をクリア
            
            // プレビュー領域のスタイルを設定
            pdfPreview.style.position = "relative";
            
            pdfPreview.appendChild(canvas);
            // ズームコントロールを追加
            pdfPreview.appendChild(createZoomControls());

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            page.render(renderContext);
        });
    }

    pdfUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileReader = new FileReader();

            fileReader.onload = function (e) {
                const pdfData = new Uint8Array(e.target.result);

                pdfjsLib.getDocument({ data: pdfData }).promise.then(function (pdf) {
                    pdfDoc = pdf;
                    renderPage(currentPage, scale); // 初期ページを描画
                });
            };

            fileReader.readAsArrayBuffer(file);
        } else {
            alert("PDFファイルを選択してください");
        }
    });
});

