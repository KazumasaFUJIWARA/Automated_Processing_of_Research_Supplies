document.addEventListener('DOMContentLoaded', function () {
	const datalist = document.getElementById('project-list');
	const options = datalist.querySelectorAll('option');
	console.log('Datalist 候補数:', options.length);
	options.forEach(option => console.log('候補:', option.value));
});
