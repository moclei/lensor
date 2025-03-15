import { create, DerivedState } from 'crann';

import { LensorStateConfig } from '../ui/state-config';
import { PorterContext } from 'porter-source';

console.log(
  'lensor service worker created! version: ',
  chrome.runtime.getManifest().version
);

// Set up state with crann
const { get, set, subscribe, findInstance, queryAgents } = create(
  LensorStateConfig,
  {
    debug: true
  }
);

subscribe((state, changes, agentInfo) => {
  if (!agentInfo) {
    console.warn('[SW] crann subscribe: No agent info found');
    return;
  }
  if (!agentInfo.location.tabId) {
    console.warn('[SW] crann subscribe: No tabId found');
    return;
  }
  if ('isSidepanelShown' in changes) {
    console.log(
      '[SW] crann subscribe: isSidepanelShown changed',
      changes.isSidepanelShown
    );
    if (changes.isSidepanelShown === true) {
      console.log('Opening a sidepanel!');
      chrome.sidePanel.setOptions({
        tabId: agentInfo.location.tabId,
        path: 'sidepanel/sidepanel.html',
        enabled: true
      });
      chrome.sidePanel.open({ tabId: agentInfo.location.tabId });
    } else {
      chrome.sidePanel.setOptions({
        tabId: agentInfo.location.tabId,
        enabled: false
      });
    }
  }
  const { active, initialized, mediaStreamId } = state;
  console.log(
    'active: ',
    active,
    ', initialized: ',
    initialized,
    ', mediaStreamId: ',
    mediaStreamId
  );
  if (active && !mediaStreamId) {
    console.log('Active but null media stream, create one.');
    // Get a MediaStream for the active tab.
    (chrome.tabCapture as any)
      .getMediaStreamId({
        consumerTabId: agentInfo.location.tabId,
        targetTabId: agentInfo.location.tabId
      })
      .then((streamId: string) => {
        set({ mediaStreamId: streamId }, agentInfo.id);
      });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  //console.log("Tab updated ", tabId, changeInfo, tab);
  if (
    changeInfo.status == 'complete' &&
    tab.status == 'complete' &&
    tab.url != undefined
  ) {
    const { key, state } = getAgentStateByTabId(tabId);
    console.log('Did we find the right agent: ', { key, state });
    if (state?.isSidepanelShown) {
      console.log('tabs onUpdated isSidepanelShown');
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidepanel/sidepanel.html',
        enabled: true
      });
    } else {
      console.log('[SW] onTabUpdated isSidepanelShown = false, agentState: ', {
        state,
        tabId
      });
      // Disables the side panel on all other sites
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('Tab activated: ', activeInfo);

  const { key, state } = getAgentStateByTabId(activeInfo.tabId);

  const agents = queryAgents({
    context: PorterContext.ContentScript
  });
  console.log('[SW] agents: ', agents);
  console.log('Did we find an agent and state: ', { key, state });
  if (state?.isSidepanelShown) {
    console.log('tabs onActivated isSidepanelShown');
    chrome.sidePanel.setOptions({
      tabId: activeInfo.tabId,
      path: 'sidepanel/sidepanel.html',
      enabled: true
    });
  } else {
    console.log('tabs onActivated isSidepanelShown = false');
    // Disables the side panel on all other sites
    chrome.sidePanel.setOptions({
      tabId: activeInfo.tabId,
      enabled: false
    });
  }
});

// const [active, setActive] = crann.subscribe('active');
async function handleActionButtonClick(tab: chrome.tabs.Tab) {
  console.log('Action clicked, tab: ', tab);
  if (!tab.id) return;

  const { key, state } = getAgentStateByTabId(tab.id);

  if (!key || !state) {
    console.warn('action button clicked but no agent found for that tab.', {
      key,
      state
    });
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ['ui/index.js']
      })
      .then(() => {
        console.log('Injected ui script into tab: ', tab.id);
        if (!tab.id) {
          console.warn('action button clicked but no tab.id found');
          return;
        }
        const { key, state } = getAgentStateByTabId(tab.id);
        console.warn('Injected UI. Did we find an agent? ', {
          key,
          state
        });
        if (key && state) {
          set({ active: true }, key);
        }
      });
    return;
  } else {
    console.log('[SW] handleActionButtonClick: Found agent, key: ', key);
    // Toggle the active state of the agent
    console.log('[SW] handleActionButtonClick: setTimeout 2 setting active');
    const { active } = get(key);
    set({ active: !active }, key);
  }
}

// Set up messaging with porter
// const [post, setMessages, onConnect] = source();
// onConnect(handlePorterConnect);
// setMessages({
//   hello_back: (message, agent) => {
//     console.log('Received hello_back message: ', message, agent);
//   },
//   settings_clicked: (message, agent) => {
//     console.log('Received settings_clicked message: ', message, agent);
//     chrome.sidePanel.open({ tabId: agent?.location.tabId! });
//   }
// });
// porter.onConnect.addListener(handlePorterConnect);
chrome.runtime.onMessage.addListener(async (message) => {
  console.log('Message heard in service worker: ', message);
});
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome started, initializing extension.');
});
chrome.runtime.onSuspend.addListener(() => {
  console.log('Unloading extension, saving state.');
});
chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log('Extension unload canceled, continuing operations.');
});
chrome.runtime.onUpdateAvailable.addListener((updateInfo) => {
  console.log(`Update available: ${updateInfo.version}`);
});

chrome.runtime.onInstalled.addListener(
  async (details: chrome.runtime.InstalledDetails) => {
    console.log('onInstalled, details: ', details);
    if (details.reason === 'install') {
      console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
      console.log(`Extension updated to version ${details.previousVersion}`);
    }
    // const currentTabs = await tabsMan.getTabs();
    // console.log('onInstalled, currentTabs: ', currentTabs);
    // for (const tab of currentTabs) {
    //   console.log('onInstalled, reloading tab: ', tab);
    //   chrome.tabs.reload(tab[0]).then(() => {
    //     if (chrome.runtime.lastError) {
    //       console.log(
    //         'Error reloading tab(',
    //         tab[0],
    //         '), lastError: ',
    //         chrome.runtime.lastError
    //       );
    //     } else {
    //       console.log('Reloaded tab ', tab[0]);
    //     }
    //   });
    // }
  }
);

chrome.action.onClicked.addListener(handleActionButtonClick);

// function handlePorterConnect(agentInfo: AgentInfo) {
//   console.log('Porter connected, agentInfo: ', agentInfo);
//   post(
//     {
//       action: `hello`,
//       payload: { answer: `Hello ${agentInfo.location.context}!` }
//     },
//     agentInfo.id
//   );
// }

function getAgentStateByTabId(tabId: number): {
  key: string | undefined;
  state: DerivedState<typeof LensorStateConfig> | undefined;
} {
  const agents = queryAgents({
    context: PorterContext.ContentScript,
    tabId: tabId
  });

  if (!agents || agents.length === 0) {
    console.warn(
      '[SW] getAgentStateByTabId: No agent info found for tabId',
      tabId
    );
    return { key: undefined, state: undefined };
  }
  const key = agents[0].info.id;
  const state = get(key);
  return { key, state };
}
