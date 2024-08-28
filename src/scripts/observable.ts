export function observeDOMChanges(handleDOMChange: (changeScore: number) => void) {
    let changeScore = 0;
    const weightFactors = {
        addedNodes: 1,
        removedNodes: 1,
        attributeChanges: 0.5,
        visibilityChanges: 2,
        displayChanges: 2
    };

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                changeScore += mutation.addedNodes.length * weightFactors.addedNodes;
                changeScore += mutation.removedNodes.length * weightFactors.removedNodes;
            } else if (mutation.type === 'attributes') {
                changeScore += weightFactors.attributeChanges;

                if (mutation.attributeName === 'visibility') {
                    changeScore += weightFactors.visibilityChanges;
                } else if (mutation.attributeName === 'display') {
                    changeScore += weightFactors.displayChanges;
                }
            }
        });

        if (changeScore >= 5) {
            handleDOMChange(changeScore);
            changeScore = 0;
        }
    });

    const observerConfig = {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ['visibility', 'display']
    };

    observer.observe(document.documentElement, observerConfig);
}