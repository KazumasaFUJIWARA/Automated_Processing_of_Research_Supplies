document.addEventListener('DOMContentLoaded', function () {
    // 数字のみを許可するセルの選択
    const numericCells = document.querySelectorAll('td[contenteditable="true"][data-type="number"]');

    numericCells.forEach(cell => {
        cell.addEventListener('keydown', function (event) {
            const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete']; // 許可する特殊キー
            if (!/^\d$/.test(event.key) && !allowedKeys.includes(event.key)) {
                event.preventDefault(); // 数字以外の入力を無効化
            }
        });
    });
});

