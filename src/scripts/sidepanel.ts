import { PorterContext, connect } from "porter-source";

const words: { [key: string]: string } = {
    extensions:
        'Extensions are software programs, built on web technologies (such as HTML, CSS, and JavaScript) that enable users to customize the Chrome browsing experience.',
    popup:
        "A UI surface which appears when an extension's action icon is clicked."
};

const [post, setMessage] = connect();
setMessage({
    'hello': (message) => {
        console.log('Porter Sidepanel, Received hello message: ', message);
        post({ action: 'hello_back', payload: 'from sidepanel' });
    }
});

chrome.storage.session.get('lastWord', ({ lastWord }) => {
    updateDefinition(lastWord);
});

chrome.storage.session.onChanged.addListener((changes) => {
    const lastWordChange = changes['lastWord'];

    if (!lastWordChange) {
        return;
    }

    updateDefinition(lastWordChange.newValue);
});
document.addEventListener('DOMContentLoaded', function () {
    const relayElement = document.getElementById('relay-button')! as HTMLInputElement;

    console.log('sidepanel, document: ', document);
    console.log('sidepanel, relayElement: ', relayElement);

    relayElement.addEventListener('click', () => {
        post({ action: 'show-number', payload: 'Relayed from sidepanel', target: { context: PorterContext.Devtools } });
    });

});

function updateDefinition(word: string) {
    // If the side panel was opened manually, rather than using the context menu,
    // we might not have a word to show the definition for.
    if (!word) return;

    // Hide instructions.
    (document.body.querySelector('#select-a-word')! as HTMLParagraphElement).style.display = 'none';

    // Show word and definition.
    (document.body.querySelector('#definition-word')! as HTMLHeadingElement).innerText = word;
    (document.body.querySelector('#definition-text')! as HTMLParagraphElement).innerText =
        words[word.toLowerCase()] ??
        `Unknown word! Supported words: ${Object.keys(words).join(', ')}`;
}