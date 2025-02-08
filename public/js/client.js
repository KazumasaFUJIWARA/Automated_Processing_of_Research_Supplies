document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const pdfUpload = document.getElementById('pdfUpload');
    const searchResearcherBtn = document.getElementById('searchResearcher');
    const searchProjectBtn = document.getElementById('searchProject');
    const researcherId = document.getElementById('researcherId');
    const researcherName = document.getElementById('researcherName');
    const projectTitle = document.getElementById('projectTitle');
    const representative = document.getElementById('representative');
    const contributor = document.getElementById('contributor');
    const itemsTableBody = document.getElementById('itemsTableBody');

    // PDF アップロードの処理
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('アップロードに失敗しました');

            const data = await response.json();
            updateFormWithPdfData(data);
        } catch (error) {
            console.error('Error:', error);
            alert('PDFの処理中にエラーが発生しました');
        }
    });

    // 研究者検索の処理を修正
    searchResearcherBtn.addEventListener('click', async () => {
        const name = researcherName.value.trim();
        if (!name) {
            alert('研究者氏名を入力してください');
            return;
        }

        console.log('検索する研究者名:', name);
        console.log('エンコード後:', encodeURIComponent(name));

        try {
            searchResearcherBtn.disabled = true;
            searchResearcherBtn.textContent = '検索中...';

            // まず研究者氏名から研究者番号を取得
            const searchUrl = `/api/researcher/search-by-name?name=${encodeURIComponent(name)}`;
            console.log('リクエストURL:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (!searchResponse.ok) {
                const errorMessage = searchData.error || '研究者番号の取得に失敗しました';
                console.error('Search Error:', {
                    status: searchResponse.status,
                    statusText: searchResponse.statusText,
                    data: searchData,
                    requestUrl: searchUrl
                });
                throw new Error(errorMessage);
            }

            if (!searchData.id) {
                throw new Error('研究者番号が見つかりませんでした');
            }

            researcherId.value = searchData.id;
            console.log('研究者番号を取得しました:', searchData.id);

            // 次に研究者情報を取得
            const infoResponse = await fetch(`/api/researcher/${searchData.id}`);
            const infoData = await infoResponse.json();

            if (!infoResponse.ok) {
                throw new Error(infoData.error || '研究者情報の取得に失敗しました');
            }

            updateResearcherInfo(infoData);
        } catch (error) {
            console.error('Error details:', error);
            alert(`エラーが発生しました: ${error.message}`);
        } finally {
            searchResearcherBtn.disabled = false;
            searchResearcherBtn.textContent = '研究者番号検索';
        }
    });

    // 課題検索の処理
    searchProjectBtn.addEventListener('click', async () => {
        const projectQuery = projectTitle.value;
        if (!projectQuery) return;

        try {
            const response = await fetch(`/api/project/search?query=${encodeURIComponent(projectQuery)}`);
            if (!response.ok) throw new Error('課題情報の取得に失敗しました');

            const data = await response.json();
            updateProjectInfo(data);
        } catch (error) {
            console.error('Error:', error);
            alert('課題情報の取得中にエラーが発生しました');
        }
    });

    // PDFデータでフォームを更新
    function updateFormWithPdfData(data) {
        // テーブルの更新
        itemsTableBody.innerHTML = '';
        data.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${item.product_name || ''}" class="item-input"></td>
                <td><input type="text" value="${item.provider || ''}" class="maker-input"></td>
                <td><input type="text" value="${item.model || ''}" class="model-input"></td>
                <td><input type="number" value="${item.number || ''}" class="number-input"></td>
                <td><input type="number" value="${item.unite_price || ''}" class="price-input"></td>
                <td><input type="number" value="${item.total_price || ''}" class="total-input"></td>
                <td>
                    <select class="expense-type">
                        <option value="消耗品">消耗品</option>
                        <option value="用品">用品</option>
                        <option value="備品">備品</option>
                    </select>
                </td>
            `;
            itemsTableBody.appendChild(row);
        });

        // その他のフィールドの更新
        if (data.receiver_name) {
            researcherName.value = data.receiver_name;
        }
    }

    // 研究者情報の更新
    function updateResearcherInfo(data) {
        researcherName.value = data.name || '';
        // 研究課題の更新など、必要に応じて他のフィールドも更新
    }

    // 課題情報の更新
    function updateProjectInfo(data) {
        projectTitle.value = data.title || '';
        representative.value = data.representative || '';
        contributor.value = data.contributor || '';
    }
}); 
