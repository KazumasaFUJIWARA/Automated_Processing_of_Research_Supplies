document.getElementById('Json-export').addEventListener('click', function () {
	const inputs = document.querySelectorAll('.right-panel input, .right-panel select, .right-panel td[contenteditable="true"], .checkbox-group input[type="checkbox"]');
	const data = {};

	inputs.forEach(input => {
		if (input.type === "checkbox") {
			if (!data[input.name]) data[input.name] = [];
			if (input.checked) data[input.name].push(input.value);
		} else {
			const id = input.id;
			const value = input.tagName === 'TD' ? input.textContent.trim() : input.value;
			if (id) {
				data[id] = value;
			}
		}
	});

	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `APRS${new Date().toISOString().replace(/[-:.TZ]/g, '')}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
});
