document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded イベントが発火しました');
    
    // DOM要素の取得
    const pdfUpload = document.getElementById('pdfUpload');
    const searchResearcherBtn = document.getElementById('研究者番号検索');
    const researcherId = document.getElementById('研究者番号');
    const researcherName = document.getElementById('研究者氏名');
    const projectNumber = document.getElementById('projectNumber');

    console.log('DOM要素:', {
        pdfUpload: pdfUpload ? 'found' : 'not found',
        searchResearcherBtn: searchResearcherBtn ? 'found' : 'not found',
        researcherId: researcherId ? 'found' : 'not found',
        researcherName: researcherName ? 'found' : 'not found',
        projectNumber: projectNumber ? 'found' : 'not found'
    });

    // PDF アップロードの処理
    if (pdfUpload) {
        console.log('PDFアップロードボタンにイベントリスナーを追加します');
        pdfUpload.addEventListener('change', async (e) => {
            console.log('PDFアップロードボタンがクリックされました');
            const file = e.target.files[0];
            console.log('選択されたファイル:', file);
            
            if (!file) return;

            const formData = new FormData();
            formData.append('pdf', file);

            try {
                const url = '/api/upload';
                console.log('リクエストURL:', url);
                
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                console.log('サーバーからのレスポンス:', response);

                if (!response.ok) throw new Error('アップロードに失敗しました');

                const data = await response.json();
                console.log('レスポンスデータ:', data);
                updateFormWithPdfData(data);
            } catch (error) {
                console.error('エラーの詳細:', error);
                alert('PDFの処理中にエラーが発生しました');
            }
        });
    } else {
        console.error('PDFアップロードボタンが見つかりません');
    }

    // 研究者検索の処理
    if (searchResearcherBtn) {
        console.log('研究者番号検索ボタンにイベントリスナーを追加します');
        searchResearcherBtn.addEventListener('click', async () => {
            console.log('研究者番号検索ボタンがクリックされました');
            const name = researcherName.value.trim();
            console.log('入力された研究者名:', name);
            
            if (!name) {
                alert('研究者氏名を入力してください');
                return;
            }

            try {
                searchResearcherBtn.disabled = true;
                searchResearcherBtn.textContent = '検索中...';

                // データベースから研究者情報を取得
                const url = `/getResearcherInfo?name=${encodeURIComponent(name)}`;
                console.log('リクエストURL:', url);
                
                const response = await fetch(url);
                console.log('サーバーからのレスポンス:', response);
                
                const data = await response.json();
                console.log('レスポンスデータ:', data);

                if (!response.ok) {
                    throw new Error(data.error || '研究者情報の取得に失敗しました');
                }

                if (data.researchers && data.researchers.length > 0) {
                    // 最初の一致する研究者の情報を使用
                    const researcher = data.researchers[0];
                    researcherId.value = researcher.RN;
                    researcherName.value = researcher.Name;
                    console.log('研究者情報を設定しました:', researcher);
                } else {
                    alert('該当する研究者が見つかりませんでした');
                }

            } catch (error) {
                console.error('エラーの詳細:', error);
                alert(`エラーが発生しました: ${error.message}`);
            } finally {
                searchResearcherBtn.disabled = false;
                searchResearcherBtn.textContent = '研究者番号 CiNii検索';
            }
        });
    } else {
        console.error('研究者番号検索ボタンが見つかりません');
    }

    // PDFデータでフォームを更新
    function updateFormWithPdfData(data) {
        if (data.receiver_name && researcherName) {
            researcherName.value = data.receiver_name;
        }
    }
});
