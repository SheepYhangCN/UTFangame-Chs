"use strict";

const searchDataURL = document.querySelector("link[name='search-data']").href;
let searchData = {};
let searcher;
const searcherOptions = {
	keys: ["title", "_authorsText"]
};

const form = document.querySelector("form[name='search-form']");
const screens = document.querySelector(".search-screens");
const searchResults = document.querySelector("#search-results");
const searchResultsBackup = document.querySelector("#search-results-backup");
const searchInitScreen = document.querySelector("#search-initial-screen");
const searchResultTemplate = document.querySelector("#template-search-result").innerHTML;

function displayError(e, desc) {
	alert(`${desc}

下面是详尽的错误报告，可能会有用：

${e.stack}`);
}

async function initSearcher() {
	const response = await fetch(searchDataURL);
	searchData = await response.json();
	searchData.translations.forEach((x) => {
		x._authorsText = x.authors.map((y) => searchData.authors[y]);
	});
	searcher = new Fuse(searchData.translations, searcherOptions);
}

function setFormEnabled(form, enabled) {
	for (let i of form.querySelectorAll("input, button, textarea, select")) {
		i.disabled = !enabled;
	}
	return enabled;
}

function onSearchReady() {
	setFormEnabled(form, true);
	screens.classList.add("search-ready");
}

function setLoading(isLoading) {
	screens.classList.remove("search-loading");
	if (isLoading) {
		setFormEnabled(form, false);
		if (searchResults.hasChildNodes()) {
			searchResultsBackup.replaceChildren(...searchResults.childNodes);
			searchResults.replaceChildren();
		}
		screens.classList.add("search-loading");
	} else {
		setFormEnabled(form, true);
		searchResultsBackup.replaceChildren();
	}
	return isLoading;
}

async function renderSearchResults(results) {
	let output;
	try {
		output = ejs.render(searchResultTemplate, { results: results });
	} catch (e) {
		displayError(e, "渲染搜索结果失败！这是网站的问题，请报告。");
		return;
	}
	searchResults.innerHTML = output;
}

async function executeSearch(query) {
	setLoading(true);

	const results = searcher.search(query);
	renderSearchResults(results);

	setLoading(false);
}

form.addEventListener("submit", (e) => {
	e.preventDefault();

	const query = form.elements.query.value;

	let url = new URL(location);
	url.searchParams.set("query", query);
	history.pushState("", "", url);

	executeSearch(query);
});

document.addEventListener("DOMContentLoaded", async () => {
	await initSearcher();
	onSearchReady();

	let url = new URL(location);
	let query = url.searchParams.get("query");
	if (query) {
		form.elements.query.value = query;
		executeSearch(query);
	}
});
