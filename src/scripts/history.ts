import { connect } from "porter-source";

const kMillisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
const kOneWeekAgo = new Date().getTime() - kMillisecondsPerWeek;
const historyDiv = document.getElementById('historyDiv');

const [post, setMessage] = connect();
setMessage({
    'hello': (message) => {
        console.log('Porter History, Received hello message: ', message);
        post({ action: 'hello_back', payload: 'from history page' });
    }
});

function faviconURL(u: string) {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', u);
    url.searchParams.set('size', '24');
    return url.toString();
}

function constructHistory(historyItems: chrome.history.HistoryItem[]) {
    const template = document.getElementById('historyTemplate') as HTMLTemplateElement;
    for (let item of historyItems) {
        const clone = document.importNode(template!.content, true);
        const pageLinkEl = clone.querySelector('.page-link') as HTMLLinkElement;
        const pageTitleEl = clone.querySelector('.page-title') as HTMLParagraphElement;
        const pageVisitTimeEl = clone.querySelector('.page-visit-time') as HTMLDivElement;
        const imageWrapperEl = clone.querySelector('.image-wrapper') as HTMLDivElement;
        const checkbox = clone.querySelector('.removeCheck, input') as HTMLInputElement;
        checkbox.setAttribute('value', item!.url!);
        const favicon = document.createElement('img');
        pageLinkEl!.href = item.url!;
        favicon.src = faviconURL(item.url!);
        pageLinkEl.textContent = item.url!;
        imageWrapperEl.prepend(favicon);
        pageVisitTimeEl.textContent = new Date(item.lastVisitTime!).toLocaleString();
        if (!item.title) {
            pageTitleEl.style.display = 'none';
        }
        pageTitleEl!.innerText = item.title!;

        clone.querySelector('.removeButton, button')!
            .addEventListener('click', async function () {
                await chrome.history.deleteUrl({ url: item.url! });
                location.reload();
            });

        clone
            .querySelector('.history')!
            .addEventListener('click', async function (event: Event) {
                // fix double click
                if ((event.target as HTMLElement).className === 'removeCheck') {
                    return;
                }

                checkbox.checked = !checkbox.checked;
            });
        historyDiv!.appendChild(clone);
    }
}

document.getElementById('searchSubmit')!.onclick = async function () {
    historyDiv!.innerHTML = ' ';
    const searchQuery = (document.getElementById('searchInput') as HTMLInputElement)!.value;
    const historyItems = await chrome.history.search({
        text: searchQuery,
        startTime: kOneWeekAgo
    });
    constructHistory(historyItems);
};

document.getElementById('deleteSelected')!.onclick = async function () {
    const checkboxes = Array.from(document.getElementsByTagName('input'));
    for (let checkbox of checkboxes) {
        if (checkbox.checked == true) {
            await chrome.history.deleteUrl({ url: checkbox.value });
        }
    }
    location.reload();
};

document.getElementById('removeAll')!.onclick = async function () {
    await chrome.history.deleteAll();
    location.reload();
};

chrome.history
    .search({
        text: '',
        startTime: kOneWeekAgo,
        maxResults: 99
    })
    .then(constructHistory);