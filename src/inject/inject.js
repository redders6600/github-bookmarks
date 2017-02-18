"use strict";

(function () {

	const issuesUrlRegex = /\/\/github\.com\/(?:[^/]+\/){2}issues/;

	var $listItems;
	var $listItemToClone;
	var $lastItem;

	var store;

	function onMainMutated (records) {
		records.forEach(function (record) {
			if (record.addedNodes.length) {
				record.addedNodes.forEach(function (node) {
					if (node.classList && node.classList.contains('container')) {
						if (isIssuesUrl(window.location.href)) {
							initIssuesPage();
						}
					}
				});
			}
		})
	}

	function urlIsSaved (url) {
		return store.hasOwnProperty(url);
	}

	function registerMutationObserver () {
		var o = new MutationObserver(onMainMutated);
		var mainDiv = document.querySelector('[role="main"]');
		o.observe(mainDiv, {
			childList: true, subtree: true
		});
	}

	function updateListItems () {
		$listItems = document
			.querySelector('.issues-listing .subnav .select-menu-list')
			.children;
	}

	function isIssuesUrl (url) {
		// match //github.com/[something]/[something]/issues
		return issuesUrlRegex.test(url);
	}

	function init () {
		registerMutationObserver();
		if (isIssuesUrl(window.location.href)) {
			initIssuesPage();
		}
	}

	function initIssuesPage () {
		updateListItems();
		$listItemToClone = $listItems[0];
		$lastItem = $listItems[$listItems.length - 1];
		// Provide default blank object.
		chrome.storage.sync.get({ 'githubBookmarks' : {} }, function (data) {
			store = data.githubBookmarks;
			addItemsToList(store);
			addButton();
		});
	}

	function addItemsToList (itemsObject) {
		Object.keys(itemsObject).forEach(function (key) {
			addItemToList(itemsObject[key], key);
		});
	}

	function addItemToList (name, link) {
		var $newItem = $listItemToClone.cloneNode();
		$newItem.href = link;
		$newItem.textContent = name;
		$newItem.setAttribute('data-gss', name);
		$lastItem.before($newItem);
	}

	function removeItemFromList (name) {
		document.querySelector(
			`.issues-listing .subnav .select-menu-list [data-gss="${name}"]`
		).remove();
	}

	function saveItemInStore (name, link) {
		store[link] = name;
		chrome.storage.sync.set({ 'githubBookmarks': store });
	}

	function removeItemFromStore (link) {
		var name = store[link];
		delete store[link];
		chrome.storage.sync.set({ 'githubBookmarks': store });
		return name;
	}

	function saveSearch (e) {
		var link = window.location.href;
		var name = window.prompt('Name this search');;
		if (!name) return;
		addItemToList(name, link);
		saveItemInStore(name, link);
		e.target.onclick = deleteSearch;
		e.target.textContent = 'Remove';
	}

	function deleteSearch (e) {
		var deleted = removeItemFromStore(window.location.href);
		removeItemFromList(deleted);
		e.target.onclick = saveSearch;
		e.target.textContent = 'Save';
	}

	function addButton () {
		var isSaved = urlIsSaved(window.location.href);
		var $button = document.createElement('a');
		$button.textContent =  isSaved ? 'Remove' : 'Save';
		$button.classList.add('js-selected-navigation-item');
		$button.classList.add('subnav-item');
		$button.onclick = isSaved ? deleteSearch : saveSearch;
		var $searchBar = document.querySelector('.subnav-search');
		$searchBar.after($button);
	}


	var readyStateCheckInterval = setInterval(function waitForReady () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			init();
		}
	}, 10);
})();
