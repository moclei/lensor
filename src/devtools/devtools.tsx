import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

let count = 0;

chrome.devtools.panels.create(
  'Lensor',
  'icons/icon-48.png',
  'devtools.html',
  function (panel) {
    console.log('Devtools panel created!');
    panel.onShown.addListener(function (win) {
      const root = ReactDOM.createRoot(
        win.document.getElementById('root') as HTMLElement
      );
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log('Devtools panel shown! window: ', win);
      // const [post, setMessage] = connect();
      // setMessage({
      //     'hello': (message) => {
      //         console.log('Porter devtools, Received hello message: ', message);
      //         post({ action: 'hello_back', payload: 'from devtools panel' });
      //     },
      //     'show-number': (message) => {
      //         console.log('Porter devtools, Received message: ', message);
      //         increment(win);
      //     }
      // });
    });
  }
);

function increment(win: Window) {
  console.log('Porter devtools, count is: ', count);
  const element = win.document.getElementById(
    'relay-target'
  )! as HTMLDivElement;
  console.log('Porter devtools, have element?: ', element);
  const paragraph = document.createElement('p');
  paragraph.textContent = '#' + count;
  element.appendChild(paragraph);
  count++;
}
