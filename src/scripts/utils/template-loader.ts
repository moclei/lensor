// Template filename and id must match
export async function loadHtmlTemplate(templateName: string, parent: HTMLElement) {
    let response: Response | null = null;
    let text: string | null = null;

    try {
        response = await fetch(chrome.runtime.getURL('templates/' + templateName + '/' + templateName + '.html'));
    } catch (err) {
        console.log("Error fetching template, ", templateName, ", error: ", err);
    }
    if (!response) return null;

    try {
        text = await response.text()
    } catch (err) {
        console.log("Error parsing text from template, ", templateName, ", error: ", err);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text!, 'text/html');
    const template = doc.querySelector('#' + templateName) as HTMLTemplateElement;
    const clone = template!.content.cloneNode(true);
    parent.appendChild(clone);
    return clone as DocumentFragment;
}